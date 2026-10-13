import { cases, requests, students } from '../data/mock';
import { actorForRole, authorizationService } from './authorizationService';
import { readDemoState, writeDemoState } from '../utils/storage';
const KEY = 'notifications';
const defaults = [{ id: 'ntf-1', title: 'Attendance review due today', message: 'Aarav Menon · CASE-2408 · assigned to Dr. Meera Nair', priority: 'high', createdAt: '2026-09-25T09:42:00+05:30', readAt: null, dismissedAt: null, target: { type: 'case', id: 'CASE-2408', page: 'Cases' } }, { id: 'ntf-2', title: 'OD request awaiting tutor review', message: 'Diya Joseph · National Women in Tech Summit', priority: 'normal', createdAt: '2026-09-25T08:15:00+05:30', readAt: null, dismissedAt: null, target: { type: 'request', id: 'REQ-091', page: 'Requests & Approvals' } }, { id: 'ntf-3', title: 'Roadmap milestone completed', message: 'Ananya Rao · DSA module verified', priority: 'low', createdAt: '2026-09-24T16:30:00+05:30', readAt: '2026-09-24T17:02:00+05:30', dismissedAt: null, target: { type: 'student', id: '22CS018', page: 'Roadmaps & Journeys' } }];
function notificationStudent(n) { if (n.target.type === 'student')
    return n.target.id; const request = requests.find(r => r.id === n.target.id); if (request)
    return students.find(s => s.name === request.who)?.id; const supportCase = cases.find(c => c.id === n.target.id); return supportCase ? students.find(s => s.name === supportCase.student)?.id : undefined; }
function permitted(n, role) { if (n.recipientRole)
    return n.recipientRole === role && (role === 'HOD' || n.recipientId === actorForRole(role).actorId); const studentId = notificationStudent(n); if (!studentId)
    return role === 'HOD'; if (role === 'Student')
    return studentId === actorForRole(role).actorId; return authorizationService.canAccessStudent(role, studentId); }
export const notificationService = {
    createForRecipient(input, actorRole) { const allowed = actorRole === 'HOD' ? authorizationService.can(actorRole, 'work.assign.department') || authorizationService.can(actorRole, 'meeting.schedule.department') : actorRole === 'Tutor' || actorRole === 'Faculty'; if (!allowed)
        throw new Error('Forbidden: this role cannot send the requested notification.'); if (input.role === 'Student' && !authorizationService.canAccessStudent(actorRole, input.id))
        throw new Error('Student is outside the sender?s authorized scope.'); if (input.role === 'HOD' && actorRole !== 'HOD')
        throw new Error('Only department leadership can notify the HOD role.'); const item = { id: `ntf-${crypto.randomUUID()}`, title: input.title, message: input.message, priority: 'normal', createdAt: new Date().toISOString(), readAt: null, dismissedAt: null, target: input.target, recipientRole: input.role, recipientId: input.id }; return this.save([item, ...readDemoState(KEY, defaults)]); },
    list(role, options = {}) { return readDemoState(KEY, defaults).filter(n => (options.includeDismissed || !n.dismissedAt) && permitted(n, role)).map(n => role === 'Student' && n.target.type !== 'responsibility' ? { ...n, message: n.target.type === 'student' ? 'A milestone in your personal development journey was updated' : 'A personal student record was updated' } : n).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
    markRead(id, role) { return this.update(id, { readAt: new Date().toISOString() }, role); },
    markAllRead(role) { const now = new Date().toISOString(); const allowed = this.list(role, { includeDismissed: true }); const ids = new Set(allowed.map(n => n.id)); return this.save(readDemoState(KEY, defaults).map(n => ids.has(n.id) && !n.readAt ? { ...n, readAt: now } : n)); },
    dismiss(id, role) { return this.update(id, { dismissedAt: new Date().toISOString() }, role); },
    update(id, patch, role) { const all = readDemoState(KEY, defaults); const item = all.find(n => n.id === id); if (!item || !permitted(item, role))
        throw new Error('Forbidden: notification is outside your scope.'); return this.save(all.map(n => n.id === id ? { ...n, ...patch } : n)); },
    save(items) { writeDemoState(KEY, items); return items; },
};
