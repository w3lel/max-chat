import { useState, type FormEvent } from 'react';
import { GreenApiClient, defaultApiUrl } from '../api/greenApi';
import type { Credentials } from '../api/types';
import { Logo } from './Icons';

interface Props {
  onLogin: (creds: Credentials, remember: boolean) => void;
}

export function LoginForm({ onLogin }: Props) {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiToken] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedApiUrl = apiUrl.trim() || defaultApiUrl(idInstance);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const creds: Credentials = { apiUrl: resolvedApiUrl, idInstance: idInstance.trim(), apiTokenInstance: apiTokenInstance.trim() };
    setLoading(true);
    try {
      const { stateInstance } = await new GreenApiClient(creds).getStateInstance();
      if (stateInstance !== 'authorized') {
        setError(`Инстанс не авторизован (состояние: ${stateInstance}). Привяжите аккаунт MAX в консоли GREEN-API.`);
        return;
      }
      onLogin(creds, remember);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={handleSubmit}>
        <Logo className="login__logo" />
        <h1 className="login__title">Вход в MAX Chat</h1>
        <p className="login__subtitle">Введите данные инстанса из личного кабинета GREEN-API</p>

        <label className="field">
          <span className="field__label">idInstance</span>
          <input
            className="field__input"
            inputMode="numeric"
            autoComplete="off"
            placeholder="3100123456"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            required
            autoFocus
          />
        </label>

        <label className="field">
          <span className="field__label">apiTokenInstance</span>
          <input
            className="field__input"
            type="password"
            autoComplete="off"
            placeholder="••••••••••••••••"
            value={apiTokenInstance}
            onChange={(e) => setApiToken(e.target.value)}
            required
          />
        </label>

        <button type="button" className="link-btn" onClick={() => setShowAdvanced((v) => !v)}>
          {showAdvanced ? 'Скрыть' : 'Дополнительно'}: API URL
        </button>
        {showAdvanced && (
          <label className="field">
            <span className="field__label">apiUrl</span>
            <input
              className="field__input"
              placeholder={defaultApiUrl(idInstance)}
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
            <span className="field__hint">По умолчанию определяется по idInstance. Скопируйте из консоли, если отличается.</span>
          </label>
        )}

        <label className="checkbox">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Запомнить на этом устройстве
        </label>

        {error && <div className="login__error" role="alert">{error}</div>}

        <button className="btn-primary" type="submit" disabled={loading || !idInstance || !apiTokenInstance}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
