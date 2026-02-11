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
  LogOut,
  CalendarOff,
  Copy,
  User,
  Mail,
  Phone,
  Trash2,
  Code,
  Check,
  ExternalLink,
  Menu,
  X
} from "lucide-react";
import ServicesPage from "./admin/ServicesPage";
import AvailabilityPage from "./admin/AvailabilityPage";
import BlockedDatesPage from "./admin/BlockedDatesPage";
import EmbedPage from "./admin/EmbedPage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const navItems = [
    { path: "/admin/dashboard", label: "Bookings", icon: List },
    { path: "/admin/services", label: "Services", icon: Clock },
    { path: "/admin/availability", label: "Availability", icon: Calendar },
    { path: "/admin/blocked-dates", label: "Blocked Dates", icon: CalendarOff },
    { path: "/admin/embed", label: "Embed Widget", icon: Code }
  ];

  const isActive = (path) => location.pathname === path;

  if (!token) return null;

  return (
    <div className="min-h-screen bg-zinc-50" data-testid="admin-dashboard">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-2 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm truncate max-w-[150px]">{businessName}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="mobile-logout">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <nav className="absolute left-0 right-0 top-full bg-white border-b shadow-lg p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-zinc-100"
                }`}
                data-testid={`mobile-nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r fixed">
          <div className="p-6">
            <Link to="/" className="flex items-center gap-3 mb-8 group">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-bold font-heading text-base">{businessName}</h2>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </Link>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-zinc-100 hover:text-foreground"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-4 lg:p-8 min-h-screen">
          <Routes>
            <Route path="/dashboard" element={<BookingsView token={token} />} />
            <Route path="/services" element={<ServicesPage token={token} onUpdate={fetchBusiness} />} />
            <Route path="/availability" element={<AvailabilityPage token={token} business={business} onUpdate={fetchBusiness} />} />
            <Route path="/blocked-dates" element={<BlockedDatesPage token={token} business={business} onUpdate={fetchBusiness} />} />
            <Route path="/embed" element={<EmbedPage businessId={businessId} />} />
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
    <div className="space-y-6 max-w-5xl" data-testid="bookings-view">
      <div>
        <h1 className="text-2xl font-bold font-heading">Bookings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your appointments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Upcoming", value: upcomingBookings.length, color: "text-emerald-600" },
          { label: "Completed", value: pastBookings.length, color: "text-blue-600" },
          { label: "Cancelled", value: cancelledBookings.length, color: "text-zinc-400" },
          { label: "Total", value: bookings.length, color: "text-foreground" }
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
              <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bookings List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-heading">Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-zinc-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No upcoming bookings</p>
              <p className="text-sm mt-1">New bookings will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50 rounded-xl gap-4 hover:bg-zinc-100 transition-colors"
                  data-testid={`booking-${booking.id}`}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold">{booking.service_name}</h4>
                      <Badge variant="secondary" className="font-normal">{booking.date}</Badge>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{booking.start_time}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {booking.customer_name}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        {booking.customer_email}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        {booking.customer_phone}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleCancel(booking.id)}
                    data-testid={`cancel-booking-${booking.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
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
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-heading">Past Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastBookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50/50 rounded-xl gap-4 opacity-60"
                  data-testid={`past-booking-${booking.id}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{booking.service_name}</h4>
                      <Badge variant="outline" className="font-normal">{booking.date}</Badge>
                      <Badge variant="outline">{booking.start_time}</Badge>
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
