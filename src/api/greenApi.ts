import type {
  CheckAccountResponse,
  Credentials,
  ReceiveNotificationResponse,
  SendMessageResponse,
  StateInstanceResponse,
} from './types';

export class GreenApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'GreenApiError';
  }
}

/** apiUrl по умолчанию: первые 4 цифры idInstance → https://XXXX.api.green-api.com */
export function defaultApiUrl(idInstance: string): string {
  const prefix = idInstance.trim().slice(0, 4);
  return /^\d{4}$/.test(prefix) ? `https://${prefix}.api.green-api.com` : 'https://api.green-api.com';
}

/**
 * Минимальный клиент GREEN-API для MAX.
 * Формат методов: {apiUrl}/waInstance{idInstance}/{method}/{apiTokenInstance}
 */
export class GreenApiClient {
  private readonly base: string;
  private readonly token: string;

  constructor({ apiUrl, idInstance, apiTokenInstance }: Credentials) {
    this.base = `${apiUrl.replace(/\/+$/, '')}/waInstance${idInstance.trim()}`;
    this.token = apiTokenInstance.trim();
  }

  private url(method: string, suffix = ''): string {
    return `${this.base}/${method}/${this.token}${suffix}`;
  }

  private async request<T>(url: string, init: RequestInit = {}): Promise<T> {
    let res: Response;
    try {
      res = await fetch(url, {
        ...init,
        headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
      });
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e;
      throw new GreenApiError('Сеть недоступна или неверный API URL');
    }

    if (!res.ok) {
      const hint =
        res.status === 401 || res.status === 403
          ? 'Неверный idInstance или apiTokenInstance'
          : res.status === 429
            ? 'Слишком много запросов, попробуйте позже'
            : `Ошибка GREEN-API (${res.status})`;
      throw new GreenApiError(hint, res.status);
    }

    const text = await res.text();
    return (text ? JSON.parse(text) : null) as T;
  }

  getStateInstance(): Promise<StateInstanceResponse> {
    return this.request(this.url('getStateInstance'));
  }

  checkAccount(phoneNumber: string): Promise<CheckAccountResponse> {
    return this.request(this.url('checkAccount'), {
      method: 'POST',
      body: JSON.stringify({ phoneNumber: Number(phoneNumber) }),
    });
  }

  sendMessage(chatId: string, message: string): Promise<SendMessageResponse> {
    return this.request(this.url('sendMessage'), {
      method: 'POST',
      body: JSON.stringify({ chatId, message }),
    });
  }

  /** Long-polling: ждёт уведомление до receiveTimeout секунд, иначе возвращает null */
  receiveNotification(receiveTimeout = 20, signal?: AbortSignal): Promise<ReceiveNotificationResponse | null> {
    return this.request(this.url('receiveNotification', `?receiveTimeout=${receiveTimeout}`), { signal });
  }

  deleteNotification(receiptId: number): Promise<{ result: boolean }> {
    return this.request(this.url('deleteNotification', `/${receiptId}`), { method: 'DELETE' });
  }
}
