import { Card, CardContent } from "@/components/ui/card";
import { Search, Edit, Trash2, Phone, Mail, Calendar, UserPlus, PlayCircle, Send, Copy, Check, Link, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStudio } from "@/hooks/useStudio";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LessonMode from "@/components/LessonMode";
import { Textarea } from "@/components/ui/textarea";

const levelColors: Record<string, string> = {
  "Grade 1": "bg-green-100 text-green-700",
  "Grade 2": "bg-green-100 text-green-700",
  "Grade 3": "bg-blue-100 text-blue-700",
  "Grade 4": "bg-blue-100 text-blue-700",
  "Grade 5": "bg-purple-100 text-purple-700",
  "Grade 6": "bg-purple-100 text-purple-700",
  "Grade 7": "bg-amber-100 text-amber-700",
  "Grade 8": "bg-amber-100 text-amber-700",
};

const statusColors: Record<string, string> = {
  active: "text-green-600",
  waiting: "text-gold",
  awaiting_payment: "text-destructive",
};

const levels = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const Students = () => {
  const { studio } = useStudio();
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editStudent, setEditStudent] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [lessonModeStudent, setLessonModeStudent] = useState<any>(null);
  const [inviteStudent, setInviteStudent] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for adding
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newLevel, setNewLevel] = useState("Grade 1");
  const [newPiece, setNewPiece] = useState("");
  const [newDay, setNewDay] = useState("Monday");
  const [newTime, setNewTime] = useState("");
  const [newParentName, setNewParentName] = useState("");
  const [newParentEmail, setNewParentEmail] = useState("");
  const [newParentPhone, setNewParentPhone] = useState("");

  const { data: students, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (student: any) => {
      const { error } = await supabase.from("students").insert({
        ...student,
        studio_id: studio?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast({ title: "Student added" });
      setShowAdd(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (student: any) => {
      const { error } = await supabase.from("students").update(student).eq("id", student.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast({ title: "Student updated" });
      setEditStudent(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast({ title: "Student removed" });
    },
  });

  const resetForm = () => {
    setNewName(""); setNewAge(""); setNewLevel("Grade 1"); setNewPiece("");
    setNewDay("Monday"); setNewTime(""); setNewParentName(""); setNewParentEmail(""); setNewParentPhone("");
  };

  const handleInviteParent = async () => {
    const email = inviteEmail.trim() || inviteStudent?.parent_email;
    if (!email) {
      toast({ title: "Please enter a parent email", variant: "destructive" });
      return;
    }
    setInviteLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("invite-parent", {
        body: {
          parentEmail: email,
          parentName: inviteStudent?.parent_name,
          studentName: inviteStudent?.name,
          studentId: inviteStudent?.id,
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error || !data?.success) throw new Error(data?.error || error?.message || "Failed");
      setInviteLink(data.inviteLink);
      toast({
        title: data.emailSent ? "Invite sent!" : "Invite link generated",
        description: data.emailSent
          ? `Welcome email sent to ${email}`
          : "No email provider configured — copy the link below to share manually.",
      });
    } catch (err: any) {
      toast({ title: "Failed to send invite", description: err.message, variant: "destructive" });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyInviteLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({
      name: newName.trim(),
      age: parseInt(newAge) || null,
      level: newLevel,
      current_piece: newPiece || null,
      lesson_day: newDay,
      lesson_time: newTime || null,
      parent_name: newParentName || null,
      parent_email: newParentEmail || null,
      parent_phone: newParentPhone || null,
      status: "active",
    });
  };

  const filtered = (students ?? []).filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.parent_email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.parent_phone ?? "").includes(search);
    const matchLevel = filterLevel === "all" || s.level === filterLevel;
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchLevel && matchStatus;
  });

  const active = filtered.filter(s => s.status === "active");
  const waiting = (students ?? []).filter(s => s.status === "waiting");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Student Management</h1>
          <p className="text-muted-foreground mt-1">Manage your student roster, waiting list, and enrollment processes</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-primary text-primary-foreground hover:opacity-90 font-medium">
          <UserPlus size={18} className="mr-2" /> Add New Student
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search students by name, email, or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Skill Levels" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skill Levels</SelectItem>
                {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Student Directory */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold">Student Directory</h2>
            <span className="text-sm text-muted-foreground">{active.length} students</span>
          </div>
          
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.filter(s => s.status !== "waiting").map((student) => (
                <Card key={student.id} className="border-border/50 hover:shadow-md transition-all group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center text-charcoal font-bold text-sm">
                            {student.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${student.status === 'active' ? 'bg-green-500' : 'bg-amber-500'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium group-hover:text-gold transition-colors truncate max-w-[110px]">{student.name}</p>
                            {(student as any).internal_label && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-mono shrink-0">
                                {(student as any).internal_label}
                              </span>
                            )}
                          </div>
                          <span className={`text-xs font-medium ${statusColors[student.status] ?? "text-muted-foreground"}`}>
                            {student.status}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${levelColors[student.level] || 'bg-muted text-muted-foreground'}`}>
                        {student.level}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {student.parent_name && (
                        <div className="flex items-center gap-1.5 font-medium text-foreground/70">
                          <MessageCircle size={12} /> {student.parent_name}
                        </div>
                      )}
                      {student.lesson_day && (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} /> {student.lesson_day} · {student.lesson_time}
                        </div>
                      )}
                    </div>

                    {student.current_piece && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Current Piece</span>
                        </div>
                        <p className="text-xs font-medium truncate">{student.current_piece}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border/50">
                      {student.status === "active" && (
                        <Button size="sm" className="flex-1 h-8 text-xs bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold" onClick={() => setLessonModeStudent(student)}>
                          <PlayCircle size={12} className="mr-1" /> Start Lesson
                        </Button>
                      )}
                      {student.parent_email && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          onClick={() => {
                            setInviteStudent(student);
                            setInviteEmail(student.parent_email || "");
                            setInviteLink(null);
                          }}
                        >
                          <Send size={12} className="mr-1" /> Invite Parent
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs" onClick={() => setEditStudent(student)}>
                        <Edit size={12} className="mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(student.id)}>
                        <Trash2 size={12} className="mr-1" /> Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Waiting List Sidebar */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold">Waiting List</h2>
            <span className="text-sm text-gold font-medium">{waiting.length}</span>
          </div>
          <div className="space-y-3">
            {waiting.length > 0 ? waiting.map((student) => (
              <Card key={student.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{student.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColors[student.level] || 'bg-muted text-muted-foreground'}`}>
                      {student.level}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {student.parent_email && (
                      <div className="flex items-center gap-1.5">
                        <Mail size={11} /> {student.parent_email}
                      </div>
                    )}
                    {student.parent_phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={11} /> {student.parent_phone}
                      </div>
                    )}
                    {student.lesson_day && (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={11} /> {student.lesson_day}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={() => setEditStudent(student)}>
                      Contact
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 h-7 text-xs bg-primary text-primary-foreground"
                      onClick={() => updateMutation.mutate({ id: student.id, status: "active" })}
                    >
                      <UserPlus size={12} className="mr-1" /> Enroll
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">No students on waiting list</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Student Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Add New Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} required maxLength={100} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" value={newAge} onChange={e => setNewAge(e.target.value)} min={3} max={99} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={newLevel} onValueChange={setNewLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Current Piece</Label>
              <Input value={newPiece} onChange={e => setNewPiece(e.target.value)} maxLength={200} placeholder="e.g. Für Elise" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lesson Day</Label>
                <Select value={newDay} onValueChange={setNewDay}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lesson Time</Label>
                <Input value={newTime} onChange={e => setNewTime(e.target.value)} maxLength={20} placeholder="e.g. 10:00 AM" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Parent Name</Label>
                <Input value={newParentName} onChange={e => setNewParentName(e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Parent Email</Label>
                <Input type="email" value={newParentEmail} onChange={e => setNewParentEmail(e.target.value)} maxLength={255} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Parent Phone</Label>
              <Input value={newParentPhone} onChange={e => setNewParentPhone(e.target.value)} maxLength={20} placeholder="(555) 123-4567" />
            </div>
            <Button type="submit" className="w-full bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold" disabled={addMutation.isPending}>
              {addMutation.isPending ? "Adding..." : "Add Student"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editStudent} onOpenChange={() => setEditStudent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Student</DialogTitle>
          </DialogHeader>
          {editStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={editStudent.name} onChange={e => setEditStudent({ ...editStudent, name: e.target.value })} maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input type="number" value={editStudent.age ?? ""} onChange={e => setEditStudent({ ...editStudent, age: parseInt(e.target.value) || null })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <Select value={editStudent.level} onValueChange={v => setEditStudent({ ...editStudent, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Current Piece</Label>
                <Input value={editStudent.current_piece ?? ""} onChange={e => setEditStudent({ ...editStudent, current_piece: e.target.value })} maxLength={200} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lesson Day</Label>
                  <Select value={editStudent.lesson_day ?? ""} onValueChange={v => setEditStudent({ ...editStudent, lesson_day: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lesson Time</Label>
                  <Input value={editStudent.lesson_time ?? ""} onChange={e => setEditStudent({ ...editStudent, lesson_time: e.target.value })} maxLength={20} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStudent.status} onValueChange={v => setEditStudent({ ...editStudent, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => updateMutation.mutate(editStudent)} 
                className="w-full bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold"
                disabled={updateMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invite Parent Dialog */}
      <Dialog open={!!inviteStudent} onOpenChange={(open) => { if (!open) { setInviteStudent(null); setInviteLink(null); setInviteEmail(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Invite Parent</DialogTitle>
            <DialogDescription>
              Send {inviteStudent?.name}'s parent an invite to the parent portal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Parent Email</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="parent@example.com"
              />
            </div>

            <Button
              className="w-full bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold"
              onClick={handleInviteParent}
              disabled={inviteLoading}
            >
              <Send size={14} className="mr-2" />
              {inviteLoading ? "Sending..." : "Send Invite"}
            </Button>

            {inviteLink && (
              <div className="space-y-3 pt-2 border-t border-border/50">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Link size={12} /> Shareable invite link
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    className="text-xs font-mono truncate"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={handleCopyInviteLink}
                  >
                    {inviteCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  </Button>
                </div>
                {/* WhatsApp share button */}
                <Button
                  variant="outline"
                  className="w-full gap-2 border-green-500/40 text-green-700 hover:bg-green-50 hover:text-green-800"
                  onClick={() => {
                    const msg = encodeURIComponent(
                      `Hi${inviteStudent?.parent_name ? ` ${inviteStudent.parent_name}` : ""},\n\nHere's your invite link to access ${inviteStudent?.name}'s progress on the parent portal:\n\n${inviteLink}`
                    );
                    window.open(`https://wa.me/?text=${msg}`, "_blank");
                  }}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Share via WhatsApp
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson Mode */}
      {lessonModeStudent && (
        <LessonMode
          open={!!lessonModeStudent}
          onClose={() => setLessonModeStudent(null)}
          student={lessonModeStudent}
        />
      )}
    </div>
  );
};

export default Students;
