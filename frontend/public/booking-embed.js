/**
 * Appointly - Embeddable Booking Widget
 * Works with: Plain HTML, React, Next.js, Vue, Angular, etc.
 * 
 * Usage Option 1 - Script Tag (HTML/WordPress/etc):
 * <div id="booking-widget"></div>
 * <script src="https://your-domain.com/booking-embed.js" data-business-id="YOUR_ID"></script>
 *
 * Usage Option 2 - React/Next.js:
 * useEffect(() => { window.AppointlyWidget.init({ businessId: 'YOUR_ID', container: 'booking-widget' }); }, []);
 */

(function(window, document) {
  'use strict';

  var API_BASE = 'https://bookingking-production-3843.up.railway.app/api';
  var STYLE_ID = 'appointly-widget-css';
  var instances = {};

  // Widget Class
  function Widget(config) {
    this.businessId = config.businessId;
    this.containerId = config.container || 'booking-widget';
    this.primaryColor = config.primaryColor || '#18181b';
    this.primaryRgb = hexToRgb(this.primaryColor);
    
    this.state = {
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

    this.init();
  }

  Widget.prototype.init = function() {
    var self = this;
    injectStyles(this.primaryColor, this.primaryRgb);
    
    // Wait for container to exist
    this.waitForContainer(function() {
      self.fetchBusiness();
    });
  };

  Widget.prototype.waitForContainer = function(callback) {
    var self = this;
    var container = document.getElementById(this.containerId);
    
    if (container) {
      callback();
      return;
    }

    // Use MutationObserver to wait for container
    if (typeof MutationObserver !== 'undefined') {
      var observer = new MutationObserver(function(mutations, obs) {
        var container = document.getElementById(self.containerId);
        if (container) {
          obs.disconnect();
          callback();
        }
      });
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
      
      // Timeout fallback
      setTimeout(function() {
        observer.disconnect();
        var container = document.getElementById(self.containerId);
        if (container) callback();
      }, 10000);
    } else {
      // Polling fallback for older browsers
      var attempts = 0;
      var interval = setInterval(function() {
        var container = document.getElementById(self.containerId);
        if (container || attempts > 100) {
          clearInterval(interval);
          if (container) callback();
        }
        attempts++;
      }, 100);
    }
  };

  Widget.prototype.fetchBusiness = function() {
    var self = this;
    fetch(API_BASE + '/businesses/' + this.businessId)
      .then(function(res) {
        if (!res.ok) throw new Error('Business not found');
        return res.json();
      })
      .then(function(data) {
        self.state.business = data;
        self.state.loading = false;
        self.render();
      })
      .catch(function(err) {
        console.error('Appointly:', err);
        self.state.loading = false;
        self.render();
      });
  };

  Widget.prototype.fetchSlots = function() {
    var self = this;
    if (!this.state.selectedDate || !this.state.selectedService) return;

    this.state.slotsLoading = true;
    this.render();

    var dateStr = formatDate(this.state.selectedDate);
    var url = API_BASE + '/businesses/' + this.businessId + '/slots?date=' + dateStr + '&service_id=' + this.state.selectedService.id;

    fetch(url)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        self.state.slots = data || [];
        self.state.slotsLoading = false;
        self.render();
      })
      .catch(function() {
        self.state.slots = [];
        self.state.slotsLoading = false;
        self.render();
      });
  };

  Widget.prototype.createBooking = function() {
    var self = this;
    this.state.submitting = true;
    this.render();

    fetch(API_BASE + '/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: this.businessId,
        service_id: this.state.selectedService.id,
        date: formatDate(this.state.selectedDate),
        start_time: this.state.selectedSlot.start_time,
        customer_name: this.state.customerInfo.name,
        customer_email: this.state.customerInfo.email,
        customer_phone: this.state.customerInfo.phone
      })
    })
      .then(function(res) {
        if (!res.ok) return res.json().then(function(e) { throw new Error(e.detail || 'Booking failed'); });
        return res.json();
      })
      .then(function(data) {
        self.state.booking = data;
        self.state.step = 4;
        self.state.submitting = false;
        self.render();
      })
      .catch(function(err) {
        alert(err.message);
        self.state.submitting = false;
        self.render();
      });
  };

  Widget.prototype.render = function() {
    var container = document.getElementById(this.containerId);
    if (!container) return;

    var state = this.state;

    if (state.loading) {
      container.innerHTML = this.template('loading');
      return;
    }

    if (!state.business) {
      container.innerHTML = this.template('error');
      return;
    }

    var html = '<div class="aptly-widget"><div class="aptly-card">';
    html += this.renderHeader();
    html += '<div class="aptly-content">' + this.renderStep() + '</div>';
    html += '</div></div>';

    container.innerHTML = html;
    this.attachEvents();
  };

  Widget.prototype.template = function(type) {
    if (type === 'loading') {
      return '<div class="aptly-widget"><div class="aptly-card"><div class="aptly-loading"><div class="aptly-spinner"></div>Loading...</div></div></div>';
    }
    if (type === 'error') {
      return '<div class="aptly-widget"><div class="aptly-card"><div class="aptly-loading">Business not found. Check your business ID.</div></div></div>';
    }
    return '';
  };

  Widget.prototype.renderHeader = function() {
    var state = this.state;
    var biz = state.business;

    if (state.step === 4) {
      return '<div class="aptly-header"><div class="aptly-header-title">' + esc(biz.business_name) + '</div></div>';
    }

    var h = '<div class="aptly-header"><div class="aptly-header-inner">';
    if (state.step > 0) {
      h += '<button class="aptly-btn-back" data-action="back">' + icons.chevronLeft + '</button>';
    }
    h += '<div class="aptly-header-title">' + esc(biz.business_name) + '</div>';
    if (state.step === 0 && biz.description) {
      h += '<div class="aptly-header-desc">' + esc(biz.description) + '</div>';
    }
    h += '</div><div class="aptly-progress">';
    for (var i = 0; i < 4; i++) {
      h += '<div class="aptly-progress-bar' + (i <= state.step ? ' active' : '') + '"></div>';
    }
    h += '</div></div>';
    return h;
  };

  Widget.prototype.renderStep = function() {
    switch (this.state.step) {
      case 0: return this.renderServices();
      case 1: return this.renderCalendar();
      case 2: return this.renderSlots();
      case 3: return this.renderForm();
      case 4: return this.renderConfirmation();
      default: return '';
    }
  };

  Widget.prototype.renderServices = function() {
    var services = this.state.business.services || [];
    if (services.length === 0) {
      return '<div class="aptly-empty">No services available</div>';
    }

    var h = '<h3 class="aptly-step-title">Select a Service</h3><div class="aptly-services">';
    for (var i = 0; i < services.length; i++) {
      var s = services[i];
      h += '<div class="aptly-service" data-action="select-service" data-id="' + s.id + '">';
      h += '<div class="aptly-service-info">';
      h += '<div class="aptly-service-name">' + esc(s.name) + '</div>';
      if (s.description) h += '<div class="aptly-service-desc">' + esc(s.description) + '</div>';
      h += '<div class="aptly-service-meta"><span>' + icons.clock + ' ' + s.duration + ' min</span>';
      if (s.price) h += '<span class="aptly-service-price">$' + s.price + '</span>';
      h += '</div></div><span class="aptly-service-arrow">' + icons.arrow + '</span></div>';
    }
    h += '</div>';
    return h;
  };

  Widget.prototype.renderCalendar = function() {
    var self = this;
    var month = this.state.currentMonth;
    var y = month.getFullYear();
    var m = month.getMonth();
    var firstDay = new Date(y, m, 1).getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var monthName = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    var h = '<h3 class="aptly-step-title">Select a Date</h3><div class="aptly-calendar">';
    h += '<div class="aptly-cal-header">';
    h += '<button class="aptly-cal-btn" data-action="prev-month">' + icons.chevronLeft + '</button>';
    h += '<span class="aptly-cal-month">' + monthName + '</span>';
    h += '<button class="aptly-cal-btn" data-action="next-month">' + icons.chevronRight + '</button>';
    h += '</div><div class="aptly-cal-grid">';

    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (var i = 0; i < days.length; i++) {
      h += '<div class="aptly-cal-day-name">' + days[i] + '</div>';
    }

    for (var i = 0; i < firstDay; i++) {
      h += '<button class="aptly-cal-day" disabled></button>';
    }

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    for (var day = 1; day <= daysInMonth; day++) {
      var date = new Date(y, m, day);
      var disabled = this.isDateDisabled(date);
      var selected = this.state.selectedDate && formatDate(this.state.selectedDate) === formatDate(date);
      var isToday = formatDate(date) === formatDate(today);

      var cls = 'aptly-cal-day';
      if (disabled) cls += ' disabled';
      if (selected) cls += ' selected';
      if (isToday) cls += ' today';

      h += '<button class="' + cls + '"' + (disabled ? ' disabled' : '') + ' data-action="select-date" data-date="' + formatDate(date) + '">' + day + '</button>';
    }

    h += '</div></div>';
    return h;
  };

  Widget.prototype.renderSlots = function() {
    var h = '<h3 class="aptly-step-title">Select a Time</h3>';
    h += '<div class="aptly-date-badge">' + formatDisplayDate(this.state.selectedDate) + '</div>';

    if (this.state.slotsLoading) {
      return h + '<div class="aptly-loading"><div class="aptly-spinner"></div>Loading times...</div>';
    }

    var available = [];
    for (var i = 0; i < this.state.slots.length; i++) {
      if (this.state.slots[i].available) available.push(this.state.slots[i]);
    }

    if (available.length === 0) {
      return h + '<div class="aptly-empty">No times available<br><br><button class="aptly-btn aptly-btn-outline" data-action="back">Pick another date</button></div>';
    }

    h += '<div class="aptly-slots">';
    for (var i = 0; i < this.state.slots.length; i++) {
      var slot = this.state.slots[i];
      var cls = 'aptly-slot';
      if (!slot.available) cls += ' disabled';
      if (this.state.selectedSlot && this.state.selectedSlot.start_time === slot.start_time) cls += ' selected';
      h += '<button class="' + cls + '"' + (!slot.available ? ' disabled' : '') + ' data-action="select-slot" data-slot=\'' + JSON.stringify(slot) + '\'>' + slot.start_time + '</button>';
    }
    h += '</div>';
    return h;
  };

  Widget.prototype.renderForm = function() {
    var s = this.state;
    var h = '<h3 class="aptly-step-title">Your Details</h3>';
    h += '<div class="aptly-summary">';
    h += '<div class="aptly-summary-row"><span class="aptly-summary-label">Service</span><span class="aptly-summary-value">' + esc(s.selectedService.name) + '</span></div>';
    h += '<div class="aptly-summary-row"><span class="aptly-summary-label">Date</span><span class="aptly-summary-value">' + formatDisplayDate(s.selectedDate) + '</span></div>';
    h += '<div class="aptly-summary-row"><span class="aptly-summary-label">Time</span><span class="aptly-summary-value">' + s.selectedSlot.start_time + ' - ' + s.selectedSlot.end_time + '</span></div>';
    h += '</div>';

    h += '<form id="aptly-form-' + this.containerId + '">';
    h += '<div class="aptly-form-group"><label class="aptly-label">Full Name</label><div class="aptly-input-wrap"><span class="aptly-input-icon">' + icons.user + '</span><input type="text" class="aptly-input" name="name" placeholder="John Doe" required value="' + esc(s.customerInfo.name) + '"></div></div>';
    h += '<div class="aptly-form-group"><label class="aptly-label">Email</label><div class="aptly-input-wrap"><span class="aptly-input-icon">' + icons.mail + '</span><input type="email" class="aptly-input" name="email" placeholder="john@example.com" required value="' + esc(s.customerInfo.email) + '"></div></div>';
    h += '<div class="aptly-form-group"><label class="aptly-label">Phone</label><div class="aptly-input-wrap"><span class="aptly-input-icon">' + icons.phone + '</span><input type="tel" class="aptly-input" name="phone" placeholder="+1 555 000 0000" required value="' + esc(s.customerInfo.phone) + '"></div></div>';
    h += '<button type="submit" class="aptly-btn aptly-btn-primary"' + (s.submitting ? ' disabled' : '') + '>' + (s.submitting ? 'Confirming...' : 'Confirm Booking') + '</button>';
    h += '</form>';
    return h;
  };

  Widget.prototype.renderConfirmation = function() {
    var b = this.state.booking;
    var h = '<div class="aptly-success">';
    h += '<div class="aptly-success-icon">' + icons.check + '</div>';
    h += '<h3 class="aptly-success-title">Booking Confirmed!</h3>';
    h += '<p class="aptly-success-text">Confirmation sent to ' + esc(b.customer_email) + '</p>';
    h += '</div><div class="aptly-summary">';
    h += '<div class="aptly-summary-row"><span class="aptly-summary-label">Service</span><span class="aptly-summary-value">' + esc(b.service_name) + '</span></div>';
    h += '<div class="aptly-summary-row"><span class="aptly-summary-label">Date</span><span class="aptly-summary-value">' + b.date + '</span></div>';
    h += '<div class="aptly-summary-row"><span class="aptly-summary-label">Time</span><span class="aptly-summary-value">' + b.start_time + ' - ' + b.end_time + '</span></div>';
    h += '<div class="aptly-summary-row"><span class="aptly-summary-label">ID</span><span class="aptly-summary-value" style="font-family:monospace;font-size:11px">' + b.id.slice(0, 8) + '</span></div>';
    h += '</div><button class="aptly-btn aptly-btn-outline" data-action="reset">Book Another</button>';
    return h;
  };

  Widget.prototype.isDateDisabled = function(date) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    var maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 60);
    if (date > maxDate) return true;

    var biz = this.state.business;
    if (biz && biz.blocked_dates) {
      var dateStr = formatDate(date);
      for (var i = 0; i < biz.blocked_dates.length; i++) {
        if (biz.blocked_dates[i] === dateStr) return true;
      }
    }

    var dow = date.getDay();
    var dayIndex = dow === 0 ? 6 : dow - 1;
    if (biz && biz.availability) {
      var avail = null;
      for (var i = 0; i < biz.availability.length; i++) {
        if (biz.availability[i].day === dayIndex) {
          avail = biz.availability[i];
          break;
        }
      }
      if (!avail || !avail.enabled) return true;
    }

    return false;
  };

  Widget.prototype.attachEvents = function() {
    var self = this;
    var container = document.getElementById(this.containerId);
    if (!container) return;

    // Back
    var backBtns = container.querySelectorAll('[data-action="back"]');
    for (var i = 0; i < backBtns.length; i++) {
      backBtns[i].onclick = function() { if (self.state.step > 0) { self.state.step--; self.render(); } };
    }

    // Service
    var services = container.querySelectorAll('[data-action="select-service"]');
    for (var i = 0; i < services.length; i++) {
      services[i].onclick = function() {
        var id = this.getAttribute('data-id');
        var list = self.state.business.services;
        for (var j = 0; j < list.length; j++) {
          if (list[j].id === id) { self.state.selectedService = list[j]; break; }
        }
        self.state.step = 1;
        self.render();
      };
    }

    // Calendar
    var prev = container.querySelector('[data-action="prev-month"]');
    if (prev) prev.onclick = function() { self.state.currentMonth = new Date(self.state.currentMonth.getFullYear(), self.state.currentMonth.getMonth() - 1); self.render(); };

    var next = container.querySelector('[data-action="next-month"]');
    if (next) next.onclick = function() { self.state.currentMonth = new Date(self.state.currentMonth.getFullYear(), self.state.currentMonth.getMonth() + 1); self.render(); };

    // Date
    var dates = container.querySelectorAll('[data-action="select-date"]');
    for (var i = 0; i < dates.length; i++) {
      dates[i].onclick = function() {
        var parts = this.getAttribute('data-date').split('-');
        self.state.selectedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        self.state.selectedSlot = null;
        self.state.step = 2;
        self.fetchSlots();
      };
    }

    // Slots
    var slots = container.querySelectorAll('[data-action="select-slot"]');
    for (var i = 0; i < slots.length; i++) {
      slots[i].onclick = function() {
        self.state.selectedSlot = JSON.parse(this.getAttribute('data-slot'));
        self.state.step = 3;
        self.render();
      };
    }

    // Form
    var form = container.querySelector('form');
    if (form) {
      form.onsubmit = function(e) {
        e.preventDefault();
        var inputs = form.querySelectorAll('input');
        for (var i = 0; i < inputs.length; i++) {
          self.state.customerInfo[inputs[i].name] = inputs[i].value;
        }
        self.createBooking();
      };
    }

    // Reset
    var reset = container.querySelector('[data-action="reset"]');
    if (reset) {
      reset.onclick = function() {
        self.state.step = 0;
        self.state.selectedService = null;
        self.state.selectedDate = null;
        self.state.selectedSlot = null;
        self.state.customerInfo = { name: '', email: '', phone: '' };
        self.state.booking = null;
        self.render();
      };
    }
  };

  // Utilities
  function formatDate(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function formatDisplayDate(d) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function hexToRgb(hex) {
    var r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? parseInt(r[1], 16) + ',' + parseInt(r[2], 16) + ',' + parseInt(r[3], 16) : '24,24,27';
  }

  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var icons = {
    clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    chevronLeft: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>',
    chevronRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>',
    user: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    mail: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>',
    phone: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    check: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>',
    arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>'
  };

  function injectStyles(color, rgb) {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@600;700&display=swap");.aptly-widget{font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:440px;margin:0 auto;line-height:1.5;-webkit-font-smoothing:antialiased}.aptly-widget *{box-sizing:border-box;margin:0;padding:0}.aptly-widget h1,.aptly-widget h2,.aptly-widget h3{font-family:"Manrope",sans-serif}.aptly-card{background:#fff;border-radius:16px;box-shadow:0 20px 40px -12px rgba(0,0,0,.15);overflow:hidden;border:1px solid #e4e4e7}.aptly-header{background:' + color + ';color:#fff;padding:20px}.aptly-header-inner{position:relative;text-align:center;padding:0 40px}.aptly-header-title{font-size:18px;font-weight:700}.aptly-header-desc{font-size:13px;opacity:.8;margin-top:4px}.aptly-progress{display:flex;gap:4px;margin-top:16px}.aptly-progress-bar{flex:1;height:3px;background:rgba(255,255,255,.3);border-radius:2px}.aptly-progress-bar.active{background:#fff}.aptly-content{padding:20px}.aptly-step-title{font-size:16px;font-weight:600;margin-bottom:16px;color:#18181b}.aptly-services{display:flex;flex-direction:column;gap:10px}.aptly-service{display:flex;align-items:center;padding:14px;background:#fafafa;border:1px solid #e4e4e7;border-radius:10px;cursor:pointer;transition:all .2s}.aptly-service:hover{border-color:' + color + ';background:#fff}.aptly-service-info{flex:1}.aptly-service-name{font-weight:500;font-size:14px;color:#18181b}.aptly-service-desc{font-size:12px;color:#71717a;margin-top:2px}.aptly-service-meta{display:flex;align-items:center;gap:10px;margin-top:6px;font-size:12px;color:#71717a}.aptly-service-price{font-weight:600;color:#18181b}.aptly-service-arrow{color:#a1a1aa;transition:transform .2s}.aptly-service:hover .aptly-service-arrow{transform:translateX(4px);color:' + color + '}.aptly-calendar{text-align:center}.aptly-cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}.aptly-cal-month{font-weight:600;font-size:15px;color:#18181b}.aptly-cal-btn{width:32px;height:32px;border:1px solid #e4e4e7;border-radius:8px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#71717a;transition:all .2s}.aptly-cal-btn:hover{background:#f4f4f5;color:#18181b}.aptly-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}.aptly-cal-day-name{font-size:11px;font-weight:500;color:#a1a1aa;padding:8px 0;text-transform:uppercase}.aptly-cal-day{width:100%;aspect-ratio:1;border-radius:8px;border:none;background:transparent;font-size:13px;cursor:pointer;transition:all .15s;color:#18181b}.aptly-cal-day:hover:not(:disabled){background:#f4f4f5}.aptly-cal-day:disabled{color:#d4d4d8;cursor:default}.aptly-cal-day.selected{background:' + color + ';color:#fff}.aptly-cal-day.today{font-weight:600}.aptly-date-badge{display:inline-block;font-size:12px;color:#71717a;background:#f4f4f5;padding:4px 10px;border-radius:6px;margin-bottom:14px}.aptly-slots{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.aptly-slot{padding:10px 8px;border:1px solid #e4e4e7;border-radius:8px;background:#fff;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;color:#18181b}.aptly-slot:hover:not(:disabled){border-color:' + color + ';background:rgba(' + rgb + ',.05)}.aptly-slot:disabled{background:#f4f4f5;color:#a1a1aa;cursor:default}.aptly-slot.selected{background:' + color + ';color:#fff;border-color:' + color + '}.aptly-form-group{margin-bottom:14px}.aptly-label{display:block;font-size:13px;font-weight:500;margin-bottom:6px;color:#18181b}.aptly-input-wrap{position:relative}.aptly-input-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#a1a1aa;pointer-events:none;display:flex}.aptly-input{width:100%;height:42px;padding:0 12px 0 38px;border:1px solid #e4e4e7;border-radius:8px;font-size:14px;font-family:inherit;color:#18181b;transition:border-color .2s}.aptly-input:focus{outline:none;border-color:' + color + '}.aptly-input::placeholder{color:#a1a1aa}.aptly-summary{background:#f4f4f5;border-radius:10px;padding:14px;margin-bottom:16px}.aptly-summary-row{display:flex;justify-content:space-between;font-size:13px;padding:3px 0}.aptly-summary-label{color:#71717a}.aptly-summary-value{font-weight:500;color:#18181b}.aptly-btn{width:100%;height:44px;border-radius:22px;font-size:14px;font-weight:500;font-family:inherit;cursor:pointer;transition:all .2s;border:none}.aptly-btn-primary{background:' + color + ';color:#fff}.aptly-btn-primary:hover{opacity:.9}.aptly-btn-primary:disabled{opacity:.5;cursor:default}.aptly-btn-outline{background:transparent;border:1px solid #e4e4e7;color:#18181b}.aptly-btn-outline:hover{background:#f4f4f5}.aptly-btn-back{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.15);border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;position:absolute;left:0;top:50%;transform:translateY(-50%)}.aptly-btn-back:hover{background:rgba(255,255,255,.25)}.aptly-success{text-align:center;padding:20px 0}.aptly-success-icon{width:56px;height:56px;border-radius:50%;background:#dcfce7;display:flex;align-items:center;justify-content:center;margin:0 auto 14px}.aptly-success-title{font-size:18px;font-weight:700;color:#18181b;margin-bottom:6px}.aptly-success-text{color:#71717a;font-size:13px}.aptly-loading{text-align:center;padding:40px 20px;color:#71717a;font-size:14px}.aptly-spinner{width:24px;height:24px;border:2px solid #e4e4e7;border-top-color:' + color + ';border-radius:50%;animation:aptly-spin .7s linear infinite;margin:0 auto 12px}@keyframes aptly-spin{to{transform:rotate(360deg)}}.aptly-empty{text-align:center;padding:30px;color:#71717a;font-size:13px}';
    document.head.appendChild(s);
  }

  // Public API
  var AppointlyWidget = {
    init: function(config) {
      if (!config || !config.businessId) {
        console.error('Appointly: businessId is required');
        return null;
      }
      var id = config.container || 'booking-widget';
      if (instances[id]) {
        // Re-initialize existing instance
        instances[id].state.loading = true;
        instances[id].businessId = config.businessId;
        instances[id].fetchBusiness();
        return instances[id];
      }
      instances[id] = new Widget(config);
      return instances[id];
    },
    destroy: function(containerId) {
      var id = containerId || 'booking-widget';
      if (instances[id]) {
        var container = document.getElementById(id);
        if (container) container.innerHTML = '';
        delete instances[id];
      }
    }
  };

  // Expose globally
  window.AppointlyWidget = AppointlyWidget;

  // Auto-init from script tag
  function autoInit() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || '';
      if (src.indexOf('booking-embed') !== -1) {
        var bid = scripts[i].getAttribute('data-business-id');
        var color = scripts[i].getAttribute('data-primary-color');
        var container = scripts[i].getAttribute('data-container');
        if (bid) {
          AppointlyWidget.init({
            businessId: bid,
            primaryColor: color || '#18181b',
            container: container || 'booking-widget'
          });
        }
        break;
      }
    }
  }

  // Run auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

})(window, document);
