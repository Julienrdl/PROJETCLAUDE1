'use client';

import { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

export interface PhotoDraft {
  data: string;
  legende: string;
}

interface Props {
  photos: PhotoDraft[];
  onChange: (photos: PhotoDraft[]) => void;
}

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.75;

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image invalide'));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const scale = MAX_DIMENSION / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas non supporté'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function PhotoUploader({ photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setProcessing(true);
    try {
      const newPhotos: PhotoDraft[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const data = await resizeImage(file);
        newPhotos.push({ data, legende: '' });
      }
      onChange([...photos, ...newPhotos]);
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (idx: number) => onChange(photos.filter((_, i) => i !== idx));
  const setLegende = (idx: number, legende: string) => onChange(photos.map((p, i) => (i === idx ? { ...p, legende } : p)));

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={processing}
        className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors disabled:opacity-60"
      >
        <Camera size={18} />
        {processing ? 'Traitement...' : 'Ajouter des photos'}
      </button>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((p, idx) => (
            <div key={idx} className="relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.data} alt={`Photo ${idx + 1}`} className="w-full h-32 object-cover" />
              <button
                type="button"
                onClick={() => remove(idx)}
                className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
              >
                <X size={14} />
              </button>
              <input
                type="text"
                value={p.legende}
                onChange={e => setLegende(idx, e.target.value)}
                placeholder="Légende..."
                className="w-full px-2 py-1 text-xs border-t border-gray-200 outline-none focus:bg-amber-50"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
