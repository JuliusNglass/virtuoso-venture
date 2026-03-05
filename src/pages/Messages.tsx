import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "@/hooks/useStudio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Plus, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const Messages = () => {
  const { user } = useAuth();
  const { studio } = useStudio();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const { data: students } = useQuery({
    queryKey: ["students-list-msg"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id, name").eq("status", "active").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: threads } = useQuery({
    queryKey: ["message-threads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_threads")
        .select("*, students(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["messages", selectedThreadId],
    queryFn: async () => {
      if (!selectedThreadId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", selectedThreadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedThreadId,
  });

  const createThreadMutation = useMutation({
    mutationFn: async (studentId: string) => {
      // Check if thread exists
      const { data: existing } = await supabase
        .from("message_threads")
        .select("id")
        .eq("student_id", studentId)
        .maybeSingle();
      if (existing) { setSelectedThreadId(existing.id); return; }
      const { data, error } = await supabase
        .from("message_threads")
        .insert({ studio_id: studio?.id ?? null, student_id: studentId })
        .select("id")
        .single();
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["message-threads"] });
      setSelectedThreadId(data.id);
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedThreadId || !newMessage.trim() || !user) return;
      const thread = threads?.find(t => t.id === selectedThreadId);
      const { error } = await supabase.from("messages").insert({
        studio_id: studio?.id ?? null,
        thread_id: selectedThreadId,
        sender_user_id: user.id,
        body: newMessage.trim(),
      });
      if (error) throw error;
      setNewMessage("");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages", selectedThreadId] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const selectedThread = threads?.find(t => t.id === selectedThreadId);
  const studentsWithoutThread = students?.filter(s => !threads?.find(t => (t as any).students?.id === s.id || (t as any).student_id === s.id));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-1">Communicate with parents about their child's progress</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[600px]">
        {/* Threads list */}
        <Card className="border-border/50 lg:col-span-1 flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-base">Conversations</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-1 pb-3 px-3">
            {threads && threads.length > 0 ? threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => setSelectedThreadId(thread.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                  selectedThreadId === thread.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  selectedThreadId === thread.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-gradient-gold text-charcoal"
                }`}>
                  {(thread as any).students?.name?.slice(0, 2).toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{(thread as any).students?.name}</p>
                  <p className={`text-xs truncate ${selectedThreadId === thread.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                  </p>
                </div>
              </button>
            )) : (
              <div className="text-center py-8">
                <MessageCircle size={28} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No conversations yet</p>
              </div>
            )}

            {/* Start new thread */}
            {studentsWithoutThread && studentsWithoutThread.length > 0 && (
              <div className="pt-3 border-t border-border/50 mt-2">
                <p className="text-xs text-muted-foreground px-2 mb-2">Start conversation</p>
                {studentsWithoutThread.map(s => (
                  <button
                    key={s.id}
                    onClick={() => createThreadMutation.mutate(s.id)}
                    className="w-full flex items-center gap-2 p-2.5 rounded-xl hover:bg-muted text-left text-sm text-muted-foreground transition-colors"
                  >
                    <Plus size={13} /> {s.name}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message view */}
        <Card className="border-border/50 lg:col-span-2 flex flex-col">
          {selectedThread ? (
            <>
              <CardHeader className="pb-3 border-b border-border/50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center text-charcoal font-bold text-xs">
                    {(selectedThread as any).students?.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{(selectedThread as any).students?.name}</p>
                    <p className="text-xs text-muted-foreground">Teacher ↔ Parent</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto py-4 px-4 space-y-3">
                {messages && messages.length > 0 ? messages.map(msg => {
                  const isMe = msg.sender_user_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}>
                        <p>{msg.body}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="flex-1 flex items-center justify-center py-12 text-center">
                    <div>
                      <MessageCircle size={32} className="text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No messages yet.</p>
                      <p className="text-xs text-muted-foreground">Start the conversation below.</p>
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="border-t border-border/50 p-4 flex gap-2">
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMutation.mutate())}
                  placeholder="Type a message..."
                  className="flex-1 text-sm"
                  maxLength={1000}
                />
                <Button
                  onClick={() => sendMutation.mutate()}
                  disabled={!newMessage.trim() || sendMutation.isPending}
                  className="bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold"
                  size="icon"
                >
                  <Send size={16} />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageCircle size={40} className="text-muted-foreground/20 mx-auto mb-3" />
                <p className="font-heading font-semibold text-lg">No conversation selected</p>
                <p className="text-sm text-muted-foreground mt-1">Pick a student thread from the left, or start a new one.</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Messages;
