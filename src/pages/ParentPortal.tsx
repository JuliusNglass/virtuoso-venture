import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle, Music, FileText, Download, LogOut, BookOpen, Send, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";

const attendanceIcon = {
  present: <CheckCircle size={16} className="text-green-600" />,
  absent: <XCircle size={16} className="text-destructive" />,
  cancelled: <Clock size={16} className="text-muted-foreground" />,
};

const ParentPortal = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["parent-students", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: lessons } = useQuery({
    queryKey: ["parent-lessons", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("*, students(name)").order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: files } = useQuery({
    queryKey: ["parent-files", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("files").select("*, students(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: lessonRequests } = useQuery({
    queryKey: ["parent-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("lesson_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || studentsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const fileTypeIcons: Record<string, any> = {
    music_sheet: Music,
    score: FileText,
    photo: FileText,
    document: FileText,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold">
              <span className="text-gradient-gold">Shanika</span> Parent Portal
            </h1>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut size={16} className="mr-2" /> Sign Out
            </Button>
            <Button size="sm" className="bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold" onClick={() => navigate("/request-lesson")}>
              <Send size={16} className="mr-2" /> Request Lessons
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
        {/* Lesson Requests Status */}
        {lessonRequests && lessonRequests.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
              <Inbox size={22} /> Your Requests
            </h2>
            <div className="space-y-3">
              {lessonRequests.map((req) => {
                const statusStyle: Record<string, string> = {
                  pending: "bg-amber-100 text-amber-700",
                  accepted: "bg-green-100 text-green-700",
                  waitlisted: "bg-blue-100 text-blue-700",
                  declined: "bg-red-100 text-red-700",
                };
                const statusLabel: Record<string, string> = {
                  pending: "Under Review",
                  accepted: "Accepted — Awaiting Payment",
                  waitlisted: "Waitlisted",
                  declined: "Declined",
                };
                return (
                  <Card key={req.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{req.child_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {req.preferred_level} · Submitted {new Date(req.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
                          </p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle[req.status] || "bg-muted text-muted-foreground"}`}>
                          {statusLabel[req.status] || req.status}
                        </span>
                      </div>
                      {req.status === "accepted" && (
                        <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded-lg p-2">
                          Your application has been accepted! Please complete payment to activate your child's lessons. Contact the academy for payment details.
                        </p>
                      )}
                      {req.admin_notes && (
                        <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded-lg p-2">
                          <span className="font-medium">Note from teacher: </span>{req.admin_notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
        {/* Children */}
        {students && students.length > 0 ? (
          <>
            <section className="space-y-4">
              <h2 className="font-heading text-2xl font-bold">Your Children</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.map((student) => (
                  <Card key={student.id} className="border-border/50">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-gold flex items-center justify-center text-charcoal font-bold text-sm">
                          {student.name.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">Age {student.age} · {student.level}</p>
                        </div>
                      </div>
                      {student.current_piece && (
                        <div className="flex items-center gap-2 text-sm">
                          <Music size={14} className="text-gold" />
                          <span>Currently working on: <strong>{student.current_piece}</strong></span>
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground mt-2">
                        {student.lesson_day} · {student.lesson_time}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Recent Lessons */}
            <section className="space-y-4">
              <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
                <BookOpen size={22} /> Recent Lessons
              </h2>
              {lessons && lessons.length > 0 ? (
                <div className="space-y-3">
                  {lessons.map((lesson) => (
                    <Card key={lesson.id} className="border-border/50">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">{(lesson as any).students?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(lesson.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            {attendanceIcon[lesson.attendance as keyof typeof attendanceIcon]}
                            <span className="capitalize text-muted-foreground">{lesson.attendance}</span>
                          </div>
                        </div>
                        {lesson.notes && <p className="text-sm mb-3">{lesson.notes}</p>}
                        {lesson.pieces && lesson.pieces.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {lesson.pieces.map((piece: string) => (
                              <span key={piece} className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent-foreground font-medium">
                                🎵 {piece}
                              </span>
                            ))}
                          </div>
                        )}
                        {lesson.homework && (
                          <div className="text-sm bg-muted/50 rounded-lg p-3">
                            <span className="text-muted-foreground font-medium">Homework: </span>
                            {lesson.homework}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No lesson notes yet.</p>
              )}
            </section>

            {/* Files */}
            <section className="space-y-4">
              <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
                <FileText size={22} /> Shared Files
              </h2>
              {files && files.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {files.map((file) => {
                    const Icon = fileTypeIcons[file.file_type] || FileText;
                    const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/studio-files/${file.file_path}`;
                    return (
                      <Card key={file.id} className="border-border/50">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                              <Icon size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{file.file_type.replace("_", " ")} · {(file as any).students?.name}</p>
                            </div>
                          </div>
                          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon"><Download size={16} /></Button>
                          </a>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No files shared yet.</p>
              )}
            </section>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No students linked to your account yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Please contact the academy to link your child's profile.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ParentPortal;
