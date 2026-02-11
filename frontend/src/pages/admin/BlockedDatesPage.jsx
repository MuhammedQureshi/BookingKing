import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { CalendarOff, X, Plus, CalendarDays } from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BlockedDatesPage = ({ token, business, onUpdate }) => {
  const [blockedDates, setBlockedDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (business) {
      setBlockedDates(business.blocked_dates || []);
      setLoading(false);
    }
  }, [business]);

  const handleBlockDate = async () => {
    if (!selectedDate) {
      toast.error("Select a date");
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    
    if (blockedDates.includes(dateStr)) {
      toast.error("Already blocked");
      return;
    }

    try {
      await axios.post(`${API}/admin/blocked-dates`, { date: dateStr }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBlockedDates([...blockedDates, dateStr].sort());
      setSelectedDate(null);
      toast.success("Date blocked!");
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to block date");
    }
  };

  const handleUnblockDate = async (dateStr) => {
    try {
      await axios.delete(`${API}/admin/blocked-dates/${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBlockedDates(blockedDates.filter(d => d !== dateStr));
      toast.success("Unblocked");
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to unblock");
    }
  };

  const isDateDisabled = (date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  const isDateBlocked = (date) => {
    return blockedDates.includes(format(date, "yyyy-MM-dd"));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading">Blocked Dates</h1>
          <p className="text-muted-foreground text-sm">Unavailable days</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="h-72 bg-zinc-100 rounded-xl animate-pulse" />
          <div className="h-72 bg-zinc-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="blocked-dates-page">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-heading">Blocked Dates</h1>
        <p className="text-muted-foreground text-sm">Unavailable days</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Calendar */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 px-4">
            <CardTitle className="text-base font-heading">Select Date</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex justify-center mb-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={isDateDisabled}
                modifiers={{ blocked: isDateBlocked }}
                modifiersStyles={{
                  blocked: { 
                    backgroundColor: "hsl(var(--destructive))", 
                    color: "hsl(var(--destructive-foreground))",
                    borderRadius: "8px"
                  }
                }}
                className="rounded-xl border-0 p-0"
                classNames={{
                  months: "space-y-3",
                  month: "space-y-3",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-semibold",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-zinc-100 rounded-lg",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.7rem]",
                  row: "flex w-full mt-1",
                  cell: "h-8 w-8 text-center text-xs p-0 relative",
                  day: "h-8 w-8 p-0 font-normal hover:bg-zinc-100 rounded-lg",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary",
                  day_today: "bg-zinc-100",
                  day_disabled: "text-muted-foreground opacity-50",
                }}
                data-testid="blocked-dates-calendar"
              />
            </div>
            <Button
              onClick={handleBlockDate}
              disabled={!selectedDate}
              className="w-full"
              size="sm"
              data-testid="block-date-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Block Date
            </Button>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 px-4">
            <CardTitle className="text-base font-heading">Blocked ({blockedDates.length})</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {blockedDates.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No blocked dates</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {blockedDates.map((dateStr) => (
                  <div
                    key={dateStr}
                    className="flex items-center justify-between p-2 bg-zinc-50 rounded-lg group"
                    data-testid={`blocked-date-${dateStr}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-destructive/10 flex items-center justify-center shrink-0">
                        <CalendarOff className="w-3.5 h-3.5 text-destructive" />
                      </div>
                      <span className="font-medium text-xs sm:text-sm truncate">
                        {format(new Date(dateStr), "MMM d, yyyy")}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => handleUnblockDate(dateStr)}
                      data-testid={`unblock-${dateStr}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BlockedDatesPage;
