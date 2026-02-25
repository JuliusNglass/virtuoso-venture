import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Music, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { repertoire, type Piece } from "@/lib/repertoireData";

const genres = ["All", "Classical", "Romantic", "Contemporary", "Jazz", "Pop", "Around the World"] as const;
const levels = ["All", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"] as const;

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
