import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { chatWithAI } from '../services/api.js';

// Lightweight Markdown renderer — no external deps
function MarkdownRenderer({ content, className }) {
  const lines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table detection (starts with |)
    if (line.trim().startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines
        .filter(l => !l.replace(/[|-]/g, '').trim() === '')  // keep separator rows for now
        .map(l => l.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim()));
      // remove separator row (dashes only)
      const header = rows[0];
      const body = rows.slice(1).filter(r => !r.every(c => /^[-:]+$/.test(c)));
      elements.push(
        <div key={`table-${i}`} style={{ overflowX: 'auto', margin: '0.75rem 0' }}>
          <table className="md-table">
            <thead><tr>{header.map((h, j) => <th key={j}>{h}</th>)}</tr></thead>
            <tbody>{body.map((row, r) => <tr key={r}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }

    // Headers
    if (line.startsWith('### ')) { elements.push(<h4 key={i} style={{margin:'0.5rem 0 0.25rem'}}>{renderInline(line.slice(4))}</h4>); i++; continue; }
    if (line.startsWith('## '))  { elements.push(<h3 key={i} style={{margin:'0.5rem 0 0.25rem'}}>{renderInline(line.slice(3))}</h3>); i++; continue; }
    if (line.startsWith('# '))   { elements.push(<h2 key={i} style={{margin:'0.5rem 0 0.25rem'}}>{renderInline(line.slice(2))}</h2>); i++; continue; }

    // Unordered list
    if (/^[*-] /.test(line.trim())) {
      const listItems = [];
      while (i < lines.length && /^[*-] /.test(lines[i].trim())) {
        listItems.push(<li key={i}>{renderInline(lines[i].trim().slice(2))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} style={{margin:'0.4rem 0',paddingLeft:'1.5rem'}}>{listItems}</ul>);
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line.trim())) {
      const listItems = [];
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
        listItems.push(<li key={i}>{renderInline(lines[i].trim().replace(/^\d+\. /,''))}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} style={{margin:'0.4rem 0',paddingLeft:'1.5rem'}}>{listItems}</ol>);
      continue;
    }

    // Blank line
    if (!line.trim()) { elements.push(<br key={i} />); i++; continue; }

    // Paragraph
    elements.push(<p key={i} style={{margin:'0 0 0.5rem'}}>{renderInline(line)}</p>);
    i++;
  }

  return <div className={className}>{elements}</div>;
}

function renderInline(text) {
  // Bold + italic patterns
  const parts = [];
  const regex = /(\*\*\*(.*?)\*\*\*)|(\*\*(.*?)\*\*)|(\*(.*?)\*)|(`(.*?)`)/g;
  let last = 0, m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={m.index}><em>{m[2]}</em></strong>);
    else if (m[3]) parts.push(<strong key={m.index}>{m[4]}</strong>);
    else if (m[5]) parts.push(<em key={m.index}>{m[6]}</em>);
    else if (m[7]) parts.push(<code key={m.index} style={{background:'rgba(0,0,0,0.08)',borderRadius:'3px',padding:'0 3px',fontSize:'0.85em'}}>{m[8]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

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
            <MarkdownRenderer content={msg.content} className="chat-markdown" />
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
