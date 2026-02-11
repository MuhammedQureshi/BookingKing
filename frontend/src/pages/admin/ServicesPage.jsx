import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Clock, Trash2, Loader2 } from "lucide-react";

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

      toast.success("Service added successfully");
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
    <div className="space-y-6" data-testid="services-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Manrope']">Services</h1>
          <p className="text-muted-foreground">Manage the services you offer</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full" data-testid="add-service-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>
                Create a new service that customers can book
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddService} className="space-y-4" data-testid="add-service-form">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Haircut"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  required
                  data-testid="service-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  step="15"
                  placeholder="30"
                  value={newService.duration}
                  onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                  required
                  data-testid="service-duration-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the service"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  data-testid="service-description-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  data-testid="service-price-input"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} data-testid="submit-service-button">
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

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No services yet</p>
              <p className="text-sm">Add your first service to start accepting bookings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`service-${service.id}`}
                >
                  <div>
                    <h4 className="font-medium">{service.name}</h4>
                    {service.description && (
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {service.duration} min
                      </span>
                      {service.price && (
                        <span className="font-medium text-foreground">${service.price}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
