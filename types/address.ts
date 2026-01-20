export interface Address {
  id: string;
  street: string;           // Full address
  buildingType: string;     // Property type
  isActive: boolean;        // Current (Yes/No)
  description: string;      // Description
  createdAt: string;
}

export const BUILDING_TYPES = ['Commercial', 'Private', '-'] as const;

export type BuildingType = (typeof BUILDING_TYPES)[number];
