import { IndicatorCategory } from '@/types/signal';

export const INDICATOR_CATEGORIES: IndicatorCategory[] = [
  {
    id: 'financial',
    label: 'Financial',
    subcategories: [
      { id: 'unusual-cash-transactions', label: 'Unusual cash transactions' },
      { id: 'multiple-bank-accounts', label: 'Multiple bank accounts' },
      { id: 'unexplained-wealth', label: 'Unexplained wealth' },
      { id: 'tax-evasion-indicators', label: 'Tax evasion indicators' },
      { id: 'suspicious-invoices', label: 'Suspicious invoices' },
    ],
  },
  {
    id: 'behavioral',
    label: 'Behavioral',
    subcategories: [
      { id: 'inconsistent-statements', label: 'Inconsistent statements' },
      { id: 'uncooperative-behavior', label: 'Uncooperative behavior' },
      { id: 'fear-or-anxiety', label: 'Fear or anxiety' },
      { id: 'scripted-responses', label: 'Scripted responses' },
    ],
  },
  {
    id: 'location',
    label: 'Location',
    subcategories: [
      { id: 'high-risk-area', label: 'High-risk area' },
      { id: 'frequent-address-changes', label: 'Frequent address changes' },
      { id: 'suspicious-premises', label: 'Suspicious premises' },
      { id: 'known-criminal-location', label: 'Known criminal location' },
    ],
  },
  {
    id: 'identity',
    label: 'Identity',
    subcategories: [
      { id: 'false-documents', label: 'False documents' },
      { id: 'multiple-identities', label: 'Multiple identities' },
      { id: 'identity-theft-indicators', label: 'Identity theft indicators' },
      { id: 'no-valid-id', label: 'No valid ID' },
    ],
  },
  {
    id: 'network',
    label: 'Network',
    subcategories: [
      { id: 'known-criminal-associates', label: 'Known criminal associates' },
      { id: 'shell-companies', label: 'Shell companies' },
      { id: 'cross-border-connections', label: 'Cross-border connections' },
      { id: 'organized-crime-links', label: 'Organized crime links' },
    ],
  },
  {
    id: 'documentation',
    label: 'Documentation',
    subcategories: [
      { id: 'missing-records', label: 'Missing records' },
      { id: 'falsified-documents', label: 'Falsified documents' },
      { id: 'inconsistent-paperwork', label: 'Inconsistent paperwork' },
      { id: 'no-audit-trail', label: 'No audit trail' },
    ],
  },
];

export function getCategoryById(categoryId: string): IndicatorCategory | undefined {
  return INDICATOR_CATEGORIES.find(cat => cat.id === categoryId);
}

export function getIndicatorLabel(categoryId: string, subcategoryId: string): string {
  const category = getCategoryById(categoryId);
  if (!category) return subcategoryId;
  const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
  return subcategory?.label || subcategoryId;
}
