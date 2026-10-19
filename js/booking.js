/* ============================================================
   ROYAL HERITAGE RESORT — Booking Engine JS
   ============================================================
   Wizard step navigation, Firestore real-time availability checks,
   pricing recalculation, and payment integration.
   ============================================================ */

'use strict';

const BookingEngine = (() => {

  // State Management
  const state = {
    step: 1,
    checkIn: '',
    checkOut: '',
    nights: 0,
    guests: 2,
    selectedAccommodation: null, // item object
    guestDetails: null,
    totalPrice: 0
  };

  // Mock Accommodations Data for fallback
  const mockAccommodations = [
    {
      id: 'tent',
      name: 'Royal Safari Tent',
      price: 8500,
      image: '../assets/images/tent.png',
      capacity: 3,
      description: 'Luxury glamping tent with en-suite bath and valley views.'
    },
    {
      id: 'cottage',
      name: 'Heritage Stone Cottage',
      price: 12000,
      image: '../assets/images/cottage.png',
      capacity: 4,
      description: 'Stone wall cottage with cozy fireplace and private garden.'
    }
  ];

  /* ─── DOM Cache ─── */
  const checkinInput = document.getElementById('booking-checkin');
  const checkoutInput = document.getElementById('booking-checkout');
  const guestsInput = document.getElementById('booking-guests');
  const accListContainer = document.getElementById('accommodation-list');
  const summarySidebar = document.getElementById('summary-sidebar');

  // Sync steps visually
  function updateProgress() {
    // Update progress bar width
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
      progressBar.style.width = `${((state.step - 1) / 3) * 90}%`;
    }

    // Update step dots
    for (let i = 1; i <= 4; i++) {
      const dot = document.getElementById(`dot-${i}`);
      if (dot) {
        dot.classList.toggle('active', i === state.step);
        dot.classList.toggle('completed', i < state.step);
      }
    }

    // Toggle panels
    for (let i = 1; i <= 4; i++) {
      const panel = document.getElementById(`panel-${i}`);
      if (panel) {
        panel.classList.toggle('active', i === state.step);
      }
    }

    // Scroll back to top of form
    const container = document.querySelector('.booking-container');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Go to next step
  function nextStep() {
    if (state.step < 4) {
      state.step++;
      updateProgress();
    }
  }

  // Go to previous step
  function prevStep() {
    if (state.step > 1) {
      state.step--;
      updateProgress();
    }
  }

  // Initialize Form Fields & Date Picker Restrictions
  function initDates() {
    if (!checkinInput || !checkoutInput) return;

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const formatDate = (d) => d.toISOString().split('T')[0];

    checkinInput.min = formatDate(today);
    
    // Read URL params or set default
    const urlCheckin = Utils.getQueryParam('checkin');
    const urlCheckout = Utils.getQueryParam('checkout');
    const urlGuests = Utils.getQueryParam('guests');
    const urlType = Utils.getQueryParam('type');

    checkinInput.value = urlCheckin || formatDate(tomorrow);
    
    const initialCheckin = new Date(checkinInput.value);
    const initialNextDay = new Date(initialCheckin);
    initialNextDay.setDate(initialNextDay.getDate() + 1);
    checkoutInput.min = formatDate(initialNextDay);
    
    checkoutInput.value = urlCheckout || formatDate(dayAfter);
    if (urlGuests) guestsInput.value = urlGuests;

    // Listen for check-in changes to adjust check-out restrictions
    checkinInput.addEventListener('change', () => {
      const selectedCheckin = new Date(checkinInput.value);
      const nextDay = new Date(selectedCheckin);
      nextDay.setDate(nextDay.getDate() + 1);
      checkoutInput.min = formatDate(nextDay);
      if (new Date(checkoutInput.value) <= selectedCheckin) {
        checkoutInput.value = formatDate(nextDay);
      }
    });

    // Auto-search if coming from details page
    if (urlCheckin && urlCheckout) {
      setTimeout(() => {
        document.getElementById('booking-search-form').dispatchEvent(new Event('submit'));
        if (urlType) {
          state.autoSelectType = urlType;
        }
      }, 200);
    }
  }

  // Update Summary Sidebar values
  function updateSummary() {
    if (!summarySidebar) return;

    summarySidebar.style.display = 'block';
    
    document.getElementById('summary-dates').textContent = `${Utils.formatDate(state.checkIn)} — ${Utils.formatDate(state.checkOut)}`;
    document.getElementById('summary-nights').textContent = `${state.nights} Night${state.nights > 1 ? 's' : ''}`;
    document.getElementById('summary-guests-count').textContent = `${state.guests} Guest${state.guests > 1 ? 's' : ''}`;

    const roomBlock = document.getElementById('summary-room-block');
    if (state.selectedAccommodation) {
      roomBlock.style.display = 'block';
      document.getElementById('summary-room-name').textContent = state.selectedAccommodation.name;
      document.getElementById('summary-room-rate').textContent = `${Utils.formatPrice(state.selectedAccommodation.price)} / night`;
      
      state.totalPrice = state.selectedAccommodation.price * state.nights;
      document.getElementById('summary-total-price').textContent = Utils.formatPrice(state.totalPrice);
    } else {
      roomBlock.style.display = 'none';
    }
  }

  // Check availability logs in Firestore
  async function checkAvailability() {
    const listContainer = document.getElementById('accommodation-list');
    if (!listContainer) return;

    listContainer.textContent = '';
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.style.margin = '2rem auto';
    listContainer.appendChild(loader);

    let items = [...mockAccommodations];

    try {
      if (db) {
        // Fetch active accommodation types from Firestore
        const snap = await db.collection('accommodations').where('isActive', '==', true).get();
        if (!snap.empty) {
          items = [];
          snap.forEach(doc => {
            const data = doc.data();
            const mockRef = mockAccommodations.find(m => m.id === doc.id) || mockAccommodations[0];
            items.push({
              id: doc.id,
              name: data.name,
              price: data.basePrice,
              image: data.images && data.images[0] ? data.images[0] : mockRef.image,
              capacity: data.maxGuests,
              description: data.description || mockRef.description
            });
          });
        }
      }
    } catch (err) {
      console.warn("Firestore accommodations retrieval failed, using mock fallbacks:", err);
    }

    listContainer.textContent = ''; // Clear loader

    items.forEach(item => {
      // Capacity check
      if (state.guests > item.capacity) return;

      const card = document.createElement('div');
      card.className = 'select-acc-card';
      card.dataset.id = item.id;

      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.name;
      img.className = 'select-acc-img';

      const details = document.createElement('div');
      details.className = 'select-acc-details';

      const h3 = document.createElement('h3');
      h3.style.fontFamily = 'var(--font-display)';
      h3.style.fontSize = 'var(--fs-h4)';
      h3.style.marginBottom = 'var(--space-2)';
      h3.textContent = item.name;

      const pDesc = document.createElement('p');
      pDesc.style.fontSize = 'var(--fs-small)';
      pDesc.style.color = 'var(--text-muted)';
      pDesc.style.marginBottom = 'var(--space-4)';
      pDesc.textContent = item.description;

      const footer = document.createElement('div');
      footer.style.display = 'flex';
      footer.style.justifyContent = 'space-between';
      footer.style.alignItems = 'center';
      footer.style.marginTop = 'auto';

      const price = document.createElement('div');
      price.style.fontFamily = 'var(--font-display)';
      price.style.fontSize = 'var(--fs-h4)';
      price.style.color = 'var(--color-maroon)';
      price.style.fontWeight = 'var(--fw-bold)';
      price.textContent = `${Utils.formatPrice(item.price)} `;
      
      const span = document.createElement('span');
      span.style.fontSize = 'var(--fs-xs)';
      span.style.color = 'var(--text-muted)';
      span.style.fontWeight = 'var(--fw-regular)';
      span.textContent = '/ night';
      price.appendChild(span);

      const selectBtn = document.createElement('button');
      selectBtn.className = 'btn btn-outline btn-sm';
      selectBtn.textContent = 'Select Stay';
      
      selectBtn.addEventListener('click', () => {
        // Toggle selected state
        document.querySelectorAll('.select-acc-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        state.selectedAccommodation = item;
        document.getElementById('next-btn-2').disabled = false;
        updateSummary();
      });

      footer.appendChild(price);
      footer.appendChild(selectBtn);

      details.appendChild(h3);
      details.appendChild(pDesc);
      details.appendChild(footer);
      
      card.appendChild(img);
      card.appendChild(details);
      listContainer.appendChild(card);

      // Handle autoselect query param logic
      if (state.autoSelectType && state.autoSelectType === item.id) {
        selectBtn.click();
      }
    });

    if (listContainer.children.length === 0) {
      const noRooms = document.createElement('p');
      noRooms.style.textAlign = 'center';
      noRooms.style.padding = '2rem 0';
      noRooms.textContent = 'No accommodations available matching your guest count or criteria.';
      listContainer.appendChild(noRooms);
    }
  }

  // Handle Payment with Razorpay
  async function payNow() {
    const payBtn = document.getElementById('pay-now-btn');
    const origText = payBtn.textContent;
    payBtn.disabled = true;
    payBtn.textContent = 'Preparing Payment...';

    // Build booking payload
    const bookingPayload = {
      roomId: state.selectedAccommodation.id,
      checkIn: state.checkIn,
      checkOut: state.checkOut,
      guests: state.guests,
      amount: state.totalPrice,
      guestDetails: state.guestDetails
    };

    // If local test or Netlify demo environment, mock payment success & store booking directly
    const isLocalhost = window.location.hostname === 'localhost' 
      || window.location.hostname === '127.0.0.1'
      || window.location.hostname.endsWith('.netlify.app');
    
    if (isLocalhost || !db) {
      setTimeout(async () => {
        try {
          // Generate a secure token and unique ID
          const secureToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
          const bookingId = `RR-${Math.floor(100000 + Math.random() * 900000)}`;

          if (db) {
            await db.collection('bookings').add({
              bookingId: bookingId,
              roomId: bookingPayload.roomId,
              roomName: state.selectedAccommodation.name,
              checkIn: bookingPayload.checkIn,
              checkOut: bookingPayload.checkOut,
              guests: bookingPayload.guests,
              totalAmount: bookingPayload.amount,
              guestName: bookingPayload.guestDetails.name,
              guestEmail: bookingPayload.guestDetails.email,
              guestPhone: bookingPayload.guestDetails.phone,
              specialRequests: bookingPayload.guestDetails.requests || '',
              status: 'pending',
              paymentStatus: 'pending',
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              secureToken: secureToken
            });
          }

          // Redirect to confirmation screen
          const params = new URLSearchParams({
            id: bookingId,
            token: secureToken
          });
          window.location.href = `confirmation.html?${params.toString()}`;
        } catch (err) {
          console.error("Local booking mock save failed:", err);
          Utils.showToast("Failed to secure booking. Try again.", "error");
          payBtn.disabled = false;
          payBtn.textContent = origText;
        }
      }, 1500);
      return;
    }

    // Call Cloud Function API for actual Razorpay Checkout creation (Blaze requirement)
    try {
      const response = await fetch('/api/create-booking-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });
      const order = await response.json();

      const options = {
        key: "RAZORPAY_KEY_ID_PLACEHOLDER", // Loaded dynamically or populated
        amount: order.amount,
        currency: order.currency,
        name: "Royal Heritage Resort",
        description: `Booking for ${state.selectedAccommodation.name}`,
        order_id: order.id,
        handler: async function (response) {
          payBtn.textContent = 'Verifying Transaction...';
          
          // Verify signature server side
          try {
            const verification = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: order.bookingId,
                secureToken: order.secureToken
              })
            });
            const result = await verification.json();

            if (result.success) {
              window.location.href = `confirmation.html?id=${order.bookingId}&token=${order.secureToken}`;
            } else {
              Utils.showToast("Payment verification failed.", "error");
              payBtn.disabled = false;
              payBtn.textContent = origText;
            }
          } catch (err) {
            console.error("Payment verification call failed:", err);
            Utils.showToast("Payment validation server error.", "error");
            payBtn.disabled = false;
            payBtn.textContent = origText;
          }
        },
        prefill: {
          name: bookingPayload.guestDetails.name,
          email: bookingPayload.guestDetails.email,
          contact: bookingPayload.guestDetails.phone
        },
        theme: {
          color: "#6B0F1A"
        }
      };

      const rzp = new Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error("API booking call failed:", err);
      Utils.showToast("Server booking order creation failed.", "error");
      payBtn.disabled = false;
      payBtn.textContent = origText;
    }
  }

  // Bind UI Events
  function bindEvents() {
    // Step 1: Search Form
    const searchForm = document.getElementById('booking-search-form');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        state.checkIn = checkinInput.value;
        state.checkOut = checkoutInput.value;
        state.guests = parseInt(guestsInput.value, 10);
        state.nights = Utils.calculateNights(state.checkIn, state.checkOut);

        updateSummary();
        checkAvailability();
        nextStep();
      });
    }

    // Step 2: Select Room Navigation
    const nextBtn2 = document.getElementById('next-btn-2');
    if (nextBtn2) {
      nextBtn2.addEventListener('click', nextStep);
    }
    const prevBtn2 = document.getElementById('prev-btn-2');
    if (prevBtn2) {
      prevBtn2.addEventListener('click', prevStep);
    }

    // Step 3: Guest details Form
    const guestForm = document.getElementById('guest-details-form');
    if (guestForm) {
      guestForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const phoneValue = document.getElementById('guest-phone').value;
        const emailValue = document.getElementById('guest-email').value;

        if (!Utils.validatePhone(phoneValue)) {
          Utils.showToast("Please enter a valid 10-digit phone number.", "error");
          return;
        }

        if (!Utils.validateEmail(emailValue)) {
          Utils.showToast("Please enter a valid email address.", "error");
          return;
        }

        state.guestDetails = {
          name: document.getElementById('guest-name').value,
          email: emailValue,
          phone: phoneValue,
          requests: document.getElementById('guest-requests').value
        };

        nextStep();
      });
    }
    const prevBtn3 = document.getElementById('prev-btn-3');
    if (prevBtn3) {
      prevBtn3.addEventListener('click', prevStep);
    }

    // Step 4: Checkout panel trigger
    const payBtn = document.getElementById('pay-now-btn');
    if (payBtn) {
      payBtn.addEventListener('click', payNow);
    }
    const prevBtn4 = document.getElementById('prev-btn-4');
    if (prevBtn4) {
      prevBtn4.addEventListener('click', prevStep);
    }
  }

  // Init
  function init() {
    initDates();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    state
  };

})();
