import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2, LogOut, BookOpen, FileText, Download, Send,
  Inbox, Video, Music, Clock, Play, Square, Plus, ListChecks,
  ChevronRight, MessageCircle, Home, FileIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import UpcomingLessons from "@/components/UpcomingLessons";

type Tab = "home" | "homework" | "files" | "messages";

interface ParentPortalProps {
  initialTab?: Tab;
}

const ParentPortal = ({ initialTab }: ParentPortalProps) => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab ?? "home");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [practiceRunning, setPracticeRunning] = useState(false);
  const [practiceSeconds, setPracticeSeconds] = useState(0);
  const [practiceNote, setPracticeNote] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const { data: students } = useQuery({
    queryKey: ["parent-students", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Auto-select first student
  useEffect(() => {
    if (students && students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  const student = students?.find(s => s.id === selectedStudentId);

  const { data: lessons } = useQuery({
    queryKey: ["parent-lessons", selectedStudentId],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("*").eq("student_id", selectedStudentId!).order("date", { ascending: false }).limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudentId,
  });

  const { data: homework } = useQuery({
    queryKey: ["parent-homework", selectedStudentId],
    queryFn: async () => {
      const { data, error } = await supabase.from("homework_assignments").select("*").eq("student_id", selectedStudentId!).eq("status", "active").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudentId,
  });

  const { data: recaps } = useQuery({
    queryKey: ["parent-recaps", selectedStudentId],
    queryFn: async () => {
      const { data, error } = await supabase.from("recap_messages").select("*").eq("student_id", selectedStudentId!).order("created_at", { ascending: false }).limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudentId,
  });

  const { data: practiceHistory } = useQuery({
    queryKey: ["parent-practice", selectedStudentId],
    queryFn: async () => {
      const { data, error } = await supabase.from("practice_logs").select("*").eq("student_id", selectedStudentId!).order("practice_date", { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudentId,
  });

  const { data: files } = useQuery({
    queryKey: ["parent-files", selectedStudentId],
    queryFn: async () => {
      const { data, error } = await supabase.from("files").select("*").eq("student_id", selectedStudentId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudentId,
  });

  const { data: thread } = useQuery({
    queryKey: ["parent-thread", selectedStudentId],
    queryFn: async () => {
      const { data, error } = await supabase.from("message_threads").select("*").eq("student_id", selectedStudentId!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudentId,
  });

  const { data: threadMessages } = useQuery({
    queryKey: ["parent-messages", thread?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("messages").select("*").eq("thread_id", thread!.id).order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!thread?.id,
  });

  // Practice timer
  useEffect(() => {
    if (practiceRunning) {
      timerRef.current = setInterval(() => setPracticeSeconds(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [practiceRunning]);

  const toggleTimer = () => {
    if (practiceRunning) {
      setPracticeRunning(false);
    } else {
      setPracticeSeconds(0);
      setPracticeRunning(true);
    }
  };

  const logPracticeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStudentId || !user) return;
      const { error } = await supabase.from("practice_logs").insert({
        student_id: selectedStudentId,
        logged_by: user.id,
        practice_date: format(new Date(), "yyyy-MM-dd"),
        duration_seconds: practiceSeconds,
        notes: practiceNote.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parent-practice", selectedStudentId] });
      toast({ title: "Practice logged! 🎵" });
      setPracticeSeconds(0);
      setPracticeNote("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateHomeworkItemMutation = useMutation({
    mutationFn: async ({ hwId, items }: { hwId: string; items: any[] }) => {
      const { error } = await supabase.from("homework_assignments").update({ items }).eq("id", hwId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parent-homework", selectedStudentId] }),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!newMessage.trim() || !user || !thread) return;
      const { error } = await supabase.from("messages").insert({
        thread_id: thread.id,
        sender_user_id: user.id,
        body: newMessage.trim(),
      });
      if (error) throw error;
      setNewMessage("");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["parent-messages", thread?.id] }),
  });

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const latestRecap = recaps?.[0];
  const latestLesson = lessons?.[0];
  const activeHomework = homework ?? [];
  const totalDoneItems = activeHomework.reduce((acc, hw) => {
    const items = (hw.items as any[]) ?? [];
    return acc + items.filter(i => i.done).length;
  }, 0);
  const totalItems = activeHomework.reduce((acc, hw) => acc + ((hw.items as any[]) ?? []).length, 0);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "homework", label: "Homework", icon: ListChecks },
    { id: "files", label: "Files", icon: FileIcon },
    { id: "messages", label: "Messages", icon: MessageCircle },
  ];

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
              <span className="text-charcoal text-sm">🎵</span>
            </div>
            <div>
              <p className="font-heading font-bold text-sm leading-tight">Parent Portal</p>
              <p className="text-[10px] text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Child switcher */}
            {students && students.length > 1 && (
              <div className="flex gap-1">
                {students.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      selectedStudentId === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {s.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }} className="h-8 text-xs">
              <LogOut size={13} className="mr-1" /> Out
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Nav */}
      <div className="sticky top-[57px] z-20 bg-card/90 backdrop-blur-md border-b border-border/60">
        <div className="max-w-2xl mx-auto px-4 flex gap-0">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 space-y-5">
        {/* HOME TAB */}
        {activeTab === "home" && (
          <div className="space-y-4 animate-fade-in">
            {student ? (
              <>
                {/* Student hero card */}
                <Card className="border-border/50 bg-gradient-to-br from-card to-secondary/30">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-gold flex items-center justify-center text-charcoal font-bold text-lg shadow-gold">
                        {student.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <h2 className="font-heading text-xl font-bold">{student.name}</h2>
                        <p className="text-sm text-muted-foreground">{student.level} · Age {student.age}</p>
                        {student.lesson_day && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {student.lesson_day}s at {student.lesson_time}
                          </p>
                        )}
                      </div>
                    </div>
                    {student.meeting_url && (
                      <a href={student.meeting_url} target="_blank" rel="noopener noreferrer" className="mt-4 block">
                        <Button size="sm" className="w-full bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold">
                          <Video size={14} className="mr-2" /> Join Online Lesson
                        </Button>
                      </a>
                    )}
                  </CardContent>
                </Card>

                {/* Homework summary */}
                {totalItems > 0 && (
                  <Card className={`border-2 cursor-pointer transition-all ${totalDoneItems === totalItems ? "border-emerald-500/40 bg-emerald-50/50" : "border-gold/30 bg-gold/5"}`} onClick={() => setActiveTab("homework")}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${totalDoneItems === totalItems ? "bg-emerald-100" : "bg-gold/15"}`}>
                          <ListChecks size={18} className={totalDoneItems === totalItems ? "text-emerald-600" : "text-gold"} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">This week's homework</p>
                          <p className="text-xs text-muted-foreground">{totalDoneItems}/{totalItems} tasks completed</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted">
                          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${totalItems > 0 ? (totalDoneItems / totalItems) * 100 : 0}%` }} />
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Latest recap */}
                {latestRecap && (
                  <Card className="border-border/50">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm font-heading flex items-center gap-2">
                        <BookOpen size={14} className="text-gold" /> Latest Recap
                        <span className="text-xs font-normal text-muted-foreground ml-auto">{formatDistanceToNow(new Date(latestRecap.created_at), { addSuffix: true })}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <p className="text-sm font-medium">{latestRecap.subject}</p>
                      {latestLesson && (
                        <div className="mt-2 space-y-1">
                          {latestLesson.pieces && (latestLesson.pieces as string[]).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {(latestLesson.pieces as string[]).map((p, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent-foreground font-medium">
                                  🎵 {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Practice logger */}
                <Card className="border-border/50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-heading flex items-center gap-2">
                      <Music size={14} className="text-gold" /> Practice Today
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-heading font-bold tabular-nums text-foreground">
                        {formatDuration(practiceSeconds)}
                      </div>
                      <Button
                        variant={practiceRunning ? "destructive" : "default"}
                        size="sm"
                        onClick={toggleTimer}
                        className={!practiceRunning ? "bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold" : ""}
                      >
                        {practiceRunning ? <><Square size={13} className="mr-1" /> Stop</> : <><Play size={13} className="mr-1" /> Start</>}
                      </Button>
                      {practiceSeconds > 0 && !practiceRunning && (
                        <Button size="sm" variant="outline" onClick={() => logPracticeMutation.mutate()} disabled={logPracticeMutation.isPending}>
                          <Plus size={13} className="mr-1" /> Log
                        </Button>
                      )}
                    </div>
                    {practiceSeconds > 0 && !practiceRunning && (
                      <Textarea
                        value={practiceNote}
                        onChange={e => setPracticeNote(e.target.value)}
                        placeholder="Add a note (optional)..."
                        rows={2}
                        className="text-sm resize-none"
                        maxLength={300}
                      />
                    )}
                    {practiceHistory && practiceHistory.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-xs text-muted-foreground font-medium">Recent sessions</p>
                        {practiceHistory.slice(0, 5).map(log => (
                          <div key={log.id} className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{format(new Date(log.practice_date), "MMM d")}</span>
                            <span className="font-medium">{formatDuration(log.duration_seconds)}</span>
                            {log.notes && <span className="truncate max-w-[120px]">{log.notes}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No students linked to your account.</p>
                <p className="text-sm text-muted-foreground mt-1">Please contact the academy.</p>
              </div>
            )}
          </div>
        )}

        {/* HOMEWORK TAB */}
        {activeTab === "homework" && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-heading text-2xl font-bold">Homework</h2>
            {activeHomework.length > 0 ? activeHomework.map(hw => {
              const items = (hw.items as { text: string; done: boolean }[]) ?? [];
              return (
                <Card key={hw.id} className="border-border/50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-heading">{hw.title}</CardTitle>
                      <span className="text-xs text-muted-foreground">{items.filter(i => i.done).length}/{items.length} done</span>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {items.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const updated = items.map((it, i) => i === idx ? { ...it, done: !it.done } : it);
                          updateHomeworkItemMutation.mutate({ hwId: hw.id, items: updated });
                        }}
                        className="w-full flex items-start gap-3 text-left py-2 px-3 rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${item.done ? "border-emerald-500 bg-emerald-500" : "border-border"}`}>
                          {item.done && <CheckCircle2 size={12} className="text-white" />}
                        </div>
                        <span className={`text-sm leading-relaxed ${item.done ? "line-through text-muted-foreground" : ""}`}>{item.text}</span>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              );
            }) : (
              <div className="text-center py-12">
                <ListChecks size={32} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground">No homework assigned yet.</p>
              </div>
            )}
          </div>
        )}

        {/* FILES TAB */}
        {activeTab === "files" && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-heading text-2xl font-bold">Shared Files</h2>
            {files && files.length > 0 ? (
              <div className="space-y-2">
                {files.map(file => {
                  const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/studio-files/${file.file_path}`;
                  return (
                    <Card key={file.id} className="border-border/50">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                            <FileText size={18} className="text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{file.file_type?.replace("_", " ")} · {format(new Date(file.created_at), "MMM d, yyyy")}</p>
                          </div>
                        </div>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon"><Download size={16} /></Button>
                        </a>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText size={32} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground">No files shared yet.</p>
              </div>
            )}
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === "messages" && (
          <div className="space-y-4 animate-fade-in h-[500px] flex flex-col">
            <h2 className="font-heading text-2xl font-bold">Messages</h2>
            {thread ? (
              <>
                <Card className="border-border/50 flex-1 flex flex-col overflow-hidden">
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                    {threadMessages && threadMessages.length > 0 ? threadMessages.map(msg => {
                      const isMe = msg.sender_user_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>
                            <p>{msg.body}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-center py-8 text-sm text-muted-foreground">No messages yet. Say hello! 👋</div>
                    )}
                  </CardContent>
                  <div className="border-t border-border/50 p-3 flex gap-2">
                    <input
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendMessageMutation.mutate()}
                      placeholder="Send a message..."
                      className="flex-1 text-sm bg-muted rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                      maxLength={1000}
                    />
                    <Button onClick={() => sendMessageMutation.mutate()} disabled={!newMessage.trim()} size="icon" className="bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold">
                      <Send size={15} />
                    </Button>
                  </div>
                </Card>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <MessageCircle size={32} className="mx-auto mb-2 text-muted-foreground/30" />
                No message thread yet. Your teacher will start one.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ParentPortal;
