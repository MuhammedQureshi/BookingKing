/**
 * Appointly - Embeddable Booking Widget
 * 
 * Usage:
 * <div id="booking-widget"></div>
 * <script 
 *   src="https://your-domain.com/booking-embed.js" 
 *   data-business-id="YOUR_BUSINESS_ID"
 *   data-primary-color="#18181b">
 * </script>
 */

(function() {
  'use strict';

  // Find our script tag (works even when loaded async)
  var scripts = document.getElementsByTagName('script');
  var currentScript = null;
  for (var i = 0; i < scripts.length; i++) {
    if (scripts[i].src && scripts[i].src.indexOf('booking-embed') !== -1) {
      currentScript = scripts[i];
      break;
    }
  }
  
  if (!currentScript) {
    currentScript = document.currentScript;
  }

  // Configuration
  var businessId = currentScript ? currentScript.getAttribute('data-business-id') : null;
  var primaryColor = (currentScript ? currentScript.getAttribute('data-primary-color') : null) || '#18181b';
  var containerId = (currentScript ? currentScript.getAttribute('data-container') : null) || 'booking-widget';
  
  // API Base URL
  var API_BASE = 'https://reserve-js.preview.emergentagent.com/api';

  if (!businessId) {
    console.error('Appointly Widget: data-business-id attribute is required');
    var container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '<div style="padding:20px;text-align:center;color:#666;font-family:sans-serif;">Widget Error: Business ID is required</div>';
    }
    return;
  }

  // Convert hex to RGB for transparency effects
  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? parseInt(result[1], 16) + ', ' + parseInt(result[2], 16) + ', ' + parseInt(result[3], 16)
      : '24, 24, 27';
  }

  var primaryRgb = hexToRgb(primaryColor);

  // Inject CSS
  var styleId = 'appointly-widget-styles';
  if (!document.getElementById(styleId)) {
    var style = document.createElement('style');
    style.id = styleId;
    style.textContent = '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@600;700&display=swap");.aptly-widget{font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:440px;margin:0 auto;line-height:1.5}.aptly-widget *{box-sizing:border-box;margin:0;padding:0}.aptly-widget h1,.aptly-widget h2,.aptly-widget h3{font-family:"Manrope",sans-serif}.aptly-card{background:#fff;border-radius:16px;box-shadow:0 20px 40px -12px rgba(0,0,0,.15);overflow:hidden;border:1px solid #e4e4e7}.aptly-header{background:' + primaryColor + ';color:#fff;padding:20px}.aptly-header-title{font-size:18px;font-weight:700}.aptly-header-desc{font-size:13px;opacity:.8;margin-top:4px}.aptly-progress{display:flex;gap:4px;margin-top:16px}.aptly-progress-bar{flex:1;height:3px;background:rgba(255,255,255,.3);border-radius:2px}.aptly-progress-bar.active{background:#fff}.aptly-content{padding:20px}.aptly-step-title{font-size:16px;font-weight:600;margin-bottom:16px;color:#18181b}.aptly-services{display:flex;flex-direction:column;gap:10px}.aptly-service{display:flex;align-items:center;padding:14px;background:#fafafa;border:1px solid #e4e4e7;border-radius:10px;cursor:pointer;transition:all .2s}.aptly-service:hover{border-color:' + primaryColor + ';background:#fff}.aptly-service-info{flex:1}.aptly-service-name{font-weight:500;font-size:14px;color:#18181b}.aptly-service-desc{font-size:12px;color:#71717a;margin-top:2px}.aptly-service-meta{display:flex;align-items:center;gap:10px;margin-top:6px;font-size:12px;color:#71717a}.aptly-service-price{font-weight:600;color:#18181b}.aptly-service-arrow{color:#a1a1aa;transition:transform .2s}.aptly-service:hover .aptly-service-arrow{transform:translateX(4px);color:' + primaryColor + '}.aptly-calendar{text-align:center}.aptly-cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}.aptly-cal-month{font-weight:600;font-size:15px;color:#18181b}.aptly-cal-nav{display:flex;gap:6px}.aptly-cal-btn{width:32px;height:32px;border:1px solid #e4e4e7;border-radius:8px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#71717a;transition:all .2s}.aptly-cal-btn:hover{background:#f4f4f5;color:#18181b}.aptly-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}.aptly-cal-day-name{font-size:11px;font-weight:500;color:#a1a1aa;padding:8px 0;text-transform:uppercase}.aptly-cal-day{width:100%;aspect-ratio:1;border-radius:8px;border:none;background:transparent;font-size:13px;cursor:pointer;transition:all .15s;color:#18181b}.aptly-cal-day:hover:not(:disabled){background:#f4f4f5}.aptly-cal-day:disabled{color:#d4d4d8;cursor:default}.aptly-cal-day.selected{background:' + primaryColor + ';color:#fff}.aptly-cal-day.today{font-weight:600}.aptly-slots{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.aptly-slot{padding:10px 8px;border:1px solid #e4e4e7;border-radius:8px;background:#fff;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;color:#18181b}.aptly-slot:hover:not(:disabled){border-color:' + primaryColor + ';background:rgba(' + primaryRgb + ',.05)}.aptly-slot:disabled{background:#f4f4f5;color:#a1a1aa;cursor:default}.aptly-slot.selected{background:' + primaryColor + ';color:#fff;border-color:' + primaryColor + '}.aptly-form-group{margin-bottom:14px}.aptly-label{display:block;font-size:13px;font-weight:500;margin-bottom:6px;color:#18181b}.aptly-input-wrap{position:relative}.aptly-input-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#a1a1aa;pointer-events:none}.aptly-input{width:100%;height:42px;padding:0 12px 0 38px;border:1px solid #e4e4e7;border-radius:8px;font-size:14px;color:#18181b;transition:border-color .2s}.aptly-input:focus{outline:none;border-color:' + primaryColor + '}.aptly-input::placeholder{color:#a1a1aa}.aptly-summary{background:#f4f4f5;border-radius:10px;padding:14px;margin-bottom:16px}.aptly-summary-row{display:flex;justify-content:space-between;font-size:13px;padding:3px 0}.aptly-summary-label{color:#71717a}.aptly-summary-value{font-weight:500;color:#18181b}.aptly-btn{width:100%;height:44px;border-radius:22px;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s;border:none}.aptly-btn-primary{background:' + primaryColor + ';color:#fff}.aptly-btn-primary:hover{opacity:.9}.aptly-btn-primary:disabled{opacity:.5;cursor:default}.aptly-btn-outline{background:transparent;border:1px solid #e4e4e7;color:#18181b}.aptly-btn-outline:hover{background:#f4f4f5}.aptly-btn-back{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.15);border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;position:absolute;left:0;top:50%;transform:translateY(-50%)}.aptly-btn-back:hover{background:rgba(255,255,255,.25)}.aptly-header-inner{position:relative;text-align:center;padding:0 40px}.aptly-success{text-align:center;padding:20px 0}.aptly-success-icon{width:56px;height:56px;border-radius:50%;background:#dcfce7;display:flex;align-items:center;justify-content:center;margin:0 auto 14px}.aptly-success-title{font-size:18px;font-weight:700;color:#18181b;margin-bottom:6px}.aptly-success-text{color:#71717a;font-size:13px}.aptly-loading{text-align:center;padding:40px 20px;color:#71717a;font-size:14px}.aptly-spinner{width:24px;height:24px;border:2px solid #e4e4e7;border-top-color:' + primaryColor + ';border-radius:50%;animation:aptly-spin .7s linear infinite;margin:0 auto 12px}@keyframes aptly-spin{to{transform:rotate(360deg)}}.aptly-empty{text-align:center;padding:30px;color:#71717a;font-size:13px}.aptly-date-badge{display:inline-block;font-size:12px;color:#71717a;background:#f4f4f5;padding:4px 10px;border-radius:6px;margin-bottom:14px}';
    document.head.appendChild(style);
  }

  // State
  var state = {
    step: 0,
    business: null,
    selectedService: null,
    selectedDate: null,
    selectedSlot: null,
    slots: [],
    customerInfo: { name: '', email: '', phone: '' },
    booking: null,
    loading: true,
    slotsLoading: false,
    submitting: false,
    currentMonth: new Date()
  };

  // Icons (inline SVG)
  var icons = {
    clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    chevronLeft: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>',
    chevronRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>',
    user: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    mail: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>',
    phone: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    check: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>',
    arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>'
  };

  // Date utilities
  function formatDate(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function formatDisplayDate(date) {
    var options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  function isDateDisabled(date) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    var maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 60);
    if (date > maxDate) return true;

    var dateStr = formatDate(date);
    if (state.business && state.business.blocked_dates && state.business.blocked_dates.indexOf(dateStr) !== -1) {
      return true;
    }

    var dow = date.getDay();
    var dayIndex = dow === 0 ? 6 : dow - 1;
    if (state.business && state.business.availability) {
      var avail = null;
      for (var i = 0; i < state.business.availability.length; i++) {
        if (state.business.availability[i].day === dayIndex) {
          avail = state.business.availability[i];
          break;
        }
      }
      if (!avail || !avail.enabled) return true;
    }

    return false;
  }

  // API calls
  function fetchBusiness() {
    fetch(API_BASE + '/businesses/' + businessId)
      .then(function(res) {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(function(data) {
        state.business = data;
        state.loading = false;
        render();
      })
      .catch(function(err) {
        console.error('Appointly Widget:', err);
        state.loading = false;
        state.business = null;
        render();
      });
  }

  function fetchSlots() {
    if (!state.selectedDate || !state.selectedService) return;

    state.slotsLoading = true;
    render();

    var dateStr = formatDate(state.selectedDate);
    var url = API_BASE + '/businesses/' + businessId + '/slots?date=' + dateStr + '&service_id=' + state.selectedService.id;

    fetch(url)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        state.slots = data || [];
        state.slotsLoading = false;
        render();
      })
      .catch(function() {
        state.slots = [];
        state.slotsLoading = false;
        render();
      });
  }

  function createBooking() {
    state.submitting = true;
    render();

    fetch(API_BASE + '/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: businessId,
        service_id: state.selectedService.id,
        date: formatDate(state.selectedDate),
        start_time: state.selectedSlot.start_time,
        customer_name: state.customerInfo.name,
        customer_email: state.customerInfo.email,
        customer_phone: state.customerInfo.phone
      })
    })
      .then(function(res) {
        if (!res.ok) return res.json().then(function(e) { throw new Error(e.detail || 'Booking failed'); });
        return res.json();
      })
      .then(function(data) {
        state.booking = data;
        state.step = 4;
        state.submitting = false;
        render();
      })
      .catch(function(err) {
        alert(err.message);
        state.submitting = false;
        render();
      });
  }

  // Render
  function render() {
    var container = document.getElementById(containerId);
    if (!container) return;

    if (state.loading) {
      container.innerHTML = '<div class="aptly-widget"><div class="aptly-card"><div class="aptly-loading"><div class="aptly-spinner"></div>Loading...</div></div></div>';
      return;
    }

    if (!state.business) {
      container.innerHTML = '<div class="aptly-widget"><div class="aptly-card"><div class="aptly-loading">Business not found</div></div></div>';
      return;
    }

    var html = '<div class="aptly-widget"><div class="aptly-card">';
    html += renderHeader();
    html += '<div class="aptly-content">';
    html += renderStep();
    html += '</div></div></div>';

    container.innerHTML = html;
    attachEvents();
  }

  function renderHeader() {
    if (state.step === 4) {
      return '<div class="aptly-header"><div class="aptly-header-title">' + escapeHtml(state.business.business_name) + '</div></div>';
    }

    var h = '<div class="aptly-header"><div class="aptly-header-inner">';
    if (state.step > 0) {
      h += '<button class="aptly-btn-back" data-action="back">' + icons.chevronLeft + '</button>';
    }
    h += '<div class="aptly-header-title">' + escapeHtml(state.business.business_name) + '</div>';
    if (state.step === 0 && state.business.description) {
      h += '<div class="aptly-header-desc">' + escapeHtml(state.business.description) + '</div>';
    }
    h += '</div><div class="aptly-progress">';
    for (var i = 0; i < 4; i++) {
      h += '<div class="aptly-progress-bar' + (i <= state.step ? ' active' : '') + '"></div>';
    }
    h += '</div></div>';
    return h;
  }

  function renderStep() {
    switch (state.step) {
      case 0: return renderServices();
      case 1: return renderCalendar();
      case 2: return renderSlots();
      case 3: return renderForm();
      case 4: return renderConfirmation();
      default: return '';
    }
  }

  function renderServices() {
    if (!state.business.services || state.business.services.length === 0) {
      return '<div class="aptly-empty">No services available</div>';
    }

    var h = '<h3 class="aptly-step-title">Select a Service</h3><div class="aptly-services">';
    state.business.services.forEach(function(s) {
      h += '<div class="aptly-service" data-action="select-service" data-id="' + s.id + '">';
      h += '<div class="aptly-service-info">';
      h += '<div class="aptly-service-name">' + escapeHtml(s.name) + '</div>';
      if (s.description) h += '<div class="aptly-service-desc">' + escapeHtml(s.description) + '</div>';
      h += '<div class="aptly-service-meta"><span>' + icons.clock + ' ' + s.duration + ' min</span>';
      if (s.price) h += '<span class="aptly-service-price">$' + s.price + '</span>';
      h += '</div></div>';
      h += '<span class="aptly-service-arrow">' + icons.arrow + '</span>';
      h += '</div>';
    });
    h += '</div>';
    return h;
  }

  function renderCalendar() {
    var month = state.currentMonth;
    var y = month.getFullYear();
    var m = month.getMonth();
    var firstDay = new Date(y, m, 1).getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var monthName = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    var h = '<h3 class="aptly-step-title">Select a Date</h3>';
    h += '<div class="aptly-calendar">';
    h += '<div class="aptly-cal-header">';
    h += '<button class="aptly-cal-btn" data-action="prev-month">' + icons.chevronLeft + '</button>';
    h += '<span class="aptly-cal-month">' + monthName + '</span>';
    h += '<button class="aptly-cal-btn" data-action="next-month">' + icons.chevronRight + '</button>';
    h += '</div>';
    h += '<div class="aptly-cal-grid">';

    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(function(d) {
      h += '<div class="aptly-cal-day-name">' + d + '</div>';
    });

    for (var i = 0; i < firstDay; i++) {
      h += '<button class="aptly-cal-day" disabled></button>';
    }

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    for (var day = 1; day <= daysInMonth; day++) {
      var date = new Date(y, m, day);
      var disabled = isDateDisabled(date);
      var selected = state.selectedDate && formatDate(state.selectedDate) === formatDate(date);
      var isToday = formatDate(date) === formatDate(today);

      var cls = 'aptly-cal-day';
      if (disabled) cls += ' disabled';
      if (selected) cls += ' selected';
      if (isToday) cls += ' today';

      h += '<button class="' + cls + '"' + (disabled ? ' disabled' : '') + ' data-action="select-date" data-date="' + formatDate(date) + '">' + day + '</button>';
    }

    h += '</div></div>';
    return h;
  }

  function renderSlots() {
    var h = '<h3 class="aptly-step-title">Select a Time</h3>';
    h += '<div class="aptly-date-badge">' + formatDisplayDate(state.selectedDate) + '</div>';

    if (state.slotsLoading) {
      return h + '<div class="aptly-loading"><div class="aptly-spinner"></div>Loading times...</div>';
    }

    var available = state.slots.filter(function(s) { return s.available; });
    if (available.length === 0) {
      return h + '<div class="aptly-empty">No available times<br><br><button class="aptly-btn aptly-btn-outline" data-action="back">Pick another date</button></div>';
    }

    h += '<div class="aptly-slots">';
    state.slots.forEach(function(slot) {
      var cls = 'aptly-slot';
      if (!slot.available) cls += ' disabled';
      if (state.selectedSlot && state.selectedSlot.start_time === slot.start_time) cls += ' selected';
      h += '<button class="' + cls + '"' + (!slot.available ? ' disabled' : '') + ' data-action="select-slot" data-slot=\'' + JSON.stringify(slot) + '\'>' + slot.start_time + '</button>';
    });
    h += '</div>';
    return h;
  }

  function renderForm() {
    var h = '<h3 class="aptly-step-title">Your Details</h3>';
    h += '<div class="aptly-summary">';
    h += '<div class="aptly-summary-row"><span class="aptly-summary-label">Service</span><span class="aptly-summary-value">' + escapeHtml(state.selectedService.name) + '</span></div>';
    h += '<div class="aptly-summary-row"><span class="aptly-summary-label">Date</span><span class="aptly-summary-value">' + formatDisplayDate(state.selectedDate) + '</span></div>';
    h += '<div class="aptly-summary-row"><span class="aptly-summary-label">Time</span><span class="aptly-summary-value">' + state.selectedSlot.start_time + ' - ' + state.selectedSlot.end_time + '</span></div>';
    h += '</div>';

    h += '<form id="aptly-form">';
    h += '<div class="aptly-form-group"><label class="aptly-label">Full Name</label><div class="aptly-input-wrap"><span class="aptly-input-icon">' + icons.user + '</span><input type="text" class="aptly-input" name="name" placeholder="John Doe" required value="' + escapeHtml(state.customerInfo.name) + '"></div></div>';
    h += '<div class="aptly-form-group"><label class="aptly-label">Email</label><div class="aptly-input-wrap"><span class="aptly-input-icon">' + icons.mail + '</span><input type="email" class="aptly-input" name="email" placeholder="john@example.com" required value="' + escapeHtml(state.customerInfo.email) + '"></div></div>';
    h += '<div class="aptly-form-group"><label class="aptly-label">Phone</label><div class="aptly-input-wrap"><span class="aptly-input-icon">' + icons.phone + '</span><input type="tel" class="aptly-input" name="phone" placeholder="+1 (555) 000-0000" required value="' + escapeHtml(state.customerInfo.phone) + '"></div></div>';
    h += '<button type="submit" class="aptly-btn aptly-btn-primary"' + (state.submitting ? ' disabled' : '') + '>' + (state.submitting ? 'Confirming...' : 'Confirm Booking') + '</button>';
    h += '</form>';
    return h;
  }

  function renderConfirmation() {
    var h = '<div class="aptly-success">';
    h += '<div class="aptly-success-icon">' + icons.check + '</div>';
    h += '<h3 class="aptly-success-title">Booking Confirmed!</h3>';
    h += '<p class="aptly-success-text">Confirmation sent to ' + escapeHtml(state.booking.customer_email) + '</p>';
    h += '</div>';
    h += '<div class="aptly-summary">';
    h += '<div class="aptly-summary-row"><span class="aptly-summary-label">Service</span><span class="aptly-summary-value">' + escapeHtml(state.booking.service_name) + '</span></div>';
    h += '<div class="aptly-summary-row"><span class="aptly-summary-label">Date</span><span class="aptly-summary-value">' + state.booking.date + '</span></div>';
    h += '<div class="aptly-summary-row"><span class="aptly-summary-label">Time</span><span class="aptly-summary-value">' + state.booking.start_time + ' - ' + state.booking.end_time + '</span></div>';
    h += '<div class="aptly-summary-row"><span class="aptly-summary-label">Confirmation</span><span class="aptly-summary-value" style="font-family:monospace;font-size:11px">' + state.booking.id.slice(0, 8) + '</span></div>';
    h += '</div>';
    h += '<button class="aptly-btn aptly-btn-outline" data-action="reset">Book Another</button>';
    return h;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function attachEvents() {
    var container = document.getElementById(containerId);
    if (!container) return;

    // Back button
    var backBtns = container.querySelectorAll('[data-action="back"]');
    for (var i = 0; i < backBtns.length; i++) {
      backBtns[i].onclick = function() {
        if (state.step > 0) { state.step--; render(); }
      };
    }

    // Service selection
    var services = container.querySelectorAll('[data-action="select-service"]');
    for (var i = 0; i < services.length; i++) {
      services[i].onclick = function() {
        var id = this.getAttribute('data-id');
        for (var j = 0; j < state.business.services.length; j++) {
          if (state.business.services[j].id === id) {
            state.selectedService = state.business.services[j];
            break;
          }
        }
        state.step = 1;
        render();
      };
    }

    // Calendar nav
    var prevMonth = container.querySelector('[data-action="prev-month"]');
    if (prevMonth) {
      prevMonth.onclick = function() {
        state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1);
        render();
      };
    }

    var nextMonth = container.querySelector('[data-action="next-month"]');
    if (nextMonth) {
      nextMonth.onclick = function() {
        state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
        render();
      };
    }

    // Date selection
    var dates = container.querySelectorAll('[data-action="select-date"]');
    for (var i = 0; i < dates.length; i++) {
      dates[i].onclick = function() {
        var parts = this.getAttribute('data-date').split('-');
        state.selectedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        state.selectedSlot = null;
        state.step = 2;
        fetchSlots();
      };
    }

    // Slot selection
    var slots = container.querySelectorAll('[data-action="select-slot"]');
    for (var i = 0; i < slots.length; i++) {
      slots[i].onclick = function() {
        state.selectedSlot = JSON.parse(this.getAttribute('data-slot'));
        state.step = 3;
        render();
      };
    }

    // Form
    var form = container.querySelector('#aptly-form');
    if (form) {
      form.onsubmit = function(e) {
        e.preventDefault();
        var inputs = form.querySelectorAll('input');
        for (var i = 0; i < inputs.length; i++) {
          state.customerInfo[inputs[i].name] = inputs[i].value;
        }
        createBooking();
      };
    }

    // Reset
    var resetBtn = container.querySelector('[data-action="reset"]');
    if (resetBtn) {
      resetBtn.onclick = function() {
        state.step = 0;
        state.selectedService = null;
        state.selectedDate = null;
        state.selectedSlot = null;
        state.customerInfo = { name: '', email: '', phone: '' };
        state.booking = null;
        render();
      };
    }
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchBusiness);
  } else {
    fetchBusiness();
  }
})();
