export const metadata = {
  title: 'راهنمای نگهداری گیاهان',
  description: 'نکات کلی نگهداری از گیاهان آپارتمانی.',
  alternates: { canonical: '/plant-care' },
};

const tips = [
  {
    title: 'نور',
    text: 'بیشتر گیاهان آپارتمانی نور غیرمستقیم را ترجیح می‌دهند. مشخصات هر گیاه در صفحه‌ی محصول ذکر شده است.',
  },
  {
    title: 'آبیاری',
    text: 'پیش از آبیاری، رطوبت خاک را با انگشت بررسی کنید؛ آبیاری بیش‌ازحد رایج‌ترین علت آسیب به گیاهان آپارتمانی است.',
  },
  {
    title: 'دما',
    text: 'اغلب گیاهان آپارتمانی دمای ۱۸ تا ۲۸ درجه را ترجیح می‌دهند و باید از کولر و بخاری مستقیم دور نگه داشته شوند.',
  },
  {
    title: 'تعویض گلدان',
    text: 'هر یک تا دو سال، یا زمانی که ریشه‌ها از کف گلدان بیرون زدند، گیاه را به گلدانی بزرگ‌تر منتقل کنید.',
  },
];

export default function PlantCarePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <div className="text-bronze text-xs tracking-[2.5px]">خدمات مشتریان</div>
        <h1 className="font-display text-3xl text-ruby mt-2">راهنمای نگهداری گیاهان</h1>
      </div>

      <div className="space-y-6">
        {tips.map((t) => (
          <div key={t.title} className="border-b border-bronze/20 pb-5">
            <h3 className="text-ruby font-semibold mb-1">{t.title}</h3>
            <p className="text-sm text-ink-soft leading-7">{t.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
