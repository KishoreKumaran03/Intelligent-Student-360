import { canonicalIdentifier, normalizeHeader } from '../utils/normalize';
import { writeDemoState, readDemoState } from '../utils/storage';
import { datasetSchemas, detectDuplicateIdentifiers, validateDatasetRow } from './validationService';
import { suggestColumnMapping } from './normalizationService';
import { jobService } from './jobService';
import { students } from '../data/mock';
import { assertCapability } from './authorizationService';
const IMPORTS_KEY = 'imports';
function parseCsvText(text) { const rows = []; let row = [], cell = '', quoted = false; for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
        if (quoted && text[i + 1] === '"') {
            cell += '"';
            i++;
        }
        else
            quoted = !quoted;
    }
    else if (char === ',' && !quoted) {
        row.push(cell);
        cell = '';
    }
    else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && text[i + 1] === '\n')
            i++;
        row.push(cell);
        if (row.some(v => v.trim() !== ''))
            rows.push(row);
        row = [];
        cell = '';
    }
    else
        cell += char;
} if (cell || row.length) {
    row.push(cell);
    rows.push(row);
} if (quoted)
    throw new Error('CSV has an unclosed quoted value'); return rows; }
async function readRows(file) { const extension = file.name.split('.').pop()?.toLocaleLowerCase(); if (extension === 'csv') {
    const matrix = parseCsvText(await file.text());
    return matrix;
} if (extension === 'xlsx' || extension === 'xls') {
    const { default: readXlsxFile } = await import('read-excel-file/browser');
    return await readXlsxFile(file);
} throw new Error('Choose a .csv or .xlsx file.'); }
export async function previewInstitutionalFile(file, dataset) { if (file.size === 0)
    throw new Error('The selected file is empty.'); if (file.size > 20 * 1024 * 1024)
    throw new Error('File exceeds the 20 MB demo limit.'); if (/\.xlsm$/i.test(file.name))
    throw new Error('Macro-enabled spreadsheets are not accepted. Save an .xlsx copy first.'); const matrix = await readRows(file); if (matrix.length < 2)
    throw new Error('The file needs a header row and at least one data row.'); const headers = matrix[0].map(v => String(v ?? '').trim()); if (headers.some(v => !v))
    throw new Error('Every source column needs a header.'); const duplicateHeaders = headers.map(normalizeHeader).filter((v, i, a) => a.indexOf(v) !== i); if (duplicateHeaders.length)
    throw new Error(`Duplicate source columns after normalization: ${[...new Set(duplicateHeaders)].join(', ')}`); const rows = matrix.slice(1).map(values => Object.fromEntries(headers.map((h, i) => [h, values[i] ?? null]))); const schema = datasetSchemas[dataset]; const mapping = suggestColumnMapping(headers, schema.map(f => f.key)); const issues = []; for (const field of schema.filter(f => f.required)) {
    if (!mapping[field.key])
        issues.push(`Required field “${field.label}” has no suggested source column.`);
} return { fileName: file.name, dataset, headers, rows, mapping, rowCount: rows.length, issues }; }
export async function previewInstitutionalBatch(files, dataset) { if (!files.length)
    throw new Error('Select at least one file.'); const previews = await Promise.all(files.map(file => previewInstitutionalFile(file, dataset))); const baseline = previews[0].headers; const schemaDifferences = previews.slice(1).flatMap(preview => { const missing = baseline.filter(h => !preview.headers.includes(h)); const extra = preview.headers.filter(h => !baseline.includes(h)); return missing.length || extra.length ? [`${preview.fileName}: missing [${missing.join(', ')}], extra [${extra.join(', ')}]`] : []; }); return { previews, schemaMismatch: schemaDifferences.length > 0, schemaDifferences }; }
