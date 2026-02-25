import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { CheckCircle2, Music, BookOpen, Users, Calendar, FileText, Bell } from "lucide-react";

const leadSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
});

type LeadForm = z.infer<typeof leadSchema>;

const features = [
  {
    icon: BookOpen,
    title: "Every lesson logged in seconds",
    description: "Notes, homework, pieces covered — all in one place. No more scrambling before the next session.",
  },
  {
    icon: Users,
    title: "Parents stay in the loop",
    description: "A live portal so parents always know what was covered and what to practise. Zero extra work for you.",
  },
  {
    icon: FileText,
    title: "Sheet music, organised",
    description: "Upload and store scores so nothing gets lost between lessons. Access from anywhere.",
  },
  {
    icon: Calendar,
    title: "Student progress at a glance",
    description: "Track repertoire and progress over time. See exactly where each student is in their journey.",
  },
  {
    icon: Bell,
    title: "Lesson requests, handled",
    description: "New students come to you already organised. No more back-and-forth emails just to get started.",
  },
  {
    icon: Music,
    title: "Built by a musician, for musicians",
    description: "Not built by a tech company. Built by a classically trained teacher who lived these exact problems.",
  },
];

const painPoints = [
  "Chasing parents for updates at 10pm",
  "Forgetting what you covered last week",
  "Losing track of repertoire across 20+ students",
  "Spending evenings on admin instead of music",
  "Parents who feel disconnected from their child's progress",
];

export default function SalesPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: "", email: "" },
  });

  const onSubmit = async (values: LeadForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("leads").insert({
        name: values.name,
        email: values.email,
        source: "sales_page",
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      form.setError("email", { message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            For independent piano teachers
          </div>
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Stop drowning in admin.<br />
            <span className="text-primary">Start teaching more.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground">
            StudioDesk is the all-in-one studio management tool built by a classically trained musician who got tired of the chaos — and built the tool they always wished existed.
          </p>
          <a href="#waitlist">
            <Button size="lg" className="px-8 py-6 text-base font-semibold shadow-lg">
              Join the Early Access List →
            </Button>
          </a>
        </div>
      </section>

      {/* Pain points */}
      <section className="bg-muted/40 px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-3 text-2xl font-bold">Sound familiar?</h2>
          <p className="mb-8 text-muted-foreground">
            If you're running a private studio, you know the feeling. The teaching is the easy part.
          </p>
          <ul className="space-y-3 text-left">
            {painPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 rounded-lg border bg-background px-5 py-4 shadow-sm">
                <span className="mt-0.5 text-destructive">✕</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-lg font-medium">
            You became a teacher because you love music — not because you love spreadsheets.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold">Everything your studio needs, in one place</h2>
            <p className="text-muted-foreground">
              StudioDesk handles the admin so you can focus on the lesson.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof / story */}
      <section className="bg-primary/5 px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 text-4xl">🎹</div>
          <blockquote className="text-lg font-medium leading-relaxed">
            "I built this because I was spending my evenings on admin instead of music. After years of teaching, I finally created the tool I always needed — and now I want to make it available to every teacher who feels the same way."
          </blockquote>
          <p className="mt-4 text-sm text-muted-foreground">— Founder, classically trained musician & piano teacher</p>
        </div>
      </section>

      {/* Lead capture */}
      <section id="waitlist" className="px-6 py-20">
        <div className="mx-auto max-w-lg text-center">
          {submitted ? (
            <div className="rounded-2xl border bg-card p-10 shadow-md">
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h2 className="mb-2 text-2xl font-bold">You're on the list!</h2>
              <p className="text-muted-foreground">
                Thank you — we'll be in touch soon with early access details. Keep an eye on your inbox.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border bg-card p-8 shadow-md sm:p-10">
              <h2 className="mb-2 text-2xl font-bold">Get early access</h2>
              <p className="mb-8 text-muted-foreground">
                Join the waitlist and be first to know when StudioDesk opens its doors. No spam, ever.
              </p>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="email" placeholder="Your email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full py-5 text-base font-semibold" disabled={loading}>
                    {loading ? "Submitting…" : "Yes, I want early access →"}
                  </Button>
                </form>
              </Form>
              <p className="mt-4 text-xs text-muted-foreground">
                No credit card. No commitment. Just early access.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        <p>StudioDesk · Built by a musician, for musicians</p>
      </footer>
    </div>
  );
}
