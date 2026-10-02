import { useState, type FormEvent } from 'react';
import type { Chat, ChatMessage } from '../api/types';
import type { ConnectionState } from '../hooks/useNotifications';
import { formatTime, isValidPhone, normalizePhone } from '../utils/format';
import { Avatar } from './Avatar';
import { LogoutIcon, PlusIcon } from './Icons';

interface Props {
  chats: Chat[];
  messages: Record<string, ChatMessage[]>;
  activeChatId: string | null;
  connection: ConnectionState;
  onSelect: (chatId: string) => void;
  onCreateChat: (phone: string) => Promise<void>;
  onLogout: () => void;
}

const CONNECTION_LABEL: Record<ConnectionState, string> = {
  connecting: 'Подключение…',
  online: 'В сети',
  error: 'Нет соединения, переподключаемся…',
};

export function Sidebar({ chats, messages, activeChatId, connection, onSelect, onCreateChat, onLogout }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const digits = normalizePhone(phone);
    if (!isValidPhone(digits)) {
      setError('Введите номер в международном формате, например +7 999 123-45-67');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onCreateChat(digits);
      setPhone('');
      setShowForm(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <div>
          <h2 className="sidebar__title">Чаты</h2>
          <span className={`conn conn--${connection}`}>{CONNECTION_LABEL[connection]}</span>
        </div>
        <div className="sidebar__actions">
          <button
            className="icon-btn"
            title="Новый чат"
            aria-label="Новый чат"
            aria-expanded={showForm}
            onClick={() => {
              setShowForm((v) => !v);
              setError(null);
            }}
          >
            <PlusIcon />
          </button>
          <button className="icon-btn" title="Выйти" aria-label="Выйти" onClick={onLogout}>
            <LogoutIcon />
          </button>
        </div>
      </header>

      {showForm && (
        <form className="new-chat" onSubmit={handleCreate}>
          <input
            className="field__input"
            type="tel"
            placeholder="Номер получателя, +7…"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoFocus
          />
          <button className="btn-primary btn-primary--sm" type="submit" disabled={loading || !phone}>
            {loading ? '…' : 'Создать'}
          </button>
          {error && <div className="new-chat__error" role="alert">{error}</div>}
        </form>
      )}

      <ul className="chat-list">
        {chats.length === 0 && (
          <li className="chat-list__empty">
            Пока нет чатов.
            <br />
            Нажмите «+», чтобы написать по номеру телефона.
          </li>
        )}
        {chats.map((chat) => {
          const list = messages[chat.chatId] ?? [];
          const last = list[list.length - 1];
          return (
            <li key={chat.chatId}>
              <button
                className={`chat-item ${chat.chatId === activeChatId ? 'chat-item--active' : ''}`}
                onClick={() => onSelect(chat.chatId)}
              >
                <Avatar title={chat.title} seed={chat.chatId} />
                <span className="chat-item__body">
                  <span className="chat-item__row">
                    <span className="chat-item__title">{chat.title}</span>
                    {last && <span className="chat-item__time">{formatTime(last.timestamp)}</span>}
                  </span>
                  <span className="chat-item__row">
                    <span className="chat-item__preview">
                      {last ? `${last.direction === 'out' ? 'Вы: ' : ''}${last.text}` : 'Нет сообщений'}
                    </span>
                    {chat.unread > 0 && <span className="badge">{chat.unread}</span>}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
