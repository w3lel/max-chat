import { useCallback, useMemo, useReducer } from 'react';
import { GreenApiClient, GreenApiError } from '../api/greenApi';
import { isMessageNotification, isStatusNotification, type Credentials, type NotificationBody } from '../api/types';
import { chatReducer, initialChatState } from '../hooks/chatReducer';
import { useNotifications } from '../hooks/useNotifications';
import { formatPhone } from '../utils/format';
import { ChatWindow } from './ChatWindow';
import { Logo } from './Icons';
import { Sidebar } from './Sidebar';

interface Props {
  credentials: Credentials;
  onLogout: () => void;
}

const STATUS_MAP = { sent: 'sent', delivered: 'delivered', read: 'read', failed: 'failed', noAccount: 'failed' } as const;

export function Messenger({ credentials, onLogout }: Props) {
  const client = useMemo(() => new GreenApiClient(credentials), [credentials]);
  const [state, dispatch] = useReducer(chatReducer, initialChatState);

  const handleNotification = useCallback((body: NotificationBody) => {
    if (isMessageNotification(body)) {
      // incomingMessageReceived — входящее; outgoing* — отправлено с телефона или через API
      const { messageData, senderData } = body;
      const text = messageData.textMessageData?.textMessage ?? messageData.extendedTextMessageData?.text;
      if (!text) return; // по ТЗ — только текстовые сообщения
      const incoming = body.typeWebhook === 'incomingMessageReceived';
      dispatch({
        type: 'addMessage',
        title: senderData.chatName || senderData.senderName,
        message: {
          id: body.idMessage,
          chatId: senderData.chatId,
          text,
          direction: incoming ? 'in' : 'out',
          timestamp: body.timestamp * 1000,
          status: incoming ? undefined : 'sent',
        },
      });
    } else if (isStatusNotification(body)) {
      const status = STATUS_MAP[body.status as keyof typeof STATUS_MAP];
      if (status) dispatch({ type: 'setStatus', chatId: String(body.chatId), id: String(body.idMessage), status });
    }
    // остальные типы уведомлений (stateInstanceChanged и т.д.) игнорируем
  }, []);

  const connection = useNotifications(client, handleNotification);

  const createChat = useCallback(
    async (phone: string) => {
      let chatId = `${phone}@c.us`;
      try {
        const res = await client.checkAccount(phone);
        if (!res.exist) throw new Error('На этом номере нет аккаунта MAX');
        if (res.chatId) chatId = res.chatId;
      } catch (e) {
        // если checkAccount недоступен — отправляем по номеру телефона (формат 79991234567@c.us)
        const fallback = e instanceof GreenApiError && e.status !== undefined && ![401, 403, 429].includes(e.status);
        if (!fallback) throw e;
      }
      dispatch({ type: 'openChat', chat: { chatId, title: formatPhone(phone), phone } });
    },
    [client],
  );

  const sendMessage = useCallback(
    async (chatId: string, text: string) => {
      const tempId = `local-${crypto.randomUUID()}`;
      dispatch({
        type: 'addMessage',
        message: { id: tempId, chatId, text, direction: 'out', timestamp: Date.now(), status: 'pending' },
      });
      try {
        const { idMessage } = await client.sendMessage(chatId, text);
        dispatch({ type: 'confirmMessage', chatId, tempId, id: idMessage });
      } catch {
        dispatch({ type: 'setStatus', chatId, id: tempId, status: 'failed' });
      }
    },
    [client],
  );

  const activeChat = state.chats.find((c) => c.chatId === state.activeChatId) ?? null;

  return (
    <div className={`app ${activeChat ? 'app--chat-open' : ''}`}>
      <Sidebar
        chats={state.chats}
        messages={state.messages}
        activeChatId={state.activeChatId}
        connection={connection}
        onSelect={(chatId) => dispatch({ type: 'selectChat', chatId })}
        onCreateChat={createChat}
        onLogout={onLogout}
      />
      {activeChat ? (
        <ChatWindow
          chat={activeChat}
          messages={state.messages[activeChat.chatId] ?? []}
          onSend={(text) => sendMessage(activeChat.chatId, text)}
          onBack={() => dispatch({ type: 'selectChat', chatId: null })}
        />
      ) : (
        <section className="placeholder">
          <Logo className="placeholder__logo" />
          <p>Выберите чат или создайте новый по номеру телефона</p>
        </section>
      )}
    </div>
  );
}
