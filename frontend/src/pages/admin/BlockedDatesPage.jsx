import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarOff, X, Plus } from "lucide-react";
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
      toast.success("Date blocked successfully");
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
      <div className="space-y-6" data-testid="blocked-dates-page-loading">
        <div>
          <h1 className="text-2xl font-bold font-['Manrope']">Blocked Dates</h1>
          <p className="text-muted-foreground">Block specific dates when you're not available</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-80 bg-muted/50 rounded-lg animate-pulse" />
          <div className="h-80 bg-muted/50 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="blocked-dates-page">
      <div>
        <h1 className="text-2xl font-bold font-['Manrope']">Blocked Dates</h1>
        <p className="text-muted-foreground">Block specific dates when you're not available</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Date to Block</CardTitle>
            <CardDescription>
              Click on a date to select it, then click "Block Date"
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
                    borderRadius: "50%"
                  }
                }}
                className="rounded-lg border p-3"
                data-testid="blocked-dates-calendar"
              />
            </div>
            <Button
              onClick={handleBlockDate}
              disabled={!selectedDate}
              className="w-full rounded-full"
              data-testid="block-date-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Block Selected Date
            </Button>
          </CardContent>
        </Card>

        {/* Blocked Dates List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Blocked Dates</CardTitle>
            <CardDescription>
              {blockedDates.length} date{blockedDates.length !== 1 ? 's' : ''} blocked
            </CardDescription>
          </CardHeader>
          <CardContent>
            {blockedDates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No blocked dates</p>
                <p className="text-sm">Select dates from the calendar to block them</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {blockedDates.map((dateStr) => (
                  <div
                    key={dateStr}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    data-testid={`blocked-date-${dateStr}`}
                  >
                    <div className="flex items-center gap-2">
                      <CalendarOff className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(dateStr), "EEEE, MMMM d, yyyy")}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
