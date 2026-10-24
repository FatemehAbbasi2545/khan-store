'use client';

import { useRef } from 'react';

const MAX_SIZE_MB = 3;

export default function ImageUploadInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`حجم عکس نباید بیشتر از ${MAX_SIZE_MB} مگابایت باشد. لطفاً عکس کوچک‌تری انتخاب کنید.`);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div>
      {label && <label className="block text-sm mb-1 text-ink-soft">{label}</label>}
      <div className="flex items-center gap-4">
        {value ? (
          <div
            className="w-20 h-20 rounded-md bg-cover bg-center border border-bronze/30 flex-shrink-0"
            style={{ backgroundImage: `url(${value})` }}
          />
        ) : (
          <div className="w-20 h-20 rounded-md border border-dashed border-bronze/30 flex items-center justify-center text-ink-soft text-xs flex-shrink-0">
            بدون عکس
          </div>
        )}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="border border-bronze/30 px-4 py-2 rounded-sm text-sm hover:bg-ivory-deep"
          >
            {value ? 'تغییر عکس' : 'انتخاب عکس'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')} className="text-xs text-red-600 text-right">
              حذف عکس
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
    </div>
  );
}
