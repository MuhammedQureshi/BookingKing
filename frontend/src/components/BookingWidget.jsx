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
  Loader2
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

  // Apply custom primary color
  const widgetStyle = primaryColor ? {
    '--ebs-primary': primaryColor
  } : {};

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
    // Disable past dates
    if (isBefore(date, startOfDay(new Date()))) return true;
    
    // Disable dates more than 60 days in future
    if (isBefore(addDays(new Date(), 60), date)) return true;
    
    // Disable blocked dates
    if (business?.blocked_dates?.includes(format(date, "yyyy-MM-dd"))) return true;
    
    // Disable days without availability
    const dayOfWeek = date.getDay();
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to Monday=0
    const dayAvailability = business?.availability?.find(a => a.day === dayIndex);
    if (!dayAvailability || !dayAvailability.enabled) return true;
    
    return false;
  };

  if (loading) {
    return (
      <div className="ebs-widget w-full max-w-[480px] mx-auto" style={widgetStyle} data-testid="booking-widget-loading">
        <Card className="border border-border/50 shadow-xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="ebs-widget w-full max-w-[480px] mx-auto" style={widgetStyle} data-testid="booking-widget-error">
        <Card className="border border-border/50 shadow-xl">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Business not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="ebs-widget w-full max-w-[480px] mx-auto" style={widgetStyle} data-testid="booking-widget">
      <Card className="border border-border/50 shadow-xl overflow-hidden">
        {/* Header */}
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <div className="flex items-center justify-between">
            {step > STEPS.SERVICE && step < STEPS.CONFIRMATION && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="text-primary-foreground hover:bg-white/10 -ml-2"
                data-testid="back-button"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <div className={step > STEPS.SERVICE && step < STEPS.CONFIRMATION ? "text-center flex-1" : ""}>
              <CardTitle className="text-xl font-bold font-['Manrope']">
                {business.business_name}
              </CardTitle>
              {step === STEPS.SERVICE && business.description && (
                <p className="text-sm text-primary-foreground/80 mt-1">{business.description}</p>
              )}
            </div>
            {step > STEPS.SERVICE && step < STEPS.CONFIRMATION && <div className="w-9" />}
          </div>
          
          {/* Progress indicator */}
          {step < STEPS.CONFIRMATION && (
            <div className="flex gap-1 mt-4" data-testid="progress-indicator">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= step ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-6">
          {/* Step 1: Select Service */}
          {step === STEPS.SERVICE && (
            <div className="space-y-3" data-testid="service-selection">
              <h3 className="text-lg font-semibold font-['Manrope'] mb-4">Select a Service</h3>
              {business.services.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No services available</p>
              ) : (
                business.services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="group w-full flex items-center p-4 border rounded-xl hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer text-left"
                    data-testid={`service-${service.id}`}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {service.name}
                      </h4>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{service.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {service.duration} min
                        </span>
                        {service.price && (
                          <span className="font-medium text-foreground">${service.price}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))
              )}
            </div>
          )}

          {/* Step 2: Select Date */}
          {step === STEPS.DATE && (
            <div className="space-y-4" data-testid="date-selection">
              <h3 className="text-lg font-semibold font-['Manrope']">Select a Date</h3>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={isDateDisabled}
                  className="rounded-lg border p-3"
                  data-testid="calendar"
                />
              </div>
            </div>
          )}

          {/* Step 3: Select Time */}
          {step === STEPS.TIME && (
            <div className="space-y-4" data-testid="time-selection">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold font-['Manrope']">Select a Time</h3>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {selectedDate && format(selectedDate, "MMM d, yyyy")}
                </span>
              </div>
              
              {slotsLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(9)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No available times for this date</p>
                  <Button
                    variant="link"
                    onClick={() => setStep(STEPS.DATE)}
                    className="mt-2"
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
                      className={`ebs-time-slot p-3 rounded-lg border text-sm font-medium transition-all ${
                        slot.available
                          ? "hover:border-primary hover:bg-primary/5 hover:text-primary cursor-pointer"
                          : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                      } ${
                        selectedSlot?.start_time === slot.start_time
                          ? "border-primary bg-primary text-primary-foreground"
                          : ""
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
              <h3 className="text-lg font-semibold font-['Manrope']">Your Details</h3>
              
              {/* Booking summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{selectedDate && format(selectedDate, "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{selectedSlot?.start_time} - {selectedSlot?.end_time}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className="pl-10"
                      required
                      data-testid="input-name"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="pl-10"
                      required
                      data-testid="input-email"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone
                  </Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="pl-10"
                      required
                      data-testid="input-phone"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-full font-medium text-base btn-press"
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
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold font-['Manrope'] mb-2">Booking Confirmed!</h3>
              <p className="text-muted-foreground mb-6">
                A confirmation email has been sent to {bookingResult.customer_email}
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm text-left mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{bookingResult.service_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{bookingResult.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{bookingResult.start_time} - {bookingResult.end_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confirmation ID</span>
                  <span className="font-mono text-xs">{bookingResult.id.slice(0, 8)}</span>
                </div>
              </div>
              
              <Button
                onClick={resetWidget}
                variant="outline"
                className="rounded-full"
                data-testid="book-another-button"
              >
                Book Another Appointment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingWidget;
