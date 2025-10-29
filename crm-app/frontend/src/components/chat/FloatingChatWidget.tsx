import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';

const DEFAULT_WIDTH = 380;
const DEFAULT_HEIGHT = 520;
const MIN_WIDTH = 320;
const MIN_HEIGHT = 320;
const MAX_WIDTH = 600;
const MAX_HEIGHT = 700;

export const FloatingChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hi! I am your Sales Agent AI. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  const [resizing, setResizing] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const startPos = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing || !startPos.current) return;
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      setSize({
        width: Math.min(Math.max(startPos.current.width + dx, MIN_WIDTH), MAX_WIDTH),
        height: Math.min(Math.max(startPos.current.height + dy, MIN_HEIGHT), MAX_HEIGHT),
      });
    };
    const handleMouseUp = () => setResizing(false);
    if (resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages(msgs => [...msgs, userMessage]);
    setInput('');
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      setMessages(msgs => [
        ...msgs,
        { sender: 'ai', text: data.response || 'No response from agent.' },
      ]);
    } catch (err) {
      setMessages(msgs => [
        ...msgs,
        { sender: 'ai', text: 'Sorry, there was a problem connecting to the agent.' },
      ]);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          className="fixed bottom-8 right-8 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 flex items-center justify-center transition-all"
          style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18)' }}
          onClick={() => setOpen(true)}
          aria-label="Open Chat"
        >
          <MessageCircle className="h-7 w-7" />
        </button>
      )}
      {/* Chat Widget */}
      {open && (
        <div
          ref={widgetRef}
          className="fixed bottom-8 right-8 z-50 bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200"
          style={{
            width: size.width,
            height: size.height,
            minWidth: MIN_WIDTH,
            minHeight: MIN_HEIGHT,
            maxWidth: MAX_WIDTH,
            maxHeight: MAX_HEIGHT,
            boxShadow: '0 8px 32px 0 rgba(0,0,0,0.22)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-500 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-white" />
              <span className="text-white font-semibold text-lg">Sales Agent AI</span>
              <span
                className="ml-2 px-2 py-0.5 text-xs rounded bg-yellow-400 text-gray-900 font-semibold"
                title="This module is in development"
              >
                In development
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white hover:text-gray-200 p-1 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-3 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-xl shadow-sm text-base leading-relaxed break-words ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                  }`}
                  style={{ wordBreak: 'break-word' }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {/* Input */}
          <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-2 rounded-b-2xl">
            <input
              type="text"
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 bg-gray-50 placeholder-gray-400 text-base"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSend();
              }}
              aria-label="Type your message"
              autoFocus
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 flex items-center justify-center transition-all disabled:opacity-50"
              onClick={handleSend}
              disabled={!input.trim()}
              aria-label="Send"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          {/* Resize Handle */}
          <div
            className="absolute bottom-2 right-2 w-5 h-5 cursor-nwse-resize z-50"
            style={{ userSelect: 'none' }}
            onMouseDown={e => {
              setResizing(true);
              startPos.current = {
                x: e.clientX,
                y: e.clientY,
                width: size.width,
                height: size.height,
              };
              e.preventDefault();
            }}
            title="Resize"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 17L17 3M10 17H17V10"
                stroke="#60A5FA"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      )}
    </>
  );
};
