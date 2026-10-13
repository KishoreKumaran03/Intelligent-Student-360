import { normalizeField } from './normalizationService';
export const datasetSchemas = {
    students: [{ key: 'studentId', label: 'Student ID', kind: 'identifier', required: true, aliases: ['student id', 'register number', 'register no', 'roll number'] }, { key: 'name', label: 'Student name', kind: 'text', required: true, aliases: ['student name', 'full name'] }, { key: 'programme', label: 'Programme', kind: 'label', required: true, aliases: ['program', 'degree'] }, { key: 'batch', label: 'Batch', kind: 'label', required: true, aliases: ['cohort', 'admission year'] }, { key: 'section', label: 'Section', kind: 'label', required: true, aliases: ['class section'] }, { key: 'semester', label: 'Semester', kind: 'number', min: 1, max: 12, aliases: ['term'] }, { key: 'cgpa', label: 'CGPA', kind: 'number', min: 0, max: 10, aliases: ['cumulative gpa'] }, { key: 'attendancePercent', label: 'Attendance %', kind: 'percentage', min: 0, max: 100, aliases: ['attendance', 'attendance percent'] }],
    attendance: [{ key: 'studentId', label: 'Student ID', kind: 'identifier', required: true, aliases: ['register number', 'register no', 'roll number'] }, { key: 'courseCode', label: 'Course code', kind: 'identifier', required: true, aliases: ['subject code', 'course id'] }, { key: 'date', label: 'Date', kind: 'date', required: true, aliases: ['attendance date'] }, { key: 'sessionsHeld', label: 'Sessions held', kind: 'number', min: 0, aliases: ['total sessions', 'classes conducted'] }, { key: 'sessionsPresent', label: 'Sessions present', kind: 'number', min: 0, aliases: ['present sessions', 'classes attended'] }],
    assessments: [{ key: 'studentId', label: 'Student ID', kind: 'identifier', required: true, aliases: ['register number', 'roll number'] }, { key: 'courseCode', label: 'Course code', kind: 'identifier', required: true, aliases: ['subject code'] }, { key: 'assessmentName', label: 'Assessment', kind: 'label', required: true, aliases: ['exam', 'assessment name'] }, { key: 'date', label: 'Date', kind: 'date', aliases: ['assessment date'] }, { key: 'mark', label: 'Mark', kind: 'number', min: 0, aliases: ['marks', 'score'] }, { key: 'maxMark', label: 'Maximum mark', kind: 'number', min: 0, aliases: ['out of', 'maximum marks'] }],
    activities: [{ key: 'activityName', label: 'Activity', kind: 'text', required: true, aliases: ['activity name', 'event name', 'project name'] }, { key: 'studentId', label: 'Student ID', kind: 'identifier', required: true, aliases: ['register number', 'roll number'] }, { key: 'date', label: 'Date', kind: 'date', aliases: ['start date'] }, { key: 'activityType', label: 'Activity type', kind: 'label', aliases: ['type', 'category'] }, { key: 'facultyId', label: 'Faculty mentor ID', kind: 'identifier', aliases: ['faculty id', 'staff id'] }],
    placement: [{ key: 'studentId', label: 'Student ID', kind: 'identifier', required: true, aliases: ['register number', 'roll number'] }, { key: 'opportunity', label: 'Opportunity', kind: 'text', required: true, aliases: ['role', 'job title'] }, { key: 'company', label: 'Company', kind: 'label', aliases: ['employer'] }, { key: 'status', label: 'Application status', kind: 'label', aliases: ['status', 'outcome'] }, { key: 'date', label: 'Date', kind: 'date', aliases: ['application date'] }],
    faculty: [{ key: 'facultyId', label: 'Faculty ID', kind: 'identifier', required: true, aliases: ['staff id', 'employee id'] }, { key: 'name', label: 'Faculty name', kind: 'text', required: true, aliases: ['faculty name', 'full name'] }, { key: 'department', label: 'Department', kind: 'label', required: true, aliases: ['school'] }, { key: 'workload', label: 'Workload units', kind: 'number', min: 0, aliases: ['teaching hours', 'load'] }],
    eventParticipants: [{ key: 'eventId', label: 'Event ID', kind: 'identifier', required: true, aliases: ['event code'] }, { key: 'studentId', label: 'Student ID', kind: 'identifier', required: true, aliases: ['register number', 'roll number'] }, { key: 'date', label: 'Event date', kind: 'date', required: true, aliases: ['date'] }, { key: 'courseCode', label: 'Affected course', kind: 'identifier', aliases: ['course', 'subject code'] }]
};
export function validateDatasetRow(row, schema, rowIndex) { const issues = []; const values = {}; for (const field of schema) {
    const sourceValue = row[field.key];
    const normalized = normalizeField(sourceValue, field.kind);
    let state = normalized.state;
    let value = normalized.value;
    if (state === 'missing' && field.required)
        issues.push({ code: 'REQUIRED_MISSING', field: field.key, message: `${field.label} is required`, severity: 'error', sourceValue });
    if (state === 'invalid')
        issues.push({ code: field.kind === 'date' ? 'INVALID_DATE' : 'INVALID_VALUE', field: field.key, message: `${field.label} could not be parsed; source value was preserved`, severity: 'error', sourceValue });
    if (state === 'present' && typeof value === 'number' && ((field.min != null && value < field.min) || (field.max != null && value > field.max))) {
        state = 'invalid';
        value = null;
        issues.push({ code: 'OUT_OF_RANGE', field: field.key, message: `${field.label} is outside the valid range`, severity: 'error', sourceValue });
    }
    if (state === 'present' && typeof value === 'string' && ['studentId', 'facultyId'].includes(field.key) && !(/^[A-Z0-9]{4,20}$/.test(value))) {
        state = 'invalid';
        value = null;
        issues.push({ code: 'INVALID_IDENTIFIER', field: field.key, message: `${field.label} format is invalid; source value was preserved`, severity: 'error', sourceValue });
    }
    if (state === 'present' && typeof value === 'string' && field.key === 'courseCode' && !(/^[A-Z]{1,5}\d{2,5}$/.test(value))) {
        state = 'invalid';
        value = null;
        issues.push({ code: 'INVALID_IDENTIFIER', field: field.key, message: 'Course code format is invalid; source value was preserved', severity: 'error', sourceValue });
    }
    values[field.key] = { sourceValue, value, state, corrected: false };
} if (values.sessionsPresent?.state === 'present' && values.sessionsHeld?.state === 'present' && Number(values.sessionsPresent.value) > Number(values.sessionsHeld.value))
    issues.push({ code: 'RELATION_INVALID', field: 'sessionsPresent', message: 'Sessions present cannot exceed sessions held', severity: 'error', sourceValue: row.sessionsPresent }); if (values.mark?.state === 'present' && values.maxMark?.state === 'present' && Number(values.mark.value) > Number(values.maxMark.value))
    issues.push({ code: 'RELATION_INVALID', field: 'mark', message: 'Mark cannot exceed the supplied maximum mark', severity: 'error', sourceValue: row.mark }); return { values, issues, rowIndex, rowState: issues.some(i => i.severity === 'error') ? 'review' : 'valid' }; }
export function detectDuplicateIdentifiers(rows, key) { const seen = new Map(); rows.forEach((row, i) => { const value = String(row[key] ?? '').trim().toLocaleUpperCase(); if (value)
    seen.set(value, [...(seen.get(value) || []), i]); }); return [...seen].filter(([, indices]) => indices.length > 1).flatMap(([value, indices]) => indices.map(index => ({ index, value, duplicateOf: indices.filter(i => i !== index) }))); }
export function detectRelationshipIssues(records, knownIdentifiers, key = 'studentId') { return records.flatMap((record, index) => { const id = String(record.values[key]?.value ?? ''); if (record.values[key]?.state === 'present' && id && !knownIdentifiers.has(id))
    return [{ index, field: key, code: 'UNMATCHED_REFERENCE', message: `${id} does not match a known institutional record` }]; return []; }); }
