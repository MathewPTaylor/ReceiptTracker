import { useState, SyntheticEvent, ChangeEvent } from 'react';
import './styles/signup.css';
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
      className="signup-panel"
    >
      <h2 className="signup-title">Create Account</h2>

      <form onSubmit={handleSubmit} className="signup-form">
        <div className="signup-field">
          <label htmlFor="name" className="signup-label">
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
            className="signup-input"
          />
        </div>

        <div className="signup-field">
          <label htmlFor="email" className="signup-label">
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
            className="signup-input"
          />
        </div>

        <div className="signup-field">
          <label htmlFor="password" className="signup-label">
            Password
          </label>
          <div className="signup-password-row">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="signup-password-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="signup-toggle"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div className="signup-field">
          <label htmlFor="confirmPassword" className="signup-label">
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
            className="signup-input"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="signup-submit"
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      {error && (
        <div
          role="alert"
          className="signup-error"
        >
          {error}
        </div>
      )}

      <p className="signup-footer">
        Already have an account?{' '}
        {/* <Link to="/login" className="signup-login-link">
          Log In
        </Link> */}
      </p>
    </div>
  );
}