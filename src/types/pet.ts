export type PetStatus = 'active' | 'deceased';

export type Pet = {
  id: string;
  pack_id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  birthdate: string | null;
  is_estimated_age: boolean;
  microchip_id: string | null;
  photo_path: string | null;
  status: PetStatus;
  created_at: string;
};

export type PetInput = {
  name: string;
  species: string;
  breed?: string | null;
  sex?: string | null;
  birthdate?: string | null;
  is_estimated_age?: boolean;
  microchip_id?: string | null;
  photo_path?: string | null;
};
