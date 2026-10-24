import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cutFlowers = await prisma.category.upsert({
    where: { slug: 'cut-flowers' },
    update: {},
    create: { slug: 'cut-flowers', nameFa: 'گل‌های شاخه‌بریده' },
  });

  const houseplants = await prisma.category.upsert({
    where: { slug: 'houseplants' },
    update: {},
    create: { slug: 'houseplants', nameFa: 'گیاهان آپارتمانی' },
  });

  const equipment = await prisma.category.upsert({
    where: { slug: 'equipment' },
    update: {},
    create: { slug: 'equipment', nameFa: 'تجهیزات و ملزومات' },
  });

  const products = [
    {
      slug: 'dutch-rose-bouquet-premium',
      nameFa: 'دسته گل رز هلندی پریمیوم',
      nameScientific: 'Rosa hybrida',
      description: 'دسته‌ای از ۲۴ شاخه رز هلندی درجه‌یک، مناسب هدایای رسمی و ممتاز.',
      priceToman: 3850000,
      images: ['https://images.unsplash.com/photo-1518895312237-a9e23508077d?w=800'],
      categoryId: cutFlowers.id,
      stockStatus: 'IN_STOCK' as const,
    },
    {
      slug: 'royal-rose-lily-box',
      nameFa: 'باکس گل رز و لیلیوم سلطنتی',
      nameScientific: 'Rosa × Lilium',
      description: 'ترکیبی از رز و لیلیوم در باکسی مخملی، همراه با کارت تبریک گل خان.',
      priceToman: 4200000,
      images: ['https://images.unsplash.com/photo-1487070183336-b863922373d4?w=800'],
      categoryId: cutFlowers.id,
      stockStatus: 'IN_STOCK' as const,
    },
    {
      slug: 'ceremonial-wreath',
      nameFa: 'تاج گل تشریفاتی',
      description: 'تاج گل برای مراسم رسمی و تشریفاتی، قابل سفارش با پیش‌سفارش.',
      priceToman: 6500000,
      images: ['https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=800'],
      categoryId: cutFlowers.id,
      stockStatus: 'PREORDER' as const,
    },
    {
      slug: 'pink-phalaenopsis-orchid',
      nameFa: 'ارکیده فالانوپسیس صورتی',
      nameScientific: 'Phalaenopsis',
      description: 'ارکیده‌ای ظریف با گلبرگ‌های صورتی، مناسب فضای داخلی با نور غیرمستقیم.',
      priceToman: 1950000,
      images: ['https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=800'],
      categoryId: houseplants.id,
      light: 'INDIRECT' as const,
      waterPerWeek: 1,
      tempMinC: 18,
      tempMaxC: 27,
      careDifficulty: 'MEDIUM' as const,
      petSafe: true,
      stockStatus: 'IN_STOCK' as const,
    },
    {
      slug: 'royal-vanda-orchid',
      nameFa: 'ارکیده وندا رویال',
      nameScientific: 'Vanda coerulea',
      description:
        'ارکیده‌ای کمیاب با گلبرگ‌های آبی-بنفش، نمادی از سلطنت در میان گیاهان آپارتمانی. مناسب هدیه‌های خاص.',
      priceToman: 3250000,
      images: ['https://images.unsplash.com/photo-1524598171353-e5643318d9c1?w=800'],
      categoryId: houseplants.id,
      light: 'INDIRECT' as const,
      waterPerWeek: 2,
      tempMinC: 18,
      tempMaxC: 28,
      careDifficulty: 'MEDIUM' as const,
      petSafe: true,
      stockStatus: 'IN_STOCK' as const,
    },
    {
      slug: 'monstera-deliciosa-large',
      nameFa: 'مونسترا دلیشیوزا (بزرگ)',
      nameScientific: 'Monstera deliciosa',
      description: 'گیاهی بزرگ و پرطرفدار برای فضاهای سالنی، تصفیه‌کننده هوا.',
      priceToman: 2800000,
      images: ['https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=800'],
      categoryId: houseplants.id,
      light: 'INDIRECT' as const,
      waterPerWeek: 2,
      tempMinC: 18,
      tempMaxC: 26,
      careDifficulty: 'EASY' as const,
      petSafe: false,
      airPurifying: true,
      stockStatus: 'IN_STOCK' as const,
    },
    {
      slug: 'sansevieria-low-light',
      nameFa: 'ساندویریا کم‌نور',
      nameScientific: 'Sansevieria trifasciata',
      description: 'مقاوم‌ترین گیاه آپارتمانی برای فضاهای کم‌نور و کم‌آب، بی‌خطر برای حیوانات خانگی.',
      priceToman: 1100000,
      images: ['https://images.unsplash.com/photo-1493957988430-a5f2e15f39a3?w=800'],
      categoryId: houseplants.id,
      light: 'LOW' as const,
      waterPerWeek: 1,
      tempMinC: 15,
      tempMaxC: 30,
      careDifficulty: 'EASY' as const,
      petSafe: true,
      airPurifying: true,
      suitableForOffice: true,
      stockStatus: 'IN_STOCK' as const,
    },
    {
      slug: 'handmade-ceramic-pot',
      nameFa: 'گلدان سرامیک دست‌ساز',
      description: 'گلدان سرامیک با طرح سنتی ایرانی، مناسب گیاهان آپارتمانی متوسط.',
      priceToman: 850000,
      images: ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800'],
      categoryId: equipment.id,
      stockStatus: 'OUT_OF_STOCK' as const,
    },
    {
      slug: 'houseplant-soil-fertilizer',
      nameFa: 'خاک و کود گیاهان آپارتمانی',
      description: 'بسته‌ی خاک آماده و کود مخصوص گیاهان آپارتمانی، کیسه یک کیلوگرمی.',
      priceToman: 185000,
      images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800'],
      categoryId: equipment.id,
      stockStatus: 'IN_STOCK' as const,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p as any,
    });
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
