export type Vaccination = {
  id: string;
  pet_id: string;
  vaccine_name: string;
  date_administered: string | null;
  next_due_date: string | null;
  administering_vet: string | null;
  document_id: string | null;
  created_at: string;
};

export type VaccinationInput = {
  vaccine_name: string;
  date_administered?: string | null;
  next_due_date?: string | null;
  administering_vet?: string | null;
  document_id?: string | null;
};
