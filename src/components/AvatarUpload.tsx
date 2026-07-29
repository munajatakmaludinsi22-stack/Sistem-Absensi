import React, { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "../utils/api";

interface AvatarUploadProps {
  photoUrl?: string | null;
  fallbackText: string;
  size?: number;
  editable?: boolean;
  onUpload: (file: File) => Promise<void>;
  ringClassName?: string;
  badgeClassName?: string;
}

export default function AvatarUpload({
  photoUrl,
  fallbackText,
  size = 80,
  editable = true,
  onUpload,
  ringClassName = "border-blue-100",
  badgeClassName = "bg-blue-600 hover:bg-blue-700",
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
      toast.show("Foto berhasil diperbarui!", "success");
    } catch (err: any) {
      toast.show(err.message || "Gagal mengunggah foto!", "error");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <div
        className={`rounded-full overflow-hidden bg-blue-600/10 text-blue-700 font-extrabold flex items-center justify-center uppercase border-2 ${ringClassName}`}
        style={{ width: size, height: size, fontSize: Math.max(12, size * 0.35) }}
      >
        {photoUrl ? (
          <img src={photoUrl} alt="Foto" className="w-full h-full object-cover" />
        ) : (
          <span>{fallbackText.charAt(0)}</span>
        )}
      </div>

      {editable && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`absolute -bottom-1 -right-1 text-white rounded-full p-1.5 border-2 border-white shadow transition disabled:opacity-60 ${badgeClassName}`}
          title="Ubah Foto"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={!editable || uploading}
      />
    </div>
  );
}
