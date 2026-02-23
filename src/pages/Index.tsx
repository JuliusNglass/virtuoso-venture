import heroImage from "@/assets/hero-piano.jpg";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Music, Users, Calendar, BookOpen, GraduationCap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <img 
          src={heroImage} 
          alt="Grand piano in warm studio light" 
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/70 via-charcoal/50 to-background" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
          <p className="text-gold font-body text-sm tracking-[0.3em] uppercase mb-4 animate-fade-in">Welcome to</p>
          <h1 className="font-heading text-5xl md:text-7xl font-bold text-ivory mb-4 animate-slide-up">
            Shanika Piano Academy
          </h1>
          <p className="text-ivory/80 text-lg md:text-xl max-w-xl mb-8 animate-fade-in font-light">
            Your complete studio management — students, lessons, progress, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
            <Button 
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold font-semibold text-base px-8 py-6 rounded-full"
            >
              Enter Studio
            </Button>
            <Button 
              onClick={() => navigate('/parent')}
              variant="outline"
              className="border-ivory/30 text-ivory hover:bg-ivory/10 font-semibold text-base px-8 py-6 rounded-full"
            >
              <GraduationCap size={18} className="mr-2" /> Parent Portal
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Users, title: "Student Profiles", desc: "Manage all your students, parents, and waiting list" },
            { icon: BookOpen, title: "Lesson Notes", desc: "Track progress, homework, and attendance" },
            { icon: Calendar, title: "Calendar", desc: "Schedule lessons, mark attendance, track cancellations" },
            { icon: Music, title: "Repertoire", desc: "Curated pieces across genres and levels" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center group">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-accent/20 flex items-center justify-center group-hover:bg-gradient-gold group-hover:text-charcoal transition-all duration-300">
                <Icon size={24} />
              </div>
              <h3 className="font-heading text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 Shanika Piano Academy. Built with 🎹</p>
      </footer>
    </div>
  );
};

export default Index;
