/* ============================================================
   DESERT DREAMERS CAMP — Camp Configuration & WhatsApp Engine
   ============================================================
   Centralized pricing, desert experiences, and WhatsApp link
   generation. Dynamically syncs with Firestore settings/campConfig.
   ============================================================ */

'use strict';

window.DEFAULT_CAMP_CONFIG = {
  campName: "Desert Dreamers Camp",
  tagline: "Luxury Desert Resort & Glamping in Sam Sand Dunes",
  location: "Sam Sand Dunes, Near Sunset Point, Jaisalmer, Rajasthan 345001",
  whatsappNumber: "919876543210",
  phone: "+91 98765 43210",
  email: "reservations@desertdreamerscamp.com",

  // Accommodation Rates (per night, double occupancy, with breakfast & dinner)
  accommodations: {
    royal_ac_tent: {
      id: 'royal_ac_tent',
      name: 'Royal AC Swiss Tent',
      rate: 5500,
      badge: 'Most Popular',
      maxGuests: 3,
      desc: 'Weatherproof luxury AC Swiss tent with handcrafted wooden interiors, plush king bed, private en-suite bathroom with running hot/cold water, and sit-out porch facing the dunes.',
      image: '../assets/images/tent.png'
    },
    luxury_swiss_tent: {
      id: 'luxury_swiss_tent',
      name: 'Luxury Heritage Swiss Tent',
      rate: 4200,
      badge: 'Authentic Desert Living',
      maxGuests: 3,
      desc: 'Spacious traditional desert Swiss tent with ambient Rajasthani decor, private bathroom, fan/air-cooler, and serene desert veranda.',
      image: '../assets/images/hero.png'
    },
    maharani_suite: {
      id: 'maharani_suite',
      name: 'Maharani Sunset Dune Suite',
      rate: 7800,
      badge: 'Royal VIP Experience',
      maxGuests: 4,
      desc: 'Ultra-luxurious elevated cottage perched directly over the golden dunes with private stargazing deck, panoramic sunset view, AC, mini-fridge, and royal bath amenities.',
      image: '../assets/images/cottage.png'
    }
  },

  extraAdultRate: 1500,
  extraChildRate: 800,

  // Desert Activities & Safaris
  activities: {
    camel_safari: {
      id: 'camel_safari',
      name: 'Sunset Camel Safari in Sam Dunes',
      price: 600,
      unit: 'person',
      desc: 'Guided camel trek into deep untouched dunes for mesmerizing sunset view.'
    },
    jeep_bashing: {
      id: 'jeep_bashing',
      name: '4x4 Thar Jeep Dune Bashing',
      price: 1800,
      unit: 'jeep (up to 5 guests)',
      desc: 'Thrilling roller-coaster ride over high desert dunes with seasoned desert drivers.'
    },
    quad_biking: {
      id: 'quad_biking',
      name: 'Desert Quad Biking / ATV (20 Mins)',
      price: 1200,
      unit: 'person',
      desc: 'Self-ride all-terrain 4x4 quad bike through desert tracks.'
    },
    parasailing: {
      id: 'parasailing',
      name: 'Desert Parasailing Experience',
      price: 1500,
      unit: 'person',
      desc: 'Fly high above the Thar Desert landscape towed by our off-road vehicle.'
    },
    candlelight_dinner: {
      id: 'candlelight_dinner',
      name: 'Private Candlelight Sand Dune Dinner',
      price: 3500,
      unit: 'couple',
      desc: 'Romantic dining setup atop secluded sand dunes illuminated by brass lanterns and stars.'
    }
  },

  // Free standard inclusions in every stay package
  inclusions: [
    'Traditional Rajasthani Welcome with Aarti, Tikka & Dhol',
    'Evening Tea/Coffee & Hot Snacks on Sand Dunes at Sunset',
    'Evening Campfire with live Kalbeliya Folk Dance & Music show',
    'Lavish Rajasthani Buffet Dinner (Dal Baati Churma, Ker Sangri & multi-cuisine)',
    'Stargazing under crystal-clear Thar desert sky',
    'Morning Buffet Breakfast with continental & Indian choices'
  ]
};

// Working in-memory camp configuration
window.CAMP_CONFIG = JSON.parse(JSON.stringify(window.DEFAULT_CAMP_CONFIG));

/**
 * Sync configuration from Firebase Firestore if available
 */
window.syncCampConfigFromFirestore = async function() {
  try {
    if (typeof db !== 'undefined' && db) {
      const doc = await db.collection('settings').doc('campConfig').get();
      if (doc.exists) {
        const data = doc.data();
        if (data.accommodations) {
          window.CAMP_CONFIG.accommodations = Object.assign({}, window.CAMP_CONFIG.accommodations, data.accommodations);
        }
        if (data.activities) {
          window.CAMP_CONFIG.activities = Object.assign({}, window.CAMP_CONFIG.activities, data.activities);
        }
        if (data.whatsappNumber) window.CAMP_CONFIG.whatsappNumber = data.whatsappNumber;
        if (data.phone) window.CAMP_CONFIG.phone = data.phone;
        if (data.email) window.CAMP_CONFIG.email = data.email;
        if (data.extraAdultRate) window.CAMP_CONFIG.extraAdultRate = Number(data.extraAdultRate);
        if (data.extraChildRate) window.CAMP_CONFIG.extraChildRate = Number(data.extraChildRate);
        console.log('[CampConfig] Synced rates & config from Firestore successfully.');
      }
    }
  } catch (err) {
    console.warn('[CampConfig] Could not sync from Firestore (using local defaults):', err.message);
  }

  // Notify listeners that config is updated
  window.dispatchEvent(new CustomEvent('campConfigLoaded', { detail: window.CAMP_CONFIG }));
};

