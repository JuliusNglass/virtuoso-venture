import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, XCircle, Edit, Trash2, Search, Calendar, AlertCircle, BookOpen } from "lucide-react";
import PiecesMultiSelect from "@/components/PiecesMultiSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, startOfWeek, addDays, isSameMonth, isToday as isTodayFn, isSameDay, parseISO } from "date-fns";

const attendanceIcon: Record<string, React.ReactNode> = {
  present: <CheckCircle size={14} className="text-green-600" />,
  absent: <XCircle size={14} className="text-destructive" />,
  cancelled: <Clock size={14} className="text-muted-foreground" />,
};

const attendanceColors: Record<string, string> = {
  present: "text-green-600",
  absent: "text-destructive",
  cancelled: "text-muted-foreground",
};

const Lessons = () => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editLesson, setEditLesson] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // New lesson form state
  const [formStudent, setFormStudent] = useState("");
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formTime, setFormTime] = useState("15:00");
  const [formDuration, setFormDuration] = useState("60");
  const [formAttendance, setFormAttendance] = useState("present");
  const [formNotes, setFormNotes] = useState("");
  const [formPieces, setFormPieces] = useState<string[]>([]);
  const [formHomework, setFormHomework] = useState("");
  const [formProgress, setFormProgress] = useState("");
  const [formParentNotes, setFormParentNotes] = useState("");

  const { data: students } = useQuery({
    queryKey: ["students-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id, name, lesson_time").eq("status", "active").order("name");
      if (error) throw error;
      return data;
    },
  });

  const monthStart = format(startOfMonth(currentDate), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(currentDate), "yyyy-MM-dd");

  const { data: lessons } = useQuery({
    queryKey: ["lessons", monthStart],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("*, students(name, lesson_time)").gte("date", monthStart).lte("date", monthEnd).order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayLessons = lessons?.filter(l => l.date === todayStr) ?? [];
  const weekLessons = lessons?.length ?? 0;
  const completed = lessons?.filter(l => l.attendance === "present")?.length ?? 0;
  const cancelled = lessons?.filter(l => l.attendance === "cancelled")?.length ?? 0;
  const noShows = lessons?.filter(l => l.attendance === "absent")?.length ?? 0;

  const addMutation = useMutation({
    mutationFn: async (lesson: any) => {
      const { error } = await supabase.from("lessons").insert(lesson);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast({ title: "Lesson saved" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (lesson: any) => {
      const { id, students: _, ...rest } = lesson;
      const { error } = await supabase.from("lessons").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast({ title: "Lesson updated" });
      setEditLesson(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast({ title: "Lesson deleted" });
    },
  });

  const resetForm = () => {
    setFormStudent(""); setFormNotes(""); setFormPieces([]); setFormHomework("");
    setFormProgress(""); setFormParentNotes(""); setFormAttendance("present");
    setFormDate(format(new Date(), "yyyy-MM-dd")); setFormTime("15:00"); setFormDuration("60");
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudent) return;
    addMutation.mutate({
      student_id: formStudent,
      date: formDate,
      attendance: formAttendance,
      notes: [formNotes, formProgress, formParentNotes].filter(Boolean).join("\n\n"),
      pieces: formPieces.length > 0 ? formPieces : [],
      homework: formHomework || null,
    });
  };

  // Calendar rendering
  const monthStartDate = startOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStartDate, { weekStartsOn: 0 });
  const calendarDays: Date[] = [];
  for (let i = 0; i < 42; i++) {
    calendarDays.push(addDays(calendarStart, i));
  }

  const filtered = (lessons ?? []).filter(l => {
    const matchSearch = (l as any).students?.name?.toLowerCase().includes(search.toLowerCase()) || false;
    const matchStatus = filterStatus === "all" || l.attendance === filterStatus;
    return (search ? matchSearch : true) && matchStatus;
  });

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Lesson Tracking</h1>
          <p className="text-muted-foreground mt-1">Manage lesson schedules, attendance, and detailed notes</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { icon: <Calendar size={18} className="text-accent" />, value: todayLessons.length, label: "Today's Lessons" },
          { icon: <BookOpen size={18} className="text-blue-500" />, value: weekLessons, label: "This Month" },
          { icon: <CheckCircle size={18} className="text-green-600" />, value: completed, label: "Completed" },
          { icon: <XCircle size={18} className="text-destructive" />, value: cancelled, label: "Cancelled" },
          { icon: <AlertCircle size={18} className="text-amber-500" />, value: noShows, label: "No-Shows" },
        ].map((stat, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <div className="mb-2">{stat.icon}</div>
              <p className="text-2xl font-heading font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Calendar + History */}
        <div className="lg:col-span-3 space-y-6">
          {/* Mini Calendar */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold">{format(currentDate, "MMMM yyyy")}</h3>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={prevMonth}>‹</Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={nextMonth}>›</Button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-0">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                ))}
                {calendarDays.map((day, i) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const dayLessons = lessons?.filter(l => l.date === dateStr) ?? [];
                  const inMonth = isSameMonth(day, currentDate);
                  const today = isTodayFn(day);

                  return (
                    <div key={i} className={`min-h-[60px] p-1 border-t border-border/30 ${!inMonth ? 'opacity-30' : ''}`}>
                      <span className={`text-xs inline-flex items-center justify-center w-6 h-6 rounded-full ${today ? 'bg-primary text-primary-foreground font-bold' : ''}`}>
                        {format(day, "d")}
                      </span>
                      <div className="space-y-0.5 mt-0.5">
                        {dayLessons.slice(0, 2).map((l, j) => (
                          <div key={j} className={`text-[10px] px-1 py-0.5 rounded truncate border ${
                            l.attendance === "present" ? "bg-green-50 border-green-200 text-green-700" :
                            l.attendance === "cancelled" ? "bg-muted border-border text-muted-foreground" :
                            "bg-accent/10 border-accent/30 text-accent-foreground"
                          }`}>
                            {(l as any).students?.name?.split(" ")[0]}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> Completed</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-accent" /> Scheduled</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-destructive" /> Cancelled</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> No-Show</span>
              </div>
            </CardContent>
          </Card>

          {/* Lesson History */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="font-heading text-lg">Lesson History</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search lessons..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm w-[180px]" />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-8 text-sm w-[130px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="present">Completed</SelectItem>
                      <SelectItem value="absent">No-Show</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
              {filtered.length > 0 ? filtered.map((lesson) => (
                <div key={lesson.id} className="flex items-start justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{(lesson as any).students?.name}</p>
                      <span className={`flex items-center gap-1 text-xs ${attendanceColors[lesson.attendance]}`}>
                        {attendanceIcon[lesson.attendance]}
                        {lesson.attendance === "present" ? "Completed" : lesson.attendance === "absent" ? "No-Show" : "Cancelled"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Calendar size={10} /> {format(parseISO(lesson.date), "MMM d, yyyy")}</span>
                      <span>· {(lesson as any).students?.lesson_time ?? ""}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditLesson(lesson)}>
                      <Edit size={12} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(lesson.id)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No lessons found</p>
              )}
              {filtered.length > 0 && (
                <p className="text-xs text-muted-foreground text-center pt-2">Showing {filtered.length} lessons</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* New Lesson Note Form */}
        <div className="lg:col-span-2">
          <Card className="border-border/50 sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg">New Lesson Note</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveLesson} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Student *</Label>
                    <Select value={formStudent} onValueChange={setFormStudent}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Select student" /></SelectTrigger>
                      <SelectContent>
                        {students?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Status *</Label>
                    <Select value={formAttendance} onValueChange={setFormAttendance}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Completed</SelectItem>
                        <SelectItem value="absent">No-Show</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Date *</Label>
                    <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Time *</Label>
                    <Input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Duration *</Label>
                    <Select value={formDuration} onValueChange={setFormDuration}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Technique Notes</Label>
                  <Textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} maxLength={1000} rows={2} placeholder="Notes on hand position, posture, finger technique..." className="text-sm" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Assigned Pieces</Label>
                  <PiecesMultiSelect selected={formPieces} onChange={setFormPieces} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Homework</Label>
                  <Textarea value={formHomework} onChange={e => setFormHomework(e.target.value)} maxLength={500} rows={2} placeholder="Practice assignments for next lesson..." className="text-sm" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Progress Observations</Label>
                  <Textarea value={formProgress} onChange={e => setFormProgress(e.target.value)} maxLength={500} rows={2} placeholder="Overall progress, improvements, areas needing attention..." className="text-sm" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Notes for Parents</Label>
                  <Textarea value={formParentNotes} onChange={e => setFormParentNotes(e.target.value)} maxLength={500} rows={2} placeholder="Information to share with parents..." className="text-sm" />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 bg-primary text-primary-foreground" disabled={addMutation.isPending || !formStudent}>
                    💾 Save Lesson
                  </Button>
                  <Button type="button" variant="ghost" onClick={resetForm}>
                    ✕ Clear Form
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editLesson} onOpenChange={() => setEditLesson(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Lesson Note</DialogTitle>
          </DialogHeader>
          {editLesson && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Attendance</Label>
                <Select value={editLesson.attendance} onValueChange={v => setEditLesson({ ...editLesson, attendance: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Completed</SelectItem>
                    <SelectItem value="absent">No-Show</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={editLesson.notes ?? ""} onChange={e => setEditLesson({ ...editLesson, notes: e.target.value })} maxLength={1000} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Assigned Pieces</Label>
                <PiecesMultiSelect selected={editLesson.pieces ?? []} onChange={pieces => setEditLesson({ ...editLesson, pieces })} />
              </div>
              <div className="space-y-2">
                <Label>Homework</Label>
                <Textarea value={editLesson.homework ?? ""} onChange={e => setEditLesson({ ...editLesson, homework: e.target.value })} maxLength={500} rows={2} />
              </div>
              <Button onClick={() => updateMutation.mutate(editLesson)} className="w-full bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold" disabled={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Lessons;
