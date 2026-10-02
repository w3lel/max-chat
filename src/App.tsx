import { useState } from 'react';
import type { Credentials } from './api/types';
import { LoginForm } from './components/LoginForm';
import { Messenger } from './components/Messenger';

const STORAGE_KEY = 'max-chat:credentials';

function loadCredentials(): Credentials | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Credentials) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(loadCredentials);

  function handleLogin(creds: Credentials, remember: boolean) {
    try {
      (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, JSON.stringify(creds));
    } catch {
      /* хранилище недоступно — просто не запоминаем */
    }
    setCredentials(creds);
  }

  function handleLogout() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    setCredentials(null);
  }

  return credentials ? (
    <Messenger key={credentials.idInstance} credentials={credentials} onLogout={handleLogout} />
  ) : (
    <LoginForm onLogin={handleLogin} />
  );
}
