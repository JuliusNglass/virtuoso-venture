import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { repertoire } from "@/lib/repertoireData";
import { cn } from "@/lib/utils";

interface PiecesMultiSelectProps {
  selected: string[];
  onChange: (pieces: string[]) => void;
  className?: string;
}

const PiecesMultiSelect = ({ selected, onChange, className }: PiecesMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = repertoire.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.composer.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (title: string) => {
    onChange(
      selected.includes(title)
        ? selected.filter(s => s !== title)
        : [...selected, title]
    );
  };

  const remove = (title: string) => {
    onChange(selected.filter(s => s !== title));
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[36px] text-sm font-normal"
          >
            <span className="truncate text-muted-foreground">
              {selected.length === 0
                ? "Select pieces..."
                : `${selected.length} piece${selected.length > 1 ? "s" : ""} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <div className="p-2 border-b border-border">
            <Input
              placeholder="Search pieces..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No pieces found</p>
            ) : (
              filtered.map(piece => {
                const isSelected = selected.includes(piece.title);
                return (
                  <button
                    key={piece.title}
                    type="button"
                    onClick={() => toggle(piece.title)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left hover:bg-muted transition-colors",
                      isSelected && "bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 shrink-0 rounded-sm border border-primary flex items-center justify-center",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-background"
                    )}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{piece.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{piece.composer} · {piece.level}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map(title => (
            <span
              key={title}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium"
            >
              {title}
              <button type="button" onClick={() => remove(title)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default PiecesMultiSelect;
