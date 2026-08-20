export type DoseStatus = 'given' | 'skipped';

export type DoseLog = {
  id: string;
  medication_id: string;
  logged_by: string;
  status: DoseStatus;
  logged_at: string;
  sync_status: 'pending' | 'synced';
  logged_by_email: string | null;
};
