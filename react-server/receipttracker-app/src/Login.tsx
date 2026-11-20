import { useState, SyntheticEvent, ChangeEvent } from 'react';
import './styles/login.css';

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
    <div className="login-panel">
      <h2 className="login-title">Log In</h2>

      <form onSubmit={handleSubmit} className="login-form">
        <div className="login-field">
          <label htmlFor="email" className="login-label">
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
            className="login-input"
          />
        </div>

        <div className="login-field">
          <label htmlFor="password" className="login-label">
            Password
          </label>
          <div className="login-password-row">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter password"
              className="login-password-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="login-toggle"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="login-submit"
        >
          {loading ? 'Signing in...' : 'Log In'}
        </button>
      </form>

      {error && (
        <div role="alert" className="login-error">
          {error}
        </div>
      )}

      {token && (
        <div className="login-success">
          <strong>Authenticated!</strong>
          <p className="login-token">Token: {token}</p>
        </div>
      )}
    </div>
  );
}

export default Login;