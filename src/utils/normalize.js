export function canonicalLabel(value) { return String(value ?? '').normalize('NFKC').trim().replace(/[\s_-]+/g, ' ').toLocaleLowerCase().replace(/(^|\s)\p{L}/gu, (m) => m.toLocaleUpperCase()); }
export function canonicalIdentifier(value) { return String(value ?? '').normalize('NFKC').trim().toUpperCase().replace(/[\s-]+/g, ''); }
export function normalizeHeader(value) { return String(value ?? '').replace(/^\uFEFF/, '').normalize('NFKC').trim().replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().toLocaleLowerCase(); }
export function parseInstitutionalDate(value) { if (value == null || value === '')
    return null; if (value instanceof Date && !Number.isNaN(value.getTime()))
    return value.toISOString().slice(0, 10); const text = String(value).trim(); let match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (match) {
    const d = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text ? text : null;
} match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/); if (match) {
    const [, a, b, y] = match;
    const day = Number(a), month = Number(b);
    if (day > 12 && month <= 12)
        return parseInstitutionalDate(`${y}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`);
    if (month > 12 && day <= 12)
        return parseInstitutionalDate(`${y}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`);
    return null;
} return null; }
export function parseFiniteNumber(value) { if (value == null || String(value).trim() === '')
    return null; if (typeof value === 'number')
    return Number.isFinite(value) ? value : null; const text = String(value).trim().replace(/,/g, ''); if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(text))
    return null; const n = Number(text); return Number.isFinite(n) ? n : null; }
export function titleCase(value) { return canonicalLabel(value); }
