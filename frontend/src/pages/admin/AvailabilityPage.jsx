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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
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
      const fullAvailability = DAYS_FULL.map((_, index) => {
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
      toast.success("Saved!");
      setHasChanges(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading">Availability</h1>
          <p className="text-muted-foreground text-sm">Working hours</p>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-2">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="h-12 bg-zinc-100 rounded-lg animate-pulse" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="availability-page">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading">Availability</h1>
          <p className="text-muted-foreground text-sm">Working hours</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || saving}
          size="sm"
          className="shrink-0"
          data-testid="save-availability-button"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Save</span>
            </>
          )}
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-2">
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
                  className={`flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg transition-colors ${
                    dayAvailability.enabled ? "bg-zinc-50" : "bg-zinc-100/50"
                  }`}
                  data-testid={`availability-${day.toLowerCase()}`}
                >
                  <Switch
                    checked={dayAvailability.enabled}
                    onCheckedChange={(checked) => updateDay(index, "enabled", checked)}
                    data-testid={`toggle-${day.toLowerCase()}`}
                  />
                  <Label className={`w-8 sm:w-10 text-xs sm:text-sm font-medium ${!dayAvailability.enabled && "text-muted-foreground"}`}>
                    {day}
                  </Label>

                  {dayAvailability.enabled ? (
                    <div className="flex items-center gap-1 sm:gap-2 flex-1">
                      <Select
                        value={dayAvailability.start_time}
                        onValueChange={(value) => updateDay(index, "start_time", value)}
                      >
                        <SelectTrigger className="h-8 text-xs w-[70px] sm:w-[80px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map(time => (
                            <SelectItem key={time} value={time} className="text-xs">{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground text-xs">-</span>
                      <Select
                        value={dayAvailability.end_time}
                        onValueChange={(value) => updateDay(index, "end_time", value)}
                      >
                        <SelectTrigger className="h-8 text-xs w-[70px] sm:w-[80px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map(time => (
                            <SelectItem key={time} value={time} className="text-xs">{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Closed</span>
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
