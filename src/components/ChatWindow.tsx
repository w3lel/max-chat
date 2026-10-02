import { Fragment, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import type { Chat, ChatMessage } from '../api/types';
import { formatDay, formatPhone, formatTime } from '../utils/format';
import { Avatar } from './Avatar';
import { BackIcon, SendIcon, Ticks } from './Icons';

interface Props {
  chat: Chat;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onBack: () => void;
}

const MAX_LENGTH = 4000; // ограничение sendMessage

export function ChatWindow({ chat, messages, onSend, onBack }: Props) {
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // автоскролл вниз при новых сообщениях
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, chat.chatId]);

  useEffect(() => {
    setText('');
    inputRef.current?.focus();
  }, [chat.chatId]);

  // авто-высота поля ввода
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <section className="chat">
      <header className="chat__header">
        <button className="icon-btn chat__back" onClick={onBack} aria-label="Назад к чатам">
          <BackIcon />
        </button>
        <Avatar title={chat.title} seed={chat.chatId} size={40} />
        <div className="chat__meta">
          <div className="chat__title">{chat.title}</div>
          <div className="chat__subtitle">{chat.phone ? formatPhone(chat.phone) : `ID ${chat.chatId}`}</div>
        </div>
      </header>

      <div className="chat__messages" ref={listRef}>
        {messages.length === 0 && <div className="chat__empty">Напишите первое сообщение 👋</div>}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const newDay = !prev || new Date(prev.timestamp).toDateString() !== new Date(m.timestamp).toDateString();
          return (
            <Fragment key={m.id}>
              {newDay && <div className="day-sep">{formatDay(m.timestamp)}</div>}
              <div className={`msg msg--${m.direction} ${m.status === 'failed' ? 'msg--failed' : ''}`}>
                <span className="msg__text">{m.text}</span>
                <span className="msg__meta">
                  {formatTime(m.timestamp)}
                  {m.direction === 'out' && <Ticks status={m.status} />}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>

      <form className="composer" onSubmit={submit}>
        <textarea
          ref={inputRef}
          className="composer__input"
          rows={1}
          maxLength={MAX_LENGTH}
          placeholder="Сообщение"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="composer__send" type="submit" disabled={!text.trim()} aria-label="Отправить">
          <SendIcon />
        </button>
      </form>
    </section>
  );
}
