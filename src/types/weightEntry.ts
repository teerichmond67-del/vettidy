export type WeightUnit = 'kg' | 'lb';

export type WeightEntry = {
  id: string;
  pet_id: string;
  weight: number;
  unit: WeightUnit;
  recorded_at: string;
  created_at: string;
};

export type WeightEntryInput = {
  weight: number;
  unit: WeightUnit;
  recorded_at: string;
};
