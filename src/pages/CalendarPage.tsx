import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CalendarEvent {
  day: number;
  time: string;
  student: string;
  status: "confirmed" | "cancelled" | "no-show";
}

const events: CalendarEvent[] = [
  { day: 23, time: "10:00", student: "Emma Thompson", status: "confirmed" },
  { day: 23, time: "11:00", student: "Oliver Chen", status: "confirmed" },
  { day: 23, time: "14:00", student: "Sophie Williams", status: "confirmed" },
  { day: 23, time: "15:30", student: "James Patel", status: "confirmed" },
  { day: 24, time: "10:00", student: "Amelia Roberts", status: "confirmed" },
  { day: 24, time: "11:00", student: "Lucas Brown", status: "cancelled" },
  { day: 25, time: "10:00", student: "Emma Thompson", status: "confirmed" },
  { day: 25, time: "14:00", student: "Oliver Chen", status: "confirmed" },
  { day: 26, time: "15:00", student: "Sophie Williams", status: "no-show" },
  { day: 27, time: "10:00", student: "James Patel", status: "confirmed" },
  { day: 28, time: "11:00", student: "Amelia Roberts", status: "confirmed" },
];

const statusStyles = {
  confirmed: "bg-green-50 border-green-200 text-green-800",
  cancelled: "bg-muted border-border text-muted-foreground line-through",
  "no-show": "bg-red-50 border-red-200 text-red-700",
};

const CalendarPage = () => {
  const [currentMonth] = useState("February 2026");
  
  // Build a simple month grid for Feb 2026 (starts on Sunday, 28 days)
  // Feb 1 2026 is a Sunday => offset 6 in Mon-start grid
  const daysInMonth = 28;
  const startOffset = 6; // Sunday = 6 in Mon-start week
  const totalCells = Math.ceil((daysInMonth + startOffset) / 7) * 7;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">Track attendance, cancellations, and no-shows.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon"><ChevronLeft size={18} /></Button>
          <span className="font-heading font-semibold text-lg min-w-[160px] text-center">{currentMonth}</span>
          <Button variant="outline" size="icon"><ChevronRight size={18} /></Button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Confirmed ({events.filter(e => e.status === 'confirmed').length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted-foreground" />
          <span>Cancelled ({events.filter(e => e.status === 'cancelled').length})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span>No-show ({events.filter(e => e.status === 'no-show').length})</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="grid grid-cols-7 border-b border-border">
            {daysOfWeek.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-3 uppercase tracking-wide">
                {day}
              </div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7">
            {Array.from({ length: totalCells }).map((_, i) => {
              const dayNum = i - startOffset + 1;
              const isValid = dayNum >= 1 && dayNum <= daysInMonth;
              const isToday = dayNum === 23;
              const dayEvents = events.filter(e => e.day === dayNum);
              
              return (
                <div 
                  key={i} 
                  className={`min-h-[100px] border-b border-r border-border p-2 ${
                    !isValid ? 'bg-muted/30' : isToday ? 'bg-accent/10' : ''
                  }`}
                >
                  {isValid && (
                    <>
                      <span className={`text-sm font-medium ${isToday ? 'bg-gradient-gold text-charcoal w-7 h-7 rounded-full flex items-center justify-center' : 'text-foreground'}`}>
                        {dayNum}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayEvents.map((ev, j) => (
                          <div key={j} className={`text-xs px-1.5 py-1 rounded border ${statusStyles[ev.status]} truncate`}>
                            {ev.time} {ev.student.split(' ')[0]}
                          </div>
                        ))}
                      </div>
                    </>
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

export default CalendarPage;
