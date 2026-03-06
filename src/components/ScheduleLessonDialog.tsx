import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStudio } from "@/hooks/useStudio";
import { useToast } from "@/hooks/use-toast";
import { format, addWeeks, parseISO, eachWeekOfInterval } from "date-fns";
import { CalendarIcon, Loader2, RepeatIcon, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface ScheduleLessonDialogProps {
  open: boolean;
  onClose: () => void;
  defaultDate?: string; // yyyy-MM-dd
}

const ScheduleLessonDialog = ({ open, onClose, defaultDate }: ScheduleLessonDialogProps) => {
  const { studio } = useStudio();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [studentId, setStudentId] = useState("");
  const [mode, setMode] = useState<"single" | "recurring">("single");
  const [startDate, setStartDate] = useState<Date | undefined>(
    defaultDate ? parseISO(defaultDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [time, setTime] = useState("10:00");
  const [loading, setLoading] = useState(false);

  const { data: students } = useQuery({
    queryKey: ["active-students-schedule", studio?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, name, lesson_time, lesson_day")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  // Auto-fill time from student's lesson_time
  const selectedStudent = students?.find((s) => s.id === studentId);
  const handleStudentChange = (id: string) => {
    setStudentId(id);
    const s = students?.find((st) => st.id === id);
    if (s?.lesson_time) setTime(s.lesson_time);
  };

  // Generate dates for preview
  const generatedDates = useMemo(() => {
    if (!startDate) return [];
    if (mode === "single") return [startDate];

    if (!endDate) return [];
    const maxEnd = addWeeks(startDate, 52);
    const actualEnd = endDate > maxEnd ? maxEnd : endDate;

    return eachWeekOfInterval(
      { start: startDate, end: actualEnd },
      { weekStartsOn: startDate.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6 }
    ).slice(0, 52);
  }, [startDate, endDate, mode]);

  const handleConfirm = async () => {
    if (!studentId || !startDate || generatedDates.length === 0) return;
    if (mode === "recurring" && !endDate) return;

    setLoading(true);
    try {
      const dateStrings = generatedDates.map((d) => format(d, "yyyy-MM-dd"));

      // Fetch existing lessons for dedup
      const { data: existing } = await supabase
        .from("lessons")
        .select("date")
        .eq("student_id", studentId)
        .in("date", dateStrings);

      const existingDates = new Set((existing ?? []).map((r) => r.date));
      const toInsert = dateStrings.filter((d) => !existingDates.has(d));
      const skipped = dateStrings.length - toInsert.length;

      if (toInsert.length > 0) {
        const rows = toInsert.map((date) => ({
          student_id: studentId,
          date,
          attendance: "scheduled" as const,
          notes: null,
          pieces: [],
          homework: null,
        }));

        const { error } = await supabase.from("lessons").insert(rows);
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["calendar-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["coming-up-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["today-lessons"] });

      toast({
        title: "Lessons scheduled",
        description:
          toInsert.length === 0
            ? "All selected dates already had lessons."
            : `${toInsert.length} lesson${toInsert.length > 1 ? "s" : ""} scheduled${skipped > 0 ? ` (${skipped} already existed)` : ""}.`,
      });

      handleClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStudentId("");
    setMode("single");
    setStartDate(defaultDate ? parseISO(defaultDate) : undefined);
    setEndDate(undefined);
    setTime("10:00");
    onClose();
  };

  const maxEndDate = startDate ? addWeeks(startDate, 52) : undefined;
  const canConfirm =
    !!studentId &&
    !!startDate &&
    (mode === "single" || !!endDate) &&
    generatedDates.length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus size={18} className="text-primary" />
            Schedule Lesson
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Student */}
          <div className="space-y-1.5">
            <Label>Student</Label>
            <Select value={studentId} onValueChange={handleStudentChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select student…" />
              </SelectTrigger>
              <SelectContent>
                {(students ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mode toggle */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="flex gap-2">
              {(["single", "recurring"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                    mode === m
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground/40"
                  )}
                >
                  {m === "recurring" && <RepeatIcon size={14} />}
                  {m === "single" ? "Single lesson" : "Recurring weekly"}
                </button>
              ))}
            </div>
          </div>

          {/* Date picker */}
          <div className="space-y-1.5">
            <Label>{mode === "single" ? "Date" : "Start date"}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End date for recurring */}
          {mode === "recurring" && (
            <div className="space-y-1.5">
              <Label>End date <span className="text-muted-foreground text-xs">(max 12 months)</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick an end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    disabled={(d) =>
                      !startDate ||
                      d <= startDate ||
                      (!!maxEndDate && d > maxEndDate)
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Time */}
          <div className="space-y-1.5">
            <Label>Time</Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Preview */}
          {generatedDates.length > 0 && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
              <p className="font-medium">
                This will create{" "}
                <span className="font-bold">{generatedDates.length}</span>{" "}
                lesson{generatedDates.length > 1 ? "s" : ""}
              </p>
              {mode === "recurring" && (
                <p className="text-xs text-blue-600 mt-0.5">
                  {format(generatedDates[0], "d MMM")} →{" "}
                  {format(generatedDates[generatedDates.length - 1], "d MMM yyyy")}, every week
                </p>
              )}
              {mode === "single" && startDate && (
                <p className="text-xs text-blue-600 mt-0.5">
                  {format(startDate, "EEEE, d MMMM yyyy")} at {time}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className="bg-gradient-gold text-charcoal hover:opacity-90 font-semibold"
          >
            {loading ? (
              <><Loader2 size={14} className="mr-2 animate-spin" /> Scheduling…</>
            ) : (
              `Schedule ${generatedDates.length > 1 ? `${generatedDates.length} Lessons` : "Lesson"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleLessonDialog;
