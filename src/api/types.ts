export interface Credentials {
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
}

export type MessageDirection = 'in' | 'out';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessage {
  /** idMessage из GREEN-API, для pending-сообщений — временный локальный id */
  id: string;
  chatId: string;
  text: string;
  direction: MessageDirection;
  timestamp: number; // ms
  status?: MessageStatus;
}

export interface Chat {
  chatId: string;
  title: string;
  phone?: string;
  unread: number;
}

/* ---------- Ответы GREEN-API (только используемые поля) ---------- */

export interface StateInstanceResponse {
  stateInstance: string;
}

export interface CheckAccountResponse {
  exist: boolean;
  chatId?: string;
}

export interface SendMessageResponse {
  idMessage: string;
}

interface SenderData {
  chatId: string;
  sender?: string;
  senderName?: string;
  chatName?: string;
}

interface MessageData {
  typeMessage: string;
  textMessageData?: { textMessage: string };
  extendedTextMessageData?: { text: string };
}

export interface MessageNotification {
  typeWebhook: 'incomingMessageReceived' | 'outgoingMessageReceived' | 'outgoingAPIMessageReceived';
  idMessage: string;
  timestamp: number; // seconds
  senderData: SenderData;
  messageData: MessageData;
}

export interface StatusNotification {
  typeWebhook: 'outgoingMessageStatus';
  idMessage: string;
  chatId: string;
  timestamp: number;
  status: string; // sent | delivered | read | failed | noAccount | ...
}

/** Тело уведомления: известные типы + любые другие (stateInstanceChanged и т.п.) */
export type NotificationBody = { typeWebhook: string } & Record<string, unknown>;

const MESSAGE_TYPES = ['incomingMessageReceived', 'outgoingMessageReceived', 'outgoingAPIMessageReceived'];

export function isMessageNotification(b: NotificationBody): b is NotificationBody & MessageNotification {
  return MESSAGE_TYPES.includes(b.typeWebhook) && typeof b.senderData === 'object' && typeof b.messageData === 'object';
}

export function isStatusNotification(b: NotificationBody): b is NotificationBody & StatusNotification {
  return b.typeWebhook === 'outgoingMessageStatus' && typeof b.status === 'string';
}

export interface ReceiveNotificationResponse {
  receiptId: number;
  body: NotificationBody;
}
