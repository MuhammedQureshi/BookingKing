import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Clock, Trash2, Loader2, DollarSign } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ServicesPage = ({ token, onUpdate }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    duration: 30,
    description: "",
    price: ""
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/admin/business`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServices(response.data.services || []);
    } catch (error) {
      console.error("Failed to fetch services:", error);
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newService.name || !newService.duration) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`${API}/admin/services`, {
        name: newService.name,
        duration: parseInt(newService.duration),
        description: newService.description || "",
        price: newService.price ? parseFloat(newService.price) : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Service added!");
      setDialogOpen(false);
      setNewService({ name: "", duration: 30, description: "", price: "" });
      fetchServices();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to add service:", error);
      toast.error(error.response?.data?.detail || "Failed to add service");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;

    try {
      await axios.delete(`${API}/admin/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Service deleted");
      fetchServices();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to delete service:", error);
      toast.error("Failed to delete service");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl" data-testid="services-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Services</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage what you offer</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-lg shadow-lg shadow-primary/20" data-testid="add-service-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Add New Service</DialogTitle>
              <DialogDescription>
                Create a service that customers can book
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddService} className="space-y-4 mt-4" data-testid="add-service-form">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Service Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Haircut, Consultation"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="h-11 rounded-lg"
                  required
                  data-testid="service-name-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-sm font-medium">Duration (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    step="15"
                    placeholder="30"
                    value={newService.duration}
                    onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                    className="h-11 rounded-lg"
                    required
                    data-testid="service-duration-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                    className="h-11 rounded-lg"
                    data-testid="service-price-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Brief description"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="h-11 rounded-lg"
                  data-testid="service-description-input"
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="rounded-lg" data-testid="submit-service-button">
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Service"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-zinc-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No services yet</p>
              <p className="text-sm mt-1">Add your first service to start accepting bookings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors group"
                  data-testid={`service-${service.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">{service.name}</h4>
                    {service.description && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{service.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white px-2 py-1 rounded-md">
                        <Clock className="w-3 h-3" />
                        {service.duration} min
                      </span>
                      {service.price && (
                        <span className="flex items-center gap-1 text-xs font-medium text-foreground bg-white px-2 py-1 rounded-md">
                          <DollarSign className="w-3 h-3" />
                          {service.price}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                    onClick={() => handleDeleteService(service.id)}
                    data-testid={`delete-service-${service.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServicesPage;
