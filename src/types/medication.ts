export type Medication = {
  id: string;
  pet_id: string;
  name: string;
  dosage: string | null;
  schedule_rule: string | null;
  start_date: string | null;
  end_date: string | null;
  active: boolean;
  created_at: string;
};

export type MedicationInput = {
  name: string;
  dosage?: string | null;
  schedule_rule?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  active?: boolean;
};
