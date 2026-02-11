import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BookingWidget from "@/components/BookingWidget";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Users, 
  Zap, 
  Shield, 
  Smartphone,
  ArrowRight,
  Check,
  Star,
  Play,
  ChevronRight,
  Sparkles,
  Globe,
  Bell,
  BarChart3
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LandingPage = () => {
  const navigate = useNavigate();
  const [demoBusinessId, setDemoBusinessId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFeature, setActiveFeature] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    initDemo();
    
    // Feature rotation
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  const initDemo = async () => {
    try {
      const response = await axios.post(`${API}/admin/register`, {
        business_name: "Luxe Studio",
        description: "Premium beauty & wellness",
        email: "demo@bookingwidget.com",
        password: "demo123"
      });
      
      const businessId = response.data.business_id;
      const token = response.data.token;
      setDemoBusinessId(businessId);
      
      await Promise.all([
        axios.post(`${API}/admin/services`, {
          name: "Signature Haircut",
          duration: 45,
          description: "Precision cut with styling",
          price: 65
        }, { headers: { Authorization: `Bearer ${token}` } }),
        axios.post(`${API}/admin/services`, {
          name: "Color Treatment",
          duration: 90,
          description: "Full color or highlights",
          price: 120
        }, { headers: { Authorization: `Bearer ${token}` } }),
        axios.post(`${API}/admin/services`, {
          name: "Express Blowout",
          duration: 30,
          description: "Quick style refresh",
          price: 40
        }, { headers: { Authorization: `Bearer ${token}` } })
      ]);
    } catch {
      try {
        const loginResponse = await axios.post(`${API}/admin/login`, {
          email: "demo@bookingwidget.com",
          password: "demo123"
        });
        setDemoBusinessId(loginResponse.data.business_id);
      } catch (e) {
        console.error("Demo init failed:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Sub-second load times. Your customers book in under 60 seconds.",
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
    {
      icon: Shield,
      title: "No Double Bookings",
      description: "Smart conflict detection ensures every slot is unique.",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      icon: Smartphone,
      title: "Mobile Perfect",
      description: "Optimized for thumb-friendly booking on any device.",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      icon: Globe,
      title: "Embed Anywhere",
      description: "One line of code. Works on any website platform.",
      color: "text-violet-500",
      bg: "bg-violet-500/10"
    }
  ];

  const stats = [
    { value: "10k+", label: "Bookings Made" },
    { value: "500+", label: "Businesses" },
    { value: "99.9%", label: "Uptime" },
    { value: "<1s", label: "Load Time" }
  ];

  const testimonials = [
    {
      quote: "This widget transformed how we handle appointments. Our no-shows dropped by 40%.",
      author: "Sarah Chen",
      role: "Owner, Bloom Salon",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
    },
    {
      quote: "Setup took 5 minutes. Now our clients book 24/7 without us lifting a finger.",
      author: "Marcus Rivera",
      role: "Founder, Peak Fitness",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
    },
    {
      quote: "Clean, professional, and exactly what our brand needed. Highly recommended.",
      author: "Emily Watson",
      role: "Director, Tranquil Spa",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-white" data-testid="landing-page">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl font-heading">Appointly</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/admin/login")}
                className="hidden sm:inline-flex"
                data-testid="nav-login-button"
              >
                Log in
              </Button>
              <Button 
                onClick={() => navigate("/admin/login")}
                className="rounded-full px-6"
                data-testid="nav-cta-button"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Content */}
            <div className="text-center lg:text-left">
              <Badge variant="secondary" className="mb-6 animate-fade-down">
                <Sparkles className="w-3 h-3 mr-1" />
                Now with email confirmations
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-heading animate-fade-up">
                Booking made
                <span className="block mt-2 gradient-text">beautifully simple</span>
              </h1>
              
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 animate-fade-up delay-100">
                The embeddable widget that lets your customers book appointments in seconds. 
                No friction. No learning curve. Just bookings.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-up delay-200">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/admin/login")}
                  className="rounded-full px-8 h-12 text-base btn-press"
                  data-testid="hero-cta-button"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="rounded-full px-8 h-12 text-base"
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="hero-demo-button"
                >
                  <Play className="w-4 h-4 mr-2" />
                  See it in action
                </Button>
              </div>
              
              {/* Social Proof */}
              <div className="mt-12 flex items-center gap-6 justify-center lg:justify-start animate-fade-up delay-300">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i} 
                      className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center text-xs font-medium"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Loved by <span className="text-foreground font-semibold">500+</span> businesses
                  </p>
                </div>
              </div>
            </div>
            
            {/* Right: Widget Preview */}
            <div className="relative animate-fade-up delay-200" id="demo">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-primary/5 rounded-3xl transform rotate-2" />
              <div className="relative animate-float">
                {loading ? (
                  <div className="w-full max-w-[440px] mx-auto h-[500px] bg-white rounded-2xl shadow-2xl shimmer" />
                ) : demoBusinessId ? (
                  <div className="transform hover:scale-[1.02] transition-transform duration-500">
                    <BookingWidget businessId={demoBusinessId} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl sm:text-5xl font-bold font-heading">{stat.value}</div>
                <div className="text-sm text-primary-foreground/70 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading">
              Everything you need to succeed
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features that help you convert visitors into booked customers
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i}
                className={`group p-6 rounded-2xl bg-white border border-border/50 hover-lift cursor-pointer transition-all ${
                  activeFeature === i ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
                onMouseEnter={() => setActiveFeature(i)}
                data-testid={`feature-card-${i}`}
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-lg font-heading mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
          
          {/* Extended Features */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {[
              { icon: Bell, title: "Email Notifications", desc: "Automatic confirmations to customers and your team" },
              { icon: BarChart3, title: "Smart Scheduling", desc: "Availability based on your business hours" },
              { icon: Users, title: "Multi-Client", desc: "One dashboard for all your business locations" }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-6 rounded-xl bg-white border border-border/50">
                <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold font-heading mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">How it Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading">
              Up and running in minutes
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: "01",
                title: "Create Account",
                description: "Sign up and add your services, availability, and business details."
              },
              {
                step: "02",
                title: "Embed Widget",
                description: "Copy one line of code and paste it anywhere on your website."
              },
              {
                step: "03",
                title: "Accept Bookings",
                description: "Customers book instantly. You get notified. Everyone's happy."
              }
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-[2px] bg-gradient-to-r from-border to-transparent -translate-x-8" />
                )}
                <div className="text-6xl font-bold text-primary/10 font-heading mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold font-heading mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading">
              Trusted by businesses worldwide
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-border/50 hover-lift" data-testid={`testimonial-${i}`}>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">"{item.quote}"</p>
                <div className="flex items-center gap-3">
                  <img 
                    src={item.avatar} 
                    alt={item.author}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-sm">{item.author}</div>
                    <div className="text-sm text-muted-foreground">{item.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading mb-6">
            Ready to transform your booking experience?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of businesses already using Appointly. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate("/admin/login")}
              className="rounded-full px-10 h-14 text-lg btn-press"
              data-testid="cta-button"
            >
              Get Started Free
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required • Free 14-day trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold font-heading">Appointly</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
              <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Appointly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
