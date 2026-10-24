import type { Occasion } from './types';

export const occasionLabels: Record<Occasion, { label: string; icon: string }> = {
  BIRTHDAY: { label: 'تولد', icon: '🎂' },
  ANNIVERSARY: { label: 'سالگرد ازدواج', icon: '💍' },
  VALENTINE: { label: 'ولنتاین', icon: '❤️' },
  MOTHERS_DAY: { label: 'روز مادر', icon: '🌷' },
  TEACHERS_DAY: { label: 'روز معلم', icon: '📚' },
  CONDOLENCE: { label: 'مراسم ترحیم', icon: '🕊️' },
};

export const occasionOrder: Occasion[] = [
  'BIRTHDAY',
  'ANNIVERSARY',
  'VALENTINE',
  'MOTHERS_DAY',
  'TEACHERS_DAY',
  'CONDOLENCE',
];
