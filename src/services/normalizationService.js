import { canonicalIdentifier, canonicalLabel, normalizeHeader, parseFiniteNumber, parseInstitutionalDate } from '../utils/normalize';
export function normalizeField(value, kind) { if (value == null || String(value).trim() === '')
    return { value: null, state: 'missing', sourceValue: value }; if (kind === 'identifier')
    return { value: canonicalIdentifier(value), state: 'present', sourceValue: value }; if (kind === 'label')
    return { value: canonicalLabel(value), state: 'present', sourceValue: value }; if (kind === 'date') {
    const normalized = parseInstitutionalDate(value);
    return { value: normalized, state: normalized ? 'present' : 'invalid', sourceValue: value };
} if (kind === 'number' || kind === 'percentage') {
    const normalized = parseFiniteNumber(value);
    const valid = normalized != null && (kind !== 'percentage' || (normalized >= 0 && normalized <= 100));
    return { value: valid ? normalized : null, state: valid ? 'present' : 'invalid', sourceValue: value };
} return { value: String(value).normalize('NFKC').trim(), state: 'present', sourceValue: value }; }
export function normalizeEntityRow(row, schema) { return Object.fromEntries(Object.entries(schema).map(([field, kind]) => [field, normalizeField(row[field], kind)])); }
export function canonicalizeRecordCategory(value, knownValues = []) { const normalized = canonicalLabel(value); return knownValues.find(item => canonicalLabel(item) === normalized) || normalized; }
export function suggestColumnMapping(columns, fields) { const aliases = { studentId: ['student id', 'register no', 'register number', 'roll no', 'roll number', 'admission number'], studentName: ['student name', 'full name', 'name'], programme: ['programme', 'program', 'degree'], batch: ['batch', 'cohort', 'year of admission'], section: ['section', 'class section'], semester: ['semester', 'term'], courseCode: ['course code', 'subject code', 'course id'], date: ['date', 'attendance date', 'assessment date'], attendancePercent: ['attendance percent', 'attendance percentage', 'attendance'], sessionsHeld: ['sessions held', 'total sessions', 'classes conducted'], sessionsPresent: ['sessions present', 'present sessions', 'classes attended'], mark: ['mark', 'marks', 'score', 'assessment score'], activityName: ['activity', 'activity name', 'event name'], facultyId: ['faculty id', 'staff id', 'employee id'] }; const result = {}; for (const field of fields) {
    const candidates = [field.replace(/[A-Z]/g, m => ` ${m.toLowerCase()}`), ...(aliases[field] || [])];
    result[field] = columns.find(col => candidates.some(c => normalizeHeader(c) === normalizeHeader(col))) || null;
} return result; }