export async function processInstitutionalImport(preview, mapping, role) { assertCapability(role, 'import.create.department', { departmentId: 'CSE' }); if (role === 'Office' && !['attendance', 'eventParticipants'].includes(preview.dataset))
    throw new Error('Office data processing is limited to attendance and event participant records.'); const schema = datasetSchemas[preview.dataset]; const selected = Object.entries(mapping).filter(([, source]) => source); const repeats = selected.map(([, source]) => source).filter((source, i, a) => a.indexOf(source) !== i); if (repeats.length)
    throw new Error(`A source column is mapped more than once: ${[...new Set(repeats)].join(', ')}`); const unmappedRequired = schema.filter(f => f.required && !mapping[f.key]); if (unmappedRequired.length)
    throw new Error(`Map required fields: ${unmappedRequired.map(f => f.label).join(', ')}`); const missingSources = selected.map(([, source]) => source).filter(source => !preview.headers.includes(source)); if (missingSources.length)
    throw new Error(`Selected source columns are missing: ${missingSources.join(', ')}`); const mappedRows = preview.rows.map(source => Object.fromEntries(schema.map(f => [f.key, mapping[f.key] ? source[mapping[f.key]] : null]))); const duplicates = detectDuplicateIdentifiers(mappedRows, schema.some(f => f.key === 'studentId') ? 'studentId' : schema.some(f => f.key === 'facultyId') ? 'facultyId' : schema.some(f => f.key === 'eventId') ? 'eventId' : 'activityName'); const duplicateIndexSet = new Set(duplicates.map(d => d.index)); const knownStudentIds = new Set(students.map(s => canonicalIdentifier(s.id))); const staged = mappedRows.map((row, index) => { const validation = validateDatasetRow(row, schema, index); if (duplicateIndexSet.has(index)) {
    const idField = schema.some(f => f.key === 'studentId') ? 'studentId' : schema.some(f => f.key === 'facultyId') ? 'facultyId' : 'eventId';
    validation.issues.push({ code: 'DUPLICATE_IDENTIFIER', field: idField, message: 'Identifier is duplicated in the imported data; records are retained for review', severity: 'error', sourceValue: row[idField] });
} const studentId = canonicalIdentifier(validation.values.studentId?.value || ''); if (studentId && !knownStudentIds.has(studentId) && preview.dataset !== 'students')
    validation.issues.push({ code: 'UNMATCHED_STUDENT', field: 'studentId', message: 'Student ID does not match a known demo student; identity review is required', severity: 'warning', sourceValue: row.studentId }); return { row, validation }; }); const records = staged.map(({ validation }, index) => ({ id: `${preview.dataset}-${index + 1}-${canonicalIdentifier(validation.values.studentId?.value || validation.values.facultyId?.value || index + 1)}`, entity: preview.dataset, values: validation.values, issues: validation.issues, rowState: validation.issues.length ? 'review' : 'valid', source: { fileName: preview.rowSources?.[index] || preview.fileName, rowNumber: preview.rowNumbers?.[index] || index + 2, importedAt: new Date().toISOString() } })); const result = { id: crypto.randomUUID(), fileName: preview.fileName, dataset: preview.dataset, processedAt: new Date().toISOString(), records, validRows: records.filter(r => r.rowState === 'valid').length, reviewRows: records.filter(r => r.rowState === 'review').length, duplicateRows: duplicateIndexSet.size, errors: records.reduce((n, r) => n + r.issues.filter(i => i.severity === 'error').length, 0), issues: preview.issues, schemaVersion: '1.0' }; const persisted = readDemoState(IMPORTS_KEY, []); writeDemoState(IMPORTS_KEY, [result, ...persisted]); return result; }
export async function runInstitutionalImport(preview, mapping, role, onProgress) { return jobService.run(`import:${preview.dataset}`, async () => processInstitutionalImport(preview, mapping, role), onProgress); }
export async function runInstitutionalBatch(batch, mapping, role, onProgress) { if (batch.schemaMismatch)
    throw new Error(`Batch files have different schemas. Align their columns before processing. ${batch.schemaDifferences.join(' ')}`); return jobService.run(`batch-import:${batch.previews[0]?.dataset}`, async () => { const previews = batch.previews; const combined = { fileName: `${previews.length} imported files`, dataset: previews[0].dataset, headers: previews[0].headers, rows: previews.flatMap(p => p.rows), mapping, rowCount: previews.reduce((n, p) => n + p.rowCount, 0), issues: previews.flatMap(p => p.issues), rowSources: previews.flatMap(p => p.rows.map(() => p.fileName)), rowNumbers: previews.flatMap(p => p.rows.map((_, i) => i + 2)) }; onProgress?.(50); const result = await processInstitutionalImport(combined, mapping, role); onProgress?.(100); return result; }, onProgress); }
export function listProcessedImports(role) { assertCapability(role, 'import.read.department', { departmentId: 'CSE' }); return readDemoState(IMPORTS_KEY, []); }
