import { Users, BookOpen, Calendar, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { label: "Active Students", value: "24", icon: Users, trend: "+3 this term" },
  { label: "Lessons This Week", value: "18", icon: BookOpen, trend: "2 remaining" },
  { label: "Attendance Rate", value: "94%", icon: Calendar, trend: "+2% vs last month" },
  { label: "Revenue (March)", value: "£2,880", icon: TrendingUp, trend: "£120 pending" },
];

const recentLessons = [
  { student: "Emma Thompson", time: "10:00 AM", piece: "Für Elise", status: "completed" },
  { student: "Oliver Chen", time: "11:00 AM", piece: "Prelude in C Major", status: "completed" },
  { student: "Sophie Williams", time: "2:00 PM", piece: "Clair de Lune", status: "upcoming" },
  { student: "James Patel", time: "3:30 PM", piece: "Nocturne Op.9 No.2", status: "upcoming" },
];

const upcomingReminders = [
  { text: "Term 2 invoices due — 12 parents pending", type: "warning" },
  { text: "Recital preparation meeting — Saturday 10 AM", type: "info" },
  { text: "New student enquiry — Waiting list #5", type: "info" },
];

const Dashboard = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold">Good morning, Shanika</h1>
        <p className="text-muted-foreground mt-1">Here's your studio overview for today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, trend }) => (
          <Card key={label} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-heading font-bold mt-1">{value}</p>
                  <p className="text-xs text-gold mt-2">{trend}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Icon size={20} className="text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Lessons */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg">Today's Lessons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLessons.map((lesson, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center text-charcoal text-xs font-bold">
                    {lesson.student.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{lesson.student}</p>
                    <p className="text-xs text-muted-foreground">{lesson.piece}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{lesson.time}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    lesson.status === 'completed' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-accent/20 text-accent-foreground'
                  }`}>
                    {lesson.status}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg">Reminders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingReminders.map((reminder, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                {reminder.type === 'warning' 
                  ? <AlertCircle size={18} className="text-gold mt-0.5 shrink-0" /> 
                  : <Clock size={18} className="text-muted-foreground mt-0.5 shrink-0" />
                }
                <p className="text-sm">{reminder.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
