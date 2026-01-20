export interface FindingType {
  id: string;
  label: string;
  severity: 'none' | 'low' | 'serious' | 'critical';
}

export const FINDING_TYPES: FindingType[] = [
  { id: 'lbb-none', label: 'LBB - no serious degree of danger', severity: 'none' },
  { id: 'lbb-low', label: 'LBB - a lower level of danger', severity: 'low' },
  { id: 'lbb-serious', label: 'LBB - serious level of danger', severity: 'serious' },
  { id: 'serious-a', label: 'Serious danger - investing criminal assets (A)', severity: 'critical' },
  { id: 'serious-b', label: 'Serious danger - committing criminal offences (B)', severity: 'critical' },
  { id: 'no-serious', label: 'no serious level of danger', severity: 'none' },
];
