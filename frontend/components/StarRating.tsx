'use client';

export default function StarRating({
  value,
  onChange,
  readOnly,
  size = 'text-xl',
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: string;
}) {
  return (
    <div className={`flex gap-1 ${size}`} dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={n <= value ? 'text-bronze' : 'text-bronze/25'}
        >
          ★
        </button>
      ))}
    </div>
  );
}
