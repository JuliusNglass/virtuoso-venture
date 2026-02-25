import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "@/hooks/useStudio";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, XCircle, UserPlus, Inbox, CreditCard, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type LessonRequest = {
  id: string;
  parent_user_id: string;
  child_name: string;
  child_age: number | null;
  parent_name: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  preferred_level: string;
  preferred_day: string | null;
  preferred_time: string | null;
  notes: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const formatWhatsAppLink = (phone: string | null, message: string) => {
  if (!phone) return null;
  const cleaned = phone.replace(/[\s\-()]/g, "").replace(/^0/, "44");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
};

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Inbox size={14} />, color: "bg-amber-100 text-amber-700", label: "Pending" },
  accepted: { icon: <CheckCircle size={14} />, color: "bg-green-100 text-green-700", label: "Accepted" },
  waitlisted: { icon: <Clock size={14} />, color: "bg-blue-100 text-blue-700", label: "Waitlisted" },
  declined: { icon: <XCircle size={14} />, color: "bg-red-100 text-red-700", label: "Declined" },
};

const AdminRequests = () => {
  const { user, role } = useAuth();
  const { studio } = useStudio();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-lesson-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LessonRequest[];
    },
    enabled: !!user && role === "admin",
  });

  const { data: pendingPaymentStudents } = useQuery({
    queryKey: ["pending-payment-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("status", "pending_payment")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && role === "admin",
  });

  const updateRequest = useMutation({
    mutationFn: async ({ id, status, adminNote }: { id: string; status: string; adminNote?: string }) => {
      const updates: Record<string, any> = { status, reviewed_at: new Date().toISOString() };
      if (adminNote !== undefined) updates.admin_notes = adminNote;

      const { error } = await supabase.from("lesson_requests").update(updates).eq("id", id);
      if (error) throw error;

      // If accepted, create student record with pending_payment status
      if (status === "accepted") {
        const request = requests?.find(r => r.id === id);
        if (request) {
          const { error: studentError } = await supabase.from("students").insert({
            name: request.child_name,
            age: request.child_age,
            parent_name: request.parent_name,
            parent_email: request.parent_email,
            parent_phone: request.parent_phone,
            parent_user_id: request.parent_user_id,
            level: request.preferred_level,
            lesson_day: request.preferred_day,
            lesson_time: request.preferred_time,
            status: "pending_payment",
            studio_id: studio?.id ?? null,
          });
          if (studentError) throw studentError;
        }
      }

      // If waitlisted, create student with waiting status
      if (status === "waitlisted") {
        const request = requests?.find(r => r.id === id);
        if (request) {
          const { error: studentError } = await supabase.from("students").insert({
            name: request.child_name,
            age: request.child_age,
            parent_name: request.parent_name,
            parent_email: request.parent_email,
            parent_phone: request.parent_phone,
            parent_user_id: request.parent_user_id,
            level: request.preferred_level,
            lesson_day: request.preferred_day,
            lesson_time: request.preferred_time,
            status: "waiting",
            studio_id: studio?.id ?? null,
          });
          if (studentError) throw studentError;
        }
      }
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-lesson-requests"] });
      toast({ title: `Request ${status}`, description: `The lesson request has been ${status}.` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const confirmPayment = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase.from("students").update({ status: "active" }).eq("id", studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-payment-students"] });
      toast({ title: "Payment confirmed", description: "Student is now active." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const revertToWaiting = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase.from("students").update({ status: "waiting" }).eq("id", studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-payment-students"] });
      toast({ title: "Moved to waiting list", description: "Student has been moved to waiting list due to non-payment." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (role !== "admin") {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-muted-foreground p-6">Loading requests...</p>;
  }

  const pending = requests?.filter(r => r.status === "pending") || [];
  const reviewed = requests?.filter(r => r.status !== "pending") || [];
  const awaitingPayment = pendingPaymentStudents || [];

  const RequestCard = ({ request }: { request: LessonRequest }) => {
    const config = statusConfig[request.status] || statusConfig.pending;
    const note = adminNotes[request.id] ?? request.admin_notes ?? "";

    return (
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-medium text-lg">{request.child_name}</p>
              <p className="text-sm text-muted-foreground">
                {request.child_age ? `Age ${request.child_age} · ` : ""}{request.preferred_level}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${config.color}`}>
              {config.icon} {config.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
            <div><span className="text-muted-foreground">Parent:</span> {request.parent_name || "—"}</div>
            <div><span className="text-muted-foreground">Email:</span> {request.parent_email || "—"}</div>
            <div><span className="text-muted-foreground">Phone:</span> {request.parent_phone || "—"}</div>
            <div><span className="text-muted-foreground">Preferred day:</span> {request.preferred_day || "Flexible"}</div>
            <div><span className="text-muted-foreground">Preferred time:</span> {request.preferred_time || "Flexible"}</div>
          </div>

          {request.parent_phone && (
            <a
              href={formatWhatsAppLink(request.parent_phone, `Hi ${request.parent_name || "there"}, this is regarding ${request.child_name}'s piano lesson request with Shanika Music Academy.`)!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors mb-3"
            >
              <MessageCircle size={14} /> Message on WhatsApp
            </a>
          )}

          {request.notes && (
            <div className="text-sm bg-muted/50 rounded-lg p-3 mb-3">
              <span className="text-muted-foreground font-medium">Notes: </span>{request.notes}
            </div>
          )}

          <p className="text-xs text-muted-foreground mb-3">
            Submitted {new Date(request.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          {request.status === "pending" && (
            <div className="space-y-3 pt-3 border-t border-border/50">
              <Textarea
                placeholder="Admin notes (optional)..."
                value={note}
                onChange={e => setAdminNotes(prev => ({ ...prev, [request.id]: e.target.value }))}
                rows={2}
                maxLength={500}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => updateRequest.mutate({ id: request.id, status: "accepted", adminNote: note })}
                  disabled={updateRequest.isPending}
                >
                  <CheckCircle size={14} className="mr-1" /> Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => updateRequest.mutate({ id: request.id, status: "waitlisted", adminNote: note })}
                  disabled={updateRequest.isPending}
                >
                  <Clock size={14} className="mr-1" /> Waitlist
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => updateRequest.mutate({ id: request.id, status: "declined", adminNote: note })}
                  disabled={updateRequest.isPending}
                >
                  <XCircle size={14} className="mr-1" /> Decline
                </Button>
              </div>
            </div>
          )}

          {request.status !== "pending" && request.admin_notes && (
            <div className="text-sm bg-accent/10 rounded-lg p-3 mt-2">
              <span className="text-muted-foreground font-medium">Admin notes: </span>{request.admin_notes}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold flex items-center gap-3">
          <UserPlus size={28} /> Lesson Requests
        </h1>
        <p className="text-muted-foreground mt-1">
          {pending.length} pending · {awaitingPayment.length} awaiting payment · {reviewed.length} reviewed
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard size={14} className="mr-1" /> Awaiting Payment ({awaitingPayment.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed ({reviewed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pending.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pending.map(r => <RequestCard key={r.id} request={r} />)}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">No pending requests.</p>
          )}
        </TabsContent>

        <TabsContent value="payment" className="mt-4">
          {awaitingPayment.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {awaitingPayment.map(student => (
                <Card key={student.id} className="border-border/50">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-lg">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.age ? `Age ${student.age} · ` : ""}{student.level}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-700">
                        <CreditCard size={14} /> Awaiting Payment
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
                      <div><span className="text-muted-foreground">Parent:</span> {student.parent_name || "—"}</div>
                      <div><span className="text-muted-foreground">Email:</span> {student.parent_email || "—"}</div>
                      <div><span className="text-muted-foreground">Phone:</span> {student.parent_phone || "—"}</div>
                      <div><span className="text-muted-foreground">Lesson day:</span> {student.lesson_day || "TBC"}</div>
                      <div><span className="text-muted-foreground">Lesson time:</span> {student.lesson_time || "TBC"}</div>
                    </div>
                    {student.parent_phone && (
                      <a
                        href={formatWhatsAppLink(student.parent_phone, `Hi ${student.parent_name || "there"}, this is a reminder regarding payment for ${student.name}'s piano lessons with Shanika Music Academy.`)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors mb-3"
                      >
                        <MessageCircle size={14} /> Send Payment Reminder
                      </a>
                    )}
                    <div className="flex gap-2 pt-3 border-t border-border/50">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => confirmPayment.mutate(student.id)}
                        disabled={confirmPayment.isPending}
                      >
                        <CheckCircle size={14} className="mr-1" /> Confirm Payment
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => revertToWaiting.mutate(student.id)}
                        disabled={revertToWaiting.isPending}
                      >
                        <Clock size={14} className="mr-1" /> Move to Waiting
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">No students awaiting payment.</p>
          )}
        </TabsContent>

        <TabsContent value="reviewed" className="mt-4">
          {reviewed.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {reviewed.map(r => <RequestCard key={r.id} request={r} />)}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">No reviewed requests yet.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminRequests;
