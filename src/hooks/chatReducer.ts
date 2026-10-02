import type { Chat, ChatMessage, MessageStatus } from '../api/types';

export interface ChatState {
  chats: Chat[]; // отсортированы: последний активный — сверху
  messages: Record<string, ChatMessage[]>;
  activeChatId: string | null;
}

export const initialChatState: ChatState = { chats: [], messages: {}, activeChatId: null };

export type ChatAction =
  | { type: 'openChat'; chat: Omit<Chat, 'unread'> }
  | { type: 'selectChat'; chatId: string | null }
  | { type: 'addMessage'; message: ChatMessage; title?: string }
  | { type: 'confirmMessage'; chatId: string; tempId: string; id: string }
  | { type: 'setStatus'; chatId: string; id: string; status: MessageStatus };

const STATUS_RANK: Record<MessageStatus, number> = { failed: -1, pending: 0, sent: 1, delivered: 2, read: 3 };

function bumpChat(chats: Chat[], chatId: string, patch: (c: Chat) => Chat, fallback: () => Chat): Chat[] {
  const existing = chats.find((c) => c.chatId === chatId);
  const updated = existing ? patch(existing) : fallback();
  return [updated, ...chats.filter((c) => c.chatId !== chatId)];
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'openChat': {
      const { chat } = action;
      const exists = state.chats.some((c) => c.chatId === chat.chatId);
      return {
        ...state,
        chats: exists ? state.chats : [{ ...chat, unread: 0 }, ...state.chats],
        activeChatId: chat.chatId,
      };
    }

    case 'selectChat':
      return {
        ...state,
        activeChatId: action.chatId,
        chats: state.chats.map((c) => (c.chatId === action.chatId ? { ...c, unread: 0 } : c)),
      };

    case 'addMessage': {
      const { message } = action;
      const list = state.messages[message.chatId] ?? [];
      // дедупликация: одно и то же сообщение может прийти и из sendMessage, и из outgoing-уведомления
      if (list.some((m) => m.id === message.id)) return state;

      const isActive = state.activeChatId === message.chatId;
      const countUnread = message.direction === 'in' && !isActive;
      return {
        ...state,
        messages: { ...state.messages, [message.chatId]: [...list, message].sort((a, b) => a.timestamp - b.timestamp) },
        chats: bumpChat(
          state.chats,
          message.chatId,
          (c) => ({ ...c, unread: c.unread + (countUnread ? 1 : 0) }),
          () => ({ chatId: message.chatId, title: action.title || message.chatId, unread: countUnread ? 1 : 0 }),
        ),
      };
    }

    case 'confirmMessage': {
      const list = state.messages[action.chatId] ?? [];
      // если outgoing-уведомление успело прийти раньше ответа sendMessage — убираем временную копию
      const alreadyHasReal = list.some((m) => m.id === action.id);
      const next = alreadyHasReal
        ? list.filter((m) => m.id !== action.tempId)
        : list.map((m) => (m.id === action.tempId ? { ...m, id: action.id, status: 'sent' as const } : m));
      return { ...state, messages: { ...state.messages, [action.chatId]: next } };
    }

    case 'setStatus': {
      const list = state.messages[action.chatId];
      if (!list) return state;
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.chatId]: list.map((m) =>
            m.id === action.id && (action.status === 'failed' || STATUS_RANK[action.status] > STATUS_RANK[m.status ?? 'pending'])
              ? { ...m, status: action.status }
              : m,
          ),
        },
      };
    }
  }
}
