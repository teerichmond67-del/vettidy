export type PackRole = 'owner' | 'caregiver' | 'sitter_view_only';

export type PackMember = {
  id: string;
  pack_id: string;
  user_id: string;
  role: PackRole;
  created_at: string;
  email: string | null;
};

export type PackInvite = {
  id: string;
  pack_id: string;
  code: string;
  role: PackRole;
  created_by: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
};
