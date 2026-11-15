import { useState, SyntheticEvent, ChangeEvent } from 'react';
// import { Link, useNavigate } from 'react-router';

interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

interface SignupResponse {
  access_token?: string;
  token_type?: string;
  message?: string;
  user?: {
    id?: string;
    name: string;
    email: string;
  };
}

interface ApiErrorResponse {
  detail?: string | Array<{ msg: string; loc?: string[] }>;
}

export default function Signup() {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

//   const navigate = useNavigate();

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    // Client-side validation before hitting the API
    if (!name.trim() || !email.trim() || !password) {
      setError('All fields are required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const payload: SignupRequest = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    };

    try {
      const res = await fetch('http://localhost:8000/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData: ApiErrorResponse = await res.json().catch(() => ({}));

        // Handle both HTTPException string details and Pydantic 422 validation error arrays
        if (Array.isArray(errData.detail)) {
          throw new Error(errData.detail[0]?.msg || 'Invalid input provided.');
        }
        throw new Error(errData.detail || `Registration failed (${res.status})`);
      }

      const data: SignupResponse = await res.json();
      console.log(data);

      // Clear sensitive inputs from memory
      setPassword('');
      setConfirmPassword('');

      // If your backend returns a token immediately upon signup, log them in; otherwise send to /login
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        // navigate('/');
      } else {
        // navigate('/login');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to reach the registration server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '380px',
        margin: '60px auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        padding: '24px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Create Account</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="name" style={{ fontSize: '14px', fontWeight: 600 }}>
            Full Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="Jane Doe"
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '16px' }}
          />
        </div>

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
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '16px' }}
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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              style={{ padding: '10px', flex: 1, borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '16px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{
                padding: '0 10px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                cursor: 'pointer',
              }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="confirmPassword" style={{ fontSize: '14px', fontWeight: 600 }}>
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '16px' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: '6px',
            padding: '12px',
            borderRadius: '4px',
            border: 'none',
            background: loading ? '#94a3b8' : '#2563eb',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: '16px',
            padding: '10px',
            background: '#fef2f2',
            color: '#b91c1c',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      <p style={{ marginTop: '18px', marginBottom: 0, fontSize: '14px', color: '#475569', textAlign: 'center' }}>
        Already have an account?{' '}
        {/* <Link to="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
          Log In
        </Link> */}
      </p>
    </div>
  );
}