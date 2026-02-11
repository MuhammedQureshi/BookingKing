import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BookingWidget from "@/components/BookingWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Settings, Code, Sparkles, ArrowRight, Copy, Check } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DemoPage = () => {
  const navigate = useNavigate();
  const [demoBusinessId, setDemoBusinessId] = useState(null);
  const [customBusinessId, setCustomBusinessId] = useState("");
  const [activeBusinessId, setActiveBusinessId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOrCreateDemoBusiness();
  }, []);

  const checkOrCreateDemoBusiness = async () => {
    try {
      setLoading(true);
      // Try to register a demo business
      const response = await axios.post(`${API}/admin/register`, {
        business_name: "Demo Salon",
        description: "A demo booking experience",
        email: "demo@bookingwidget.com",
        password: "demo123"
      });
      
      const businessId = response.data.business_id;
      setDemoBusinessId(businessId);
      setActiveBusinessId(businessId);
      
      // Add demo services
      const token = response.data.token;
      await Promise.all([
        axios.post(`${API}/admin/services`, {
          name: "Haircut",
          duration: 30,
          description: "Classic haircut and styling",
          price: 35
        }, { headers: { Authorization: `Bearer ${token}` } }),
        axios.post(`${API}/admin/services`, {
          name: "Consultation",
          duration: 60,
          description: "One-on-one consultation session",
          price: 75
        }, { headers: { Authorization: `Bearer ${token}` } }),
        axios.post(`${API}/admin/services`, {
          name: "Express Trim",
          duration: 15,
          description: "Quick trim and touch-up",
          price: 20
        }, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
    } catch (error) {
      // Business might already exist, try to login
      try {
        const loginResponse = await axios.post(`${API}/admin/login`, {
          email: "demo@bookingwidget.com",
          password: "demo123"
        });
        setDemoBusinessId(loginResponse.data.business_id);
        setActiveBusinessId(loginResponse.data.business_id);
      } catch (loginError) {
        console.error("Could not create or login to demo business:", loginError);
        toast.error("Failed to load demo. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCustomBusinessLoad = () => {
    if (customBusinessId.trim()) {
      setActiveBusinessId(customBusinessId.trim());
      toast.success("Widget loaded with custom business ID");
    }
  };

  const copyEmbedCode = () => {
    const code = `<div id="booking-widget"></div>
<script src="${window.location.origin}/booking-embed.js" 
  data-business-id="${activeBusinessId}"
  data-primary-color="#18181b">
</script>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Embed code copied!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100" data-testid="demo-page">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg font-['Manrope']">BookingWidget</span>
            </div>
            <Button 
              onClick={() => navigate("/admin/login")}
              variant="outline"
              className="rounded-full"
              data-testid="admin-login-button"
            >
              <Settings className="w-4 h-4 mr-2" />
              Admin Panel
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground font-['Manrope'] mb-4">
              Embeddable Booking Widget
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A lightweight, customizable booking system that integrates seamlessly into any website. 
              Try it live below.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Widget Preview */}
            <div className="order-2 lg:order-1">
              <div className="sticky top-24">
                {loading ? (
                  <div className="w-full max-w-[480px] mx-auto h-[600px] bg-muted/30 rounded-xl animate-pulse" />
                ) : activeBusinessId ? (
                  <BookingWidget businessId={activeBusinessId} />
                ) : (
                  <Card className="max-w-[480px] mx-auto">
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">Enter a business ID to load the widget</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="order-1 lg:order-2 space-y-6">
              {/* Try with custom business */}
              <Card data-testid="custom-business-card">
                <CardHeader>
                  <CardTitle className="text-lg font-['Manrope']">Load Different Business</CardTitle>
                  <CardDescription>
                    Enter a business ID to preview how the widget looks for different clients
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="businessId">Business ID</Label>
                    <div className="flex gap-2 mt-1.5">
                      <Input
                        id="businessId"
                        placeholder="Enter business ID..."
                        value={customBusinessId}
                        onChange={(e) => setCustomBusinessId(e.target.value)}
                        data-testid="custom-business-input"
                      />
                      <Button 
                        onClick={handleCustomBusinessLoad}
                        data-testid="load-business-button"
                      >
                        Load
                      </Button>
                    </div>
                  </div>
                  {demoBusinessId && (
                    <Button
                      variant="link"
                      className="px-0 text-sm"
                      onClick={() => {
                        setActiveBusinessId(demoBusinessId);
                        setCustomBusinessId("");
                      }}
                      data-testid="reset-demo-button"
                    >
                      Reset to demo business
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Embed Code */}
              <Card data-testid="embed-code-card">
                <CardHeader>
                  <CardTitle className="text-lg font-['Manrope'] flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Embed Code
                  </CardTitle>
                  <CardDescription>
                    Copy this code to embed the widget on your website
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{`<div id="booking-widget"></div>
<script 
  src="${window.location.origin}/booking-embed.js" 
  data-business-id="${activeBusinessId || 'YOUR_BUSINESS_ID'}"
  data-primary-color="#18181b">
</script>`}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={copyEmbedCode}
                      disabled={!activeBusinessId}
                      data-testid="copy-embed-button"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* React Component Usage */}
              <Card data-testid="react-usage-card">
                <CardHeader>
                  <CardTitle className="text-lg font-['Manrope']">React Component</CardTitle>
                  <CardDescription>
                    Import and use as a React component in your app
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`import { BookingWidget } from '@your-package/booking-widget';

<BookingWidget 
  businessId="${activeBusinessId || 'YOUR_BUSINESS_ID'}"
  primaryColor="#18181b"
/>`}</code>
                  </pre>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg font-['Manrope'] mb-2">
                    Ready to get started?
                  </h3>
                  <p className="text-primary-foreground/80 text-sm mb-4">
                    Create your business account and start accepting bookings today.
                  </p>
                  <Button
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => navigate("/admin/login")}
                    data-testid="get-started-button"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center font-['Manrope'] mb-12">
            Why Choose Our Booking Widget?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Lightweight",
                description: "Minimal footprint that won't slow down your website"
              },
              {
                title: "Customizable",
                description: "Easy color theming to match your brand identity"
              },
              {
                title: "Mobile-First",
                description: "Beautiful experience on any device size"
              },
              {
                title: "No Double Bookings",
                description: "Smart conflict detection prevents scheduling issues"
              },
              {
                title: "Email Notifications",
                description: "Automatic confirmations to customers and owners"
              },
              {
                title: "Easy Embed",
                description: "Works with React, Next.js, or any HTML website"
              }
            ].map((feature, i) => (
              <div key={i} className="text-center p-6">
                <h3 className="font-semibold text-lg mb-2 font-['Manrope']">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground">
            Built with React + FastAPI + MongoDB
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DemoPage;
