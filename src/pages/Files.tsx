import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, FileText, Camera, Download, Trash2, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import FileUploadDialog from "@/components/FileUploadDialog";
import ScoreViewer from "@/components/ScoreViewer";
import IMSLPSearch from "@/components/IMSLPSearch";

const fileTypeIcons: Record<string, typeof FileText> = {
  music_sheet: Music,
  score: FileText,
  photo: Camera,
  document: FileText,
};

const fileTypeLabels: Record<string, string> = {
  music_sheet: "Music Sheet",
  score: "Score",
  photo: "Photo",
  document: "Document",
};

const viewableTypes = ["application/pdf"];

const Files = () => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewerFile, setViewerFile] = useState<{ url: string; name: string; id: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: files, isLoading } = useQuery({
    queryKey: ["files"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("files")
        .select("*, students(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: students } = useQuery({
    queryKey: ["students-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (file: { id: string; file_path: string }) => {
      await supabase.storage.from("studio-files").remove([file.file_path]);
      const { error } = await supabase.from("files").delete().eq("id", file.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast({ title: "File deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const filtered = files?.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || f.file_type === filterType;
    return matchesSearch && matchesType;
  });

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getPublicUrl = (filePath: string) =>
    `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/studio-files/${filePath}`;

  const canView = (mimeType: string | null) =>
    mimeType && (viewableTypes.includes(mimeType) || mimeType.startsWith("image/"));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Files</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage music sheets, scores, and photos
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <IMSLPSearch />
          <FileUploadDialog
            students={students ?? []}
            onUploaded={() => queryClient.invalidateQueries({ queryKey: ["files"] })}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="music_sheet">Music Sheets</SelectItem>
            <SelectItem value="score">Scores</SelectItem>
            <SelectItem value="photo">Photos</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* File Grid */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading files...</p>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((file) => {
            const Icon = fileTypeIcons[file.file_type] || FileText;
            const publicUrl = getPublicUrl(file.file_path);
            const isViewable = canView(file.mime_type);
            return (
              <Card key={file.id} className="border-border/50 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                      <Icon size={20} className="text-accent-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fileTypeLabels[file.file_type] || file.file_type}
                        {(file as any).students?.name && ` · ${(file as any).students.name}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatSize(file.file_size)} · {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 justify-end">
                    {isViewable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewerFile({ url: publicUrl, name: file.name, id: file.id })}
                      >
                        <Eye size={14} className="mr-1" /> View
                      </Button>
                    )}
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm">
                        <Download size={14} className="mr-1" /> Download
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate({ id: file.id, file_path: file.file_path })}
                    >
                      <Trash2 size={14} className="mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <FileText size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No files found</p>
          <p className="text-sm text-muted-foreground mt-1">Upload music sheets, scores, or photos to get started.</p>
        </div>
      )}

      {/* Score Viewer */}
      {viewerFile && (
        <ScoreViewer
          open={!!viewerFile}
          onOpenChange={(open) => !open && setViewerFile(null)}
          fileUrl={viewerFile.url}
          fileName={viewerFile.name}
          fileId={viewerFile.id}
        />
      )}
    </div>
  );
};

export default Files;
