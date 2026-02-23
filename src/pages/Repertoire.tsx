import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Music, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

const genres = ["All", "Classical", "Romantic", "Contemporary", "Jazz", "Pop", "Around the World"] as const;
const levels = ["All", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"] as const;

interface Piece {
  title: string;
  composer: string;
  genre: string;
  level: string;
  duration: string;
}

const repertoire: Piece[] = [
  // Classical
  { title: "Minuet in G Major", composer: "J.S. Bach", genre: "Classical", level: "Grade 1", duration: "1:30" },
  { title: "Sonatina in C Major Op.36 No.1", composer: "Clementi", genre: "Classical", level: "Grade 2", duration: "3:00" },
  { title: "Prelude in C Major (WTC I)", composer: "J.S. Bach", genre: "Classical", level: "Grade 3", duration: "2:30" },
  { title: "Sonatina in G Major Op.36 No.5", composer: "Clementi", genre: "Classical", level: "Grade 4", duration: "5:00" },
  { title: "Sonata in C Major K.545", composer: "Mozart", genre: "Classical", level: "Grade 5", duration: "5:30" },
  { title: "Invention No.1 in C Major", composer: "J.S. Bach", genre: "Classical", level: "Grade 6", duration: "1:45" },
  // Romantic
  { title: "Für Elise", composer: "Beethoven", genre: "Romantic", level: "Grade 5", duration: "3:30" },
  { title: "Nocturne Op.9 No.2", composer: "Chopin", genre: "Romantic", level: "Grade 7", duration: "4:30" },
  { title: "Clair de Lune", composer: "Debussy", genre: "Romantic", level: "Grade 7", duration: "5:00" },
  { title: "Moonlight Sonata Mvt.1", composer: "Beethoven", genre: "Romantic", level: "Grade 6", duration: "6:00" },
  { title: "Waltz in A Minor", composer: "Chopin", genre: "Romantic", level: "Grade 3", duration: "2:00" },
  { title: "Träumerei", composer: "Schumann", genre: "Romantic", level: "Grade 5", duration: "3:00" },
  // Contemporary
  { title: "River Flows in You", composer: "Yiruma", genre: "Contemporary", level: "Grade 4", duration: "3:30" },
  { title: "Comptine d'un autre été", composer: "Yann Tiersen", genre: "Contemporary", level: "Grade 3", duration: "2:30" },
  { title: "Experience", composer: "Ludovico Einaudi", genre: "Contemporary", level: "Grade 6", duration: "5:00" },
  // Jazz
  { title: "Autumn Leaves (arr.)", composer: "Joseph Kosma", genre: "Jazz", level: "Grade 4", duration: "3:00" },
  { title: "Misty", composer: "Erroll Garner", genre: "Jazz", level: "Grade 6", duration: "3:30" },
  { title: "Take Five (arr.)", composer: "Dave Brubeck", genre: "Jazz", level: "Grade 5", duration: "4:00" },
  // Pop
  { title: "Someone Like You", composer: "Adele", genre: "Pop", level: "Grade 3", duration: "3:00" },
  { title: "Let It Be", composer: "The Beatles", genre: "Pop", level: "Grade 2", duration: "3:30" },
  { title: "Bohemian Rhapsody (arr.)", composer: "Queen", genre: "Pop", level: "Grade 6", duration: "5:00" },
  // Around the World
  { title: "Sakura Sakura", composer: "Traditional Japanese", genre: "Around the World", level: "Grade 1", duration: "1:30" },
  { title: "Arirang", composer: "Traditional Korean", genre: "Around the World", level: "Grade 2", duration: "2:00" },
  { title: "Danza Ritual del Fuego", composer: "Manuel de Falla", genre: "Around the World", level: "Grade 7", duration: "4:30" },
];

const genreColors: Record<string, string> = {
  "Classical": "bg-blue-50 text-blue-700 border-blue-200",
  "Romantic": "bg-rose-50 text-rose-700 border-rose-200",
  "Contemporary": "bg-teal-50 text-teal-700 border-teal-200",
  "Jazz": "bg-amber-50 text-amber-700 border-amber-200",
  "Pop": "bg-purple-50 text-purple-700 border-purple-200",
  "Around the World": "bg-green-50 text-green-700 border-green-200",
};

const Repertoire = () => {
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [selectedLevel, setSelectedLevel] = useState<string>("All");

  const filtered = repertoire.filter(p => 
    (selectedGenre === "All" || p.genre === selectedGenre) &&
    (selectedLevel === "All" || p.level === selectedLevel)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-3xl font-bold">Repertoire</h1>
        <p className="text-muted-foreground mt-1">Solo pieces suggested by level and genre.</p>
      </div>

      {/* Genre Filter */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Genre</p>
        <div className="flex flex-wrap gap-2">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedGenre === genre 
                  ? 'bg-gradient-gold text-charcoal shadow-gold' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Level Filter */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Level</p>
        <div className="flex flex-wrap gap-2">
          {levels.map(level => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedLevel === level 
                  ? 'bg-foreground text-background' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <p className="text-sm text-muted-foreground">{filtered.length} pieces found</p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((piece, i) => (
          <Card key={i} className="border-border/50 hover:shadow-md transition-all group cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center group-hover:bg-gradient-gold group-hover:text-charcoal transition-all">
                    <Music size={18} />
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-gold transition-colors">{piece.title}</p>
                    <p className="text-sm text-muted-foreground">{piece.composer}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className={`text-xs px-2 py-1 rounded-full border ${genreColors[piece.genre]}`}>
                  {piece.genre}
                </span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{piece.level}</span>
                  <span>~{piece.duration}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Repertoire;
