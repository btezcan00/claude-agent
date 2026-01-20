export interface Address {
  id: string;
  street: string;           // Full address (Adres)
  buildingType: string;     // Type pand
  isActive: boolean;        // Actueel (Ja/Nee)
  description: string;      // Omschrijving
  createdAt: string;
}

export const BUILDING_TYPES = ['Commercial', 'Private', '-'] as const;

export type BuildingType = (typeof BUILDING_TYPES)[number];
