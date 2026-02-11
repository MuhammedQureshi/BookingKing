import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
}

const AvailabilityPage = ({ token, business, onUpdate }) => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (business?.availability) {
      // Ensure all 7 days exist
      const fullAvailability = DAYS.map((_, index) => {
        const existing = business.availability.find(a => a.day === index);
        return existing || {
          day: index,
          start_time: "09:00",
          end_time: "17:00",
          enabled: false
        };
      });
      setAvailability(fullAvailability);
      setLoading(false);
    }
  }, [business]);

  const updateDay = (dayIndex, field, value) => {
    setAvailability(prev => prev.map(a => 
      a.day === dayIndex ? { ...a, [field]: value } : a
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.put(`${API}/admin/availability`, {
        availability: availability
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Availability updated");
      setHasChanges(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to update availability:", error);
      toast.error("Failed to update availability");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" data-testid="availability-page-loading">
        <div>
          <h1 className="text-2xl font-bold font-['Manrope']">Availability</h1>
          <p className="text-muted-foreground">Set your weekly working hours</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="availability-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-['Manrope']">Availability</h1>
          <p className="text-muted-foreground">Set your weekly working hours</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || saving}
          className="rounded-full"
          data-testid="save-availability-button"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {DAYS.map((day, index) => {
              const dayAvailability = availability.find(a => a.day === index) || {
                day: index,
                start_time: "09:00",
                end_time: "17:00",
                enabled: false
              };

              return (
                <div
                  key={day}
                  className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border transition-colors ${
                    dayAvailability.enabled ? "bg-card" : "bg-muted/30"
                  }`}
                  data-testid={`availability-${day.toLowerCase()}`}
                >
                  <div className="flex items-center gap-3 sm:w-32">
                    <Switch
                      checked={dayAvailability.enabled}
                      onCheckedChange={(checked) => updateDay(index, "enabled", checked)}
                      data-testid={`toggle-${day.toLowerCase()}`}
                    />
                    <Label className={`font-medium ${!dayAvailability.enabled && "text-muted-foreground"}`}>
                      {day}
                    </Label>
                  </div>

                  {dayAvailability.enabled && (
                    <div className="flex items-center gap-2 flex-1">
                      <Select
                        value={dayAvailability.start_time}
                        onValueChange={(value) => updateDay(index, "start_time", value)}
                      >
                        <SelectTrigger className="w-28" data-testid={`start-time-${day.toLowerCase()}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground">to</span>
                      <Select
                        value={dayAvailability.end_time}
                        onValueChange={(value) => updateDay(index, "end_time", value)}
                      >
                        <SelectTrigger className="w-28" data-testid={`end-time-${day.toLowerCase()}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {!dayAvailability.enabled && (
                    <span className="text-sm text-muted-foreground">Closed</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AvailabilityPage;
