import { students } from '../data/mock';
import { readDemoState, writeDemoState } from '../utils/storage';
import { assertCapability, authorizationService } from './authorizationService';
import { workflowService } from './workflowService';
const KEY = 'signals';
export function generateStudentSignals(records, now = new Date('2026-09-25T09:42:00+05:30')) { const generated = []; for (const student of records) {
    if (student.attendance < 75) {
        generated.push({ id: `attendance-${student.id}`, title: 'Attendance below review threshold', summary: `${student.name} attendance is ${student.attendance}% for semester ${student.semester}.`, severity: student.attendance < 65 ? 'urgent' : 'high', timestamp: now.toISOString(), freshness: 'Updated today', owner: student.mentor, dueDate: '2026-09-26', status: 'new', entityType: 'student', entityId: student.id, evidence: [{ id: `ev-att-${student.id}`, source: 'Attendance register', value: `${student.attendance}%`, recordedAt: now.toISOString(), freshness: 'Current', relatedRecord: student.id, criteria: 'Semester attendance below 75%' }], caseId: null, action: 'Review attendance context with mentor', outcome: null });
    }
    if (student.arrears > 0) {
        generated.push({ id: `arrears-${student.id}`, title: 'Active course arrears need follow-up', summary: `${student.name} has ${student.arrears} active arrears.`, severity: student.arrears >= 2 ? 'urgent' : 'watch', timestamp: now.toISOString(), freshness: 'Current term', owner: student.mentor, dueDate: '2026-09-30', status: 'new', entityType: 'student', entityId: student.id, evidence: [{ id: `ev-arr-${student.id}`, source: 'Academic progression record', value: `${student.arrears} active arrears`, recordedAt: now.toISOString(), freshness: 'Current', relatedRecord: student.id, criteria: 'At least one uncleared course' }], caseId: null, action: 'Review academic support plan', outcome: null });
    }
} return generated; }
function allSignals() { const saved = readDemoState(KEY, []); if (saved.length)
    return saved; const initial = generateStudentSignals(students); writeDemoState(KEY, initial); return initial; }
export function listSignals(role) { return allSignals().filter(signal => authorizationService.canAccessStudent(role, signal.entityId)); }
export function updateSignal(id, update, role) { const current = allSignals(); const signal = current.find(x => x.id === id); if (!signal)
    throw new Error(`Signal ${id} not found`); assertCapability(role, 'case.update.assigned', { studentId: signal.entityId, departmentId: 'CSE' }); const next = { ...signal, ...update }; writeDemoState(KEY, current.map(x => x.id === id ? next : x)); return next; }
const transitions = { new: ['assigned', 'dismissed'], assigned: ['in_progress', 'dismissed'], in_progress: ['resolved', 'assigned'], dismissed: ['new'], resolved: [] };
export function transitionSignal(id, status, details = {}, role) { const signal = allSignals().find(x => x.id === id); if (!signal)
    throw new Error(`Signal ${id} not found`); assertCapability(role, 'case.update.assigned', { studentId: signal.entityId, departmentId: 'CSE' }); if (!transitions[signal.status].includes(status))
    throw new Error(`Invalid signal transition ${signal.status} → ${status}`); return updateSignal(id, { ...details, status }, role); }
export function dismissSignal(id, reason, role) { if (!reason.trim())
    throw new Error('A dismissal reason is required'); return transitionSignal(id, 'dismissed', { dismissedReason: reason.trim() }, role); }
export function linkSignalCase(id, caseId, role) { if (!caseId.trim())
    throw new Error('Case ID is required'); return updateSignal(id, { caseId }, role); }
export function recordSignalOutcome(id, outcome, role) { if (!outcome.trim())
    throw new Error('Outcome is required'); return transitionSignal(id, 'resolved', { outcome: outcome.trim() }, role); }
export function refreshSignals(records, role) { assertCapability(role, 'case.read.department', { departmentId: 'CSE' }); const previous = allSignals(); const generated = generateStudentSignals(records); const overrides = new Map(previous.map(s => [s.id, s])); const refreshed = generated.map(signal => overrides.get(signal.id) || signal); writeDemoState(KEY, refreshed); return refreshed; }
export function createCaseFromSignal(id, role) { const signal = listSignals(role).find(item => item.id === id); if (!signal)
    throw new Error(`Signal ${id} is outside your assignment or not found`); assertCapability(role, 'case.create.assigned', { studentId: signal.entityId, departmentId: 'CSE' }); const student = students.find(item => item.id === signal.entityId); if (!student)
    throw new Error('Signal has no linked demo student'); const supportCase = workflowService.createCase({ studentId: student.id, studentName: student.name, type: signal.title, priority: signal.severity === 'urgent' ? 'Urgent' : signal.severity === 'high' ? 'High' : 'Medium', owner: signal.owner || student.mentor, reason: signal.summary }, role); transitionSignal(id, 'assigned', { owner: signal.owner || student.mentor, caseId: supportCase.id, action: 'Follow up through assigned case' }, role); return supportCase; }
