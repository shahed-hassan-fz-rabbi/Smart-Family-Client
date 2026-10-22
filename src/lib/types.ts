export type FamilyRole = 'owner' | 'admin' | 'member';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  /** Platform privilege — 'super_admin' is granted only by the secure bootstrap script. */
  role: 'user' | 'super_admin';
  preferredLanguage: 'en' | 'bn' | 'banglish';
  timezone: string;
  privacy: {
    shareUpdatesWithFamily: boolean;
    shareCalendarWithFamily: boolean;
    locationSharingOptIn: boolean;
    aiFamilyContextAllowed: boolean;
  };
  notificationPrefs: { inApp: boolean; emailEnabled: boolean };
}

export interface FamilySummary {
  id: string;
  name: string;
  description?: string;
  owner: boolean;
  role: FamilyRole;
}

export interface FamilyMember {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: FamilyRole;
  nickname?: string;
  lastSeenAt?: string;
  locationSharingOptIn?: boolean;
}

export interface FamilyInvitationSummary {
  id: string;
  email: string | null;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string | null;
  assignee: { id: string; name: string } | null;
  createdBy?: 'user' | 'ai';
}

export interface CalendarEventT {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  category: string;
  createdBy?: 'user' | 'ai';
  participants: { id: string; name: string }[];
}

export interface Reminder {
  id: string;
  title: string;
  notes?: string;
  dueAt: string;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  status: 'pending' | 'completed' | 'dismissed';
  remindFamily: boolean;
  isMine: boolean;
  createdBy?: 'user' | 'ai';
}

export interface NotificationT {
  id: string;
  type: string;
  title: string;
  message?: string;
  linkPath?: string;
  readAt: string | null;
  createdAt: string;
}

export interface ChatPreview {
  id: string;
  type: 'dm' | 'group';
  name: string | null;
  participants: { id: string; name: string; isMe: boolean }[];
  lastMessageAt?: string | null;
  preview?: string;
  unreadCount: number;
}

export interface ChatMsg {
  id: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: string;
  readByMe?: boolean;
}

export interface AiProposal {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  explanation: string;
}

export interface AiTurnResult {
  conversationId: string;
  reply: string;
  needsClarification: string | null;
  proposal: AiProposal | null;
}

export interface AiConversationSummary {
  id: string;
  title: string;
  lastMessageAt: string;
  preview: string;
}

export interface AiConversationFull {
  id: string;
  title: string;
  familyId: string | null;
  messages: { role: 'user' | 'assistant'; content: string; createdAt: string }[];
}

export interface FamilyUpdateT {
  id: string;
  content: string;
  author: string;
  isMine: boolean;
  pinned: boolean;
  createdAt: string;
}

export interface EmergencyContactT {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  altPhone?: string;
  notes?: string;
  isPrimary: boolean;
}

export interface CallSummary {
  id: string;
  mode: 'audio' | 'video';
  status: string;
  startedAt: string;
  endedAt?: string | null;
  isInitiator: boolean;
  participantCount: number;
}
