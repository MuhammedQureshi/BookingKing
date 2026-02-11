import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    business_name: "",
    description: "",
    email: "",
    password: ""
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API}/admin/login`, loginData);
      
      // Store auth data
      localStorage.setItem("booking_token", response.data.token);
      localStorage.setItem("booking_business_id", response.data.business_id);
      localStorage.setItem("booking_business_name", response.data.business_name);
      
      toast.success("Login successful!");
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerData.business_name || !registerData.email || !registerData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API}/admin/register`, registerData);
      
      // Store auth data
      localStorage.setItem("booking_token", response.data.token);
      localStorage.setItem("booking_business_id", response.data.business_id);
      localStorage.setItem("booking_business_name", response.data.business_name);
      
      toast.success("Registration successful!");
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error(error.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col" data-testid="admin-login-page">
      {/* Header */}
      <header className="p-4">
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-testid="back-to-demo"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to demo
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold font-['Manrope']">Admin Panel</CardTitle>
            <CardDescription>
              Manage your bookings, services, and availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
                <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4" data-testid="login-form">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      data-testid="login-email-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      data-testid="login-password-input"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-full"
                    disabled={loading}
                    data-testid="login-submit-button"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4" data-testid="register-form">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Business Name *</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Your Business Name"
                      value={registerData.business_name}
                      onChange={(e) => setRegisterData({ ...registerData, business_name: e.target.value })}
                      required
                      data-testid="register-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-description">Description</Label>
                    <Input
                      id="register-description"
                      type="text"
                      placeholder="Brief description of your business"
                      value={registerData.description}
                      onChange={(e) => setRegisterData({ ...registerData, description: e.target.value })}
                      data-testid="register-description-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email *</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="you@example.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      data-testid="register-email-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password *</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      data-testid="register-password-input"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-full"
                    disabled={loading}
                    data-testid="register-submit-button"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminLogin;
