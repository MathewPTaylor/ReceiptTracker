import { useState, type SubmitEvent, type ChangeEvent } from 'react';
import "./App.css"

// 1. Define interfaces matching your FastAPI Pydantic models
interface GreetRequest {
  name: string;
}

interface GreetResponse {
  message: string;
  character_count: number;
}

function App() {
  const [name, setName] = useState<string>('');
  const [response, setResponse] = useState<GreetResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // 2. Type the form submission event
  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');
    setResponse(null);

    const payload: GreetRequest = { name };

    try {
      const res = await fetch('http://localhost:8000/api/greet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      // 3. Cast the parsed JSON response to the expected interface
      const data: GreetResponse = await res.json();
      setResponse(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Connection failed: ${err.message}`);
      } else {
        setError('Failed to connect to FastAPI. Is the backend running?');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Type the input change event
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setName(e.target.value);
  };

  return (
    <div className="form-wrapper">
      <h2>FastAPI + React (TS) Demo</h2>
      
      <form onSubmit={handleSubmit} className="mainForm">
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="Enter your name..."
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>

      {error && (
        <p style={{ color: 'red', marginTop: '16px' }}>{error}</p>
      )}

      {response && (
        <div style={{ marginTop: '20px', padding: '12px', background: '#f0f4f8', borderRadius: '6px' }}>
          <p><strong>Message:</strong> {response.message}</p>
          <p><strong>Name Length:</strong> {response.character_count}</p>
        </div>
      )}
    </div>
  );
}

export default App;