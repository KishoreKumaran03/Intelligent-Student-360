import { students } from '../data/mock';
import { authorizationService } from './authorizationService';
function toStudentFacingRecord(student) {
    return {
        id: student.id, name: student.name, initials: student.initials, program: student.program, section: student.section, semester: student.semester,
        cgpa: student.cgpa, attendance: student.attendance, cia: student.cia, credits: student.credits, arrears: student.arrears, mentor: student.mentor, skills: [...student.skills],
        developmentActions: student.gaps.map(skill => `Build ${skill} through a guided learning activity`),
    };
}
export const studentAccessService = {
    list(role, actorId) {
        const visible = authorizationService.scopeStudents(role, students, actorId);
        return role === 'Student' ? visible.map(toStudentFacingRecord) : visible;
    },
    get(role, studentId, actorId) {
        if (!authorizationService.canAccessStudent(role, studentId, actorId))
            throw new Error('Forbidden: this student record is outside your authorized scope.');
        const record = students.find(student => student.id === studentId);
        if (!record)
            throw new Error('Student record was not found.');
        return role === 'Student' ? toStudentFacingRecord(record) : record;
    },
    canRead(role, studentId, actorId) { return authorizationService.canAccessStudent(role, studentId, actorId); },
};
export function asInstitutionalStudent(record) {
    if (!('readiness' in record))
        throw new Error('Student-facing records do not contain institutional intelligence.');
    return record;
}
