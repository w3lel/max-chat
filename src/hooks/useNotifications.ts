import { useEffect, useRef, useState } from 'react';
import type { GreenApiClient } from '../api/greenApi';
import type { NotificationBody } from '../api/types';

export type ConnectionState = 'connecting' | 'online' | 'error';

const RECEIVE_TIMEOUT_SEC = 20;
const RETRY_DELAY_MS = 3000;

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      resolve();
    });
  });

/**
 * Получение входящих через HTTP API (ReceiveNotification + DeleteNotification).
 * Один бесконечный цикл long-polling'а: получили уведомление → обработали → удалили из очереди.
 */
export function useNotifications(client: GreenApiClient | null, onNotification: (body: NotificationBody) => void) {
  const [state, setState] = useState<ConnectionState>('connecting');
  // актуальный обработчик без перезапуска цикла
  const handlerRef = useRef(onNotification);
  handlerRef.current = onNotification;

  useEffect(() => {
    if (!client) return;
    const controller = new AbortController();
    const { signal } = controller;

    (async () => {
      setState('connecting');
      while (!signal.aborted) {
        try {
          const notification = await client.receiveNotification(RECEIVE_TIMEOUT_SEC, signal);
          setState('online');
          if (!notification) continue; // очередь пуста — сразу следующий запрос

          try {
            handlerRef.current(notification.body);
          } finally {
            // удаляем всегда, иначе «битое» уведомление заблокирует очередь
            await client.deleteNotification(notification.receiptId);
          }
        } catch (e) {
          if (signal.aborted || (e as Error).name === 'AbortError') break;
          console.warn('[notifications]', e);
          setState('error');
          await sleep(RETRY_DELAY_MS, signal);
        }
      }
    })();

    return () => controller.abort();
  }, [client]);

  return state;
}
