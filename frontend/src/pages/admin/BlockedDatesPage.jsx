import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
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
      toast.error("Please select a date");
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    
    if (blockedDates.includes(dateStr)) {
      toast.error("This date is already blocked");
      return;
    }

    try {
      await axios.post(`${API}/admin/blocked-dates`, {
        date: dateStr
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBlockedDates([...blockedDates, dateStr].sort());
      setSelectedDate(null);
      toast.success("Date blocked!");
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to block date:", error);
      toast.error("Failed to block date");
    }
  };

  const handleUnblockDate = async (dateStr) => {
    try {
      await axios.delete(`${API}/admin/blocked-dates/${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBlockedDates(blockedDates.filter(d => d !== dateStr));
      toast.success("Date unblocked");
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to unblock date:", error);
      toast.error("Failed to unblock date");
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
      <div className="space-y-6 max-w-4xl" data-testid="blocked-dates-page-loading">
        <div>
          <h1 className="text-2xl font-bold font-heading">Blocked Dates</h1>
          <p className="text-muted-foreground text-sm mt-1">Block dates when you're unavailable</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-80 bg-zinc-100 rounded-xl animate-pulse" />
          <div className="h-80 bg-zinc-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl" data-testid="blocked-dates-page">
      <div>
        <h1 className="text-2xl font-bold font-heading">Blocked Dates</h1>
        <p className="text-muted-foreground text-sm mt-1">Block dates when you're unavailable</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-heading">Select Date</CardTitle>
            <CardDescription>
              Click a date to select it for blocking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={isDateDisabled}
                modifiers={{
                  blocked: (date) => isDateBlocked(date)
                }}
                modifiersStyles={{
                  blocked: { 
                    backgroundColor: "hsl(var(--destructive))", 
                    color: "hsl(var(--destructive-foreground))",
                    borderRadius: "8px"
                  }
                }}
                className="rounded-xl border-0 p-0"
                classNames={{
                  months: "space-y-4",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-semibold",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-zinc-100 rounded-lg transition-all",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]",
                  row: "flex w-full mt-1",
                  cell: "h-10 w-10 text-center text-sm p-0 relative",
                  day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-zinc-100 rounded-lg transition-all",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary",
                  day_today: "bg-zinc-100 text-foreground",
                  day_disabled: "text-muted-foreground opacity-50",
                }}
                data-testid="blocked-dates-calendar"
              />
            </div>
            <Button
              onClick={handleBlockDate}
              disabled={!selectedDate}
              className="w-full rounded-lg"
              data-testid="block-date-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Block Selected Date
            </Button>
          </CardContent>
        </Card>

        {/* Blocked Dates List */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-heading">Blocked Dates</CardTitle>
            <CardDescription>
              {blockedDates.length} date{blockedDates.length !== 1 ? 's' : ''} blocked
            </CardDescription>
          </CardHeader>
          <CardContent>
            {blockedDates.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No blocked dates</p>
                <p className="text-sm mt-1">Select dates from the calendar to block</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {blockedDates.map((dateStr) => (
                  <div
                    key={dateStr}
                    className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors group"
                    data-testid={`blocked-date-${dateStr}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                        <CalendarOff className="w-4 h-4 text-destructive" />
                      </div>
                      <span className="font-medium text-sm">
                        {format(new Date(dateStr), "EEEE, MMM d, yyyy")}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                      onClick={() => handleUnblockDate(dateStr)}
                      data-testid={`unblock-${dateStr}`}
                    >
                      <X className="w-4 h-4" />
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
