import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const stopWords = new Set('a an and are as at be can do for from how i in is it me my of on or student the this to what where which with'.split(' '));
const tokenize = (text) => (text.toLowerCase().match(/[a-z0-9]+/g) || []).map((word) => word.length > 5 && word.endsWith('ing') ? word.slice(0, -3) : word).map((word) => word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word).filter((word) => word.length > 1 && !stopWords.has(word));

export async function searchKnowledge(query, limit = 4) {
  const documentDir = join(here, 'documents');
  const files = (await readdir(documentDir, { withFileTypes: true })).filter((item) => item.isFile() && item.name.toLowerCase().endsWith('.md'));
  const sections = [];
  for (const file of files) {
    const raw = await readFile(join(documentDir, file.name), 'utf8');
    const title = raw.match(/^title:\s*(.+)$/m)?.[1]?.trim() || file.name.replace(/\.md$/i, '');
    const body = raw.replace(/^---[\s\S]*?---\s*/, '');
    for (const text of body.split(/(?=^## )/m)) {
      const sectionTitle = text.match(/^#{1,2}\s+(.+)$/m)?.[1]?.trim() || title;
      const content = text.replace(/^#{1,2}\s+.+$/m, '').trim();
      if (content) sections.push({ title: `${title} — ${sectionTitle}`, text: content });
    }
  }
  const queryTerms = new Set(tokenize(query));
  const ranked = sections.map((section) => {
    const words = tokenize(section.text);
    const counts = new Map();
    for (const word of words) counts.set(word, (counts.get(word) || 0) + 1);
    const score = [...queryTerms].reduce((sum, term) => sum + (counts.has(term) ? 1 + Math.log(counts.get(term)) : 0), 0) / Math.sqrt(words.length || 1);
    return { ...section, score };
  }).filter((section) => section.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
  return ranked.map(({ title, text, score }) => ({ title, text, score: Number(score.toFixed(3)) }));
}