/**
 * Calculates detailed price quote based on stay parameters
 */
window.calculateCampQuote = function(opts) {
  const cfg = window.CAMP_CONFIG;
  const tentId = opts.tentId || 'royal_ac_tent';
  const tent = cfg.accommodations[tentId] || cfg.accommodations['royal_ac_tent'];
  
  const checkin = opts.checkin ? new Date(opts.checkin) : new Date();
  const checkout = opts.checkout ? new Date(opts.checkout) : new Date(Date.now() + 86400000);
  
  let nights = Math.round((checkout - checkin) / (1000 * 60 * 60 * 24));
  if (nights < 1) nights = 1;

  const adults = Number(opts.adults) || 2;
  const children = Number(opts.children) || 0;

  // Base stay cost (includes up to 2 adults)
  const baseRatePerNight = tent.rate;
  const stayCost = baseRatePerNight * nights;

  // Extra adults (> 2)
  const extraAdultsCount = Math.max(0, adults - 2);
  const extraAdultCost = extraAdultsCount * cfg.extraAdultRate * nights;

  // Extra children
  const extraChildCost = children * cfg.extraChildRate * nights;

  // Selected Activities
  let activitiesTotal = 0;
  const selectedActivitiesList = [];

  if (Array.isArray(opts.activities)) {
    opts.activities.forEach(actId => {
      const act = cfg.activities[actId];
      if (act) {
        let cost = act.price;
        if (act.unit === 'person') {
          cost = act.price * adults;
        }
        activitiesTotal += cost;
        selectedActivitiesList.push({
          id: act.id,
          name: act.name,
          cost: cost,
          unit: act.unit
        });
      }
    });
  }

  const grandTotal = stayCost + extraAdultCost + extraChildCost + activitiesTotal;

  return {
    tent,
    nights,
    adults,
    children,
    extraAdultsCount,
    baseRatePerNight,
    stayCost,
    extraAdultCost,
    extraChildCost,
    selectedActivitiesList,
    activitiesTotal,
    grandTotal
  };
};

/**
 * Formats and generates the direct WhatsApp booking URL
 */
window.generateWhatsAppBookingLink = function(data) {
  const cfg = window.CAMP_CONFIG;
  const phone = (cfg.whatsappNumber || '919876543210').replace(/\D/g, '');

  const quote = window.calculateCampQuote(data);

  const checkinStr = data.checkin || 'Not specified';
  const checkoutStr = data.checkout || 'Not specified';

  let text = `🐫 *DESERT DREAMERS CAMP — BOOKING ENQUIRY*\n`;
  text += `📍 *Location:* Sam Sand Dunes, Jaisalmer, Rajasthan\n`;
  text += `────────────────────────────\n`;
  if (data.guestName) text += `👤 *Guest Name:* ${data.guestName}\n`;
  if (data.guestPhone) text += `📞 *Guest Phone:* ${data.guestPhone}\n`;
  if (data.guestCity) text += `🏙️ *City:* ${data.guestCity}\n`;
  text += `🏕️ *Accommodation:* ${quote.tent.name}\n`;
  text += `📅 *Dates:* ${checkinStr} to ${checkoutStr} (${quote.nights} Night${quote.nights > 1 ? 's' : ''})\n`;
  text += `👥 *Guests:* ${quote.adults} Adult${quote.adults > 1 ? 's' : ''}${quote.children > 0 ? `, ${quote.children} Child(ren)` : ''}\n`;
  text += `🍽️ *Inclusions:* Welcome Aarti, Camel Safari Sunset, Cultural Folk Dance & Campfire, Buffet Dinner & Breakfast\n`;

  if (quote.selectedActivitiesList.length > 0) {
    text += `\n🐪 *Additional Desert Safaris:*\n`;
    quote.selectedActivitiesList.forEach(act => {
      text += `  • ${act.name} (+₹${act.cost.toLocaleString('en-IN')})\n`;
    });
  }

  text += `────────────────────────────\n`;
  text += `💰 *Estimated Total Quote:* ₹${quote.grandTotal.toLocaleString('en-IN')}\n`;
  text += `────────────────────────────\n`;
  if (data.specialRequests) {
    text += `📝 *Notes/Requests:* ${data.specialRequests}\n`;
  }
  text += `_Hello Desert Dreamers team! Please confirm tent availability and advance booking details for our Jaisalmer trip._`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
};

// Initialize configuration sync on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.syncCampConfigFromFirestore();
});
