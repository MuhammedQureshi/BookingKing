import { useState, useEffect } from "react";
import axios from "axios";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Calendar as CalendarIcon,
  User,
  Mail,
  Phone,
  Loader2,
  Sparkles
} from "lucide-react";
import { format, addDays, isBefore, startOfDay } from "date-fns";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STEPS = {
  SERVICE: 0,
  DATE: 1,
  TIME: 2,
  DETAILS: 3,
  CONFIRMATION: 4
};

export const BookingWidget = ({ businessId, primaryColor }) => {
  const [step, setStep] = useState(STEPS.SERVICE);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: ""
  });

  useEffect(() => {
    fetchBusiness();
  }, [businessId]);

  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchSlots();
    }
  }, [selectedDate, selectedService]);

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/businesses/${businessId}`);
      setBusiness(response.data);
    } catch (error) {
      console.error("Failed to fetch business:", error);
      toast.error("Failed to load booking information");
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    if (!selectedDate || !selectedService) return;
    
    try {
      setSlotsLoading(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await axios.get(
        `${API}/businesses/${businessId}/slots?date=${dateStr}&service_id=${selectedService.id}`
      );
      setSlots(response.data);
    } catch (error) {
      console.error("Failed to fetch slots:", error);
      toast.error("Failed to load available times");
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setStep(STEPS.DATE);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep(STEPS.TIME);
  };

  const handleSlotSelect = (slot) => {
    if (!slot.available) return;
    setSelectedSlot(slot);
    setStep(STEPS.DETAILS);
  };

  const handleBack = () => {
    if (step > STEPS.SERVICE) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(`${API}/bookings`, {
        business_id: businessId,
        service_id: selectedService.id,
        date: format(selectedDate, "yyyy-MM-dd"),
        start_time: selectedSlot.start_time,
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone
      });
      
      setBookingResult(response.data);
      setStep(STEPS.CONFIRMATION);
      toast.success("Booking confirmed!");
    } catch (error) {
      console.error("Failed to create booking:", error);
      toast.error(error.response?.data?.detail || "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  const resetWidget = () => {
    setStep(STEPS.SERVICE);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setBookingResult(null);
    setCustomerInfo({ name: "", email: "", phone: "" });
  };

  const isDateDisabled = (date) => {
    if (isBefore(date, startOfDay(new Date()))) return true;
    if (isBefore(addDays(new Date(), 60), date)) return true;
    if (business?.blocked_dates?.includes(format(date, "yyyy-MM-dd"))) return true;
    
    const dayOfWeek = date.getDay();
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const dayAvailability = business?.availability?.find(a => a.day === dayIndex);
    if (!dayAvailability || !dayAvailability.enabled) return true;
    
    return false;
  };

  if (loading) {
    return (
      <div className="ebs-widget w-full max-w-[440px] mx-auto" data-testid="booking-widget-loading">
        <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-primary p-6">
            <Skeleton className="h-6 w-3/4 bg-white/20" />
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="ebs-widget w-full max-w-[440px] mx-auto" data-testid="booking-widget-error">
        <Card className="border-0 shadow-2xl rounded-2xl">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Business not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="ebs-widget w-full max-w-[440px] mx-auto" data-testid="booking-widget">
      <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden bg-white">
        {/* Header */}
        <div className="relative bg-primary text-primary-foreground p-6">
          <div className="flex items-center">
            {step > STEPS.SERVICE && step < STEPS.CONFIRMATION && (
              <button
                onClick={handleBack}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                data-testid="back-button"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div className={`flex-1 ${step > STEPS.SERVICE && step < STEPS.CONFIRMATION ? 'text-center' : ''}`}>
              <h2 className="text-lg font-bold font-heading">
                {business.business_name}
              </h2>
              {step === STEPS.SERVICE && business.description && (
                <p className="text-sm text-white/70 mt-0.5">{business.description}</p>
              )}
            </div>
          </div>
          
          {/* Progress */}
          {step < STEPS.CONFIRMATION && (
            <div className="flex gap-1.5 mt-5" data-testid="progress-indicator">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    i <= step ? "bg-white" : "bg-white/25"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <CardContent className="p-6">
          {/* Step 1: Select Service */}
          {step === STEPS.SERVICE && (
            <div className="space-y-3" data-testid="service-selection">
              <h3 className="text-base font-semibold font-heading text-foreground mb-4">Select a Service</h3>
              {business.services.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No services available</p>
              ) : (
                business.services.map((service, index) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="group w-full flex items-center p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-all cursor-pointer text-left border border-transparent hover:border-primary/20"
                    style={{ animationDelay: `${index * 50}ms` }}
                    data-testid={`service-${service.id}`}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {service.name}
                      </h4>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{service.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {service.duration} min
                        </span>
                        {service.price && (
                          <span className="text-sm font-semibold text-foreground">${service.price}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </button>
                ))
              )}
            </div>
          )}

          {/* Step 2: Select Date */}
          {step === STEPS.DATE && (
            <div className="space-y-4" data-testid="date-selection">
              <h3 className="text-base font-semibold font-heading">Select a Date</h3>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={isDateDisabled}
                  className="rounded-xl border-0 p-0"
                  classNames={{
                    months: "space-y-4",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-semibold",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-zinc-100 rounded-lg transition-all",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse",
                    head_row: "flex",
                    head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]",
                    row: "flex w-full mt-1",
                    cell: "h-10 w-10 text-center text-sm p-0 relative",
                    day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-zinc-100 rounded-lg transition-all",
                    day_range_end: "day-range-end",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-zinc-100 text-foreground",
                    day_outside: "day-outside text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_hidden: "invisible",
                  }}
                  data-testid="calendar"
                />
              </div>
            </div>
          )}

          {/* Step 3: Select Time */}
          {step === STEPS.TIME && (
            <div className="space-y-4" data-testid="time-selection">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold font-heading">Select a Time</h3>
                <span className="text-xs text-muted-foreground bg-zinc-100 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <CalendarIcon className="h-3 w-3" />
                  {selectedDate && format(selectedDate, "MMM d")}
                </span>
              </div>
              
              {slotsLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(9)].map((_, i) => (
                    <Skeleton key={i} className="h-11 w-full rounded-lg" />
                  ))}
                </div>
              ) : slots.length === 0 || !slots.some(s => s.available) ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">No available times for this date</p>
                  <Button
                    variant="link"
                    onClick={() => setStep(STEPS.DATE)}
                    className="mt-2 text-sm"
                    data-testid="select-different-date"
                  >
                    Select a different date
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => handleSlotSelect(slot)}
                      disabled={!slot.available}
                      className={`p-3 rounded-lg text-sm font-medium transition-all ${
                        slot.available
                          ? selectedSlot?.start_time === slot.start_time
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                            : "bg-zinc-50 hover:bg-zinc-100 text-foreground border border-transparent hover:border-primary/20"
                          : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      }`}
                      data-testid={`slot-${slot.start_time}`}
                    >
                      {slot.start_time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Customer Details */}
          {step === STEPS.DETAILS && (
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="customer-details-form">
              <h3 className="text-base font-semibold font-heading">Your Details</h3>
              
              {/* Booking summary */}
              <div className="bg-zinc-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{selectedDate && format(selectedDate, "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{selectedSlot?.start_time} - {selectedSlot?.end_time}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-foreground">
                    Full Name
                  </Label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className="pl-10 h-11 rounded-lg border-zinc-200 focus:border-primary focus:ring-primary"
                      required
                      data-testid="input-name"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="pl-10 h-11 rounded-lg border-zinc-200 focus:border-primary focus:ring-primary"
                      required
                      data-testid="input-email"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                    Phone
                  </Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="pl-10 h-11 rounded-lg border-zinc-200 focus:border-primary focus:ring-primary"
                      required
                      data-testid="input-phone"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-full font-medium text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                disabled={submitting}
                data-testid="confirm-booking-button"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </form>
          )}

          {/* Step 5: Confirmation */}
          {step === STEPS.CONFIRMATION && bookingResult && (
            <div className="text-center py-4" data-testid="booking-confirmation">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                <Check className="h-8 w-8 text-emerald-600" strokeWidth={3} />
              </div>
              <h3 className="text-xl font-bold font-heading mb-2">You're all set!</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Confirmation sent to {bookingResult.customer_email}
              </p>
              
              <div className="bg-zinc-50 rounded-xl p-4 space-y-2.5 text-left mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{bookingResult.service_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{bookingResult.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{bookingResult.start_time} - {bookingResult.end_time}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Confirmation</span>
                  <span className="font-mono text-xs bg-zinc-200 px-2 py-0.5 rounded">{bookingResult.id.slice(0, 8)}</span>
                </div>
              </div>
              
              <Button
                onClick={resetWidget}
                variant="outline"
                className="rounded-full px-6"
                data-testid="book-another-button"
              >
                Book Another
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingWidget;
