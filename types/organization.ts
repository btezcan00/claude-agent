export interface Organization {
  id: string;
  name: string;
  type: string;
  address: string;
  description: string;
  chamberOfCommerce?: string;
  createdAt: string;
}

export const ORGANIZATION_TYPES = [
  'Corporation',
  'Non-profit',
  'Government',
  'Partnership',
  'Sole Proprietorship',
  'Other',
] as const;

export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export const MOCK_ADDRESSES = [
  'Kerkstraat 123, 1011 AB Amsterdam',
  'Damrak 45, 1012 LN Amsterdam',
  'Kalverstraat 78, 1012 PE Amsterdam',
  'Rokin 92, 1012 KZ Amsterdam',
  'Prinsengracht 456, 1016 HK Amsterdam',
  'Herengracht 234, 1016 BT Amsterdam',
  'Singel 567, 1012 WP Amsterdam',
  'Leidseplein 12, 1017 PT Amsterdam',
  'Vondelstraat 89, 1054 GJ Amsterdam',
  'Ferdinand Bolstraat 34, 1072 LN Amsterdam',
  'Overtoom 156, 1054 HN Amsterdam',
  'Albert Cuypstraat 67, 1072 CN Amsterdam',
  'Javastraat 45, 1094 HC Amsterdam',
  'Czaar Peterstraat 23, 1018 PH Amsterdam',
  'Haarlemmerstraat 78, 1013 EP Amsterdam',
] as const;
