import { students } from '../data/mock';
import { assertCapability, authorizationService, actorForRole } from './authorizationService';
import { notificationService } from './notificationService';
import { readDemoState, writeDemoState } from '../utils/storage';
const KEY = 'department.work.assignments';
const faculty = [{ id: 'faculty:karthik-s', name: 'Prof. Karthik S' }, { id: 'faculty:meera-nair', name: 'Dr. Meera Nair' }, { id: 'faculty:arun-p', name: 'Dr. Arun Prakash' }, { id: 'faculty:lakshmi-r', name: 'Dr. Lakshmi Raman' }, { id: 'faculty:devika-s', name: 'Prof. Devika Shah' }, { id: 'faculty:rahul-m', name: 'Dr. Rahul Menon' }, { id:'faculty:asha-v',name:'Dr. Asha Varghese' }, { id:'faculty:vinod-k',name:'Prof. Vinod Kumar' }];
function all() { return readDemoState(KEY, []); }
function recipient(role, id) { if (role === 'Student') {
    const s = students.find(x => x.id === id);
    if (!s)
        throw new Error('Student is outside the department.');
    return { name: s.name, studentId: s.id };
} const f = faculty.find(x => x.id === id); if (!f)
    throw new Error('Faculty recipient was not found.'); return { name: f.name }; }
export const workAssignmentService = {
    list(role, actorId) { assertCapability(role, role === 'HOD' ? 'work.assign.department' : 'work.read.assigned', {}, actorId); if (role === 'HOD')
        return all(); const actor = actorForRole(role, actorId); return all().filter(x => x.assigneeRole === role && x.assigneeId === actor.actorId); },
    create(input, role, actorId) { assertCapability(role, 'work.assign.department', {}, actorId); if (!input.title.trim() || !input.instructions.trim() || !input.dueDate)
        throw new Error('Title, instructions, and due date are required.'); const target = recipient(input.assigneeRole, input.assigneeId); if (input.assigneeRole === 'Student' && !authorizationService.canAccessStudent('HOD', input.assigneeId))
        throw new Error('Student is outside the HOD department scope.'); const item = { id: `TASK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, title: input.title.trim(), instructions: input.instructions.trim(), assigneeRole: input.assigneeRole, assigneeId: input.assigneeId, assigneeName: target.name, studentId: 'studentId' in target ? target.studentId : undefined, createdAt: new Date().toISOString(), dueDate: input.dueDate, status: 'Assigned', evidence: input.evidence || [] }; writeDemoState(KEY, [item, ...all()]); notificationService.createForRecipient({ role: input.assigneeRole, id: input.assigneeId, title: 'New department assignment', message: `${item.title} · due ${item.dueDate}`, target: { type: 'assignment', id: item.id, page: input.assigneeRole === 'Student' ? 'My Assigned Work' : 'My Assigned Work' } }, role); return item; },
    complete(id, note, role, actorId) { assertCapability(role, 'work.complete.assigned', {}, actorId); const actor = actorForRole(role, actorId); const item = all().find(x => x.id === id); if (!item || item.assigneeRole !== role || item.assigneeId !== actor.actorId)
        throw new Error('Assignment is outside your scope.'); if (!note.trim())
        throw new Error('Add a completion note.'); const updated = { ...item, status: 'Completed', completedAt: new Date().toISOString(), completionNote: note.trim() }; writeDemoState(KEY, all().map(x => x.id === id ? updated : x)); notificationService.createForRecipient({ role: 'HOD', id: actorForRole('HOD').actorId, title: 'Assignment completed', message: `${item.assigneeName} completed: ${item.title}`, target: { type: 'assignment', id: item.id, page: 'Intelligence & Engagement' } }, 'HOD'); return updated; },
};
export const departmentFaculty = faculty;
