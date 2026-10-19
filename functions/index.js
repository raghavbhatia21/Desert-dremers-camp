/* ============================================================
   ROYAL HERITAGE RESORT — Cloud Functions
   ============================================================
   Atomic transaction-based booking engine, Razorpay checkout
   management, signature checks, cancellations, and email dispatches.
   ============================================================ */

'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Razorpay = require('razorpay');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();
const db = admin.firestore();

// Initialize SendGrid and Razorpay with environment keys
sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'PLACEHOLDER');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'RAZORPAY_KEY_ID_PLACEHOLDER',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'RAZORPAY_KEY_SECRET_PLACEHOLDER'
});

// Accommodations prices configuration
const TARRIFS = {
  tent: 8500,
  cottage: 12000
};

// Helper: Calculate nights count
function calculateNights(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 1. Recalculate price server side (never trust client amounts)
function recalculatePrice(type, checkIn, checkOut) {
  const pricePerNight = TARRIFS[type];
  if (!pricePerNight) throw new Error("Invalid accommodation category.");
  const nights = calculateNights(checkIn, checkOut);
  return pricePerNight * nights;
}


// 2. Create Booking Order (Atomic availability check & lock)
exports.createBookingOrder = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { roomId, checkIn, checkOut, guests, guestDetails } = req.body;
    
    if (!roomId || !checkIn || !checkOut || !guestDetails) {
      res.status(400).json({ error: "Missing required booking details." });
      return;
    }

    const calculatedAmount = recalculatePrice(roomId, checkIn, checkOut);
    const nights = calculateNights(checkIn, checkOut);

    // Double-booking check using Firestore Transaction
    const secureToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const bookingId = `RR-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const availabilityRef = db.collection('availability');

    // Run transaction
    const bookingDocId = await db.runTransaction(async (transaction) => {
      // Loop through date range to inspect limits
      const startDate = new Date(checkIn);
      const endDate = new Date(checkOut);
      
      for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const docId = `${roomId}_${dateStr}`;
        const dayRef = availabilityRef.doc(docId);
        const daySnap = await transaction.get(dayRef);
        
        const totalUnits = roomId === 'tent' ? 10 : 5; // Suppose 10 tents, 5 cottages total
        let bookedUnits = 0;

        if (daySnap.exists) {
          bookedUnits = daySnap.data().bookedUnits || 0;
          if (daySnap.data().isBlocked) {
            throw new Error(`Accommodation is blocked on date: ${dateStr}`);
          }
        }

        if (bookedUnits >= totalUnits) {
          throw new Error(`Accommodation is fully booked on date: ${dateStr}`);
        }

        // Lock/increment availability slot temporarily
        transaction.set(dayRef, {
          roomId: roomId,
          date: dateStr,
          bookedUnits: bookedUnits + 1,
          isBlocked: false
        }, { merge: true });
      }

      // Generate booking reference
      const newBookingRef = db.collection('bookings').doc();
      transaction.set(newBookingRef, {
        bookingId: bookingId,
        roomId: roomId,
        roomName: roomId === 'tent' ? 'Royal Safari Tent' : 'Heritage Stone Cottage',
        checkIn: checkIn,
        checkOut: checkOut,
        guests: guests,
        totalAmount: calculatedAmount,
        guestName: guestDetails.name,
        guestEmail: guestDetails.email,
        guestPhone: guestDetails.phone,
        specialRequests: guestDetails.requests || '',
        status: 'pending',
        paymentStatus: 'unpaid',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        secureToken: secureToken
      });

      return newBookingRef.id;
    });

    // Create Razorpay Order
    const options = {
      amount: calculatedAmount * 100, // Razorpay amount in paise
      currency: "INR",
      receipt: bookingDocId
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      bookingId: bookingId,
      secureToken: secureToken,
      bookingDocId: bookingDocId
    });

  } catch (err) {
    console.error("Booking transactional creation failed:", err);
    res.status(500).json({ error: err.message || "Failed to create booking order." });
  }
});


// 3. Verify Razorpay Payment (Secures transaction)
exports.verifyPayment = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId, secureToken } = req.body;

    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'RAZORPAY_KEY_SECRET_PLACEHOLDER');
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      res.status(400).json({ success: false, error: "Invalid transaction signature check." });
      return;
    }

    // Update booking in firestore to confirmed
    const snap = await db.collection('bookings')
      .where('bookingId', '==', bookingId)
      .where('secureToken', '==', secureToken)
      .limit(1)
      .get();

    if (snap.empty) {
      res.status(404).json({ success: false, error: "Booking reference mismatch." });
      return;
    }

    const bookingDoc = snap.docs[0];
    await bookingDoc.ref.update({
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentId: razorpay_payment_id
    });

    const bookingData = bookingDoc.data();

    // Trigger transactional confirmation email
    await sendConfirmationEmail(bookingData);

    res.status(200).json({ success: true });

  } catch (err) {
    console.error("Signature payment check failed:", err);
    res.status(500).json({ success: false, error: "Server signature error verification." });
  }
});


// 4. Cancel Booking (Refund & Release availability)
exports.cancelBooking = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { bookingDocId, secureToken } = req.body;

    if (!bookingDocId || !secureToken) {
      res.status(400).json({ error: "Missing required cancellation parameters." });
      return;
    }

    const bookingRef = db.collection('bookings').doc(bookingDocId);
    
    // Perform transaction to revert availability counts and change status
    await db.runTransaction(async (transaction) => {
      const bookingSnap = await transaction.get(bookingRef);
      if (!bookingSnap.exists) {
        throw new Error("Target booking record not found.");
      }

      const booking = bookingSnap.data();
      if (booking.secureToken !== secureToken) {
        throw new Error("Invalid cancellation authorization token.");
      }

      if (booking.status === 'cancelled') {
        throw new Error("This booking has already been cancelled.");
      }

      // Verify cancellation window (48 hours before check-in)
      const checkinDate = new Date(booking.checkIn);
      const limitDate = new Date(checkinDate);
      limitDate.setHours(limitDate.getHours() - 48);
      
      if (new Date() >= limitDate) {
        throw new Error("Cancellation window expired (48 hour lock policy).");
      }

      // Revert Availability records
      const availabilityRef = db.collection('availability');
      const startDate = new Date(booking.checkIn);
      const endDate = new Date(booking.checkOut);

      for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const docId = `${booking.roomId}_${dateStr}`;
        const dayRef = availabilityRef.doc(docId);
        const daySnap = await transaction.get(dayRef);

        if (daySnap.exists) {
          const bookedUnits = daySnap.data().bookedUnits || 0;
          transaction.update(dayRef, {
            bookedUnits: Math.max(0, bookedUnits - 1)
          });
        }
      }

      // Mark status as cancelled
      transaction.update(bookingRef, {
        status: 'cancelled',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    // Fetch refreshed data for cancellation email trigger
    const updatedSnap = await bookingRef.get();
    await sendCancellationEmail(updatedSnap.data());

    res.status(200).json({ success: true });

  } catch (err) {
    console.error("Cancellation operation failed:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to cancel booking." });
  }
});


// 5. Custom Claims Auth Setter (Setup claims safely)
exports.setAdminRole = functions.https.onCall(async (data, context) => {
  // Enforce caller check or super admin email checks
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must log in.');
  }

  const superAdmin = "raghavbhatia332@gmail.com";
  
  if (context.auth.token.email !== superAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized execution.');
  }

  const { targetUid, role } = data;
  if (!targetUid || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing parameters.');
  }

  try {
    await admin.auth().setCustomUserClaims(targetUid, { role: role });
    // Write admin audit log log
    await db.collection('auditLogs').add({
      adminEmail: context.auth.token.email,
      action: `Set role ${role} for uid: ${targetUid}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (err) {
    throw new functions.https.HttpsError('internal', err.message);
  }
});


