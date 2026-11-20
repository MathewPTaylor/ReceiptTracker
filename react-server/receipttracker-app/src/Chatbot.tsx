import React, { useState, useRef, useEffect } from 'react';
import { BottomNavbar } from './components/Navbar.tsx';
import './styles/chatbot.css';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

const initialMessages: Message[] = [
  {
    id: '1',
    sender: 'bot',
    text: 'Hello! How can I help you today?',
    timestamp: '10:00 AM',
  },
];

export const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const formatTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: trimmed,
      timestamp: formatTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulated bot response (replace with your API call)
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `You said: "${trimmed}". Connect your backend API here to generate real responses.`,
        timestamp: formatTime(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="chatbot-page">
      <header className="chatbot-header">
        <div className="chatbot-header__status-dot" />
        <h1 className="chatbot-header__title">Bei</h1>
      </header>

      <main className="chatbot-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chatbot-message chatbot-message--${msg.sender}`}
          >
            <div className="chatbot-message__bubble">
              <p className="chatbot-message__text">{msg.text}</p>
              <span className="chatbot-message__timestamp">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="chatbot-message chatbot-message--bot">
            <div className="chatbot-message__bubble chatbot-message__bubble--typing">
              <span className="chatbot-typing-dot" />
              <span className="chatbot-typing-dot" />
              <span className="chatbot-typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      <form className="chatbot-input-bar" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chatbot-input-bar__field"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          aria-label="Message input"
        />
        <button
          type="submit"
          className="chatbot-input-bar__submit"
          disabled={!inputValue.trim()}
        >
          Send
        </button>
      </form>

      <BottomNavbar />
    </div>
  );
};

export default ChatbotPage;