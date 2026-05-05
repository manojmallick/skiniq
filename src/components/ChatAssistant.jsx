import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { chatWithAI } from '../services/api.js';

export default function ChatAssistant({ skinContext }) {
  const { t, locale } = useLanguage();
  const [messages, setMessages] = useState([
    { role: 'ai', content: t('chat_greeting') || 'Do you have any questions about your routine, products, or skin? Ask me anything!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || isLoading) return;

    const newMsgs = [...messages, { role: 'user', content: query }];
    setMessages(newMsgs);
    setInput('');
    setIsLoading(true);

    try {
      const resp = await chatWithAI(newMsgs, skinContext, locale);
      setMessages(prev => [...prev, { role: 'ai', content: resp.response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: t('chat_error') || 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card chat-container" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', height: '400px' }}>
      <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ fontSize: '1.5rem' }}>🤖</div>
        <div>
          <h3 style={{ margin: 0 }}>{t('chat_title') || 'SkinIQ Consultant'}</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {t('chat_subtitle') || 'Ask about your routine, products, or lifestyle'}
          </p>
        </div>
      </div>
      
      <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ 
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            padding: '0.75rem 1rem',
            borderRadius: msg.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
            background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-subtle)',
            color: msg.role === 'user' ? 'white' : 'var(--text)',
            fontSize: '0.9rem',
            lineHeight: '1.4'
          }}>
            {msg.content.split('\n').map((line, idx) => (
              <span key={idx}>
                {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                {idx !== msg.content.split('\n').length - 1 && <br />}
              </span>
            ))}
          </div>
        ))}
        {isLoading && (
          <div style={{ 
            alignSelf: 'flex-start', 
            padding: '0.75rem 1rem', 
            borderRadius: '16px 16px 16px 0', 
            background: 'var(--bg-subtle)' 
          }}>
            <div className="loading-dot" style={{ display: 'inline-block', margin: '0 2px' }} />
            <div className="loading-dot" style={{ display: 'inline-block', margin: '0 2px' }} />
            <div className="loading-dot" style={{ display: 'inline-block', margin: '0 2px' }} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chat_placeholder') || 'Ask a question...'}
            disabled={isLoading}
            style={{ 
              flex: 1, 
              padding: '0.75rem 1rem', 
              borderRadius: '100px', 
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            style={{
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '100px',
              padding: '0 1.25rem',
              fontWeight: '600',
              cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
              opacity: (isLoading || !input.trim()) ? 0.5 : 1
            }}
          >
            {t('chat_send') || 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
