'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { Category } from '@/lib/types';

export default function FilterSidebar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const params = useSearchParams();

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === '' || value === 'false') next.delete(key);
    else next.set(key, value);
    router.push(`/catalog?${next.toString()}`);
  }

  function toggleBoolean(key: string) {
    const current = params.get(key);
    updateParam(key, current === 'true' ? null : 'true');
  }

  const activeCategory = params.get('category') ?? '';

  return (
    <aside className="border border-bronze/30 rounded-sm p-5 bg-white h-max md:sticky md:top-24">
      <h4 className="text-ruby text-sm mb-1">🔍 فیلتر هوشمند</h4>
      <p className="text-xs text-ink-soft mb-4">
        مثال: «گیاه آپارتمانی کم‌نور، نگهداری آسان، زیر ۲ میلیون تومان»
      </p>

      <div className="mb-5 pb-4 border-b border-dashed border-bronze/30">
        <h4 className="text-sm mb-2">دسته‌بندی</h4>
        <label className="flex items-center gap-2 text-sm text-ink-soft mb-2">
          <input
            type="radio"
            checked={activeCategory === ''}
            onChange={() => updateParam('category', null)}
          />
          همه
        </label>
        {categories.map((c) => (
          <label key={c.id} className="flex items-center gap-2 text-sm text-ink-soft mb-2">
            <input
              type="radio"
              checked={activeCategory === c.slug}
              onChange={() => updateParam('category', c.slug)}
            />
            {c.nameFa}
          </label>
        ))}
      </div>

      <div className="mb-5 pb-4 border-b border-dashed border-bronze/30">
        <h4 className="text-sm mb-2">محدوده قیمت (تومان)</h4>
        <input
          type="range"
          min={0}
          max={7000000}
          step={100000}
          defaultValue={params.get('maxPrice') ?? '7000000'}
          onChange={(e) => updateParam('maxPrice', e.target.value)}
          className="w-full accent-bronze"
        />
        <div className="flex justify-between text-xs text-ink-soft">
          <span>۰</span>
          <span>۷,۰۰۰,۰۰۰</span>
        </div>
      </div>

      <div className="mb-5 pb-4 border-b border-dashed border-bronze/30">
        <h4 className="text-sm mb-2">میزان نور محیط</h4>
        {[
          ['LOW', 'نور کم'],
          ['INDIRECT', 'نور غیرمستقیم'],
          ['DIRECT', 'نور مستقیم'],
        ].map(([value, label]) => (
          <label key={value} className="flex items-center gap-2 text-sm text-ink-soft mb-2">
            <input
              type="radio"
              checked={params.get('light') === value}
              onChange={() => updateParam('light', value)}
            />
            {label}
          </label>
        ))}
      </div>

      <div className="mb-1">
        <h4 className="text-sm mb-2">ویژگی‌ها</h4>
        <label className="flex items-center gap-2 text-sm text-ink-soft mb-2">
          <input
            type="checkbox"
            checked={params.get('petSafe') === 'true'}
            onChange={() => toggleBoolean('petSafe')}
          />
          مناسب حیوان خانگی
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-soft mb-2">
          <input
            type="checkbox"
            checked={params.get('airPurifying') === 'true'}
            onChange={() => toggleBoolean('airPurifying')}
          />
          تصفیه‌کننده هوا
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-soft mb-2">
          <input
            type="checkbox"
            checked={params.get('suitableForOffice') === 'true'}
            onChange={() => toggleBoolean('suitableForOffice')}
          />
          مناسب محل کار
        </label>
      </div>
    </aside>
  );
}
