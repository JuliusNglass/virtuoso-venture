export interface Piece {
  title: string;
  composer: string;
  genre: string;
  level: string;
  duration: string;
}

export const repertoire: Piece[] = [
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

export const repertoireTitles = repertoire.map(p => `${p.title} – ${p.composer}`);
