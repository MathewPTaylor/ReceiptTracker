import { useState, SyntheticEvent, ChangeEvent } from 'react';

// 1. Interfaces matching a standard FastAPI login endpoint
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginProps {
  onLoginSuccess: (state: boolean) => void;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: {
    email: string;
  };
}

interface ApiErrorResponse {
  detail?: string;
}

function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError('');
    setToken(null);

    const payload: LoginRequest = {
      email: email.trim(),
      password,
    };

    alert(JSON.stringify(payload));

    try {
      const res = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Attempt to read FastAPI's standard {"detail": "..."} error message
        const errData: ApiErrorResponse = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Authentication failed (${res.status})`);
      }

      const data: LoginResponse = await res.json();
      setToken(data.access_token);
      onLoginSuccess(true); // Call the success callback
      setPassword(''); // Clear password from memory on success
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to reach the authentication server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setPassword(e.target.value);
  };

  return (
    <div style={{ maxWidth: '380px', margin: '80px auto', fontFamily: 'sans-serif', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Log In</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="email" style={{ fontSize: '14px', fontWeight: 600 }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={handleEmailChange}
            placeholder="you@example.com"
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="password" style={{ fontSize: '14px', fontWeight: 600 }}>
            Password
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter password"
              style={{ padding: '10px', flex: 1, borderRadius: '4px', border: '1px solid #cbd5e1' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{ padding: '0 10px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: '6px',
            padding: '10px',
            borderRadius: '4px',
            border: 'none',
            background: loading ? '#94a3b8' : '#2563eb',
            color: '#fff',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Signing in...' : 'Log In'}
        </button>
      </form>

      {error && (
        <div role="alert" style={{ marginTop: '16px', padding: '10px', background: '#fef2f2', color: '#b91c1c', borderRadius: '4px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {token && (
        <div style={{ marginTop: '16px', padding: '12px', background: '#f0fdf4', color: '#166534', borderRadius: '4px', fontSize: '14px', wordBreak: 'break-all' }}>
          <strong>Authenticated!</strong>
          <p style={{ margin: '6px 0 0' }}>Token: {token}</p>
        </div>
      )}
    </div>
  );
}

export default Login;