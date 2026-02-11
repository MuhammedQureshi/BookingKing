import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, Clock } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_OPTIONS = [];
for (let h = 6; h < 23; h++) {
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
      toast.success("Availability saved!");
      setHasChanges(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to update availability:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl" data-testid="availability-page-loading">
        <div>
          <h1 className="text-2xl font-bold font-heading">Availability</h1>
          <p className="text-muted-foreground text-sm mt-1">Set your working hours</p>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="h-16 bg-zinc-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl" data-testid="availability-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Availability</h1>
          <p className="text-muted-foreground text-sm mt-1">Set your working hours</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || saving}
          className="rounded-lg shadow-lg shadow-primary/20"
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

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-3">
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
                  className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl transition-all ${
                    dayAvailability.enabled 
                      ? "bg-zinc-50" 
                      : "bg-zinc-100/50"
                  }`}
                  data-testid={`availability-${day.toLowerCase()}`}
                >
                  <div className="flex items-center gap-4 sm:w-36">
                    <Switch
                      checked={dayAvailability.enabled}
                      onCheckedChange={(checked) => updateDay(index, "enabled", checked)}
                      data-testid={`toggle-${day.toLowerCase()}`}
                    />
                    <Label className={`font-medium text-sm ${!dayAvailability.enabled && "text-muted-foreground"}`}>
                      {day}
                    </Label>
                  </div>

                  {dayAvailability.enabled ? (
                    <div className="flex items-center gap-3 flex-1">
                      <Select
                        value={dayAvailability.start_time}
                        onValueChange={(value) => updateDay(index, "start_time", value)}
                      >
                        <SelectTrigger className="w-28 h-10 rounded-lg bg-white" data-testid={`start-time-${day.toLowerCase()}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground text-sm">to</span>
                      <Select
                        value={dayAvailability.end_time}
                        onValueChange={(value) => updateDay(index, "end_time", value)}
                      >
                        <SelectTrigger className="w-28 h-10 rounded-lg bg-white" data-testid={`end-time-${day.toLowerCase()}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
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
