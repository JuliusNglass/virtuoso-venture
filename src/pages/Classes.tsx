import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStudio } from "@/hooks/useStudio";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Users, Calendar, Clock, ChevronRight, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const CreateClassDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { studio } = useStudio();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [duration, setDuration] = useState("60");
  const [defaultDay, setDefaultDay] = useState<string>("");
  const [defaultTime, setDefaultTime] = useState("16:00");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !studio) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("classes").insert({
        studio_id: studio.id,
        name: name.trim(),
        teacher_user_id: user!.id,
        capacity: capacity ? parseInt(capacity) : null,
        duration_minutes: parseInt(duration) || 60,
        default_day: defaultDay || null,
        default_time: defaultTime || null,
        status: "active",
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["classes", studio.id] });
      toast({ title: "Class created ✓" });
      handleClose();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName(""); setCapacity(""); setDuration("60");
    setDefaultDay(""); setDefaultTime("16:00");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={18} className="text-primary" /> Create Class
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Class Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Junior Ensemble, Theory Group A" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Capacity</Label>
              <Input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g. 8" min="1" max="50" />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (min)</Label>
              <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="60" min="15" max="240" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Default Day</Label>
              <Select value={defaultDay} onValueChange={setDefaultDay}>
                <SelectTrigger><SelectValue placeholder="Any day" /></SelectTrigger>
                <SelectContent>
                  {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Default Time</Label>
              <Input type="time" value={defaultTime} onChange={e => setDefaultTime(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className="bg-gradient-gold text-charcoal hover:opacity-90 font-semibold shadow-gold"
          >
            {loading ? <><Loader2 size={14} className="mr-2 animate-spin" /> Creating…</> : "Create Class"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Classes = () => {
  const { studio } = useStudio();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: classes, isLoading } = useQuery({
    queryKey: ["classes", studio?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*, class_members(count), class_sessions(starts_at, status)")
        .eq("studio_id", studio!.id)
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!studio?.id,
  });

  const getNextSession = (sessions: any[]) => {
    if (!sessions) return null;
    const upcoming = sessions
      .filter(s => s.status === "scheduled" && new Date(s.starts_at) >= new Date())
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    return upcoming[0] ?? null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Classes</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage group classes, rosters, and sessions.</p>
        </div>
        <Button
          className="bg-gradient-gold text-charcoal hover:opacity-90 font-semibold shadow-gold"
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={14} className="mr-1.5" /> Create Class
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <Card key={i} className="border-border/50 animate-pulse">
              <CardContent className="p-5 h-32" />
            </Card>
          ))}
        </div>
      ) : classes?.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-primary" />
            </div>
            <h3 className="font-heading font-semibold text-lg mb-2">No classes yet</h3>
            <p className="text-muted-foreground text-sm mb-6">Create your first group class to get started.</p>
            <Button className="bg-gradient-gold text-charcoal hover:opacity-90 font-semibold shadow-gold" onClick={() => setCreateOpen(true)}>
              <Plus size={14} className="mr-1.5" /> Create Class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(classes ?? []).map((cls: any) => {
            const memberCount = cls.class_members?.[0]?.count ?? 0;
            const nextSession = getNextSession(cls.class_sessions ?? []);
            return (
              <Card
                key={cls.id}
                className="border-border/50 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all duration-150"
                onClick={() => navigate(`/classes/${cls.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                      <Users size={18} className="text-indigo-600" />
                    </div>
                    <Badge variant="secondary" className="text-xs">{memberCount} students</Badge>
                  </div>
                  <h3 className="font-heading font-bold text-base mb-1">{cls.name}</h3>
                  <div className="space-y-1">
                    {cls.default_day && cls.default_time && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock size={11} /> {cls.default_day}s at {cls.default_time}
                      </p>
                    )}
                    {cls.duration_minutes && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock size={11} /> {cls.duration_minutes} min sessions
                      </p>
                    )}
                    {nextSession && (
                      <p className="text-xs text-indigo-600 flex items-center gap-1.5 font-medium">
                        <Calendar size={11} /> Next: {format(parseISO(nextSession.starts_at), "d MMM, HH:mm")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-end mt-3">
                    <ChevronRight size={15} className="text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateClassDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
};

export default Classes;
