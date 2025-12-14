import { useState, useRef, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Image, X, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PhotoPickerProps {
  onPhotoSelected: (file: File) => void;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  maxSizeMB?: number;
}

const PhotoPicker = ({
  onPhotoSelected,
  trigger,
  title = "Add Photo",
  description = "Take a photo or choose from your library",
  maxSizeMB = 5,
}: PhotoPickerProps) => {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Please select an image smaller than ${maxSizeMB}MB.`,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    if (selectedFile) {
      setLoading(true);
      onPhotoSelected(selectedFile);
      setLoading(false);
      handleClose();
      toast({
        title: "Photo added! 📸",
        description: "Your photo has been attached.",
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const openLibrary = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Camera className="w-4 h-4" />
            Add Photo
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  setPreview(null);
                  setSelectedFile(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 py-4">
              <button
                onClick={openCamera}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-primary" />
                </div>
                <span className="font-medium">Take Photo</span>
              </button>
              <button
                onClick={openLibrary}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Image className="w-6 h-6 text-primary" />
                </div>
                <span className="font-medium">Photo Library</span>
              </button>
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {preview && (
              <Button onClick={handleConfirm} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Use This Photo
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PhotoPicker;