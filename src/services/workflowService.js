import { cases as seedCases, requests as seedRequests, meetings as seedMeetings, students } from '../data/mock';
import { actorForRole, assertCapability, authorizationService } from './authorizationService';
import { readDemoState, writeDemoState } from '../utils/storage';
import { notificationService } from './notificationService';
const CASES = 'workflow.cases', REQUESTS = 'workflow.requests', MEETINGS = 'workflow.meetings', AUDIT = 'workflow.audit';
const caseTransitions = { Open: ['Assigned', 'In progress', 'Escalated', 'Closed'], Assigned: ['In progress', 'Escalated', 'Closed'], 'In progress': ['Assigned', 'Awaiting student', 'Awaiting faculty', 'Resolved', 'Escalated', 'Closed'], 'Awaiting student': ['In progress', 'Escalated', 'Closed'], 'Awaiting faculty': ['In progress', 'Escalated', 'Closed'], Escalated: ['In progress', 'Resolved', 'Closed'], Resolved: ['Closed', 'In progress'], Closed: [] };
const studentIdByName = (name) => students.find(student => student.name === name)?.id;
function requestScope(item) { const kind = String(item.type || '').toLowerCase(); return { requestId: item.id, studentId: item.studentId || studentIdByName(item.who), studentName: item.who, requestType: item.type, requestStatus: item.status, departmentId: 'CSE', domain: kind.includes('attendance') ? 'attendance' : kind.includes('document') ? 'documents' : kind.includes('record') ? 'records' : kind.includes('event') || kind.includes('od') ? 'events' : 'requests' }; }
function caseScope(item) { return { caseId: item.id, studentId: item.studentId || studentIdByName(item.student), studentName: item.student, ownerId: item.owner, departmentId: 'CSE' }; }
function meetingScope(item) { return { studentId: item.studentId || students.find(s => item.title?.includes(s.name))?.id, studentName: item.studentName, ownerId: item.owner, departmentId: 'CSE' }; }
function audit(entityType, entityId, action, role, note, actorId) { const events = readDemoState(AUDIT, []); const event = { id: crypto.randomUUID(), entityType, entityId, action, actorRole: role, actorId: actorId || actorForRole(role).actorId, at: new Date().toISOString(), note }; writeDemoState(AUDIT, [event, ...events]); return event; }
function routeDecisionCapability(role, item) {
    const kind = String(item.type || '').toLowerCase();
    if (role === 'Tutor' && (kind.includes('mentor') || kind.includes('mentoring')))
        return 'request.decide.mentor';
    if (role === 'Faculty' && (kind.includes('attendance') || kind.includes('assessment') || kind.includes('academic') || kind.includes('project')))
        return 'request.decide.academic';
    if (role === 'HOD' && (kind.includes('od') || kind.includes('event') || kind.includes('leave') || kind.includes('department') || kind.includes('placement') || kind.includes('grievance') || kind.includes('escalat')))
        return 'request.decide.department';
    if (role === 'Office' && (kind.includes('document') || kind.includes('record') || kind.includes('administrative')))
        return 'request.process.office';
    return null;
}
function staffCanReview(role, item, actorId) {
    const required = routeDecisionCapability(role, item);
    if (!required)
        return false;
    return authorizationService.can(role, required, requestScope(item), actorId);
}
function currentRequests() { return readDemoState(REQUESTS, seedRequests); }
function currentCases() { return readDemoState(CASES, seedCases); }
function currentMeetings() { return readDemoState(MEETINGS, seedMeetings); }
export const workflowService = {
    listCases(role, actorId) {
        const items = currentCases();
        const visible = items.filter(item => {
            const scope = caseScope(item);
            if (role === 'Student')
                return authorizationService.can(role, 'case.read.self', scope, actorId);
            if (role === 'Tutor' || role === 'Faculty')
                return authorizationService.can(role, 'case.read.assigned', scope, actorId);
            if (role === 'HOD')
                return authorizationService.can(role, 'case.read.department', scope, actorId);
            return false;
        });
        return role === 'Student' ? visible.map(({ id, status, type, createdAt, due, dueDate }) => ({ id, status, type, createdAt, due, dueDate })) : visible;
    },
    updateCaseStatus(id, next, role, actorId) {
        const items = currentCases();
        const item = items.find(x => x.id === id);
        if (!item)
            throw new Error('Demo case not found');
        if (!this.canSetCaseStatus(role, item, next, actorId))
            throw new Error('Forbidden: ' + role + ' cannot set this case to ' + next + '.');
        const current = item.status || 'Open';
        if (!caseTransitions[current]?.includes(next))
            throw new Error('Invalid case status change.');
        const updated = { ...item, status: next };
        writeDemoState(CASES, items.map(x => x.id === id ? updated : x));
        audit('case', id, 'status_changed', role, current + ' to ' + next, actorId);
        return updated;
    },
    canSetCaseStatus(role, item, next, actorId) { const scope = caseScope(item); if (role === 'Student' || !authorizationService.can(role, 'case.update.assigned', scope, actorId))
        return false; if (next === 'Closed')
        return authorizationService.can(role, 'case.close.department', scope, actorId); if (next === 'Escalated')
        return authorizationService.can(role, 'case.escalate.assigned', scope, actorId); return ['Assigned', 'In progress', 'Awaiting student', 'Awaiting faculty', 'Resolved'].includes(next); },
    caseStatusChoices(role, item, actorId) { return (caseTransitions[item.status || 'Open'] || []).filter(next => this.canSetCaseStatus(role, item, next, actorId)); },
    createCase(input, role, actorId) { assertCapability(role, 'case.create.assigned', { studentId: input.studentId, departmentId: 'CSE' }, actorId); if (!input.studentId || !input.reason.trim())
        throw new Error('Student and reason are required'); const target = students.find(s => s.id === input.studentId); if (!target || target.name !== input.studentName)
        throw new Error('Student identity does not match the selected record.'); if (role === 'Tutor' && input.owner !== 'Dr. Meera Nair')
        throw new Error('Tutors may only assign mentoring cases within their own responsibility.'); if (role === 'Faculty' && input.owner !== 'Prof. Karthik S')
        throw new Error('Faculty may only assign an intervention to their own course responsibility.'); if (role === 'HOD' && !['Dr. Meera Nair', 'Prof. Karthik S', 'Department office'].includes(input.owner))
        throw new Error('Case owner is outside this department.'); const id = `CASE-${Math.floor(2400 + Math.random() * 500)}`; const item = { ...input, id, status: 'Open', createdAt: new Date().toISOString(), dueDate: null, evidenceIds: [], departmentId: 'CSE' }; writeDemoState(CASES, [item, ...currentCases()]); audit('case', id, 'created', role, input.reason, actorId); return item; },
    listRequests(role, actorId) {
        const items = currentRequests();
        const visible = items.filter(item => {
            const scope = requestScope(item);
            if (role === 'Student')
                return authorizationService.can(role, 'request.read.self', scope, actorId);
            return staffCanReview(role, item, actorId);
        });
        return role === 'Student' ? visible.map(item => ({ id: item.id, who: item.who, studentId: item.studentId, type: item.type, date: item.date, status: item.status, reason: item.reason, reviewer: item.reviewer, supportingDocument: item.supportingDocument || null, additionalInformation: item.additionalInformation || null, nextAction: item.status === 'Needs information' ? 'Provide requested information' : item.status === 'Approved' ? 'Follow the instructions in the decision' : item.status === 'Rejected' ? 'Review the decision or contact your tutor' : item.status === 'Completed' ? 'No further action' : 'Await review', timeline: (item.timeline || []).map((event) => ({ decision: event.decision, at: event.at })) })) : visible;
    },
    canDecideRequest(item, role, actorId) { const capability = routeDecisionCapability(role, item); return !!capability && authorizationService.can(role, capability, requestScope(item), actorId); },
    createRequest(input, role, actorId) { const actor = actorForRole(role, actorId); assertCapability(role, 'request.create.self', { studentId: input.studentId || actor.actorId }, actor.actorId); if (role !== 'Student' || (input.studentId && input.studentId !== actor.actorId))
        throw new Error('Requests can only be submitted by a student for their own record.'); if (!input.reason.trim())
        throw new Error('A reason is required.'); if (typeof input.supportingDocument === 'object' && (input.supportingDocument.size > 1024 * 1024 || !input.supportingDocument.dataUrl.startsWith('data:')))
        throw new Error('Supporting files must be valid and 1 MB or smaller.'); const student = students.find(s => s.id === actor.actorId); if (!student)
        throw new Error('Student profile was not found.'); const id = `REQ-${String(Math.floor(100 + Math.random() * 899)).padStart(3, '0')}`; const item = { id, who: student.name, studentId: student.id, type: input.type, date: new Date().toLocaleDateString(), status: 'Under review', reason: input.reason, reviewer: routeReviewer(input.type), timeline: [{ decision: 'Submitted', note: 'Request submitted by student', at: new Date().toISOString(), actor: actor.actorId }], supportingDocument: input.supportingDocument || null, departmentId: actor.departmentId }; writeDemoState(REQUESTS, [item, ...currentRequests()]); audit('request', id, 'submitted', role, input.reason, actor.actorId); return item; },
    updateOwnRequest(id, action, value, role, actorId) { const items = currentRequests(); const item = items.find(x => x.id === id); if (!item)
        throw new Error('Request not found.'); const scope = requestScope(item); const capability = action === 'cancel' ? 'request.cancel.self' : 'request.update.self'; assertCapability(role, capability, scope, actorId); if (['Approved', 'Rejected', 'Completed', 'Cancelled'].includes(item.status))
        throw new Error('This request is no longer editable.'); const text = typeof value === 'string' ? value : value?.name; if (!text?.trim())
        throw new Error('Enter the requested information.'); if (typeof value !== 'string' && (value.size > 1024 * 1024 || !value.dataUrl.startsWith('data:')))
        throw new Error('Supporting files must be valid and 1 MB or smaller in this browser demo.'); const status = action === 'provide_information' ? 'Under review' : item.status; const timeline = [...(item.timeline || []), { decision: action === 'provide_information' ? 'Information provided' : action === 'attach_document' ? 'Document attached' : 'Cancelled', note: text, at: new Date().toISOString(), actor: actorId || actorForRole(role).actorId }]; const updated = { ...item, status, ...(action === 'attach_document' ? { supportingDocument: value } : {}), ...(action === 'provide_information' ? { additionalInformation: value } : {}), ...(action === 'cancel' ? { status: 'Cancelled' } : {}), timeline }; writeDemoState(REQUESTS, items.map(x => x.id === id ? updated : x)); audit('request', id, action, role, text, actorId); return updated; },
    decideRequest(id, decision, note, role, actorId) { const items = currentRequests(); const item = items.find(x => x.id === id); if (!item)
        throw new Error('Demo request not found'); const capability = routeDecisionCapability(role, item); if (!capability)
        throw new Error(`No approval route assigns ${role} to this request type.`); assertCapability(role, capability, requestScope(item), actorId); if (['Approved', 'Rejected', 'Completed', 'Cancelled'].includes(item.status))
        throw new Error('This request is already finalized.'); if (!note.trim())
        throw new Error('A decision rationale is required.'); if (item.studentId === actorId || studentIdByName(item.who) === actorId)
        throw new Error('A requester cannot decide their own request.'); const next = decision === 'Needs information' ? 'Needs information' : decision; const updated = { ...item, status: next, timeline: [...(item.timeline || []), { decision: next, note, at: new Date().toISOString(), actor: actorId || actorForRole(role).actorId }] }; writeDemoState(REQUESTS, items.map(x => x.id === id ? updated : x)); audit('request', id, next.toLowerCase(), role, note, actorId); return updated; },
    completeRequest(id, note, role, actorId) { const items = currentRequests(); const item = items.find(x => x.id === id); if (!item)
        throw new Error('Request not found.'); assertCapability(role, 'request.decide.department', requestScope(item), actorId); if (item.status !== 'Approved')
        throw new Error('Only an approved request can be marked completed.'); if (!note.trim())
        throw new Error('Record the execution outcome.'); const updated = { ...item, status: 'Completed', timeline: [...(item.timeline || []), { decision: 'Completed', note, at: new Date().toISOString(), actor: actorId || actorForRole(role).actorId }] }; writeDemoState(REQUESTS, items.map(x => x.id === id ? updated : x)); audit('request', id, 'completed', role, note, actorId); return updated; },
    listMeetings(role, actorId) { const list = currentMeetings(); const visible = list.filter(item => { const scope = meetingScope(item); if (role === 'Student')
        return authorizationService.can(role, 'meeting.read.self', scope, actorId); return authorizationService.can(role, 'meeting.read.assigned', scope, actorId); }); return role === 'Student' ? visible.map(({ id, title, date, status, studentName, purpose, decision, action, followUpDate }) => ({ id, title, date, status, studentName, purpose, decision, action, followUpDate })) : visible; },
    createMeeting(input, role, actorId) { const student = students.find(s => s.id === input.studentId); if (!student)
        throw new Error('Student record was not found.'); if (role === 'Student') {
        assertCapability(role, 'meeting.request.self', { studentId: input.studentId }, actorId);
        if (input.studentId !== actorForRole(role, actorId).actorId)
            throw new Error('Students may request a meeting only for themselves.');
        if (input.owner !== student.mentor)
            throw new Error('Students may book a meeting only with their assigned tutor.');
        if (!input.title.toLowerCase().includes('tutor') && !input.title.toLowerCase().includes('mentoring'))
            throw new Error('Student meeting requests must be for tutor mentoring.');
    }
    else {
        assertCapability(role, role === 'HOD' ? 'meeting.schedule.department' : 'meeting.schedule.assigned', { studentId: input.studentId, ownerId: input.owner, departmentId: 'CSE' }, actorId);
        if (role === 'Tutor' && input.owner !== 'Dr. Meera Nair')
            throw new Error('Tutors may only schedule meetings for their assigned mentoring responsibility.');
        if (role === 'Faculty' && input.owner !== 'Prof. Karthik S')
            throw new Error('Faculty may only schedule meetings for their assigned courses.');
        if (role === 'HOD' && !['Dr. Meera Nair', 'Prof. Karthik S', 'Department office'].includes(input.owner))
            throw new Error('Meeting owner is outside this department.');
    } const item = { ...input, studentName: student.name, id: `MTG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, status: role === 'Student' ? 'Requested' : 'Scheduled', createdAt: new Date().toISOString(), decision: null, followUpDate: null, departmentId: 'CSE' }; writeDemoState(MEETINGS, [item, ...currentMeetings()]); audit('meeting', item.id, role === 'Student' ? 'requested' : 'scheduled', role, input.purpose, actorId); return item; },
    cancelOwnMeeting(id, role, actorId) { const list = currentMeetings(); const meeting = list.find(x => x.id === id); if (!meeting)
        throw new Error('Meeting was not found.'); assertCapability(role, 'meeting.update.self', meetingScope(meeting), actorId); if (role !== 'Student' || meeting.status !== 'Requested')
        throw new Error('Only your pending meeting requests can be cancelled.'); const updated = { ...meeting, status: 'Cancelled' }; writeDemoState(MEETINGS, list.map(x => x.id === id ? updated : x)); audit('meeting', id, 'cancelled', role, 'Student cancelled pending meeting request', actorId); notificationService.createForRecipient({ role: 'Tutor', id: actorForRole('Tutor').actorId, title: 'Student cancelled a meeting request', message: `${meeting.studentName || meeting.title} cancelled a pending appointment`, target: { type: 'meeting', id, page: 'Meetings' } }, role); return updated; },
    scheduleMeetingRequest(id, date, role, actorId) { const list = currentMeetings(); const meeting = list.find(x => x.id === id); if (!meeting)
        throw new Error('Meeting request was not found.'); assertCapability(role, 'meeting.schedule.assigned', meetingScope(meeting), actorId); if (role !== 'Tutor' || meeting.status !== 'Requested')
        throw new Error('This meeting request is not available to schedule.'); const updated = { ...meeting, status: 'Scheduled', date, owner: 'Dr. Meera Nair' }; writeDemoState(MEETINGS, list.map(x => x.id === id ? updated : x)); audit('meeting', id, 'scheduled', role, `Tutor scheduled for ${date}`, actorId); if (meeting.studentId)
        notificationService.createForRecipient({ role: 'Student', id: meeting.studentId, title: 'Mentor meeting scheduled', message: `Your meeting was scheduled for ${date}`, target: { type: 'meeting', id, page: 'Meetings' } }, role); return updated; },
    recordMeetingOutcome(id, decision, action, followUpDate, role, actorId) { const list = currentMeetings(); const meeting = list.find(x => x.id === id); if (!meeting)
        throw new Error('Demo meeting not found'); assertCapability(role, 'meeting.outcome.assigned', meetingScope(meeting), actorId); if (role === 'Student')
        throw new Error('Students cannot record meeting outcomes.'); const updated = { ...meeting, status: 'Completed', decision, action, followUpDate }; writeDemoState(MEETINGS, list.map(x => x.id === id ? updated : x)); audit('meeting', id, 'outcome_recorded', role, `${decision}; action: ${action}; follow-up ${followUpDate}`, actorId); return updated; },
    completeJourneyAction(studentId, action, role, actorId) { const capability = role === 'Student' ? 'journey.complete.self' : 'journey.manage.assigned'; assertCapability(role, capability, { studentId, departmentId: 'CSE' }, actorId); if (!action.trim())
        throw new Error('Journey action is required.'); const key = `journey.completed.${studentId}`; const completed = readDemoState(key, []); if (!completed.includes(action))
        writeDemoState(key, [...completed, action]); audit('journey', studentId, 'action_completed', role, action, actorId); return { studentId, action, status: 'Completed' }; },
    listCompletedJourneyActions(studentId, role, actorId) { assertCapability(role, role === 'Student' ? 'journey.read.self' : 'journey.manage.assigned', { studentId, departmentId: 'CSE' }, actorId); return readDemoState(`journey.completed.${studentId}`, []); },
    listStudentAchievements(studentId, role, actorId) { assertCapability(role, 'journey.read.self', { studentId, departmentId: 'CSE' }, actorId); return readDemoState(`journey.achievements.${studentId}`, []); },
    addStudentAchievement(input, role, actorId) { assertCapability(role, 'journey.update.self', { studentId: input.studentId, departmentId: 'CSE' }, actorId); if (!input.title.trim() || !input.detail.trim())
        throw new Error('Achievement title and description are required.'); if (input.evidence && (input.evidence.size > 1024 * 1024 || !input.evidence.dataUrl.startsWith('data:')))
        throw new Error('Evidence must be a valid file up to 1 MB.'); const key = `journey.achievements.${input.studentId}`; const entries = readDemoState(key, []); const item = { id: crypto.randomUUID(), title: input.title.trim(), detail: input.detail.trim(), evidence: input.evidence || null, createdAt: new Date().toISOString() }; writeDemoState(key, [item, ...entries]); audit('journey', input.studentId, 'achievement_added', role, item.title, actorId); return item; },
    submitFeedback(message, role, actorId) { const actor = actorForRole(role, actorId); assertCapability(role, 'feedback.submit.self', { studentId: actor.actorId, departmentId: actor.departmentId }, actor.actorId); if (!message.trim())
        throw new Error('Feedback cannot be empty.'); const key = `feedback.self.${actor.actorId}`; const entries = readDemoState(key, []); const entry = { message: message.trim(), at: new Date().toISOString() }; writeDemoState(key, [entry, ...entries]); audit('feedback', actor.actorId, 'submitted', role, 'Student feedback submitted', actor.actorId); return entry; },
    listAuditEvents(role, actorId) { if (role !== 'HOD')
        throw new Error('Only department leadership can review the department audit log.'); return readDemoState(AUDIT, []).filter(event => event.actorRole === role || actorId === actorForRole('HOD').actorId); },
};
function routeReviewer(type) { const kind = type.toLowerCase(); if (kind.includes('mentor'))
    return 'Tutor'; if (kind.includes('grievance') || kind.includes('escalat'))
    return 'HOD'; if (kind.includes('attendance') || kind.includes('academic') || kind.includes('project'))
    return 'Faculty'; if (kind.includes('document') || kind.includes('record'))
    return 'Office'; return 'HOD'; }
