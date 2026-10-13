import { students } from '../data/mock';
import { actorForRole, assertCapability } from './authorizationService';
import { readDemoState, writeDemoState } from '../utils/storage';
const KEY = 'resource.reservations';
export const labResources = [
    { id: 'innovation-lab-2', name: 'Innovation Lab 2', seats: 72, owner: 'CSE Department', available: true, features: 'Workstations · projector · Linux' },
    { id: 'systems-lab-a', name: 'Systems Lab A', seats: 64, owner: 'CSE Department', available: true, features: 'Workstations · network lab' },
    { id: 'central-lab-1', name: 'Central Lab 1', seats: 90, owner: 'Central Facilities', available: false, features: 'Reserved · CS305 practical' },
];
function all() { return readDemoState(KEY, []); }
export const resourceReservationService = {
    resources: labResources,
    list(role, actorId) {
        const records = all();
        if (role === 'Student') {
            const actor = actorForRole(role, actorId);
            assertCapability(role, 'resource.read.self', { studentId: actor.actorId }, actorId);
            return records.filter(item => item.studentId === actor.actorId);
        }
        if (role === 'HOD') {
            assertCapability(role, 'resource.review.department', { departmentId: 'CSE' }, actorId);
            return records;
        }
        if (role === 'Office') {
            assertCapability(role, 'resource.manage.office', { domain: 'resources' }, actorId);
            return records;
        }
        throw new Error(`Forbidden: ${role} cannot view resource reservations.`);
    },
    request(input, role, actorId) {
        const actor = actorForRole(role, actorId);
        assertCapability(role, 'resource.reserve.self', { studentId: actor.actorId }, actorId);
        if (role !== 'Student')
            throw new Error('Only students can request a lab reservation.');
        const student = students.find(item => item.id === actor.actorId);
        const resource = labResources.find(item => item.id === input.resourceId);
        if (!student || !resource)
            throw new Error('Choose a valid lab and student profile.');
        if (!resource.available)
            throw new Error('This lab is already reserved for the selected period.');
        if (!input.date || !input.slot || !input.purpose.trim())
            throw new Error('Date, time, and purpose are required.');
        if (all().some(item => item.resourceId === resource.id && item.date === input.date && item.slot === input.slot && ['Requested', 'Approved', 'Confirmed'].includes(item.status)))
            throw new Error('That lab and time slot already has a booking. Choose another available slot.');
        const reservation = { id: `LAB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, resourceId: resource.id, resourceName: resource.name, studentId: student.id, studentName: student.name, date: input.date, slot: input.slot, purpose: input.purpose.trim(), status: 'Requested', createdAt: new Date().toISOString() };
        writeDemoState(KEY, [reservation, ...all()]);
        return reservation;
    },
    decide(id, decision, note, role, actorId) {
        assertCapability(role, 'resource.review.department', { departmentId: 'CSE' }, actorId);
        if (role !== 'HOD')
            throw new Error('Only the HOD can review department lab reservations.');
        if (!note.trim())
            throw new Error('Add a decision rationale.');
        const records = all();
        const reservation = records.find(item => item.id === id);
        if (!reservation)
            throw new Error('Reservation was not found.');
        if (reservation.status !== 'Requested')
            throw new Error('This reservation has already been reviewed.');
        const updated = { ...reservation, status: decision, decisionNote: note.trim() };
        writeDemoState(KEY, records.map(item => item.id === id ? updated : item));
        return updated;
    },
    cancel(id, role, actorId) {
        const actor = actorForRole(role, actorId);
        assertCapability(role, 'resource.reserve.self', { studentId: actor.actorId }, actorId);
        const records = all();
        const reservation = records.find(item => item.id === id && item.studentId === actor.actorId);
        if (!reservation || reservation.status !== 'Requested')
            throw new Error('Only your pending reservation can be cancelled.');
        const updated = { ...reservation, status: 'Cancelled' };
        writeDemoState(KEY, records.map(item => item.id === id ? updated : item));
        return updated;
    },
};
