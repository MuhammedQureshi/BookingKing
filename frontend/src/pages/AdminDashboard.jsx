import { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  List,
  Settings,
  LogOut,
  CalendarOff,
  Sparkles,
  Copy,
  User,
  Mail,
  Phone,
  Trash2
} from "lucide-react";
import ServicesPage from "./admin/ServicesPage";
import AvailabilityPage from "./admin/AvailabilityPage";
import BlockedDatesPage from "./admin/BlockedDatesPage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("booking_token");
  const businessId = localStorage.getItem("booking_business_id");
  const businessName = localStorage.getItem("booking_business_name");

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchBusiness();
  }, [token, navigate]);

  const fetchBusiness = async () => {
    try {
      const response = await axios.get(`${API}/admin/business`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBusiness(response.data);
    } catch (error) {
      console.error("Failed to fetch business:", error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("booking_token");
    localStorage.removeItem("booking_business_id");
    localStorage.removeItem("booking_business_name");
    navigate("/admin/login");
    toast.success("Logged out successfully");
  };

  const copyBusinessId = () => {
    navigator.clipboard.writeText(businessId);
    toast.success("Business ID copied!");
  };

  const navItems = [
    { path: "/admin/dashboard", label: "Bookings", icon: List },
    { path: "/admin/services", label: "Services", icon: Clock },
    { path: "/admin/availability", label: "Availability", icon: Calendar },
    { path: "/admin/blocked-dates", label: "Blocked Dates", icon: CalendarOff }
  ];

  const isActive = (path) => location.pathname === path;

  if (!token) return null;

  return (
    <div className="min-h-screen bg-background" data-testid="admin-dashboard">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-card border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">{businessName}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="mobile-logout">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
        {/* Mobile Nav */}
        <nav className="flex gap-1 mt-3 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                isActive(item.path)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              data-testid={`mobile-nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 min-h-screen bg-card border-r fixed">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold font-['Manrope'] text-sm">{businessName}</h2>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </div>

            {/* Business ID */}
            <div className="bg-muted/50 rounded-lg p-3 mb-6">
              <p className="text-xs text-muted-foreground mb-1">Your Business ID</p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono flex-1 truncate">{businessId}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={copyBusinessId}
                  data-testid="copy-business-id"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <Separator className="mb-4" />

            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-4 lg:p-8">
          <Routes>
            <Route path="/dashboard" element={<BookingsView token={token} />} />
            <Route path="/services" element={<ServicesPage token={token} onUpdate={fetchBusiness} />} />
            <Route path="/availability" element={<AvailabilityPage token={token} business={business} onUpdate={fetchBusiness} />} />
            <Route path="/blocked-dates" element={<BlockedDatesPage token={token} business={business} onUpdate={fetchBusiness} />} />
            <Route path="*" element={<BookingsView token={token} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// Bookings View Component
const BookingsView = ({ token }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API}/admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    
    try {
      await axios.delete(`${API}/admin/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Booking cancelled");
      fetchBookings();
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      toast.error("Failed to cancel booking");
    }
  };

  const upcomingBookings = bookings.filter(b => b.status === "confirmed" && new Date(b.date) >= new Date().setHours(0,0,0,0));
  const pastBookings = bookings.filter(b => b.status === "confirmed" && new Date(b.date) < new Date().setHours(0,0,0,0));
  const cancelledBookings = bookings.filter(b => b.status === "cancelled");

  return (
    <div className="space-y-6" data-testid="bookings-view">
      <div>
        <h1 className="text-2xl font-bold font-['Manrope']">Bookings</h1>
        <p className="text-muted-foreground">Manage your upcoming and past appointments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Upcoming</p>
            <p className="text-2xl font-bold">{upcomingBookings.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Past</p>
            <p className="text-2xl font-bold">{pastBookings.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Cancelled</p>
            <p className="text-2xl font-bold">{cancelledBookings.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{bookings.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming bookings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4"
                  data-testid={`booking-${booking.id}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{booking.service_name}</h4>
                      <Badge variant="outline">{booking.date}</Badge>
                      <Badge variant="secondary">{booking.start_time}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {booking.customer_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {booking.customer_email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {booking.customer_phone}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleCancel(booking.id)}
                    data-testid={`cancel-booking-${booking.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Past Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastBookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4 opacity-60"
                  data-testid={`past-booking-${booking.id}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{booking.service_name}</h4>
                      <Badge variant="outline">{booking.date}</Badge>
                      <Badge variant="secondary">{booking.start_time}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{booking.customer_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
