import { supabase } from './supabase';
import type { PackInvite, PackMember, PackRole } from '../types/pack';

export async function fetchPackMembers(
  packId: string,
): Promise<{ data: PackMember[]; error: string | null }> {
  const { data: members, error } = await supabase
    .from('pack_members')
    .select('id, pack_id, user_id, role, created_at')
    .eq('pack_id', packId)
    .order('created_at', { ascending: true });

  if (error) return { data: [], error: error.message };

  const userIds = (members ?? []).map((m) => m.user_id);

  const { data: profiles, error: profilesError } = userIds.length
    ? await supabase.from('profiles').select('id, email').in('id', userIds)
    : { data: [], error: null };

  if (profilesError) return { data: [], error: profilesError.message };

  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  const merged: PackMember[] = (members ?? []).map((m) => ({
    ...m,
    email: emailById.get(m.user_id) ?? null,
  }));

  return { data: merged, error: null };
}

export async function fetchMyPackRole(
  packId: string,
  userId: string,
): Promise<{ role: PackRole | null; error: string | null }> {
  const { data, error } = await supabase
    .from('pack_members')
    .select('role')
    .eq('pack_id', packId)
    .eq('user_id', userId)
    .maybeSingle();

  return { role: (data?.role as PackRole | undefined) ?? null, error: error?.message ?? null };
}

export async function removePackMember(memberId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('pack_members').delete().eq('id', memberId);
  return { error: error?.message ?? null };
}

export async function fetchPendingInvites(
  packId: string,
): Promise<{ data: PackInvite[]; error: string | null }> {
  const { data, error } = await supabase
    .from('pack_invites')
    .select('*')
    .eq('pack_id', packId)
    .is('used_at', null)
    .order('created_at', { ascending: false });

  return { data: data ?? [], error: error?.message ?? null };
}

export async function createPackInvite(
  packId: string,
  createdBy: string,
  role: 'caregiver' | 'sitter_view_only',
): Promise<{ data: PackInvite | null; error: string | null }> {
  const { data, error } = await supabase
    .from('pack_invites')
    .insert({ pack_id: packId, created_by: createdBy, role })
    .select()
    .single();

  return { data: data ?? null, error: error?.message ?? null };
}

export async function deletePackInvite(inviteId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('pack_invites').delete().eq('id', inviteId);
  return { error: error?.message ?? null };
}

export async function redeemPackInvite(code: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('redeem_pack_invite', { invite_code: code });
  return { error: error?.message ?? null };
}
