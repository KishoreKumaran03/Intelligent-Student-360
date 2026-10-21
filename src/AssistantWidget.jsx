import { useEffect, useRef, useState } from 'react';
import { Bot, Copy, MessageCircle, Plus, Send, X } from 'lucide-react';
import './assistant.css';

const API = import.meta.env.VITE_AI_API_URL || '';
const starterQuestions = ['What is Student 360?', 'How do I book a lab?', 'Where can I find my attendance?'];

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, busy, open]);
  useEffect(() => () => requestRef.current?.abort(), []);

  async function send(text = draft) {
    const message = text.trim();
    if (!message || busy) return;
    const next = [...messages, { role: 'user', content: message }];
    setMessages(next);
    setDraft(''); setError(''); setBusy(true);
    const controller = new AbortController(); requestRef.current = controller;
    try {
      const response = await fetch(`${API}/api/ai/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message, history: messages.slice(-8) }), signal: controller.signal });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The assistant could not respond. Please retry.');
      setMessages([...next, { role: 'assistant', content: result.answer, sources: result.sources || [] }]);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || 'Student 360 Assistant is unavailable. Check that the local AI backend is running, then retry.');
    } finally { setBusy(false); requestRef.current = null; }
  }

  return <>
    <button className="assistant-launch" aria-label={open ? 'Close Student 360 Assistant' : 'Open Student 360 Assistant'} onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <MessageCircle size={22} />}<span>{open ? 'Close' : 'Ask AI'}</span></button>
    {open && <section className="assistant-panel" aria-label="Student 360 Assistant">
      <header className="assistant-head"><div className="assistant-bot"><Bot size={19} /></div><div><b>Student 360 Assistant</b><small>Your local assistant for academics and student services</small></div><button aria-label="New conversation" title="New conversation" onClick={() => { requestRef.current?.abort(); setMessages([]); setError(''); setBusy(false); }}><Plus size={18} /></button><button aria-label="Close assistant" onClick={() => setOpen(false)}><X size={18} /></button></header>
      <div className="assistant-notice">Local model · read only · prototype demo data</div>
      <div className="assistant-messages" ref={scrollRef}>
        {!messages.length && <div className="assistant-welcome"><div className="assistant-bot large"><Bot size={24} /></div><h3>How can I help?</h3><p>Ask about Student 360 features or how to find a service.</p><div className="assistant-suggestions">{starterQuestions.map(q => <button key={q} onClick={() => send(q)}>{q}</button>)}</div></div>}
        {messages.map((m, i) => <article className={`assistant-message ${m.role}`} key={i}><div>{m.content}</div>{m.sources?.length > 0 && <small>Sources: {m.sources.map(s => s.title).join(' · ')}</small>}{m.role === 'assistant' && <button className="assistant-copy" aria-label="Copy response" title="Copy response" onClick={() => navigator.clipboard?.writeText(m.content)}><Copy size={13} /></button>}</article>)}
        {busy && <div className="assistant-loading"><i /><i /><i /> Thinking with local Qwen…</div>}
        {error && <div className="assistant-error"><p>{error}</p><button onClick={() => send(messages.at(-1)?.content || draft)}>Retry</button></div>}
      </div>
      <form className="assistant-compose" onSubmit={e => { e.preventDefault(); send(); }}><textarea value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} maxLength={2000} placeholder="Ask about a Student 360 feature…" aria-label="Message" /><button type="submit" disabled={!draft.trim() || busy} aria-label="Send message"><Send size={17} /></button></form>
      <footer className="assistant-foot">No personal records are connected. Don't enter confidential information.</footer>
    </section>}
  </>;
}
