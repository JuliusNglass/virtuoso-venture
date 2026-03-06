import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStudio } from "@/hooks/useStudio";
import { useToast } from "@/hooks/use-toast";
import {
  format, addWeeks, parseISO, eachWeekOfInterval, addMinutes,
} from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, RepeatIcon, CalendarPlus } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  open: boolean;
  onClose: () => void;
  classId: string;
  studioId: string;
  durationMinutes?: number;
  defaultDay?: string | null;
  defaultTime?: string | null;
  memberStudentIds: string[];
}

const ScheduleClassSessionDialog = ({
  open, onClose, classId, studioId, durationMinutes = 60,
  defaultDay, defaultTime, memberStudentIds,
}: Props) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"single" | "recurring">("single");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [time, setTime] = useState(defaultTime ?? "16:00");
  const [loading, setLoading] = useState(false);

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
    if (!startDate || generatedDates.length === 0) return;
    if (mode === "recurring" && !endDate) return;
    setLoading(true);
    try {
      for (const d of generatedDates) {
        const [h, m] = time.split(":").map(Number);
        const startsAt = new Date(d);
        startsAt.setHours(h, m, 0, 0);
        const endsAt = addMinutes(startsAt, durationMinutes);

        // Create session
        const { data: session, error: sessErr } = await supabase
          .from("class_sessions")
          .insert({
            studio_id: studioId,
            class_id: classId,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            status: "scheduled",
          })
          .select("id")
          .single();
        if (sessErr) throw sessErr;

        // Pre-create attendance rows
        if (memberStudentIds.length > 0) {
          const attendanceRows = memberStudentIds.map(sid => ({
            studio_id: studioId,
            class_session_id: session.id,
            student_id: sid,
            attendance: "scheduled",
          }));
          await supabase.from("class_attendance").insert(attendanceRows);
        }
      }

      qc.invalidateQueries({ queryKey: ["class-sessions", classId] });
      qc.invalidateQueries({ queryKey: ["calendar-class-sessions"] });
      toast({
        title: "Sessions scheduled",
        description: `${generatedDates.length} session${generatedDates.length > 1 ? "s" : ""} created.`,
      });
      handleClose();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMode("single"); setStartDate(undefined); setEndDate(undefined);
    setTime(defaultTime ?? "16:00");
    onClose();
  };

  const maxEndDate = startDate ? addWeeks(startDate, 52) : undefined;
  const canConfirm = !!startDate && (mode === "single" || !!endDate) && generatedDates.length > 0;

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus size={18} className="text-primary" /> Schedule Class Session
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="flex gap-2">
              {(["single", "recurring"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                    mode === m ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground/40"
                  )}
                >
                  {m === "recurring" && <RepeatIcon size={14} />}
                  {m === "single" ? "Single session" : "Recurring weekly"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{mode === "single" ? "Date" : "Start date"}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single" selected={startDate} onSelect={setStartDate}
                  initialFocus className="p-3 pointer-events-auto"
                  disabled={d => d < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          {mode === "recurring" && (
            <div className="space-y-1.5">
              <Label>End date <span className="text-muted-foreground text-xs">(max 12 months)</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick an end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single" selected={endDate} onSelect={setEndDate}
                    initialFocus className="p-3 pointer-events-auto"
                    disabled={d => !startDate || d <= startDate || (!!maxEndDate && d > maxEndDate)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Start time</Label>
            <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full" />
          </div>

          {generatedDates.length > 0 && (
            <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3 text-sm text-indigo-800">
              <p className="font-medium">
                Will create <span className="font-bold">{generatedDates.length}</span> session{generatedDates.length > 1 ? "s" : ""}
                {memberStudentIds.length > 0 && ` + ${memberStudentIds.length} attendance records each`}
              </p>
              {mode === "recurring" && (
                <p className="text-xs text-indigo-600 mt-0.5">
                  {format(generatedDates[0], "d MMM")} → {format(generatedDates[generatedDates.length - 1], "d MMM yyyy")}, weekly
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className="bg-gradient-gold text-charcoal hover:opacity-90 font-semibold shadow-gold"
          >
            {loading
              ? <><Loader2 size={14} className="mr-2 animate-spin" /> Scheduling…</>
              : `Schedule ${generatedDates.length > 1 ? `${generatedDates.length} Sessions` : "Session"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleClassSessionDialog;
