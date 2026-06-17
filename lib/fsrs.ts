import { FSRS, generatorParameters } from 'ts-fsrs';

export { Rating } from 'ts-fsrs';
export type { RecordLog } from 'ts-fsrs';

export const fsrs = new FSRS(generatorParameters({ enable_fuzz: true }));

export function formatInterval(days: number): string {
  if (days < 1) return '< 1 day';
  if (days === 1) return '1 day';
  if (days < 7) return `${Math.round(days)} days`;
  if (days < 30) return `${Math.round(days / 7)} week${Math.round(days / 7) === 1 ? '' : 's'}`;
  return `${Math.round(days / 30)} month${Math.round(days / 30) === 1 ? '' : 's'}`;
}

export function getRatingLabel(rating: number): string {
  switch (rating) {
    case 1: return 'Again';
    case 2: return 'Hard';
    case 3: return 'Good';
    case 4: return 'Easy';
    default: return '';
  }
}
