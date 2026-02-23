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

const statusDot = {
  confirmed: "bg-green-500",
  cancelled: "bg-muted-foreground",
  "no-show": "bg-destructive",
};

const statusStyles = {
  confirmed: "bg-green-50 border-green-200 text-green-800",
  cancelled: "bg-muted border-border text-muted-foreground line-through",
  "no-show": "bg-red-50 border-red-200 text-red-700",
};

const CalendarPage = () => {
  const [currentMonth] = useState("February 2026");
  const [selectedDay, setSelectedDay] = useState<number | null>(23);

  const daysInMonth = 28;
  const startOffset = 6;
  const totalCells = Math.ceil((daysInMonth + startOffset) / 7) * 7;

  const selectedEvents = selectedDay ? events.filter(e => e.day === selectedDay) : [];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <h1 className="font-heading text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground text-sm mt-1">Track attendance, cancellations, and no-shows.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8"><ChevronLeft size={16} /></Button>
          <span className="font-heading font-semibold text-base min-w-[140px] text-center">{currentMonth}</span>
          <Button variant="outline" size="icon" className="h-8 w-8"><ChevronRight size={16} /></Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span>Confirmed ({events.filter(e => e.status === 'confirmed').length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
          <span>Cancelled ({events.filter(e => e.status === 'cancelled').length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
          <span>No-show ({events.filter(e => e.status === 'no-show').length})</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-border">
            {daysOfWeek.map(day => (
              <div key={day} className="text-center text-[10px] sm:text-xs font-semibold text-muted-foreground py-2 sm:py-3 uppercase tracking-wide">
                {day.charAt(0)}<span className="hidden sm:inline">{day.slice(1)}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: totalCells }).map((_, i) => {
              const dayNum = i - startOffset + 1;
              const isValid = dayNum >= 1 && dayNum <= daysInMonth;
              const isToday = dayNum === 23;
              const isSelected = dayNum === selectedDay;
              const dayEvents = events.filter(e => e.day === dayNum);

              return (
                <div
                  key={i}
                  onClick={() => isValid && setSelectedDay(dayNum === selectedDay ? null : dayNum)}
                  className={`min-h-[52px] sm:min-h-[90px] border-b border-r border-border p-1 sm:p-2 cursor-pointer transition-colors ${
                    !isValid ? 'bg-muted/30 cursor-default' : isSelected ? 'bg-accent/20' : isToday ? 'bg-accent/10' : 'hover:bg-accent/5'
                  }`}
                >
                  {isValid && (
                    <>
                      <span className={`text-xs sm:text-sm font-medium inline-flex items-center justify-center ${
                        isToday ? 'bg-gradient-gold text-charcoal w-6 h-6 sm:w-7 sm:h-7 rounded-full' : 'text-foreground'
                      }`}>
                        {dayNum}
                      </span>
                      {/* Desktop: show event labels */}
                      <div className="hidden sm:block mt-1 space-y-1">
                        {dayEvents.map((ev, j) => (
                          <div key={j} className={`text-xs px-1.5 py-0.5 rounded border ${statusStyles[ev.status]} truncate`}>
                            {ev.time} {ev.student.split(' ')[0]}
                          </div>
                        ))}
                      </div>
                      {/* Mobile: show dots only */}
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 mt-1 sm:hidden flex-wrap">
                          {dayEvents.map((ev, j) => (
                            <div key={j} className={`w-1.5 h-1.5 rounded-full ${statusDot[ev.status]}`} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Detail (mobile-friendly) */}
      {selectedDay && (
        <Card className="border-border/50">
          <CardContent className="p-4">
            <h3 className="font-heading font-semibold text-sm mb-3">
              {currentMonth.split(' ')[0]} {selectedDay}, {currentMonth.split(' ')[1]}
            </h3>
            {selectedEvents.length > 0 ? (
              <div className="space-y-2">
                {selectedEvents.map((ev, j) => (
                  <div key={j} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${statusStyles[ev.status]}`}>
                    <span className="font-medium text-sm tabular-nums">{ev.time}</span>
                    <span className="text-sm">{ev.student}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No lessons scheduled.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CalendarPage;