// ─── Transactional Email Senders ───

async function sendConfirmationEmail(booking) {
  const msg = {
    to: booking.guestEmail,
    from: 'reservations@royalheritageresort.com',
    subject: `Reservation Confirmed - Royal Heritage Resort (${booking.bookingId})`,
    text: `Dear ${booking.guestName}, your reservation is confirmed for stays between ${booking.checkIn} and ${booking.checkOut}. Manage your stay securely here: https://royalheritageresort.com/booking-status.html?id=${booking.bookingId}&token=${booking.secureToken}`,
    html: `<p>Dear ${booking.guestName},</p><p>Your reservation is confirmed at <strong>Royal Heritage Resort</strong>.</p><p><strong>Booking ID:</strong> ${booking.bookingId}<br><strong>Check-in:</strong> ${booking.checkIn}<br><strong>Check-out:</strong> ${booking.checkOut}</p><p>Manage your reservation <a href="https://royalheritageresort.com/booking-status.html?id=${booking.bookingId}&token=${booking.secureToken}">here</a>.</p>`
  };
  try {
    await sgMail.send(msg);
  } catch (err) {
    console.error("SendGrid confirmation dispatch failure:", err);
  }
}

async function sendCancellationEmail(booking) {
  const msg = {
    to: booking.guestEmail,
    from: 'reservations@royalheritageresort.com',
    subject: `Reservation Cancelled - Royal Heritage Resort (${booking.bookingId})`,
    text: `Dear ${booking.guestName}, your reservation (${booking.bookingId}) has been successfully cancelled. If refunds are applicable, they will be processed according to our policy.`,
    html: `<p>Dear ${booking.guestName},</p><p>Your reservation (${booking.bookingId}) at <strong>Royal Heritage Resort</strong> has been successfully cancelled.</p>`
  };
  try {
    await sgMail.send(msg);
  } catch (err) {
    console.error("SendGrid cancellation dispatch failure:", err);
  }
}
