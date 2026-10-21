import { createServer } from 'node:http';
import { generateAnswer, modelStatus } from './ai/model.js';
import { searchKnowledge } from './ai/knowledge/retrieval.js';

const port = Number(process.env.AI_PORT) || 3001;
const host = process.env.AI_HOST || '127.0.0.1';
const maxBody = 16_000;
const buckets = new Map();
const send = (res, status, data) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(JSON.stringify(data));
};
function rateAllowed(key) {
  const now = Date.now();
  const recent = (buckets.get(key) || []).filter((time) => now - time < 60_000);
  if (recent.length >= 12) { buckets.set(key, recent); return false; }
  recent.push(now); buckets.set(key, recent);
  if (buckets.size > 1000) buckets.clear();
  return true;
}
const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/api/ai/status') return send(res, 200, await modelStatus());
  if (req.method !== 'POST' || url.pathname !== '/api/ai/chat') return send(res, 404, { error: 'Not found.' });
  if (!rateAllowed(req.headers['x-real-ip'] || req.socket.remoteAddress || 'local')) return send(res, 429, { error: 'Too many requests. Please wait a minute and retry.' });
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > maxBody) return send(res, 413, { error: 'Message is too large.' });
  }
  try {
    const input = JSON.parse(body || '{}');
    if (typeof input.message !== 'string' || !input.message.trim() || input.message.length > 2000) return send(res, 400, { error: 'Enter a message of 1 to 2,000 characters.' });
    const history = Array.isArray(input.history) ? input.history.slice(-8) : [];
    const sources = await searchKnowledge(input.message);
    const answer = await generateAnswer({ message: input.message.trim(), history, passages: sources });
    return send(res, 200, { answer, sources: sources.map(({ title }) => ({ title })), grounded: sources.length > 0 });
  } catch (error) {
    if (error instanceof SyntaxError) return send(res, 400, { error: 'Invalid JSON request.' });
    const status = error.code === 'MODEL_UNAVAILABLE' ? 503 : error.code === 'MODEL_OUTPUT_INVALID' ? 502 : 500;
    if (status === 500) console.error('AI request failed:', error.message);
    return send(res, status, { error: error.message || 'The assistant could not respond. Please retry.', code: error.code || 'AI_ERROR' });
  }
});
server.listen(port, host, () => console.log(`Student 360 local AI backend listening at http://${host}:${port}`));
