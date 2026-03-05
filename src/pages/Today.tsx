import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PlayCircle, MessageCircle, Calendar, CheckCircle2,
  XCircle, Clock, Send, AlertCircle, Zap
} from "lucide-react";
import LessonMode from "@/components/LessonMode";

const Today = () => {
  const navigate = useNavigate();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [lessonModeStudent, setLessonModeStudent] = useState<any>(null);
  const [existingLesson, setExistingLesson] = useState<any>(null);
  const [filterChip, setFilterChip] = useState<"all" | "needs_recap" | "overdue">("all");

  const { data: todayLessons, isLoading } = useQuery({
    queryKey: ["today-lessons", todayStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*, students(id, name, level, lesson_time, parent_email, parent_user_id, status)")
        .eq("date", todayStr)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: recappedToday } = useQuery({
    queryKey: ["recapped-today", todayStr],
    queryFn: async () => {
      if (!todayLessons || todayLessons.length === 0) return new Set<string>();
      const ids = todayLessons.map((l) => l.id);
      const { data } = await supabase
        .from("recap_messages")
        .select("lesson_id")
        .in("lesson_id", ids);
      return new Set((data ?? []).map((r) => r.lesson_id));
    },
    enabled: !!todayLessons,
  });

  const needsRecapCount = (todayLessons ?? []).filter(
    (l) => l.attendance === "present" && !recappedToday?.has(l.id)
  ).length;

  const filtered = (todayLessons ?? []).filter((l) => {
    if (filterChip === "needs_recap")
      return l.attendance === "present" && !recappedToday?.has(l.id);
    if (filterChip === "overdue")
      return (l.students as any)?.status === "awaiting_payment";
    return true;
  });

  const attendanceMeta: Record<string, { label: string; icon: any; cls: string }> = {
    present: { label: "Completed", icon: CheckCircle2, cls: "bg-emerald-100 text-emerald-700" },
    absent: { label: "No-Show", icon: XCircle, cls: "bg-red-100 text-red-600" },
    cancelled: { label: "Cancelled", icon: Clock, cls: "bg-muted text-muted-foreground" },
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground font-medium">
          {format(new Date(), "EEEE, d MMMM yyyy")}
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight mt-0.5">
          {greeting} <span className="text-gradient-gold">👋</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isLoading
            ? "Loading today's schedule…"
            : todayLessons?.length
            ? `You have ${todayLessons.length} lesson${todayLessons.length > 1 ? "s" : ""} today`
            : "No lessons scheduled today"}
          {needsRecapCount > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-medium">
              <AlertCircle size={13} /> {needsRecapCount} need{needsRecapCount > 1 ? "" : "s"} recap
            </span>
          )}
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "all", label: "All" },
          { id: "needs_recap", label: `Needs Recap${needsRecapCount > 0 ? ` (${needsRecapCount})` : ""}` },
          { id: "overdue", label: "Overdue" },
        ].map((chip) => (
          <button
            key={chip.id}
            onClick={() => setFilterChip(chip.id as any)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border ${
              filterChip === chip.id
                ? "bg-primary text-primary-foreground border-transparent"
                : "border-border text-muted-foreground hover:border-muted-foreground/40"
            }`}
          >
            {chip.label}
          </button>
        ))}
        <button
          className="text-xs px-3 py-1.5 rounded-full font-medium border border-border text-muted-foreground opacity-50 cursor-not-allowed"
          disabled
          title="Coming soon"
        >
          Not Practiced <span className="text-[10px]">(soon)</span>
        </button>
      </div>

      {/* Lesson cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-14 text-center">
            <Calendar size={36} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-heading font-semibold text-base">
              {filterChip === "all" ? "No lessons today" : "No lessons match this filter"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {filterChip === "all"
                ? "Enjoy your free time! Check the calendar for upcoming sessions."
                : "Try switching to 'All' to see today's full schedule."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => navigate("/calendar")}
            >
              View Calendar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((lesson) => {
            const student = lesson.students as any;
            const meta =
              attendanceMeta[lesson.attendance] ?? attendanceMeta.present;
            const MetaIcon = meta.icon;
            const isPresent = lesson.attendance === "present";
            const hasRecap = recappedToday?.has(lesson.id);
            const needsRecap = isPresent && !hasRecap;
            const isOverdue = student?.status === "awaiting_payment";
            const initials = student?.name
              ? student.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
              : "?";

            return (
              <Card
                key={lesson.id}
                className={`border-border/50 transition-all ${needsRecap ? "border-amber-300/60 bg-amber-50/30 dark:bg-amber-900/10" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-xl bg-gradient-gold flex items-center justify-center text-charcoal font-bold shrink-0">
                      {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-heading font-bold text-base">{student?.name ?? "Unknown"}</p>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${meta.cls}`}>
                          <MetaIcon size={11} />
                          {meta.label}
                        </span>
                        {needsRecap && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-[11px]">
                            <Send size={10} className="mr-1" /> Needs Recap
                          </Badge>
                        )}
                        {isOverdue && (
                          <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 text-[11px]">
                            <AlertCircle size={10} className="mr-1" /> Payment Overdue
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <Clock size={11} />
                        <span>{student?.lesson_time ?? "No time set"}</span>
                        {student?.level && <span>· {student.level}</span>}
                      </div>
                      {lesson.notes && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{lesson.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border/40">
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold font-semibold h-9"
                      onClick={() => {
                        setLessonModeStudent({
                          id: student.id,
                          name: student.name,
                          level: student.level,
                          parent_email: student.parent_email,
                        });
                        setExistingLesson(lesson);
                      }}
                    >
                      <PlayCircle size={15} className="mr-1.5" />
                      {isPresent ? "Review Lesson" : "Start Lesson"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 px-3"
                      onClick={() => navigate("/messages")}
                    >
                      <MessageCircle size={15} />
                    </Button>
                    {needsRecap && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 border-amber-300 text-amber-600 hover:bg-amber-50"
                        onClick={() => {
                          setLessonModeStudent({
                            id: student.id,
                            name: student.name,
                            level: student.level,
                            parent_email: student.parent_email,
                          });
                          setExistingLesson(lesson);
                        }}
                      >
                        <Send size={14} />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick summary bar at bottom */}
      {(todayLessons?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="font-bold text-lg font-heading">{todayLessons?.filter((l) => l.attendance === "present").length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Done</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="font-bold text-lg font-heading">{todayLessons?.filter((l) => l.attendance === "absent").length ?? 0}</p>
              <p className="text-xs text-muted-foreground">No-Show</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="font-bold text-lg font-heading text-amber-600">{needsRecapCount}</p>
              <p className="text-xs text-muted-foreground">Need Recap</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/lessons")}
            className="shrink-0"
          >
            <Zap size={13} className="mr-1.5" /> Log New
          </Button>
        </div>
      )}

      {/* Lesson Mode */}
      {lessonModeStudent && (
        <LessonMode
          open={!!lessonModeStudent}
          onClose={() => {
            setLessonModeStudent(null);
            setExistingLesson(null);
          }}
          student={lessonModeStudent}
          existingLesson={existingLesson}
        />
      )}
    </div>
  );
};

export default Today;
