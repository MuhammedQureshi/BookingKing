/**
 * Embeddable Booking Widget - Standalone Script
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

  // Get script element and read data attributes
  const script = document.currentScript;
  const businessId = script.getAttribute('data-business-id');
  const primaryColor = script.getAttribute('data-primary-color') || '#18181b';
  const containerId = script.getAttribute('data-container') || 'booking-widget';
  
  // API Base URL - update this to your deployed backend URL
  const API_BASE = 'https://reserve-js.preview.emergentagent.com/api';

  if (!businessId) {
    console.error('BookingWidget: data-business-id is required');
    return;
  }

  // Inject styles
  const styles = document.createElement('style');
  styles.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
    
    .ebs-widget-container {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --ebs-primary: ${primaryColor};
      --ebs-primary-rgb: ${hexToRgb(primaryColor)};
      max-width: 480px;
      margin: 0 auto;
    }
    
    .ebs-widget-container * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    .ebs-widget-container h1,
    .ebs-widget-container h2,
    .ebs-widget-container h3 {
      font-family: 'Manrope', sans-serif;
    }
    
    .ebs-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      border: 1px solid #e4e4e7;
    }
    
    .ebs-header {
      background: var(--ebs-primary);
      color: white;
      padding: 24px;
    }
    
    .ebs-header-title {
      font-size: 20px;
      font-weight: 700;
    }
    
    .ebs-header-desc {
      font-size: 14px;
      opacity: 0.8;
      margin-top: 4px;
    }
    
    .ebs-progress {
      display: flex;
      gap: 4px;
      margin-top: 16px;
    }
    
    .ebs-progress-bar {
      flex: 1;
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
    }
    
    .ebs-progress-bar.active {
      background: white;
    }
    
    .ebs-content {
      padding: 24px;
    }
    
    .ebs-step-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    
    .ebs-service-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .ebs-service-item {
      display: flex;
      align-items: center;
      padding: 16px;
      border: 1px solid #e4e4e7;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .ebs-service-item:hover {
      border-color: var(--ebs-primary);
      background: rgba(var(--ebs-primary-rgb), 0.05);
    }
    
    .ebs-service-info {
      flex: 1;
    }
    
    .ebs-service-name {
      font-weight: 500;
      font-size: 15px;
    }
    
    .ebs-service-desc {
      font-size: 13px;
      color: #71717a;
      margin-top: 2px;
    }
    
    .ebs-service-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
      font-size: 13px;
      color: #71717a;
    }
    
    .ebs-service-price {
      font-weight: 500;
      color: #18181b;
    }
    
    .ebs-calendar {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .ebs-calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      margin-top: 16px;
    }
    
    .ebs-calendar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      margin-bottom: 16px;
    }
    
    .ebs-calendar-month {
      font-weight: 600;
      font-size: 16px;
    }
    
    .ebs-calendar-nav {
      display: flex;
      gap: 8px;
    }
    
    .ebs-calendar-btn {
      width: 32px;
      height: 32px;
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
    
    .ebs-calendar-btn:hover {
      background: #f4f4f5;
    }
    
    .ebs-calendar-day-header {
      font-size: 12px;
      font-weight: 500;
      color: #71717a;
      text-align: center;
      padding: 8px 0;
    }
    
    .ebs-calendar-day {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      background: transparent;
    }
    
    .ebs-calendar-day:hover:not(.disabled) {
      background: #f4f4f5;
    }
    
    .ebs-calendar-day.selected {
      background: var(--ebs-primary);
      color: white;
    }
    
    .ebs-calendar-day.disabled {
      color: #d4d4d8;
      cursor: not-allowed;
    }
    
    .ebs-slots-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    
    .ebs-slot {
      padding: 12px;
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      text-align: center;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      background: white;
    }
    
    .ebs-slot:hover:not(.disabled) {
      border-color: var(--ebs-primary);
      background: rgba(var(--ebs-primary-rgb), 0.05);
    }
    
    .ebs-slot.selected {
      background: var(--ebs-primary);
      color: white;
      border-color: var(--ebs-primary);
    }
    
    .ebs-slot.disabled {
      background: #f4f4f5;
      color: #a1a1aa;
      cursor: not-allowed;
    }
    
    .ebs-form-group {
      margin-bottom: 16px;
    }
    
    .ebs-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 6px;
    }
    
    .ebs-input {
      width: 100%;
      height: 44px;
      padding: 0 12px 0 40px;
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s;
    }
    
    .ebs-input:focus {
      outline: none;
      border-color: var(--ebs-primary);
    }
    
    .ebs-input-wrapper {
      position: relative;
    }
    
    .ebs-input-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #71717a;
    }
    
    .ebs-summary {
      background: #f4f4f5;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    
    .ebs-summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      padding: 4px 0;
    }
    
    .ebs-summary-label {
      color: #71717a;
    }
    
    .ebs-summary-value {
      font-weight: 500;
    }
    
    .ebs-btn {
      width: 100%;
      height: 48px;
      border-radius: 24px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    
    .ebs-btn-primary {
      background: var(--ebs-primary);
      color: white;
    }
    
    .ebs-btn-primary:hover {
      opacity: 0.9;
    }
    
    .ebs-btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .ebs-btn-secondary {
      background: transparent;
      border: 1px solid #e4e4e7;
      color: #18181b;
    }
    
    .ebs-btn-secondary:hover {
      background: #f4f4f5;
    }
    
    .ebs-btn-back {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
    }
    
    .ebs-btn-back:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .ebs-header-inner {
      position: relative;
      text-align: center;
    }
    
    .ebs-success {
      text-align: center;
      padding: 24px 0;
    }
    
    .ebs-success-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #dcfce7;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }
    
    .ebs-success-icon svg {
      width: 32px;
      height: 32px;
      color: #16a34a;
    }
    
    .ebs-success-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .ebs-success-text {
      color: #71717a;
      font-size: 14px;
    }
    
    .ebs-loading {
      text-align: center;
      padding: 48px;
      color: #71717a;
    }
    
    .ebs-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #e4e4e7;
      border-top-color: var(--ebs-primary);
      border-radius: 50%;
      animation: ebs-spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    
    @keyframes ebs-spin {
      to { transform: rotate(360deg); }
    }
    
    .ebs-empty {
      text-align: center;
      padding: 32px;
      color: #71717a;
    }
  `;
  document.head.appendChild(styles);

  // Helper function to convert hex to RGB
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '24, 24, 27';
  }

  // Widget State
  const state = {
    step: 0, // 0: service, 1: date, 2: time, 3: details, 4: confirmation
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

  // Fetch business data
  async function fetchBusiness() {
    try {
      const response = await fetch(`${API_BASE}/businesses/${businessId}`);
      if (!response.ok) throw new Error('Business not found');
      state.business = await response.json();
      state.loading = false;
      render();
    } catch (error) {
      console.error('BookingWidget: Failed to fetch business', error);
      state.loading = false;
      render();
    }
  }

  // Fetch available slots
  async function fetchSlots() {
    if (!state.selectedDate || !state.selectedService) return;
    
    state.slotsLoading = true;
    render();
    
    try {
      const dateStr = formatDate(state.selectedDate);
      const response = await fetch(`${API_BASE}/businesses/${businessId}/slots?date=${dateStr}&service_id=${state.selectedService.id}`);
      state.slots = await response.json();
    } catch (error) {
      console.error('BookingWidget: Failed to fetch slots', error);
      state.slots = [];
    }
    
    state.slotsLoading = false;
    render();
  }

  // Create booking
  async function createBooking() {
    state.submitting = true;
    render();
    
    try {
      const response = await fetch(`${API_BASE}/bookings`, {
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
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create booking');
      }
      
      state.booking = await response.json();
      state.step = 4;
    } catch (error) {
      alert(error.message);
    }
    
    state.submitting = false;
    render();
  }

  // Date helpers
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDisplayDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function isDateDisabled(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return true;
    
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 60);
    if (date > maxDate) return true;
    
    if (state.business?.blocked_dates?.includes(formatDate(date))) return true;
    
    const dayOfWeek = date.getDay();
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const dayAvail = state.business?.availability?.find(a => a.day === dayIndex);
    if (!dayAvail || !dayAvail.enabled) return true;
    
    return false;
  }

  // SVG Icons
  const icons = {
    clock: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="7"/><path d="M8 4v4l2 2"/></svg>',
    chevronLeft: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4l-6 6 6 6"/></svg>',
    chevronRight: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4l6 6-6 6"/></svg>',
    user: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.5-5 6-5s6 2 6 5"/></svg>',
    mail: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="14" height="10" rx="1"/><path d="M1 3l7 5 7-5"/></svg>',
    phone: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 1h4l1.5 4L6 6.5c1 2 2.5 3.5 4.5 4.5l1.5-2.5 4 1.5v4c0 .5-.5 1-1 1C7 15 1 9 1 4c0-.5.5-1 1-1z"/></svg>',
    check: '<svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 16l6 6 12-12"/></svg>'
  };

  // Render functions
  function render() {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (state.loading) {
      container.innerHTML = renderLoading();
      return;
    }

    if (!state.business) {
      container.innerHTML = renderError();
      return;
    }

    container.innerHTML = `
      <div class="ebs-widget-container">
        <div class="ebs-card">
          ${renderHeader()}
          <div class="ebs-content">
            ${renderStep()}
          </div>
        </div>
      </div>
    `;

    attachEventListeners();
  }

  function renderLoading() {
    return `
      <div class="ebs-widget-container">
        <div class="ebs-card">
          <div class="ebs-loading">
            <div class="ebs-spinner"></div>
            Loading booking options...
          </div>
        </div>
      </div>
    `;
  }

  function renderError() {
    return `
      <div class="ebs-widget-container">
        <div class="ebs-card">
          <div class="ebs-loading">
            Business not found. Please check the business ID.
          </div>
        </div>
      </div>
    `;
  }

  function renderHeader() {
    if (state.step === 4) {
      return `<div class="ebs-header"><div class="ebs-header-title">${state.business.business_name}</div></div>`;
    }

    return `
      <div class="ebs-header">
        <div class="ebs-header-inner">
          ${state.step > 0 ? `<button class="ebs-btn-back" data-action="back">${icons.chevronLeft}</button>` : ''}
          <div class="ebs-header-title">${state.business.business_name}</div>
          ${state.step === 0 && state.business.description ? `<div class="ebs-header-desc">${state.business.description}</div>` : ''}
        </div>
        <div class="ebs-progress">
          ${[0, 1, 2, 3].map(i => `<div class="ebs-progress-bar ${i <= state.step ? 'active' : ''}"></div>`).join('')}
        </div>
      </div>
    `;
  }

  function renderStep() {
    switch (state.step) {
      case 0: return renderServices();
      case 1: return renderCalendar();
      case 2: return renderSlots();
      case 3: return renderDetails();
      case 4: return renderConfirmation();
      default: return '';
    }
  }

  function renderServices() {
    if (!state.business.services || state.business.services.length === 0) {
      return '<div class="ebs-empty">No services available</div>';
    }

    return `
      <h3 class="ebs-step-title">Select a Service</h3>
      <div class="ebs-service-list">
        ${state.business.services.map(service => `
          <div class="ebs-service-item" data-action="select-service" data-service-id="${service.id}">
            <div class="ebs-service-info">
              <div class="ebs-service-name">${service.name}</div>
              ${service.description ? `<div class="ebs-service-desc">${service.description}</div>` : ''}
              <div class="ebs-service-meta">
                <span>${icons.clock} ${service.duration} min</span>
                ${service.price ? `<span class="ebs-service-price">$${service.price}</span>` : ''}
              </div>
            </div>
            ${icons.chevronRight}
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderCalendar() {
    const today = new Date();
    const month = state.currentMonth;
    const year = month.getFullYear();
    const monthNum = month.getMonth();
    
    const firstDay = new Date(year, monthNum, 1);
    const lastDay = new Date(year, monthNum + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Empty cells for days before start of month
    for (let i = 0; i < startDay; i++) {
      days.push('<div class="ebs-calendar-day disabled"></div>');
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum, day);
      const disabled = isDateDisabled(date);
      const selected = state.selectedDate && formatDate(state.selectedDate) === formatDate(date);
      
      days.push(`
        <button 
          class="ebs-calendar-day ${disabled ? 'disabled' : ''} ${selected ? 'selected' : ''}"
          ${disabled ? 'disabled' : ''}
          data-action="select-date" 
          data-date="${formatDate(date)}"
        >${day}</button>
      `);
    }

    const monthName = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return `
      <h3 class="ebs-step-title">Select a Date</h3>
      <div class="ebs-calendar">
        <div class="ebs-calendar-header">
          <button class="ebs-calendar-btn" data-action="prev-month">${icons.chevronLeft}</button>
          <span class="ebs-calendar-month">${monthName}</span>
          <button class="ebs-calendar-btn" data-action="next-month">${icons.chevronRight}</button>
        </div>
        <div class="ebs-calendar-grid">
          ${dayHeaders.map(d => `<div class="ebs-calendar-day-header">${d}</div>`).join('')}
          ${days.join('')}
        </div>
      </div>
    `;
  }

  function renderSlots() {
    if (state.slotsLoading) {
      return `
        <h3 class="ebs-step-title">Select a Time</h3>
        <div class="ebs-loading">
          <div class="ebs-spinner"></div>
          Loading available times...
        </div>
      `;
    }

    const availableSlots = state.slots.filter(s => s.available);
    
    if (availableSlots.length === 0) {
      return `
        <h3 class="ebs-step-title">Select a Time</h3>
        <div class="ebs-empty">
          No available times for ${formatDisplayDate(state.selectedDate)}
          <br><br>
          <button class="ebs-btn ebs-btn-secondary" data-action="back">Select different date</button>
        </div>
      `;
    }

    return `
      <h3 class="ebs-step-title">Select a Time</h3>
      <div style="font-size: 13px; color: #71717a; margin-bottom: 16px;">${formatDisplayDate(state.selectedDate)}</div>
      <div class="ebs-slots-grid">
        ${state.slots.map(slot => `
          <button 
            class="ebs-slot ${!slot.available ? 'disabled' : ''} ${state.selectedSlot?.start_time === slot.start_time ? 'selected' : ''}"
            ${!slot.available ? 'disabled' : ''}
            data-action="select-slot"
            data-slot='${JSON.stringify(slot)}'
          >${slot.start_time}</button>
        `).join('')}
      </div>
    `;
  }

  function renderDetails() {
    return `
      <h3 class="ebs-step-title">Your Details</h3>
      <div class="ebs-summary">
        <div class="ebs-summary-row">
          <span class="ebs-summary-label">Service</span>
          <span class="ebs-summary-value">${state.selectedService.name}</span>
        </div>
        <div class="ebs-summary-row">
          <span class="ebs-summary-label">Date</span>
          <span class="ebs-summary-value">${formatDisplayDate(state.selectedDate)}</span>
        </div>
        <div class="ebs-summary-row">
          <span class="ebs-summary-label">Time</span>
          <span class="ebs-summary-value">${state.selectedSlot.start_time} - ${state.selectedSlot.end_time}</span>
        </div>
      </div>
      <form id="ebs-details-form">
        <div class="ebs-form-group">
          <label class="ebs-label">Full Name</label>
          <div class="ebs-input-wrapper">
            <span class="ebs-input-icon">${icons.user}</span>
            <input type="text" class="ebs-input" name="name" placeholder="John Doe" required value="${state.customerInfo.name}">
          </div>
        </div>
        <div class="ebs-form-group">
          <label class="ebs-label">Email</label>
          <div class="ebs-input-wrapper">
            <span class="ebs-input-icon">${icons.mail}</span>
            <input type="email" class="ebs-input" name="email" placeholder="john@example.com" required value="${state.customerInfo.email}">
          </div>
        </div>
        <div class="ebs-form-group">
          <label class="ebs-label">Phone</label>
          <div class="ebs-input-wrapper">
            <span class="ebs-input-icon">${icons.phone}</span>
            <input type="tel" class="ebs-input" name="phone" placeholder="+1 (555) 000-0000" required value="${state.customerInfo.phone}">
          </div>
        </div>
        <button type="submit" class="ebs-btn ebs-btn-primary" ${state.submitting ? 'disabled' : ''}>
          ${state.submitting ? 'Confirming...' : 'Confirm Booking'}
        </button>
      </form>
    `;
  }

  function renderConfirmation() {
    return `
      <div class="ebs-success">
        <div class="ebs-success-icon">${icons.check}</div>
        <h3 class="ebs-success-title">Booking Confirmed!</h3>
        <p class="ebs-success-text">A confirmation email has been sent to ${state.booking.customer_email}</p>
      </div>
      <div class="ebs-summary">
        <div class="ebs-summary-row">
          <span class="ebs-summary-label">Service</span>
          <span class="ebs-summary-value">${state.booking.service_name}</span>
        </div>
        <div class="ebs-summary-row">
          <span class="ebs-summary-label">Date</span>
          <span class="ebs-summary-value">${state.booking.date}</span>
        </div>
        <div class="ebs-summary-row">
          <span class="ebs-summary-label">Time</span>
          <span class="ebs-summary-value">${state.booking.start_time} - ${state.booking.end_time}</span>
        </div>
        <div class="ebs-summary-row">
          <span class="ebs-summary-label">Confirmation</span>
          <span class="ebs-summary-value" style="font-family: monospace; font-size: 12px;">${state.booking.id.slice(0, 8)}</span>
        </div>
      </div>
      <button class="ebs-btn ebs-btn-secondary" data-action="reset">Book Another Appointment</button>
    `;
  }

  function attachEventListeners() {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Back button
    container.querySelectorAll('[data-action="back"]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.step > 0) {
          state.step--;
          render();
        }
      });
    });

    // Service selection
    container.querySelectorAll('[data-action="select-service"]').forEach(el => {
      el.addEventListener('click', () => {
        const serviceId = el.dataset.serviceId;
        state.selectedService = state.business.services.find(s => s.id === serviceId);
        state.step = 1;
        render();
      });
    });

    // Calendar navigation
    container.querySelector('[data-action="prev-month"]')?.addEventListener('click', () => {
      state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1);
      render();
    });

    container.querySelector('[data-action="next-month"]')?.addEventListener('click', () => {
      state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1);
      render();
    });

    // Date selection
    container.querySelectorAll('[data-action="select-date"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [year, month, day] = btn.dataset.date.split('-').map(Number);
        state.selectedDate = new Date(year, month - 1, day);
        state.selectedSlot = null;
        state.step = 2;
        fetchSlots();
      });
    });

    // Slot selection
    container.querySelectorAll('[data-action="select-slot"]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.selectedSlot = JSON.parse(btn.dataset.slot);
        state.step = 3;
        render();
      });
    });

    // Details form
    const form = container.querySelector('#ebs-details-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        state.customerInfo = {
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone')
        };
        createBooking();
      });

      // Update state on input change
      form.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', (e) => {
          state.customerInfo[e.target.name] = e.target.value;
        });
      });
    }

    // Reset
    container.querySelector('[data-action="reset"]')?.addEventListener('click', () => {
      state.step = 0;
      state.selectedService = null;
      state.selectedDate = null;
      state.selectedSlot = null;
      state.customerInfo = { name: '', email: '', phone: '' };
      state.booking = null;
      render();
    });
  }

  // Initialize
  fetchBusiness();
})();
