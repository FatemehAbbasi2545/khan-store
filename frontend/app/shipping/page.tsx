export const metadata = {
  title: 'شرایط ارسال',
  description: 'شرایط و زمان‌بندی ارسال سفارش‌های فروشگاه گل خان.',
  alternates: { canonical: '/shipping' },
};

export default function ShippingPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <div className="text-bronze text-xs tracking-[2.5px]">خدمات مشتریان</div>
        <h1 className="font-display text-3xl text-ruby mt-2">شرایط ارسال</h1>
      </div>

      <div className="text-ink-soft leading-8 space-y-5 text-sm">
        <p>سفارش‌ها در دو حالت قابل تحویل هستند: امروز، فردا، یا زمان‌بندی دلخواه شما با انتخاب تاریخ و بازه‌ی ساعتی مشخص.</p>
        <p>هزینه‌ی ارسال به‌صورت ثابت در مرحله‌ی تسویه‌حساب محاسبه و نمایش داده می‌شود.</p>
        <p>برای اطمینان از تازگی گل‌ها، بسته‌بندی هر سفارش در نزدیک‌ترین زمان ممکن به لحظه‌ی تحویل انجام می‌شود.</p>
        <p>در صورت هرگونه سؤال درباره‌ی وضعیت سفارش، از بخش «سفارش‌های من» در حساب کاربری‌تان می‌توانید وضعیت لحظه‌ای را پیگیری کنید، یا از طریق صفحه‌ی تماس با ما با ما در ارتباط باشید.</p>
      </div>
    </div>
  );
}
