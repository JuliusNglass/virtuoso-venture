import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus, Download, Calendar, RefreshCw } from "lucide-react";
import { downloadICS, openGoogleCalendar } from "@/lib/calendarExport";
import { addDays, nextDay, format } from "date-fns";

interface UpcomingLessonsProps {
  studentId: string;
}

const DAY_MAP: Record<string, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

function generateRecurringDates(lessonDay: string, lessonTime: string, count = 4): Date[] {
  const dayIndex = DAY_MAP[lessonDay.toLowerCase()];
  if (dayIndex === undefined) return [];

  const [h, m] = (lessonTime || "10:00").split(":").map(Number);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates: Date[] = [];
  let cursor = today;

  while (dates.length < count) {
    const next = nextDay(cursor, dayIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6);
    const d = new Date(next);
    d.setHours(h, m, 0, 0);
    dates.push(d);
    cursor = addDays(next, 1);
  }
  return dates;
}

const UpcomingLessons = ({ studentId }: UpcomingLessonsProps) => {
  const today = new Date().toISOString().split("T")[0];

  // Only fetch scheduled (future) lessons — not logged lessons
  const { data: lessons, isLoading: lessonsLoading } = useQuery({
    queryKey: ["upcoming-lessons", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*, students(name, lesson_time, lesson_day)")
        .eq("student_id", studentId)
        .eq("attendance", "scheduled")
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!studentId,
  });

  const { data: student } = useQuery({
    queryKey: ["student-schedule", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("name, lesson_day, lesson_time")
        .eq("id", studentId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  const handleGoogleCal = (date: Date, studentName: string) => {
    openGoogleCalendar({
      title: `Piano Lesson — ${studentName}`,
      startDate: date,
      durationMinutes: 30,
    });
  };

  const handleICS = (date: Date, studentName: string) => {
    downloadICS({
      title: `Piano Lesson — ${studentName}`,
      startDate: date,
      durationMinutes: 30,
    });
  };

  if (lessonsLoading) return null;

  const hasScheduledLessons = lessons && lessons.length > 0;
  const isRecurring = !hasScheduledLessons && student?.lesson_day && student?.lesson_time;
  const recurringDates = isRecurring
    ? generateRecurringDates(student!.lesson_day!, student!.lesson_time!)
    : [];

  if (!hasScheduledLessons && !isRecurring) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-base font-bold flex items-center gap-2">
        <Calendar size={16} className="text-gold" /> Upcoming Lessons
        {isRecurring && (
          <span className="ml-auto text-[10px] font-normal text-muted-foreground flex items-center gap-1">
            <RefreshCw size={10} /> Recurring schedule (estimated)
          </span>
        )}
      </h2>

      <div className="space-y-2">
        {hasScheduledLessons
          ? lessons!.map((lesson) => {
              const s = (lesson as any).students;
              const [h, m] = (s?.lesson_time || "10:00").split(":").map(Number);
              const d = new Date(lesson.date + "T00:00:00");
              d.setHours(h, m, 0, 0);
              return (
                <Card key={lesson.id} className="border-blue-200/60 bg-blue-50/30">
                  <CardContent className="p-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{s?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(d, "EEEE, d MMMM")}
                          {s?.lesson_time && ` · ${s.lesson_time}`}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => handleGoogleCal(d, s?.name ?? "Student")} className="text-xs h-7 px-2">
                          <CalendarPlus size={12} className="mr-1" /> Google
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleICS(d, s?.name ?? "Student")} className="text-xs h-7 px-2">
                          <Download size={12} className="mr-1" /> .ics
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          : recurringDates.map((d, i) => (
              <Card key={i} className="border-border/40 bg-muted/20">
                <CardContent className="p-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{student?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(d, "EEEE, d MMMM")} · {student?.lesson_time}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => handleGoogleCal(d, student?.name ?? "Student")} className="text-xs h-7 px-2">
                        <CalendarPlus size={12} className="mr-1" /> Google
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleICS(d, student?.name ?? "Student")} className="text-xs h-7 px-2">
                        <Download size={12} className="mr-1" /> .ics
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
    </section>
  );
};

export default UpcomingLessons;
