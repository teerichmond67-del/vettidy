import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { CreateInviteModal } from '../../components/CreateInviteModal';
import { useAuth } from '../../hooks/useAuth';
import { useMyPackRole } from '../../hooks/useMyPackRole';
import { usePack } from '../../hooks/usePack';
import { usePackMembers } from '../../hooks/usePackMembers';
import { usePaywallGate } from '../../hooks/usePaywallGate';
import { usePendingInvites } from '../../hooks/usePendingInvites';
import { useRealtimeRefetch } from '../../hooks/useRealtimeRefetch';
import { deletePackInvite, redeemPackInvite, removePackMember } from '../../lib/packApi';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  caregiver: 'Caregiver',
  sitter_view_only: 'Sitter — View Only',
};

export function PackScreen() {
  const { session } = useAuth();
  const { packId, refetch: refetchPack } = usePack();
  const { isOwner } = useMyPackRole(packId);
  const {
    members,
    loading: loadingMembers,
    error: membersError,
    refetch: refetchMembers,
  } = usePackMembers(packId);
  const {
    invites,
    loading: loadingInvites,
    error: invitesError,
    refetch: refetchInvites,
  } = usePendingInvites(packId);
  const guardPremium = usePaywallGate();

  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  const packFilter = packId ? `pack_id=eq.${packId}` : null;
  useRealtimeRefetch('pack_members', packFilter, refetchMembers);
  useRealtimeRefetch('pack_invites', packFilter, refetchInvites);

  useFocusEffect(
    useCallback(() => {
      refetchMembers();
      refetchInvites();
    }, [refetchMembers, refetchInvites]),
  );

  const handleInvitePress = () => {
    if (guardPremium('pack_invite')) return;
    setInviteModalVisible(true);
  };

  const handleRemoveMember = (memberId: string, email: string | null) => {
    Alert.alert('Remove Member', `Remove ${email ?? 'this member'} from the pack?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const result = await removePackMember(memberId);
          if (result.error) {
            Alert.alert('Something went wrong', result.error);
          } else {
            refetchMembers();
          }
        },
      },
    ]);
  };

  const handleRevokeInvite = (inviteId: string) => {
    Alert.alert('Revoke Invite', 'This invite link will no longer work.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          const result = await deletePackInvite(inviteId);
          if (result.error) {
            Alert.alert('Something went wrong', result.error);
          } else {
            refetchInvites();
          }
        },
      },
    ]);
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;

    setJoining(true);
    const result = await redeemPackInvite(code);
    setJoining(false);

    if (result.error) {
      Alert.alert('Could not join', result.error);
      return;
    }

    setJoinCode('');
    await refetchPack();
    Alert.alert('Joined!', "You're now part of that pack.");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Caregivers</Text>

      {loadingMembers && members.length === 0 ? (
        <ActivityIndicator style={styles.spacing} />
      ) : membersError ? (
        <View style={styles.spacing}>
          <Text style={styles.errorText}>{membersError}</Text>
          <Pressable style={styles.retryButton} onPress={refetchMembers}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.spacing}>
          {members.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberEmail}>
                  {member.user_id === session?.user.id ? 'You' : (member.email ?? 'Member')}
                </Text>
                <Text style={styles.memberRole}>{ROLE_LABELS[member.role] ?? member.role}</Text>
              </View>
              {isOwner && member.user_id !== session?.user.id ? (
                <Pressable onPress={() => handleRemoveMember(member.id, member.email)} hitSlop={16}>
                  <Text style={styles.removeLink}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {isOwner ? (
        <>
          <Pressable style={styles.inviteButton} onPress={handleInvitePress}>
            <Text style={styles.inviteButtonText}>Invite a Caregiver</Text>
          </Pressable>

          {loadingInvites || invitesError || invites.length > 0 ? (
            <View style={styles.pendingSection}>
              <Text style={styles.sectionHeader}>Pending Invites</Text>
              {loadingInvites ? (
                <ActivityIndicator />
              ) : invitesError ? (
                <View>
                  <Text style={styles.errorText}>{invitesError}</Text>
                  <Pressable style={styles.retryButton} onPress={refetchInvites}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </Pressable>
                </View>
              ) : (
                invites.map((invite) => (
                  <View key={invite.id} style={styles.inviteRow}>
                    <View>
                      <Text style={styles.inviteCode}>{invite.code}</Text>
                      <Text style={styles.inviteMeta}>
                        {ROLE_LABELS[invite.role] ?? invite.role}
                      </Text>
                    </View>
                    <Pressable onPress={() => handleRevokeInvite(invite.id)} hitSlop={16}>
                      <Text style={styles.removeLink}>Revoke</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          ) : null}
        </>
      ) : null}

      <View style={styles.joinSection}>
        <Text style={styles.sectionHeader}>Have an Invite Code?</Text>
        <TextInput
          style={styles.joinInput}
          value={joinCode}
          onChangeText={setJoinCode}
          placeholder="Enter code"
          accessibilityLabel="Invite code"
          autoCapitalize="characters"
          editable={!joining}
        />
        <Pressable
          style={[styles.joinButton, (!joinCode.trim() || joining) && styles.joinButtonDisabled]}
          onPress={handleJoin}
          disabled={!joinCode.trim() || joining}
        >
          {joining ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.joinButtonText}>Join a Pack</Text>
          )}
        </Pressable>
      </View>

      {packId && session ? (
        <CreateInviteModal
          visible={inviteModalVisible}
          onClose={() => setInviteModalVisible(false)}
          packId={packId}
          createdBy={session.user.id}
          onCreated={refetchInvites}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  spacing: {
    marginTop: 16,
  },
  errorText: {
    color: '#c00',
    marginTop: 16,
  },
  retryButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    fontWeight: '600',
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberInfo: {
    flexShrink: 1,
  },
  memberEmail: {
    fontSize: 15,
    fontWeight: '600',
  },
  memberRole: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  removeLink: {
    color: '#c00',
    fontSize: 13,
  },
  inviteButton: {
    marginTop: 24,
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  pendingSection: {
    marginTop: 28,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inviteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  inviteCode: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  },
  inviteMeta: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  joinSection: {
    marginTop: 32,
    gap: 8,
  },
  joinInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  joinButton: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.5,
  },
  joinButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
});
