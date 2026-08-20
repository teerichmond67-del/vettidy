export type UploadStatus = 'pending' | 'synced' | 'failed';

export type DocumentRecord = {
  id: string;
  pet_id: string;
  uploaded_by: string | null;
  file_path: string;
  file_type: string | null;
  title: string | null;
  linked_type: string | null;
  linked_id: string | null;
  upload_status: UploadStatus;
  ocr_extracted_date: string | null;
  created_at: string;
};
