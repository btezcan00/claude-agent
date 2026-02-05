export interface FindingType {
  id: string;
  label: string;
  severity: 'none' | 'low' | 'serious' | 'critical';
}

export const FINDING_TYPES: FindingType[] = [
  { id: 'lbb-none', label: 'LBB - geen ernstige mate van gevaar', severity: 'none' },
  { id: 'lbb-low', label: 'LBB - mindere mate van gevaar', severity: 'low' },
  { id: 'lbb-serious', label: 'LBB - ernstige mate van gevaar', severity: 'serious' },
  { id: 'serious-a', label: 'Ernstig gevaar - investeren crimineel vermogen (A)', severity: 'critical' },
  { id: 'serious-b', label: 'Ernstig gevaar - plegen van strafbare feiten (B)', severity: 'critical' },
  { id: 'no-serious', label: 'Geen ernstige mate van gevaar', severity: 'none' },
];
