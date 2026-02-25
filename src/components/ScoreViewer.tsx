import { useState, useCallback, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Pen, Eraser, Save, Loader2 } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface ScoreViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  fileName: string;
  fileId: string;
}

interface DrawPoint {
  x: number;
  y: number;
}

interface Stroke {
  points: DrawPoint[];
  color: string;
  width: number;
}

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];

const ScoreViewer = ({ open, onOpenChange, fileUrl, fileName, fileId }: ScoreViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [annotating, setAnnotating] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawPoint[]>([]);
  const [erasing, setErasing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load annotations for current page
  const { data: savedAnnotations } = useQuery({
    queryKey: ["annotations", fileId, pageNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("score_annotations")
        .select("*")
        .eq("file_id", fileId)
        .eq("page_number", pageNumber)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: open && !!fileId,
  });

  // Load saved strokes when annotations data changes
  useEffect(() => {
    if (savedAnnotations?.annotations) {
      try {
        const parsed = typeof savedAnnotations.annotations === "string"
          ? JSON.parse(savedAnnotations.annotations)
          : savedAnnotations.annotations;
        setStrokes(Array.isArray(parsed) ? parsed : []);
      } catch {
        setStrokes([]);
      }
    } else {
      setStrokes([]);
    }
  }, [savedAnnotations]);

  // Save annotations mutation
  const saveMutation = useMutation({
    mutationFn: async (strokeData: Stroke[]) => {
      const { data: existing } = await supabase
        .from("score_annotations")
        .select("id")
        .eq("file_id", fileId)
        .eq("page_number", pageNumber)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("score_annotations")
          .update({ annotations: JSON.stringify(strokeData) as any })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("score_annotations")
          .insert({
            file_id: fileId,
            page_number: pageNumber,
            annotations: JSON.stringify(strokeData) as any,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annotations", fileId, pageNumber] });
      toast({ title: "Annotations saved" });
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  // Redraw canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allStrokes = [...strokes, ...(currentStroke.length > 0 ? [{ points: currentStroke, color: currentColor, width: 3 }] : [])];

    allStrokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [strokes, currentStroke, currentColor]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Resize canvas to match page
  const syncCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const pageEl = container.querySelector(".react-pdf__Page") as HTMLElement;
    if (pageEl) {
      canvas.width = pageEl.clientWidth;
      canvas.height = pageEl.clientHeight;
      redrawCanvas();
    }
  }, [redrawCanvas]);

  useEffect(() => {
    if (open) setTimeout(syncCanvas, 500);
  }, [open, pageNumber, scale, syncCanvas]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>): DrawPoint => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!annotating) return;
    if (erasing) {
      const pos = getPos(e);
      setStrokes((prev) =>
        prev.filter((s) => !s.points.some((p) => Math.hypot(p.x - pos.x, p.y - pos.y) < 12))
      );
      return;
    }
    setDrawing(true);
    setCurrentStroke([getPos(e)]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    setCurrentStroke((prev) => [...prev, getPos(e)]);
  };

  const handleMouseUp = () => {
    if (!drawing) return;
    setDrawing(false);
    if (currentStroke.length > 1) {
      setStrokes((prev) => [...prev, { points: currentStroke, color: currentColor, width: 3 }]);
    }
    setCurrentStroke([]);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-5 pt-4 pb-2 border-b">
          <DialogTitle className="font-heading text-lg truncate">{fileName}</DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={pageNumber <= 1}>
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm font-medium min-w-[80px] text-center">
              {pageNumber} / {numPages}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))} disabled={pageNumber >= numPages}>
              <ChevronRight size={16} />
            </Button>
          </div>

          <div className="h-5 w-px bg-border" />

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}>
              <ZoomOut size={16} />
            </Button>
            <span className="text-xs font-mono min-w-[40px] text-center">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.min(3, s + 0.2))}>
              <ZoomIn size={16} />
            </Button>
          </div>

          <div className="h-5 w-px bg-border" />

          <Button
            variant={annotating && !erasing ? "default" : "ghost"}
            size="sm"
            onClick={() => { setAnnotating(true); setErasing(false); }}
          >
            <Pen size={14} className="mr-1" /> Draw
          </Button>
          <Button
            variant={erasing ? "default" : "ghost"}
            size="sm"
            onClick={() => { setAnnotating(true); setErasing(true); }}
          >
            <Eraser size={14} className="mr-1" /> Erase
          </Button>

          {annotating && !erasing && (
            <div className="flex items-center gap-1 ml-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${currentColor === c ? "border-foreground scale-125" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setCurrentColor(c)}
                />
              ))}
            </div>
          )}

          {annotating && (
            <>
              <Button size="sm" variant="ghost" onClick={() => { setAnnotating(false); setErasing(false); }}>
                Done
              </Button>
              <Button size="sm" onClick={() => saveMutation.mutate(strokes)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />}
                Save
              </Button>
            </>
          )}
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-muted/20 flex justify-center p-4" ref={containerRef}>
          <div className="relative inline-block">
            <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-muted-foreground" size={32} /></div>}>
              <Page pageNumber={pageNumber} scale={scale} onRenderSuccess={syncCanvas} />
            </Document>
            {/* Annotation overlay canvas */}
            <canvas
              ref={canvasRef}
              className={`absolute top-0 left-0 ${annotating ? (erasing ? "cursor-crosshair" : "cursor-crosshair") : "pointer-events-none"}`}
              style={{ zIndex: 10 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScoreViewer;
