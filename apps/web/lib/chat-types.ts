export type ChatKind = 'escrow' | 'support';

export type ChatPerson = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
};

export type ChatAttachment = {
  url: string;
  name: string;
  mime: string;
};

export type ChatMessage = {
  id: string;
  kind: ChatKind;
  threadId: string;
  senderId: string | null;
  sender: ChatPerson | null;
  content: string;
  isSystem: boolean;
  isStaff: boolean;
  attachment: ChatAttachment | null;
  createdAt: string;
};

export type ChatThreadSummary = {
  kind: ChatKind;
  id: string;
  title: string;
  subtitle: string;
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
  status?: string;
  counterpart?: ChatPerson | null;
  href: string;
};

export type ChatUnread = {
  escrow: number;
  support: number;
  total: number;
};

export function chatPersonName(person?: ChatPerson | null) {
  if (!person) return 'User';
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
  return name || person.email || 'User';
}
