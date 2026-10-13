import { actorForRole, authorizationService, assertCapability } from './authorizationService';
import { readDemoState, writeDemoState } from '../utils/storage';
import { roleAssignmentService } from './roleAssignmentService';

const KEY = 'student.event-reservations';
export const studentReservationService = {
  list(role, actorId) {
    if (!authorizationService.can(role, 'resource.read.self', { studentId: actorId || actorForRole(role)?.actorId }, actorId)) return [];
    const id = actorId || actorForRole(role).actorId;
    return readDemoState(KEY, []).filter(x => x.studentId === id).map(({ id: reservationId, event, date, time, venue, purpose, participants, status, createdAt }) => ({ id: reservationId, event, date, time, venue, purpose, participants, status, createdAt }));
  },
  reviewQueue(role, actorId) {
    assertCapability(role, 'resource.review.department', { departmentId: 'CSE' }, actorId);
    return readDemoState(KEY, []).map(x => ({ ...x })).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  },
  create(input, role, actorId) {
    const actor = actorForRole(role, actorId);
    if (!actor || !authorizationService.can(role, 'resource.reserve.self', { studentId: actor.actorId }, actor.actorId) || !roleAssignmentService.canReserveAs(role, actor.actorId)) throw new Error('Event space reservations are available only to a student whose club secretary appointment has been approved by the HOD.');
    if (!input.event?.trim() || !input.date || !input.purpose?.trim()) throw new Error('Event, date and purpose are required.');
    const club = input.club || roleAssignmentService.secretaryClubs(role, actor.actorId)[0];
    if (!roleAssignmentService.secretaryClubs(role, actor.actorId).includes(club)) throw new Error('You can reserve space only for a club where your Secretary appointment is active.');
    const records = readDemoState(KEY, []);
    const record = { id: `EVR-${Date.now()}`, studentId: actor.actorId, club, event: input.event.trim(), type: input.type, date: input.date, time: input.time, venue: input.venue, purpose: input.purpose.trim(), participants: Number(input.participants) || 1, status: 'Pending Approval', createdAt: new Date().toISOString() };
    writeDemoState(KEY, [record, ...records]);
    return { ...record };
  },
  decide(id, decision, note, role, actorId) {
    assertCapability(role, 'resource.review.department', { departmentId: 'CSE' }, actorId);
    if (role !== 'HOD') throw new Error('Only the HOD can review club event-space reservations.');
    if (!['Approved','Rejected'].includes(decision)) throw new Error('Choose approve or reject.');
    if (!note?.trim()) throw new Error('Add a decision rationale.');
    const records = readDemoState(KEY, []); const item = records.find(x => x.id === id);
    if (!item || item.status !== 'Pending Approval') throw new Error('Only pending event reservations can be reviewed.');
    const updated = { ...item, status: decision, decisionNote: note.trim(), reviewedBy: 'Dr. Priya Nair', reviewedAt: new Date().toISOString() };
    writeDemoState(KEY, records.map(x => x.id === id ? updated : x)); return { ...updated };
  },
};
