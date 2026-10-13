const numeric = (v) => typeof v === 'number' && Number.isFinite(v) ? v : null;
export function filterRecords(rows, filters) { const search = (filters.search || '').trim().toLocaleLowerCase(); return rows.filter(row => { if (search && !Object.values(row).some(v => String(v ?? '').toLocaleLowerCase().includes(search)))
    return false; for (const [key, value] of Object.entries(filters)) {
    if (!value || key === 'search' || key === 'from' || key === 'to')
        continue;
    const actual = row[key];
    if (String(actual ?? '').toLocaleLowerCase() !== String(value).toLocaleLowerCase())
        return false;
} const date = String(row.date || row.createdAt || '').slice(0, 10); if (filters.from && date && date < filters.from)
    return false; if (filters.to && date && date > filters.to)
    return false; return true; }); }
export function groupMetric(rows, options) { const groups = new Map(); for (const row of rows) {
    const key = String(row[options.dimension] ?? 'Unknown');
    const group = groups.get(key) || { sum: 0, count: 0, values: [] };
    const value = numeric(row[options.metric]);
    if (value != null) {
        group.sum += value;
        group.count++;
        group.values.push(value);
    }
    groups.set(key, group);
} const operation = options.operation || 'sum'; let result = [...groups].map(([name, g]) => ({ name, value: operation === 'count' ? g.count : operation === 'mean' ? (g.count ? g.sum / g.count : null) : operation === 'min' ? (g.values.length ? Math.min(...g.values) : null) : operation === 'max' ? (g.values.length ? Math.max(...g.values) : null) : g.sum, count: g.count })); result.sort((a, b) => { if (a.value == null)
    return 1; if (b.value == null)
    return -1; return options.sort === 'asc' ? a.value - b.value : b.value - a.value; }); if (options.limit)
    result = result.slice(0, options.limit); return result; }
export function compareGroups(rows, dimension, metric, baseline) { return groupMetric(rows, { dimension, metric, operation: 'mean', sort: 'desc' }).map(group => ({ ...group, delta: group.value == null || group.name === baseline ? 0 : group.value - (groupMetric(rows.filter(r => String(r[dimension]) === baseline), { dimension, metric, operation: 'mean' })[0]?.value || 0) })); }
export function trendByPeriod(rows, dateField, metric, grain = 'month') { const key = (raw) => { const d = new Date(String(raw || '')); if (Number.isNaN(d.getTime()))
    return null; const y = d.getUTCFullYear(), m = d.getUTCMonth(); return grain === 'year' ? String(y) : grain === 'quarter' ? `${y}-Q${Math.floor(m / 3) + 1}` : `${y}-${String(m + 1).padStart(2, '0')}`; }; return groupMetric(rows.map(r => ({ ...r, __period: key(r[dateField]) })).filter(r => r.__period), { dimension: '__period', metric, operation: 'mean' }).sort((a, b) => a.name.localeCompare(b.name)).map(x => ({ period: x.name, value: x.value, count: x.count })); }
export function distribution(rows, metric, buckets, min, max) { const vals = rows.map(r => numeric(r[metric])).filter((x) => x != null); if (!vals.length)
    return []; const low = min ?? Math.min(...vals), high = max ?? Math.max(...vals), step = (high - low || 1) / Math.max(1, buckets); return Array.from({ length: buckets }, (_, i) => { const start = low + i * step, end = i === buckets - 1 ? high + Number.EPSILON : low + (i + 1) * step; return { name: `${start.toFixed(1)}–${Math.min(high, end).toFixed(1)}`, min: start, max: end, count: vals.filter(v => v >= start && (i === buckets - 1 ? v <= high : v < end)).length }; }); }
export function calculateKpis(rows, spec) { return Object.fromEntries(Object.entries(spec).map(([name, rule]) => { const vals = rows.map(r => numeric(r[rule.field])).filter((v) => v != null); return [name, rule.operation === 'count' ? rows.length : !vals.length ? null : rule.operation === 'sum' ? vals.reduce((a, b) => a + b, 0) : vals.reduce((a, b) => a + b, 0) / vals.length]; })); }
export function buildDepartmentDashboard(input) { const rows = input.students; const available = rows.filter(s => Number.isFinite(s.attendance)); const cgpa = rows.filter(s => Number.isFinite(s.cgpa)); return { contractVersion: '1.0', generatedAt: new Date().toISOString(), scope: { department: input.department || 'Computer Science', programme: input.programme || 'All programmes', semester: input.semester || 7 }, metrics: { studentCount: input.studentCount ?? rows.length, facultyCount: input.facultyCount, attendanceMean: input.attendanceMeanOverride ?? (available.length ? available.reduce((n, s) => n + s.attendance, 0) / available.length : null), cgpaMean: input.cgpaMeanOverride ?? (cgpa.length ? cgpa.reduce((n, s) => n + s.cgpa, 0) / cgpa.length : null), attentionCount: rows.filter(s => s.attendance < 75 || s.arrears > 0).length, placementRate: input.placementRate, activeCases: input.activeCases, pendingApprovals: input.pendingApprovals, pendingRequests: input.pendingRequests }, attendanceTrend: [{ period: 'Apr', value: 88, count: 114 }, { period: 'May', value: 86, count: 114 }, { period: 'Jun', value: 89, count: 116 }, { period: 'Jul', value: 84, count: 116 }, { period: 'Aug', value: 82, count: 118 }, { period: 'Sep', value: 85, count: 118 }], courseHealth: [{ course: 'CS301', attendance: 91, meanMark: 83, count: 118 }, { course: 'CS302', attendance: 82, meanMark: 74, count: 116 }, { course: 'CS303', attendance: 88, meanMark: 80, count: 118 }, { course: 'CS304', attendance: 76, meanMark: 69, count: 112 }], sources: ['student-records.demo.v1', 'attendance-register.demo.v1', 'assessment-ledger.demo.v1', 'case-register.demo.v1'], limitations: ['All values are synthetic demo records.', 'Missing values are excluded from means, never coerced to zero.', 'This contract does not contain predicted values.'] }; }
