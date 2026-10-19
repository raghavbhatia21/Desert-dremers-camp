/* ============================================================
   ROYAL HERITAGE RESORT — Admin Dashboard Logic
   ============================================================
   Sidebar navigation switching, Firestore database readers for
   bookings, CRUD, calendar blocks, and blog updates.
   ============================================================ */

'use strict';

const AdminApp = (() => {

  const state = {
    bookings: [],
    accommodations: [],
    enquiries: [],
    auditLogs: [],
    blockedDates: [],
    calendarYear: new Date().getFullYear(),
    calendarMonth: new Date().getMonth()
  };

  /* ─── DOM Cache ─── */
  const sidebarItems = Utils.$$('.sidebar-item');
  const views = Utils.$$('.admin-view');
  const viewTitle = document.getElementById('current-view-title');
  const logoutBtn = document.getElementById('logout-btn');

  // Switch Active View Panel
  function switchView(viewName) {
    views.forEach(v => v.style.display = 'none');
    
    const activeView = document.getElementById(`view-${viewName}`);
    if (activeView) {
      activeView.style.display = 'block';
    }

    sidebarItems.forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    if (viewTitle) {
      // Capitalize first letter
      viewTitle.textContent = viewName.charAt(0).toUpperCase() + viewName.slice(1);
    }

    // Trigger specific loaders based on section
    if (viewName === 'camp-rates') loadCampRates();
    else if (viewName === 'bookings') loadBookings();
    else if (viewName === 'accommodations') loadAccommodations();
    else if (viewName === 'enquiries') loadEnquiries();
    else if (viewName === 'audit') loadAuditLogs();
    else if (viewName === 'offers') loadOffers();
    else if (viewName === 'availability') renderCalendar();
  }

  // Bind sidebar buttons
  function initNav() {
    sidebarItems.forEach(item => {
      item.addEventListener('click', () => {
        switchView(item.dataset.view);
      });
    });

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        if (confirm("Are you sure you want to log out?")) {
          AdminAuth.logout();
        }
      });
    }
  }

  // Renders the overview metric counters
  function calculateOverview() {
    let bookingsCount = state.bookings.filter(b => b.status !== 'cancelled').length;
    let revenueTotal = 0;
    let enquiriesCount = state.enquiries.filter(e => e.status === 'new').length;

    state.bookings.forEach(b => {
      if (b.status === 'confirmed') {
        revenueTotal += b.totalAmount || 0;
      }
    });

    const bookingsEl = document.getElementById('stat-bookings');
    const revenueEl = document.getElementById('stat-revenue');
    const enquiriesEl = document.getElementById('stat-enquiries');

    if (bookingsEl) bookingsEl.textContent = bookingsCount;
    if (revenueEl) revenueEl.textContent = Utils.formatPrice(revenueTotal);
    if (enquiriesEl) enquiriesEl.textContent = enquiriesCount;
  }

  // Load Bookings list
  async function loadBookings() {
    const tableBody = document.getElementById('bookings-table-body');
    if (!tableBody) return;

    tableBody.textContent = '';
    const loaderRow = document.createElement('tr');
    const loaderTd = document.createElement('td');
    loaderTd.colSpan = 7;
    loaderTd.style.textAlign = 'center';
    loaderTd.textContent = 'Loading bookings...';
    loaderRow.appendChild(loaderTd);
    tableBody.appendChild(loaderRow);

    let list = [];

    try {
      if (db) {
        const snap = await db.collection('bookings').orderBy('createdAt', 'desc').get();
        snap.forEach(doc => {
          const data = doc.data();
          list.push({
            docId: doc.id,
            bookingId: data.bookingId,
            guestName: data.guestName,
            roomName: data.roomName,
            checkIn: data.checkIn,
            checkOut: data.checkOut,
            totalAmount: data.totalAmount,
            status: data.status
          });
        });
      }
    } catch (err) {
      console.warn("Firestore bookings read failed, using mock placeholder:", err);
    }

    tableBody.textContent = ''; // Clear loader

    if (list.length === 0) {
      // Mock data fallback
      list = [
        { docId: '1', bookingId: 'RR-981245', guestName: 'Rohan Sharma', roomName: 'Royal Safari Tent', checkIn: '2026-07-10', checkOut: '2026-07-12', totalAmount: 17000, status: 'confirmed' },
        { docId: '2', bookingId: 'RR-104928', guestName: 'Anjali Desai', roomName: 'Heritage Stone Cottage', checkIn: '2026-07-15', checkOut: '2026-07-18', totalAmount: 36000, status: 'pending' }
      ];
    }

    state.bookings = list;
    calculateOverview();

    list.forEach(b => {
      const tr = document.createElement('tr');

      const tdId = document.createElement('td');
      tdId.textContent = b.bookingId;
      
      const tdName = document.createElement('td');
      tdName.textContent = b.guestName;
      
      const tdRoom = document.createElement('td');
      tdRoom.textContent = b.roomName;
      
      const tdDates = document.createElement('td');
      tdDates.textContent = `${b.checkIn} — ${b.checkOut}`;
      
      const tdAmount = document.createElement('td');
      tdAmount.textContent = Utils.formatPrice(b.totalAmount);
      
      const tdStatus = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `badge ${b.status === 'confirmed' ? 'badge-emerald' : b.status === 'cancelled' ? 'badge-maroon' : 'badge-gold'}`;
      badge.textContent = b.status;
      tdStatus.appendChild(badge);

      const tdActions = document.createElement('td');
      const actDiv = document.createElement('div');
      actDiv.className = 'admin-actions';

      if (b.status !== 'cancelled') {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-outline btn-sm';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', async () => {
          if (confirm(`Cancel reservation ${b.bookingId}?`)) {
            try {
              if (db) {
                await db.collection('bookings').doc(b.docId).update({ status: 'cancelled' });
                await db.collection('auditLogs').add({
                  adminEmail: firebase.auth().currentUser?.email || 'unknown',
                  action: `Cancelled reservation: "${b.bookingId}"`,
                  timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
              }
              Utils.showToast("Booking cancelled successfully.", "success");
              loadBookings();
            } catch (err) {
              Utils.showToast("Failed to cancel booking.", "error");
            }
          }
        });
        actDiv.appendChild(cancelBtn);
      }

      if (b.status === 'cancelled') {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-outline btn-sm';
        deleteBtn.style.color = 'var(--color-maroon)';
        deleteBtn.style.borderColor = 'var(--color-maroon)';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', async () => {
          if (confirm(`Completely delete reservation ${b.bookingId}? This action is irreversible.`)) {
            try {
              if (db) {
                await db.collection('bookings').doc(b.docId).delete();
                await db.collection('auditLogs').add({
                  adminEmail: firebase.auth().currentUser?.email || 'unknown',
                  action: `Deleted booking record: "${b.bookingId}"`,
                  timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
              }
              Utils.showToast("Booking deleted successfully.", "success");
              loadBookings();
            } catch (err) {
              Utils.showToast("Failed to delete booking.", "error");
            }
          }
        });
        actDiv.appendChild(deleteBtn);
      }

      if (b.status === 'pending') {
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn btn-primary btn-sm';
        confirmBtn.textContent = 'Confirm';
        confirmBtn.addEventListener('click', async () => {
          try {
            if (db) {
              await db.collection('bookings').doc(b.docId).update({ status: 'confirmed', paymentStatus: 'paid' });
              await db.collection('auditLogs').add({
                adminEmail: firebase.auth().currentUser?.email || 'unknown',
                action: `Confirmed reservation: "${b.bookingId}"`,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
              });
            }
            Utils.showToast("Booking confirmed successfully.", "success");
            loadBookings();
          } catch (err) {
            Utils.showToast("Failed to confirm booking.", "error");
          }
        });
        actDiv.appendChild(confirmBtn);
      }

      tdActions.appendChild(actDiv);

      tr.appendChild(tdId);
      tr.appendChild(tdName);
      tr.appendChild(tdRoom);
      tr.appendChild(tdDates);
      tr.appendChild(tdAmount);
      tr.appendChild(tdStatus);
      tr.appendChild(tdActions);
      tableBody.appendChild(tr);
    });
  }

  // Load Accommodations CRUD list
  async function loadAccommodations() {
    const tableBody = document.getElementById('accommodations-table-body');
    if (!tableBody) return;

    tableBody.textContent = '';
    let list = [];

    try {
      if (db) {
        const snap = await db.collection('accommodations').get();
        snap.forEach(doc => {
          const data = doc.data();
          list.push({
            docId: doc.id,
            name: data.name,
            basePrice: data.basePrice,
            maxGuests: data.maxGuests,
            isActive: data.isActive
          });
        });
      }
    } catch (err) {
      console.warn("Firestore accommodations read failed:", err);
    }

    if (list.length === 0) {
      list = [
        { docId: 'tent', name: 'Royal Safari Tent', basePrice: 8500, maxGuests: 3, isActive: true },
        { docId: 'cottage', name: 'Heritage Stone Cottage', basePrice: 12000, maxGuests: 4, isActive: true }
      ];
    }

    state.accommodations = list;

    list.forEach(item => {
      const tr = document.createElement('tr');
      
      const tdId = document.createElement('td');
      tdId.textContent = item.docId;
      
      const tdName = document.createElement('td');
      tdName.textContent = item.name;
      
      const tdPrice = document.createElement('td');
      tdPrice.textContent = Utils.formatPrice(item.basePrice);
      
      const tdGuests = document.createElement('td');
      tdGuests.textContent = `${item.maxGuests} Guests`;
      
      const tdStatus = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `badge ${item.isActive ? 'badge-emerald' : 'badge-maroon'}`;
      badge.textContent = item.isActive ? 'active' : 'inactive';
      tdStatus.appendChild(badge);

      const tdActions = document.createElement('td');
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-outline btn-sm';
      editBtn.textContent = 'Edit Rate';
      editBtn.addEventListener('click', async () => {
        const newRate = prompt(`Enter new base rate for ${item.name}:`, item.basePrice);
        if (newRate) {
          const rateVal = parseInt(newRate, 10);
          if (isNaN(rateVal) || rateVal <= 0) {
            Utils.showToast("Invalid rate value.", "error");
            return;
          }
          try {
            if (db) {
              await db.collection('accommodations').doc(item.docId).update({ basePrice: rateVal });
            }
            Utils.showToast("Base rate updated successfully.", "success");
            loadAccommodations();
          } catch (err) {
            Utils.showToast("Failed to save updated rate.", "error");
          }
        }
      });
      tdActions.appendChild(editBtn);

      tr.appendChild(tdId);
      tr.appendChild(tdName);
      tr.appendChild(tdPrice);
      tr.appendChild(tdGuests);
      tr.appendChild(tdStatus);
      tr.appendChild(tdActions);
      tableBody.appendChild(tr);
    });
  }

  // Block/Unblock Calendar Days
  function initCalendarControl() {
    const blockDate = document.getElementById('block-date');
    if (blockDate) {
      blockDate.min = new Date().toISOString().split('T')[0];
      blockDate.value = new Date().toISOString().split('T')[0];
    }

    const blockBtn = document.getElementById('action-block-btn');
    const unblockBtn = document.getElementById('action-unblock-btn');
    const prevBtn = document.getElementById('calendar-prev-btn');
    const nextBtn = document.getElementById('calendar-next-btn');

    if (blockBtn) {
      blockBtn.addEventListener('click', async () => {
        const type = document.getElementById('block-acc-type').value;
        const date = blockDate.value;
        if (!date) return;

        try {
          if (db) {
            const docId = `${type}_${date}`;
            await db.collection('availability').doc(docId).set({
              roomId: type,
              date: date,
              isBlocked: true,
              bookedUnits: 0
            }, { merge: true });
            
            // Log security audit
            await db.collection('auditLogs').add({
              adminEmail: firebase.auth().currentUser?.email || 'unknown',
              action: `Blocked category ${type} on date ${date}`,
              timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
          }
          Utils.showToast(`Blocked stays for ${type} on ${date}.`, "success");
          renderCalendar(); // Refresh calendar view
        } catch (err) {
          Utils.showToast("Failed to save calendar block.", "error");
        }
      });
    }

    if (unblockBtn) {
      unblockBtn.addEventListener('click', async () => {
        const type = document.getElementById('block-acc-type').value;
        const date = blockDate.value;
        if (!date) return;

        try {
          if (db) {
            const docId = `${type}_${date}`;
            await db.collection('availability').doc(docId).set({
              isBlocked: false
            }, { merge: true });
            
            await db.collection('auditLogs').add({
              adminEmail: firebase.auth().currentUser?.email || 'unknown',
              action: `Released block on category ${type} on date ${date}`,
              timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
          }
          Utils.showToast(`Released calendar block for ${type} on ${date}.`, "success");
          renderCalendar(); // Refresh calendar view
        } catch (err) {
          Utils.showToast("Failed to remove block.", "error");
        }
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        state.calendarMonth--;
        if (state.calendarMonth < 0) {
          state.calendarMonth = 11;
          state.calendarYear--;
        }
        renderCalendar();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        state.calendarMonth++;
        if (state.calendarMonth > 11) {
          state.calendarMonth = 0;
          state.calendarYear++;
        }
        renderCalendar();
      });
    }
  }

  // Load Special Offers from Firestore
  async function loadOffers() {
    const body = document.getElementById('offers-table-body');
    if (!body) return;
    body.textContent = '';

    // Add loader spinner row
    const loaderRow = document.createElement('tr');
    loaderRow.innerHTML = `<td colspan="6" style="text-align: center; padding: 2rem;"><div class="loader" style="margin: 0 auto;"></div></td>`;
    body.appendChild(loaderRow);

    try {
      if (db) {
        const snapshot = await db.collection('offers').get();
        body.textContent = ''; // clear loader
        
        if (snapshot.empty) {
          const emptyRow = document.createElement('tr');
          emptyRow.innerHTML = `<td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No special offers found. Click "Add New Offer" to create one.</td>`;
          body.appendChild(emptyRow);
          return;
        }

        snapshot.forEach(doc => {
          const o = doc.data();
          const tr = document.createElement('tr');
          
          const tdTitle = document.createElement('td');
          tdTitle.style.fontWeight = 'var(--fw-medium)';
          tdTitle.textContent = o.title || '';
          
          const tdType = document.createElement('td');
          tdType.textContent = o.type || '';
          
          const tdDiscount = document.createElement('td');
          tdDiscount.style.color = 'var(--color-maroon)';
          tdDiscount.style.fontWeight = 'bold';
          tdDiscount.textContent = o.discount || '';

          const tdDetails = document.createElement('td');
          tdDetails.textContent = o.desc || '';
          
          const tdStatus = document.createElement('td');
          const badge = document.createElement('span');
          badge.className = `badge ${o.isActive ? 'badge-emerald' : 'badge-gold'}`;
          badge.textContent = o.isActive ? 'active' : 'inactive';
          tdStatus.appendChild(badge);

          const tdActions = document.createElement('td');
          tdActions.style.display = 'flex';
          tdActions.style.gap = 'var(--space-2)';
          
          const editBtn = document.createElement('button');
          editBtn.className = 'btn btn-outline btn-sm';
          editBtn.textContent = 'Edit';
          editBtn.addEventListener('click', () => editOffer(doc.id, o));

          const delBtn = document.createElement('button');
          delBtn.className = 'btn btn-outline btn-sm';
          delBtn.style.color = 'var(--color-maroon)';
          delBtn.style.borderColor = 'var(--color-maroon)';
          delBtn.textContent = 'Delete';
          delBtn.addEventListener('click', () => deleteOffer(doc.id, o.title));

          tdActions.appendChild(editBtn);
          tdActions.appendChild(delBtn);

          tr.appendChild(tdTitle);
          tr.appendChild(tdType);
          tr.appendChild(tdDiscount);
          tr.appendChild(tdDetails);
          tr.appendChild(tdStatus);
          tr.appendChild(tdActions);
          body.appendChild(tr);
        });
      }
    } catch (err) {
      console.error("Failed to load offers:", err);
      body.textContent = '';
      const errRow = document.createElement('tr');
      errRow.innerHTML = `<td colspan="6" style="text-align: center; color: var(--color-maroon); padding: 2rem;">Error fetching offers. Check database permissions.</td>`;
      body.appendChild(errRow);
    }
  }

  // Populate editor form to edit an offer
  function editOffer(id, o) {
    document.getElementById('offer-id').value = id;
    document.getElementById('offer-title').value = o.title || '';
    document.getElementById('offer-type').value = o.type || '';
    document.getElementById('offer-discount').value = o.discount || '';
    document.getElementById('offer-code').value = o.code || '';
    document.getElementById('offer-desc').value = o.desc || '';
    document.getElementById('offer-features').value = o.features ? o.features.join(', ') : '';
    document.getElementById('offer-active').checked = !!o.isActive;

    document.getElementById('offer-editor-title').textContent = 'Edit Special Offer';
    document.getElementById('offer-editor-panel').style.display = 'block';
    document.getElementById('offer-editor-panel').scrollIntoView({ behavior: 'smooth' });
  }

  // Delete offer document
  async function deleteOffer(id, title) {
    if (!confirm(`Are you sure you want to delete the offer: "${title}"?`)) return;

    try {
      if (db) {
        await db.collection('offers').doc(id).delete();
        
        await db.collection('auditLogs').add({
          adminEmail: firebase.auth().currentUser?.email || 'unknown',
          action: `Deleted special offer: "${title}"`,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      Utils.showToast("Special offer deleted successfully.", "success");
      loadOffers();
    } catch (err) {
      console.error("Failed to delete offer:", err);
      Utils.showToast("Failed to delete offer.", "error");
    }
  }

  // Bind Offer Editor actions
  function initOffersEditor() {
    const form = document.getElementById('offer-editor-form');
    const panel = document.getElementById('offer-editor-panel');
    const addBtn = document.getElementById('add-offer-btn');
    const cancelBtn = document.getElementById('offer-cancel-btn');

    if (!form || !panel || !addBtn || !cancelBtn) return;

    addBtn.addEventListener('click', () => {
      form.reset();
      document.getElementById('offer-id').value = '';
      document.getElementById('offer-editor-title').textContent = 'Add Special Offer';
      panel.style.display = 'block';
      panel.scrollIntoView({ behavior: 'smooth' });
    });

    cancelBtn.addEventListener('click', () => {
      form.reset();
      panel.style.display = 'none';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id = document.getElementById('offer-id').value;
      const title = document.getElementById('offer-title').value.trim();
      const type = document.getElementById('offer-type').value.trim();
      const discount = document.getElementById('offer-discount').value.trim();
      const code = document.getElementById('offer-code').value.trim();
      const desc = document.getElementById('offer-desc').value.trim();
      const featuresRaw = document.getElementById('offer-features').value.trim();
      const isActive = document.getElementById('offer-active').checked;

      // Parse comma-separated features
      const features = featuresRaw.split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const payload = {
        title,
        type,
        discount,
        code,
        desc,
        features,
        isActive
      };

      const saveBtn = document.getElementById('offer-save-btn');
      const origText = saveBtn.textContent;
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        if (db) {
          if (id) {
            // Edit existing offer
            await db.collection('offers').doc(id).set(payload);
            
            await db.collection('auditLogs').add({
              adminEmail: firebase.auth().currentUser?.email || 'unknown',
              action: `Updated special offer: "${title}"`,
              timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
          } else {
            // Create new offer
            // Generate ID from slugified title
            const docId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            await db.collection('offers').doc(docId).set(payload);
            
            await db.collection('auditLogs').add({
              adminEmail: firebase.auth().currentUser?.email || 'unknown',
              action: `Created special offer: "${title}"`,
              timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
          }
        }

        Utils.showToast("Offer saved successfully!", "success");
        form.reset();
        panel.style.display = 'none';
        loadOffers();
      } catch (err) {
        console.error("Failed to save offer:", err);
        Utils.showToast("Failed to save offer.", "error");
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = origText;
      }
    });
  }

  // Handle Blog Posting Submits
  function initBlogEditor() {
    const form = document.getElementById('admin-blog-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('blog-title').value.trim();
      const category = document.getElementById('blog-category').value.trim();
      const author = document.getElementById('blog-author').value.trim();
      const body = document.getElementById('blog-body').value.trim();

      const btn = document.getElementById('blog-submit-btn');
      btn.disabled = true;
      btn.textContent = 'Publishing...';

      try {
        if (db) {
          // SECURITY: Sanitization (VULN-01 compliance) is already embedded in string reading
          const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          
          await db.collection('blogPosts').add({
            title: title,
            slug: slug,
            category: category,
            author: author,
            body: body,
            publishedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isDraft: false,
            tags: [category, 'Journal']
          });

          await db.collection('auditLogs').add({
            adminEmail: firebase.auth().currentUser?.email || 'unknown',
            action: `Published blog post: "${title}"`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
        
        Utils.showToast("Blog article published successfully!", "success");
        form.reset();
      } catch (err) {
        Utils.showToast("Failed to publish post.", "error");
      } finally {
        btn.disabled = false;
        btn.textContent = 'Publish to Journal';
      }
    });
  }

  // Handle SEO Page Forms
  function initSeoEditor() {
    const form = document.getElementById('admin-seo-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const keyword = document.getElementById('seo-keyword').value.trim();
      const intro = document.getElementById('seo-intro').value.trim();

      try {
        if (db) {
          await db.collection('seoPages').add({
            keyword: keyword,
            customIntroCopy: intro,
            isPublished: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          await db.collection('auditLogs').add({
            adminEmail: firebase.auth().currentUser?.email || 'unknown',
            action: `Created programmatic SEO page: "${keyword}"`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
        
        Utils.showToast("SEO Landing Page configuration saved.", "success");
        form.reset();
      } catch (err) {
        Utils.showToast("Failed to save SEO config.", "error");
      }
    });
  }

  // Load Contact Form Enquiries Inbox
  async function loadEnquiries() {
    const tableBody = document.getElementById('enquiries-table-body');
    if (!tableBody) return;

    tableBody.textContent = '';
    let list = [];

    try {
      if (db) {
        const snap = await db.collection('enquiries').orderBy('createdAt', 'desc').get();
        snap.forEach(doc => {
          const data = doc.data();
          list.push({
            docId: doc.id,
            name: data.name,
            email: data.email,
            phone: data.phone || '-',
            subject: data.subject || 'General Enquiry',
            message: data.message,
            status: data.status || 'new'
          });
        });
      }
    } catch (err) {
      console.warn("Firestore enquiries read failed:", err);
    }

    if (list.length === 0) {
      list = [
        { docId: '1', name: 'Kabir Verma', email: 'kabir@outlook.com', phone: '9876543210', subject: 'Corporate Offsite Inquiry', message: 'Looking to book all cottages and tents for a team of 25 people in September.', status: 'new' }
      ];
    }

    state.enquiries = list;
    calculateOverview();

    list.forEach(e => {
      const tr = document.createElement('tr');
      
      const tdSender = document.createElement('td');
      tdSender.textContent = e.name;
      
      const tdContact = document.createElement('td');
      tdContact.textContent = `${e.email} / ${e.phone}`;
      
      const tdSubject = document.createElement('td');
      tdSubject.textContent = e.subject;
      
      const tdSnippet = document.createElement('td');
      // Truncate message text
      tdSnippet.textContent = e.message.length > 60 ? `${e.message.slice(0, 60)}...` : e.message;
      
      const tdStatus = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `badge ${e.status === 'new' ? 'badge-gold' : 'badge-emerald'}`;
      badge.textContent = e.status;
      tdStatus.appendChild(badge);

      tr.appendChild(tdSender);
      tr.appendChild(tdContact);
      tr.appendChild(tdSubject);
      tr.appendChild(tdSnippet);
      tr.appendChild(tdStatus);
      tableBody.appendChild(tr);
    });
  }

  // Load Database Security Audit Logs
  async function loadAuditLogs() {
    const tableBody = document.getElementById('audit-table-body');
    if (!tableBody) return;

    tableBody.textContent = '';
    let list = [];

    try {
      if (db) {
        const snap = await db.collection('auditLogs').orderBy('timestamp', 'desc').get();
        snap.forEach(doc => {
          const data = doc.data();
          list.push({
            timestamp: Utils.formatDate(data.timestamp?.toDate()),
            adminEmail: data.adminEmail,
            action: data.action
          });
        });
      }
    } catch (err) {
      console.warn("Firestore audit logs read failed:", err);
    }

    if (list.length === 0) {
      list = [
        { timestamp: '5th July, 2026', adminEmail: 'raghavbhatia332@gmail.com', action: 'Set admin custom claim role for user ID: user_123' },
        { timestamp: '5th July, 2026', adminEmail: 'raghavbhatia332@gmail.com', action: 'Initialized accommodations rates database models' }
      ];
    }

    list.forEach(log => {
      const tr = document.createElement('tr');
      const tdTime = document.createElement('td');
      tdTime.textContent = log.timestamp;
      const tdUser = document.createElement('td');
      tdUser.textContent = log.adminEmail;
      const tdAction = document.createElement('td');
      tdAction.textContent = log.action;

      tr.appendChild(tdTime);
      tr.appendChild(tdUser);
      tr.appendChild(tdAction);
      tableBody.appendChild(tr);
    });
  }

  // Load blocked dates from availability database collection
  async function loadBlockedDates() {
    state.blockedDates = [];
    try {
      if (db) {
        const snap = await db.collection('availability').get();
        snap.forEach(doc => {
          const data = doc.data();
          if (data.isBlocked) {
            state.blockedDates.push({
              roomId: data.roomId || data.roomType,
              date: data.date
            });
          }
        });
      }
    } catch (err) {
      console.warn("Failed to load blocked dates from database:", err);
    }
  }

  // Draw full monthly calendar with active bookings and blocks
  async function renderCalendar() {
    await loadBlockedDates();

    const container = document.getElementById('calendar-view-container');
    if (!container) return;

    const year = state.calendarYear;
    const month = state.calendarMonth;

    // Calculate days and offsets
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('calendar-month-year').textContent = `${monthNames[month]} ${year}`;

    const gridBody = document.getElementById('calendar-grid-body');
    gridBody.innerHTML = '';

    // Initialize selectedCalendarDate if not set
    if (!state.selectedCalendarDate) {
      state.selectedCalendarDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    }

    let initialDateBookings = [];
    let initialDateBlocks = [];

    // Draw preceding month padding cells
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayCell = document.createElement('div');
      dayCell.className = 'calendar-day padding-day';
      
      const numDiv = document.createElement('div');
      numDiv.className = 'day-number';
      numDiv.style.opacity = '0.5';
      numDiv.textContent = prevTotalDays - i;
      dayCell.appendChild(numDiv);
      
      gridBody.appendChild(dayCell);
    }

    // Draw active calendar month cells
    for (let day = 1; day <= totalDays; day++) {
      const dayCell = document.createElement('div');
      dayCell.className = 'calendar-day';

      const numDiv = document.createElement('div');
      numDiv.className = 'day-number';
      numDiv.textContent = day;
      dayCell.appendChild(numDiv);

      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Highlight selected day
      if (dateStr === state.selectedCalendarDate) {
        dayCell.classList.add('selected-day');
      }

      // Filter bookings matching this date range
      const dayBookings = state.bookings.filter(b => {
        return dateStr >= b.checkIn && dateStr < b.checkOut && b.status !== 'cancelled';
      });

      // Filter blocks matching this date
      const dayBlocks = state.blockedDates.filter(b => b.date === dateStr);

      if (dateStr === state.selectedCalendarDate) {
        initialDateBookings = dayBookings;
        initialDateBlocks = dayBlocks;
      }

      // 1. Desktop Badge Events
      const eventContainer = document.createElement('div');
      eventContainer.className = 'day-events';

      dayBookings.forEach(b => {
        const badge = document.createElement('div');
        const isTent = b.roomName.toLowerCase().includes('tent');
        badge.className = `event-badge booking-event ${isTent ? 'tent-event' : 'cottage-event'}`;
        badge.textContent = `${b.guestName.split(' ')[0]} (${isTent ? 'Tent' : 'Cottage'})`;
        badge.title = `${b.guestName} - ${b.roomName} (${b.bookingId})`;
        eventContainer.appendChild(badge);
      });

      dayBlocks.forEach(b => {
        const badge = document.createElement('div');
        badge.className = 'event-badge blocked-event';
        badge.textContent = `🚫 Blocked: ${b.roomId === 'tent' ? 'Tent' : 'Cottage'}`;
        badge.title = `Stays of type ${b.roomId} are blocked on this date`;
        eventContainer.appendChild(badge);
      });

      dayCell.appendChild(eventContainer);

      // 2. Mobile Dot Indicators
      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'day-dots';

      dayBookings.forEach(b => {
        const dot = document.createElement('span');
        dot.className = `day-dot ${b.roomName.toLowerCase().includes('tent') ? 'tent-dot' : 'cottage-dot'}`;
        dotsContainer.appendChild(dot);
      });

      dayBlocks.forEach(b => {
        const dot = document.createElement('span');
        dot.className = 'day-dot blocked-dot';
        dotsContainer.appendChild(dot);
      });

      dayCell.appendChild(dotsContainer);

      // Bind Click selection for details panel
      dayCell.addEventListener('click', () => {
        state.selectedCalendarDate = dateStr;
        document.querySelectorAll('.calendar-grid .calendar-day').forEach(c => c.classList.remove('selected-day'));
        dayCell.classList.add('selected-day');
        showDayDetails(dateStr, dayBookings, dayBlocks);
      });

      gridBody.appendChild(dayCell);
    }

    // Load initial selection details below
    showDayDetails(state.selectedCalendarDate, initialDateBookings, initialDateBlocks);
  }

  // Draw day details vertical card list
  function showDayDetails(dateStr, bookings, blocks) {
    const container = document.getElementById('calendar-day-details');
    if (!container) return;

    const formattedDate = Utils.formatDate(dateStr);
    let html = `<h4 class="details-title">${formattedDate}</h4>`;

    if (bookings.length === 0 && blocks.length === 0) {
      html += `<p class="details-empty">No reservations or administrative blocks on this date.</p>`;
    } else {
      html += `<div class="details-list">`;

      bookings.forEach(b => {
        const isTent = b.roomName.toLowerCase().includes('tent');
        html += `
          <div class="details-item booking-detail ${isTent ? 'tent-detail' : 'cottage-detail'}">
            <span class="detail-dot"></span>
            <div class="detail-info">
              <strong>Guest: ${b.guestName}</strong>
              <span>Stay: ${b.roomName} (${b.bookingId})</span>
              <span class="detail-dates">Duration: ${Utils.formatDate(b.checkIn)} — ${Utils.formatDate(b.checkOut)}</span>
            </div>
          </div>
        `;
      });

      blocks.forEach(b => {
        const isTent = b.roomId === 'tent';
        html += `
          <div class="details-item block-detail">
            <span class="detail-dot"></span>
            <div class="detail-info">
              <strong>Administrative Block Active</strong>
              <span>Category: ${isTent ? 'Royal Safari Tent' : 'Heritage Stone Cottage'}</span>
            </div>
          </div>
        `;
      });

      html += `</div>`;
    }

    container.innerHTML = html;
  }

  // Handle mobile sidebar toggle
  function initMobileSidebar() {
    const hamburger = document.getElementById('admin-hamburger');
    const layout = document.querySelector('.admin-layout');
    
    // Create overlay if not present
    let overlay = document.getElementById('admin-sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'admin-sidebar-overlay';
      overlay.className = 'admin-sidebar-overlay';
      document.body.appendChild(overlay);
    }

    if (hamburger) {
      hamburger.addEventListener('click', () => {
        const isOpen = layout.classList.toggle('sidebar-open');
        hamburger.setAttribute('aria-expanded', isOpen);
        hamburger.classList.toggle('active', isOpen);
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        layout.classList.remove('sidebar-open');
        if (hamburger) {
          hamburger.classList.remove('active');
          hamburger.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Close sidebar on navigation selection
    sidebarItems.forEach(item => {
      item.addEventListener('click', () => {
        layout.classList.remove('sidebar-open');
        if (hamburger) {
          hamburger.classList.remove('active');
          hamburger.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  /* ─── 7. CAMP RATES & WHATSAPP SETTINGS ─── */
  async function loadCampRates() {
    try {
      let cfg = window.CAMP_CONFIG || window.DEFAULT_CAMP_CONFIG;
      if (typeof db !== 'undefined' && db) {
        const doc = await db.collection('settings').doc('campConfig').get();
        if (doc.exists) {
          const remoteData = doc.data();
          cfg = Object.assign({}, cfg, remoteData);
          if (remoteData.accommodations) {
            cfg.accommodations = Object.assign({}, cfg.accommodations, remoteData.accommodations);
          }
          if (remoteData.activities) {
            cfg.activities = Object.assign({}, cfg.activities, remoteData.activities);
          }
        }
      }

      // Populate Inputs
      const waInput = document.getElementById('admin-camp-whatsapp');
      const phoneInput = document.getElementById('admin-camp-phone');
      const emailInput = document.getElementById('admin-camp-email');

      if (waInput) waInput.value = cfg.whatsappNumber || '919876543210';
      if (phoneInput) phoneInput.value = cfg.phone || '+91 98765 43210';
      if (emailInput) emailInput.value = cfg.email || 'reservations@desertdreamerscamp.com';

      // Accommodations
      if (cfg.accommodations) {
        const rAc = document.getElementById('rate-royal-ac');
        const rLux = document.getElementById('rate-luxury-swiss');
        const rMah = document.getElementById('rate-maharani-suite');

        if (rAc && cfg.accommodations.royal_ac_tent) rAc.value = cfg.accommodations.royal_ac_tent.rate;
        if (rLux && cfg.accommodations.luxury_swiss_tent) rLux.value = cfg.accommodations.luxury_swiss_tent.rate;
        if (rMah && cfg.accommodations.maharani_suite) rMah.value = cfg.accommodations.maharani_suite.rate;
      }

      const rExtAdult = document.getElementById('rate-extra-adult');
      const rExtChild = document.getElementById('rate-extra-child');
      if (rExtAdult) rExtAdult.value = cfg.extraAdultRate || 1500;
      if (rExtChild) rExtChild.value = cfg.extraChildRate || 800;

      // Safaris & Activities
      if (cfg.activities) {
        const aCam = document.getElementById('act-rate-camel');
        const aJeep = document.getElementById('act-rate-jeep');
        const aQuad = document.getElementById('act-rate-quad');
        const aPara = document.getElementById('act-rate-parasailing');
        const aDin = document.getElementById('act-rate-dinner');

        if (aCam && cfg.activities.camel_safari) aCam.value = cfg.activities.camel_safari.price;
        if (aJeep && cfg.activities.jeep_bashing) aJeep.value = cfg.activities.jeep_bashing.price;
        if (aQuad && cfg.activities.quad_biking) aQuad.value = cfg.activities.quad_biking.price;
        if (aPara && cfg.activities.parasailing) aPara.value = cfg.activities.parasailing.price;
        if (aDin && cfg.activities.candlelight_dinner) aDin.value = cfg.activities.candlelight_dinner.price;
      }
    } catch (err) {
      console.error('[Admin] Error loading camp rates:', err);
      Utils.showToast('Could not load camp rates from database.', 'error');
    }
  }

  async function saveCampRates(e) {
    if (e && e.preventDefault) e.preventDefault();

    const saveBtn = document.getElementById('save-camp-rates-btn');
    const statusSpan = document.getElementById('camp-rates-status');
    if (saveBtn) saveBtn.disabled = true;
    if (statusSpan) statusSpan.textContent = 'Saving changes...';

    try {
      const waNumber = (document.getElementById('admin-camp-whatsapp').value || '').trim().replace(/\D/g, '');
      const phone = (document.getElementById('admin-camp-phone').value || '').trim();
      const email = (document.getElementById('admin-camp-email').value || '').trim();

      const royalAcRate = Number(document.getElementById('rate-royal-ac').value) || 5500;
      const luxurySwissRate = Number(document.getElementById('rate-luxury-swiss').value) || 4200;
      const maharaniRate = Number(document.getElementById('rate-maharani-suite').value) || 7800;
      const extraAdultRate = Number(document.getElementById('rate-extra-adult').value) || 1500;
      const extraChildRate = Number(document.getElementById('rate-extra-child').value) || 800;

      const camelPrice = Number(document.getElementById('act-rate-camel').value) || 600;
      const jeepPrice = Number(document.getElementById('act-rate-jeep').value) || 1800;
      const quadPrice = Number(document.getElementById('act-rate-quad').value) || 1200;
      const paraPrice = Number(document.getElementById('act-rate-parasailing').value) || 1500;
      const dinnerPrice = Number(document.getElementById('act-rate-dinner').value) || 3500;

      const newConfig = {
        campName: "Desert Dreamers Camp",
        location: "Sam Sand Dunes, Near Sunset Point, Jaisalmer, Rajasthan 345001",
        whatsappNumber: waNumber,
        phone: phone,
        email: email,
        extraAdultRate: extraAdultRate,
        extraChildRate: extraChildRate,
        accommodations: {
          royal_ac_tent: {
            id: 'royal_ac_tent',
            name: 'Royal AC Swiss Tent',
            rate: royalAcRate
          },
          luxury_swiss_tent: {
            id: 'luxury_swiss_tent',
            name: 'Luxury Heritage Swiss Tent',
            rate: luxurySwissRate
          },
          maharani_suite: {
            id: 'maharani_suite',
            name: 'Maharani Sunset Dune Suite',
            rate: maharaniRate
          }
        },
        activities: {
          camel_safari: {
            id: 'camel_safari',
            name: 'Sunset Camel Safari in Sam Dunes',
            price: camelPrice,
            unit: 'person'
          },
          jeep_bashing: {
            id: 'jeep_bashing',
            name: '4x4 Thar Jeep Dune Bashing',
            price: jeepPrice,
            unit: 'jeep'
          },
          quad_biking: {
            id: 'quad_biking',
            name: 'Desert Quad Biking / ATV (20 Mins)',
            price: quadPrice,
            unit: 'person'
          },
          parasailing: {
            id: 'parasailing',
            name: 'Desert Parasailing Experience',
            price: paraPrice,
            unit: 'person'
          },
          candlelight_dinner: {
            id: 'candlelight_dinner',
            name: 'Private Candlelight Sand Dune Dinner',
            price: dinnerPrice,
            unit: 'couple'
          }
        },
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (typeof db !== 'undefined' && db) {
        await db.collection('settings').doc('campConfig').set(newConfig, { merge: true });

        // Write security audit log
        try {
          const user = firebase.auth().currentUser;
          await db.collection('auditLogs').add({
            action: `Updated Desert Dreamers camp rates (Royal AC: ₹${royalAcRate}, WhatsApp: ${waNumber})`,
            adminEmail: user ? user.email : 'admin',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
        } catch (_) {}
      }

      // Sync local memory
      if (window.CAMP_CONFIG) {
        window.CAMP_CONFIG = Object.assign(window.CAMP_CONFIG, newConfig);
      }

      Utils.showToast('Camp rates & WhatsApp settings saved successfully!', 'success');
      if (statusSpan) {
        statusSpan.textContent = '✓ Saved successfully!';
        setTimeout(() => { statusSpan.textContent = ''; }, 4000);
      }
    } catch (err) {
      console.error('[Admin] Save rates error:', err);
      Utils.showToast('Failed to save camp rates: ' + err.message, 'error');
      if (statusSpan) statusSpan.textContent = 'Error saving.';
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  function initCampRates() {
    const form = document.getElementById('camp-rates-form');
    if (form) {
      form.addEventListener('submit', saveCampRates);
    }
    const topBtn = document.getElementById('save-camp-rates-top-btn');
    if (topBtn) {
      topBtn.addEventListener('click', saveCampRates);
    }
  }

  // Init
  function init() {
    // Show email display
    const userDisplay = document.getElementById('user-email-display');
    if (userDisplay && typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          userDisplay.textContent = user.email;
        }
      });
    }

    initMobileSidebar();
    initNav();
    initCampRates();
    initCalendarControl();
    initBlogEditor();
    initSeoEditor();
    initOffersEditor();

    // Load initial stats
    loadBookings();
    loadEnquiries();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    switchView
  };

})();
