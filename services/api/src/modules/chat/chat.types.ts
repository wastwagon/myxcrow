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

export type ChatMessageDto = {
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

export type ChatThreadDto = {
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

export type ChatUnreadDto = {
  escrow: number;
  support: number;
  total: number;
};
