import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newService.name || !newService.duration) {
      toast.error("Fill in required fields");
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
      toast.error("Failed to add service");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("Delete this service?")) return;

    try {
      await axios.delete(`${API}/admin/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Service deleted");
      fetchServices();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-4" data-testid="services-page">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading">Services</h1>
          <p className="text-muted-foreground text-sm">What you offer</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="shrink-0" data-testid="add-service-button">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Add Service</DialogTitle>
              <DialogDescription>Create a bookable service</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddService} className="space-y-4 mt-2">
              <div>
                <Label htmlFor="name" className="text-sm">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Haircut"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="h-10 mt-1"
                  required
                  data-testid="service-name-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="duration" className="text-sm">Duration (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    step="15"
                    value={newService.duration}
                    onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                    className="h-10 mt-1"
                    required
                    data-testid="service-duration-input"
                  />
                </div>
                <div>
                  <Label htmlFor="price" className="text-sm">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                    className="h-10 mt-1"
                    data-testid="service-price-input"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description" className="text-sm">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  className="h-10 mt-1"
                  data-testid="service-description-input"
                />
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting} data-testid="submit-service-button">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-16 bg-zinc-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No services yet</p>
              <p className="text-xs mt-1">Add your first service</p>
            </div>
          ) : (
            <div className="space-y-2">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg group"
                  data-testid={`service-${service.id}`}
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm truncate">{service.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {service.duration}m
                      </span>
                      {service.price && (
                        <span className="flex items-center gap-0.5 text-xs font-medium">
                          <DollarSign className="w-3 h-3" />
                          {service.price}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive hover:text-destructive"
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
