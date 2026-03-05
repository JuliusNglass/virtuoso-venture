import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, addDays,
  isSameMonth, isToday as isTodayFn, parseISO,
} from "date-fns";
import LessonMode from "@/components/LessonMode";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const statusStyles: Record<string, string> = {
  present:   "bg-emerald-50 border-emerald-200 text-emerald-800",
  cancelled: "bg-muted border-border text-muted-foreground line-through",
  absent:    "bg-red-50 border-red-200 text-red-700",
};

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(format(new Date(), "yyyy-MM-dd"));
  const [lessonModeStudent, setLessonModeStudent] = useState<any>(null);
  const [existingLesson, setExistingLesson] = useState<any>(null);

  const monthStart = format(startOfMonth(currentDate), "yyyy-MM-dd");
  const monthEnd   = format(endOfMonth(currentDate),   "yyyy-MM-dd");

  const { data: lessons } = useQuery({
    queryKey: ["calendar-lessons", monthStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*, students(id, name, lesson_time, level, parent_email)")
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .order("date");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Build calendar grid (Mon-Sun)
  const firstDay = startOfMonth(currentDate);
  const calStart = startOfWeek(firstDay, { weekStartsOn: 1 });
  const calDays: Date[] = Array.from({ length: 42 }, (_, i) => addDays(calStart, i));

  const selectedEvents = selectedDay
    ? (lessons ?? []).filter((l) => l.date === selectedDay)
    : [];

  const prevMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1 text-sm">View and manage your lesson schedule.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setCurrentDate(new Date()); setSelectedDay(format(new Date(), "yyyy-MM-dd")); }}>
          Today
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month grid */}
        <div className="lg:col-span-2">
          <Card className="border-border/50">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold text-lg">{format(currentDate, "MMMM yyyy")}</h3>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                    <ChevronLeft size={15} />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                    <ChevronRight size={15} />
                  </Button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {daysOfWeek.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1.5">{d}</div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7">
                {calDays.map((day, i) => {
                  const dateStr  = format(day, "yyyy-MM-dd");
                  const dayLessons = (lessons ?? []).filter((l) => l.date === dateStr);
                  const inMonth  = isSameMonth(day, currentDate);
                  const today    = isTodayFn(day);
                  const selected = selectedDay === dateStr;

                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedDay(dateStr)}
                      className={`min-h-[64px] p-1 border-t border-border/20 cursor-pointer transition-colors hover:bg-muted/40 ${!inMonth ? "opacity-25" : ""} ${selected ? "bg-primary/5" : ""}`}
                    >
                      <span className={`text-xs inline-flex items-center justify-center w-6 h-6 rounded-full ${today ? "bg-primary text-primary-foreground font-bold" : selected ? "bg-primary/20 font-semibold" : ""}`}>
                        {format(day, "d")}
                      </span>
                      <div className="space-y-0.5 mt-0.5">
                        {dayLessons.slice(0, 2).map((l, j) => (
                          <div
                            key={j}
                            className={`text-[10px] px-1 py-0.5 rounded truncate border ${statusStyles[l.attendance] ?? statusStyles.present}`}
                          >
                            {(l.students as any)?.name?.split(" ")[0]}
                          </div>
                        ))}
                        {dayLessons.length > 2 && (
                          <div className="text-[10px] text-muted-foreground px-1">+{dayLessons.length - 2}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Completed</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-destructive" /> No-Show</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-muted-foreground" /> Cancelled</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day list */}
        <div>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <h4 className="font-heading font-semibold mb-3">
                {selectedDay ? format(parseISO(selectedDay), "EEEE, d MMMM") : "Select a day"}
              </h4>
              {selectedEvents.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">No lessons on this day</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((l) => {
                    const student = l.students as any;
                    const initials = student?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "?";
                    const isDone = l.attendance === "present";
                    return (
                      <div
                        key={l.id}
                        className={`p-3 rounded-xl border transition-colors ${statusStyles[l.attendance] ?? ""}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center text-charcoal font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{student?.name}</p>
                            <p className="text-xs text-muted-foreground">{student?.lesson_time ?? ""}</p>
                          </div>
                        </div>
                        {!isDone && (
                          <Button
                            size="sm"
                            className="w-full mt-2 h-8 bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold text-xs font-semibold"
                            onClick={() => {
                              setLessonModeStudent({
                                id: student.id,
                                name: student.name,
                                level: student.level,
                                parent_email: student.parent_email,
                              });
                              setExistingLesson(l);
                            }}
                          >
                            <PlayCircle size={13} className="mr-1.5" /> Start Lesson
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lesson Mode */}
      {lessonModeStudent && (
        <LessonMode
          open={!!lessonModeStudent}
          onClose={() => { setLessonModeStudent(null); setExistingLesson(null); }}
          student={lessonModeStudent}
          existingLesson={existingLesson}
        />
      )}
    </div>
  );
};

export default CalendarPage;
