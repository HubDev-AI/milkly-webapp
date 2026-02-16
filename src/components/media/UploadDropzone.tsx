import { useState, useCallback } from "react";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/Utils";
import { UPLOAD } from "@/lib/Constants";

interface UploadDropzoneProps {
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
  accept?: string;
  maxSize?: number;
  className?: string;
  compact?: boolean;
}

export function UploadDropzone({
  onUpload,
  isUploading = false,
  accept = "image/*",
  maxSize = UPLOAD.MAX_FILE_SIZE_BYTES,
  className,
  compact = false,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!file.type.startsWith("image/")) {
        return "Only image files are allowed";
      }
      if (file.size > maxSize) {
        return `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`;
      }
      return null;
    },
    [maxSize]
  );

  const handleFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      await onUpload(file);
    },
    [onUpload, validateFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        await handleFile(files[0]);
      }
      e.target.value = "";
    },
    [handleFile]
  );

  if (compact) {
    return (
      <label
        className={cn(
          "relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-all",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50",
          isUploading && "pointer-events-none opacity-60",
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="sr-only"
          disabled={isUploading}
        />
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Uploading...</span>
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            <span className="text-sm">Upload</span>
          </>
        )}
      </label>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label
        className={cn(
          "relative flex flex-col items-center justify-center py-10 px-4 rounded-2xl border border-dashed cursor-pointer transition-all duration-300 overflow-hidden group",
          isDragging
            ? "border-primary bg-primary/10 scale-[1.01] shadow-[0_0_20px_rgba(var(--primary),0.1)]"
            : "border-primary/20 hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5",
          isUploading && "pointer-events-none opacity-60"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="sr-only"
          disabled={isUploading}
        />
        <div className="flex flex-col items-center text-center">
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
              <p className="text-sm font-medium">Uploading...</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-primary/20 shadow-inner">
                <Upload className="h-8 w-8 text-primary group-hover:text-primary transition-colors" />
              </div>
              <p className="text-lg font-serif font-medium text-foreground group-hover:text-primary transition-colors">
                {isDragging ? "Drop to upload" : "Upload Media"}
              </p>
              <p className="text-xs text-muted-foreground mt-2 max-w-xs text-center leading-relaxed">
                Drag and drop your high-resolution images here, or click to browse. Suports up to {Math.round(maxSize / 1024 / 1024)}MB.
              </p>
            </>
          )}
        </div>
      </label>
      {error ? (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}
    </div>
  );
}
