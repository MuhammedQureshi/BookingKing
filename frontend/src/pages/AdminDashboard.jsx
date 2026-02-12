import { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  List,
  LogOut,
  CalendarOff,
  User,
  Mail,
  Phone,
  Trash2,
  Code,
  Menu,
  ChevronRight
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
    toast.success("Logged out");
  };

  const navItems = [
    { path: "/admin/dashboard", label: "Bookings", icon: List },
    { path: "/admin/services", label: "Services", icon: Clock },
    { path: "/admin/availability", label: "Availability", icon: Calendar },
    { path: "/admin/blocked-dates", label: "Blocked", icon: CalendarOff },
    { path: "/admin/embed", label: "Embed", icon: Code }
  ];

  const isActive = (path) => location.pathname === path;

  if (!token) return null;

  const NavContent = ({ onItemClick }) => (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onClick={onItemClick}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isActive(item.path)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-zinc-100 hover:text-foreground"
          }`}
          data-testid={`nav-${item.label.toLowerCase()}`}
        >
          <item.icon className="w-4 h-4 flex-shrink-0" />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-zinc-50" data-testid="admin-dashboard">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3 min-w-0">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 -ml-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-bold text-sm truncate">{businessName}</h2>
                      <p className="text-xs text-muted-foreground">Admin</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <NavContent onItemClick={() => setMobileMenuOpen(false)} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm truncate">{businessName}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="shrink-0">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-white border-r fixed">
          <div className="p-4">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-sm truncate">{businessName}</h2>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </Link>
            <NavContent />
          </div>
          <div className="mt-auto p-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground text-xs"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-56 p-4 lg:p-6 min-h-screen">
          <div className="max-w-4xl">
            <Routes>
              <Route path="/dashboard" element={<BookingsView token={token} />} />
              <Route path="/services" element={<ServicesPage token={token} onUpdate={fetchBusiness} />} />
              <Route path="/availability" element={<AvailabilityPage token={token} business={business} onUpdate={fetchBusiness} />} />
              <Route path="/blocked-dates" element={<BlockedDatesPage token={token} business={business} onUpdate={fetchBusiness} />} />
              <Route path="/embed" element={<EmbedPage businessId={businessId} />} />
              <Route path="*" element={<BookingsView token={token} />} />
            </Routes>
          </div>
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
    if (!window.confirm("Cancel this booking?")) return;
    
    try {
      await axios.delete(`${API}/admin/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Booking cancelled");
      fetchBookings();
    } catch (error) {
      toast.error("Failed to cancel");
    }
  };

  const upcomingBookings = bookings.filter(b => b.status === "confirmed" && new Date(b.date) >= new Date().setHours(0,0,0,0));
  const pastBookings = bookings.filter(b => b.status === "confirmed" && new Date(b.date) < new Date().setHours(0,0,0,0));

  return (
    <div className="space-y-4" data-testid="bookings-view">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-heading">Bookings</h1>
        <p className="text-muted-foreground text-sm">Manage appointments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Upcoming", value: upcomingBookings.length, color: "text-emerald-600" },
          { label: "Completed", value: pastBookings.length, color: "text-blue-600" },
          { label: "Cancelled", value: bookings.filter(b => b.status === "cancelled").length, color: "text-zinc-400" },
          { label: "Total", value: bookings.length, color: "text-foreground" }
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
              <p className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bookings List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="text-base font-heading">Upcoming</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-20 bg-zinc-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No upcoming bookings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-3 sm:p-4 bg-zinc-50 rounded-xl"
                  data-testid={`booking-${booking.id}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-sm">{booking.service_name}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5">{booking.date}</Badge>
                      <Badge className="bg-primary/10 text-primary text-[10px] px-1.5">{booking.start_time}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-7 px-2 -mr-2"
                      onClick={() => handleCancel(booking.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {booking.customer_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {booking.customer_phone}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
