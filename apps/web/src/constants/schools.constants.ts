import type { School } from '@repo/shared/schools';

export function getSchoolLabel(school: School): string {
  const city = school.location.city ? ` - ${school.location.city}` : '';
  return `${school.name}${city} (${school.board})`;
}
