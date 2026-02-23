import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Music, Camera, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FileUploadDialogProps {
  students: { id: string; name: string }[];
  onUploaded?: () => void;
}

const fileTypes = [
  { value: "music_sheet", label: "Music Sheet", icon: Music },
  { value: "score", label: "Downloaded Score", icon: FileText },
  { value: "photo", label: "Photo", icon: Camera },
  { value: "document", label: "Document", icon: FileText },
];

const FileUploadDialog = ({ students, onUploaded }: FileUploadDialogProps) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState("music_sheet");
  const [studentId, setStudentId] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${fileType}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage.from("studio-files").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("files").insert({
        name: file.name,
        file_path: filePath,
        file_type: fileType,
        student_id: studentId && studentId !== "none" ? studentId : null,
        file_size: file.size,
        mime_type: file.type,
      });
      if (dbError) throw dbError;

      toast({ title: "File uploaded", description: `${file.name} uploaded successfully.` });
      setOpen(false);
      setFile(null);
      setStudentId("");
      onUploaded?.();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold font-medium">
          <Upload size={18} className="mr-2" /> Upload File
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Upload File</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>File Type</Label>
            <Select value={fileType} onValueChange={setFileType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {fileTypes.map(ft => (
                  <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assign to Student (optional)</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>File</Label>
            <div className="flex gap-2 mb-2">
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                <Upload size={14} className="mr-1.5" /> Choose File
              </Button>
              <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => cameraInputRef.current?.click()}>
                <Camera size={14} className="mr-1.5" /> Scan / Photo
              </Button>
            </div>
            {file ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <FileText size={18} />
                <span className="text-sm font-medium truncate flex-1">{file.name}</span>
                <button type="button" onClick={() => setFile(null)}>
                  <X size={14} className="text-muted-foreground" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">PDF, images, or documents up to 10MB</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            <input
              ref={cameraInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <Button type="submit" className="w-full bg-gradient-gold text-charcoal hover:opacity-90 shadow-gold" disabled={!file || uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadDialog;
