import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus, Download, Calendar } from "lucide-react";
import { downloadICS, openGoogleCalendar } from "@/lib/calendarExport";

interface UpcomingLessonsProps {
  userId: string;
}

const UpcomingLessons = ({ userId }: UpcomingLessonsProps) => {
  const today = new Date().toISOString().split("T")[0];

  const { data: lessons, isLoading } = useQuery({
    queryKey: ["parent-upcoming-lessons", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*, students(name, lesson_time)")
        .gte("date", today)
        .eq("attendance", "present")
        .order("date", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const handleGoogleCal = (lesson: any) => {
    const student = (lesson as any).students;
    const [hours, minutes] = (student?.lesson_time || "10:00").split(":").map(Number);
    const startDate = new Date(lesson.date);
    startDate.setHours(hours, minutes, 0, 0);

    openGoogleCalendar({
      title: `Piano Lesson — ${student?.name || "Student"}`,
      description: lesson.homework ? `Homework: ${lesson.homework}` : undefined,
      startDate,
      durationMinutes: 30,
    });
  };

  const handleICS = (lesson: any) => {
    const student = (lesson as any).students;
    const [hours, minutes] = (student?.lesson_time || "10:00").split(":").map(Number);
    const startDate = new Date(lesson.date);
    startDate.setHours(hours, minutes, 0, 0);

    downloadICS({
      title: `Piano Lesson — ${student?.name || "Student"}`,
      description: lesson.homework ? `Homework: ${lesson.homework}` : undefined,
      startDate,
      durationMinutes: 30,
    });
  };

  if (isLoading) return null;
  if (!lessons || lessons.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
        <Calendar size={22} /> Upcoming Lessons
      </h2>
      <div className="space-y-3">
        {lessons.map((lesson) => {
          const student = (lesson as any).students;
          return (
            <Card key={lesson.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{student?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(lesson.date).toLocaleDateString("en-GB", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                      {student?.lesson_time && ` · ${student.lesson_time}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGoogleCal(lesson)}
                      className="text-xs"
                    >
                      <CalendarPlus size={14} className="mr-1.5" />
                      Google Cal
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleICS(lesson)}
                      className="text-xs"
                    >
                      <Download size={14} className="mr-1.5" />
                      .ics
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default UpcomingLessons;
