export interface Person {
  id: string;
  firstName: string;
  surname: string;
  dateOfBirth: string;
  address: string;
  description: string;
  bsn?: string;
  gender?: 'M' | 'V';
  createdAt: string;
}

export const MUNICIPALITIES = [
  'Amsterdam',
  'Rotterdam',
  'Den Haag',
  'Utrecht',
  'Eindhoven',
  'Tilburg',
  'Groningen',
  'Almere',
  'Breda',
  'Nijmegen',
  'Apeldoorn',
  'Haarlem',
  'Arnhem',
  'Enschede',
  'Zaanstad',
  'Amersfoort',
  'Haarlemmermeer',
  'Zoetermeer',
  'Zwolle',
  'Leiden',
] as const;

export type Municipality = (typeof MUNICIPALITIES)[number];
