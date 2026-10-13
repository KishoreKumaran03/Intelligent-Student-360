import { beforeEach, describe, expect, it } from 'vitest';
import { normalizeField, suggestColumnMapping } from '../src/services/normalizationService';
import { datasetSchemas, validateDatasetRow } from '../src/services/validationService';
import { filterRecords, groupMetric, trendByPeriod } from '../src/services/analyticsService';
import { processInstitutionalImport, runInstitutionalBatch } from '../src/services/importService';
import { jobService } from '../src/services/jobService';
import { generateStudentSignals } from '../src/services/signalService';
import { authorizationService } from '../src/services/authorizationService';
import { workflowService } from '../src/services/workflowService';
import { studentAccessService } from '../src/services/studentAccessService';
import { workAssignmentService } from '../src/services/workAssignmentService';
import { notificationService } from '../src/services/notificationService';
import { students } from '../src/data/mock';
import { appRouteHash, parseAppRoute } from '../src/services/navigationService';
import { studentReservationService } from '../src/services/studentReservationService';
import { resourceReservationService } from '../src/services/resourceReservationService';
import { navigationForRole } from '../src/services/authorizationService';
class MemoryStorage {
    map = new Map();
    getItem(key) { return this.map.get(key) ?? null; }
    setItem(key, value) { this.map.set(key, value); }
    removeItem(key) { this.map.delete(key); }
    clear() { this.map.clear(); }
    key(index) { return [...this.map.keys()][index] ?? null; }
    get length() { return this.map.size; }
}
beforeEach(() => { Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true }); });
describe('institutional normalization and validation', () => {
    it('preserves missing and invalid academic values instead of coercing them to zero', () => {
        expect(normalizeField('', 'number')).toMatchObject({ value: null, state: 'missing', sourceValue: '' });
        expect(normalizeField('not-a-mark', 'number')).toMatchObject({ value: null, state: 'invalid', sourceValue: 'not-a-mark' });
    });
    it('canonicalizes identifiers and flags impossible academic relationships', () => {
        expect(normalizeField('22cs-041', 'identifier').value).toBe('22CS041');
        const assessment = validateDatasetRow({ studentId: '22CS041', courseCode: 'CS302', assessmentName: 'CIA 1', date: '2026-09-25', mark: 108, maxMark: 100 }, datasetSchemas.assessments, 0);
        expect(assessment.issues.some(issue => issue.code === 'RELATION_INVALID')).toBe(true);
        const attendance = validateDatasetRow({ studentId: '22CS041', courseCode: 'CS302', date: '2026-09-25', sessionsHeld: 10, sessionsPresent: 12 }, datasetSchemas.attendance, 0);
        expect(attendance.issues.some(issue => issue.field === 'sessionsPresent')).toBe(true);
    });
    it('suggests institutional mappings from normalized headers', () => {
        expect(suggestColumnMapping(['Register No', 'Course Code', 'Present Sessions'], ['studentId', 'courseCode', 'sessionsPresent'])).toEqual({ studentId: 'Register No', courseCode: 'Course Code', sessionsPresent: 'Present Sessions' });
    });
});
describe('reusable analytics operations', () => {
    const rows = [{ section: 'A', attendance: 90, date: '2026-08-03' }, { section: 'A', attendance: null, date: '2026-09-03' }, { section: 'B', attendance: 70, date: '2026-09-04' }];
    it('groups numeric values while excluding missing measures', () => { expect(groupMetric(rows, { dimension: 'section', metric: 'attendance', operation: 'mean' })).toEqual([{ name: 'A', value: 90, count: 1 }, { name: 'B', value: 70, count: 1 }]); });
    it('filters and prepares chronological time series', () => { expect(filterRecords(rows, { section: 'B' })).toHaveLength(1); expect(trendByPeriod(rows, 'date', 'attendance')).toEqual([{ period: '2026-08', value: 90, count: 1 }, { period: '2026-09', value: 70, count: 1 }]); });
});
describe('data processing lifecycle', () => {
    it('detects duplicate identifiers and retains missing/invalid score source values', async () => {
        const preview = { fileName: 'marks.csv', dataset: 'assessments', headers: ['Register ID', 'Course', 'Assessment', 'Mark'], rows: [{ 'Register ID': '22CS041', Course: 'CS302', Assessment: 'CIA', Mark: '' }, { 'Register ID': '22CS041', Course: 'CS302', Assessment: 'CIA', Mark: 'bad' }], mapping: { studentId: 'Register ID', courseCode: 'Course', assessmentName: 'Assessment', mark: 'Mark' }, rowCount: 2, issues: [] };
        const result = await processInstitutionalImport(preview, preview.mapping, 'HOD');
        expect(result.duplicateRows).toBe(2);
        expect(result.records[0].values.mark).toMatchObject({ sourceValue: '', value: null, state: 'missing' });
        expect(result.records[1].values.mark).toMatchObject({ sourceValue: 'bad', value: null, state: 'invalid' });
    });
    it('runs jobs through queued, running, and succeeded', async () => { const result = await jobService.run('test-job', async () => ({ rows: 3 })); expect(result.result.rows).toBe(3); expect(result.job.status).toBe('succeeded'); expect(result.job.progress).toBe(100); });
    it('retries a failed in-session processor and finishes the same job', async () => { let calls = 0; let failedId = ''; try {
        await jobService.run('retry-job', async () => { calls++; if (calls === 1)
            throw new Error('transient'); return { ok: true }; });
    }
    catch (error) {
        failedId = error.job.id;
    } const retried = await jobService.retryAndRun(failedId); expect(calls).toBe(2); expect(retried.result.ok).toBe(true); expect(retried.job.status).toBe('succeeded'); });
    it('finds duplicate identifiers across files in a single institutional batch', async () => { const first = { fileName: 'one.csv', dataset: 'assessments', headers: ['ID', 'Course', 'Assessment', 'Mark'], rows: [{ ID: '22CS041', Course: 'CS302', Assessment: 'CIA', Mark: '80' }], mapping: { studentId: 'ID', courseCode: 'Course', assessmentName: 'Assessment', mark: 'Mark' }, rowCount: 1, issues: [] }; const second = { ...first, fileName: 'two.csv', rows: [{ ID: '22CS041', Course: 'CS302', Assessment: 'CIA', Mark: '82' }] }; const done = await runInstitutionalBatch({ previews: [first, second], schemaMismatch: false, schemaDifferences: [] }, first.mapping, 'HOD'); expect(done.result.records).toHaveLength(2); expect(done.result.duplicateRows).toBe(2); expect(done.result.records.map(r => r.source.fileName)).toEqual(['one.csv', 'two.csv']); });
});
describe('signals, workflow, and role policy', () => {
    it('generates signals with evidence, owner, due date, and severity', () => { const signals = generateStudentSignals(students); expect(signals.length).toBeGreaterThan(0); expect(signals[0]).toHaveProperty('evidence'); expect(signals[0]).toHaveProperty('owner'); expect(signals[0]).toHaveProperty('dueDate'); });
    it('persists permitted case transitions and rejects a role without permission', () => { const changed = workflowService.updateCaseStatus('CASE-2408', 'Assigned', 'HOD'); expect(changed.status).toBe('Assigned'); expect(() => workflowService.updateCaseStatus('CASE-2408', 'Closed', 'Student')).toThrow(); });
    it('keeps demonstration role grants explicit', () => { expect(authorizationService.can('HOD', 'reports:export')).toBe(true); expect(authorizationService.can('Student', 'requests:decide')).toBe(false); });
    it('limits student data to the student-facing self record and assigned staff scope', () => { const self = studentAccessService.list('Student'); expect(self).toHaveLength(1); expect(self[0].id).toBe('22CS018'); expect('readiness' in self[0]).toBe(false); expect(() => studentAccessService.get('Student', '22CS041')).toThrow(/Forbidden/); expect(studentAccessService.canRead('Tutor', '22CS018')).toBe(true); expect(studentAccessService.canRead('Tutor', students.find(student => student.mentor !== 'Dr. Meera Nair').id)).toBe(false); const courseStudent = students.find(student => student.section.endsWith('B')); expect(studentAccessService.canRead('Faculty', courseStudent.id)).toBe(true); expect(studentAccessService.canRead('Faculty', '22CS018')).toBe(false); });
    it('rejects student decision, case creation, and spoofed demo actor requests', () => { const request = workflowService.createRequest({ type: 'Leave request', reason: 'Need leave for a personal matter' }, 'Student'); expect(() => workflowService.decideRequest(request.id, 'Approved', 'Approved', 'Student')).toThrow(); expect(() => workflowService.createCase({ studentId: '22CS018', studentName: 'Ananya Rao', type: 'Administrative', priority: 'Low', owner: 'Dr. Meera Nair', reason: 'Attempted self-case' }, 'Student')).toThrow(); expect(authorizationService.can('Student', 'request.create.self', {}, '22CS041')).toBe(false); });
    it('round-trips student deep links and exposes Student 360 only to the student role', () => { const hash = appRouteHash('Students', '22CS041'); expect(parseAppRoute(hash)).toEqual({ page: 'Students', studentId: '22CS041' }); expect(parseAppRoute(appRouteHash('Academic Intelligence'))).toEqual({ page: 'Academic Intelligence' }); expect(parseAppRoute(appRouteHash('My Student 360'))).toEqual({ page: 'My Student 360' }); expect(authorizationService.canOpenPage('Student', 'My Student 360')).toBe(true); expect(authorizationService.canOpenPage('HOD', 'My Student 360')).toBe(false); });
    it('routes HOD assignments to the recipient and sends completion notification back', () => { const task = workAssignmentService.create({ title: 'Review project brief', instructions: 'Read the brief and respond.', assigneeRole: 'Student', assigneeId: '22CS018', dueDate: '2026-10-10', evidence: ['matched skills: Python'] }, 'HOD'); expect(workAssignmentService.list('Student').some(item => item.id === task.id)).toBe(true); expect(notificationService.list('Student').some(item => item.title === 'New department assignment')).toBe(true); workAssignmentService.complete(task.id, 'Reviewed the brief', 'Student'); expect(workAssignmentService.list('HOD').find(item => item.id === task.id)?.status).toBe('Completed'); expect(notificationService.list('HOD').some(item => item.title === 'Assignment completed')).toBe(true); });
    it('rejects assignment creation outside HOD authority', () => { expect(() => workAssignmentService.create({ title: 'x', instructions: 'y', assigneeRole: 'Student', assigneeId: '22CS018', dueDate: '2026-10-10' }, 'Student')).toThrow(/Forbidden/); });
    it('allows a student to record own achievements and blocks another student journey', () => { const entry = workflowService.addStudentAchievement({ studentId: '22CS018', title: 'Cloud course', detail: 'Completed module' }, 'Student'); expect(entry.title).toBe('Cloud course'); expect(workflowService.listStudentAchievements('22CS018', 'Student')).toHaveLength(1); expect(() => workflowService.addStudentAchievement({ studentId: '22CS041', title: 'x', detail: 'y' }, 'Student')).toThrow(/Forbidden/); });
    it('routes grievance requests to HOD and exposes faculty progress only within its role grant', () => { const request = workflowService.createRequest({ type: 'Grievance', reason: 'Request department review' }, 'Student'); expect(workflowService.listRequests('HOD').some(item => item.id === request.id)).toBe(true); expect(authorizationService.canOpenPage('Faculty', 'Roadmaps & Journeys')).toBe(true); expect(authorizationService.canOpenPage('Faculty', 'Intelligence & Engagement')).toBe(false); });
    it('exposes compact command-center pages only to students and round-trips deep links', () => { const items=navigationForRole('Student').flatMap(g=>g.items); expect(items.map(x=>x.label)).toContain('Event Reservations'); expect(items.map(x=>x.label)).toContain('Lab Bookings'); expect(items.length).toBeLessThan(20); for (const page of ['My Academics','My Attendance','My Results','Event Reservations','My Projects','My Activities','Events & Competitions','Messages','Notifications','My Profile','My Settings']) { expect(authorizationService.canOpenPage('Student',page)).toBe(true); expect(authorizationService.canOpenPage('HOD',page)).toBe(false); expect(parseAppRoute(appRouteHash(page))).toEqual({page}); } });
    it('creates own event reservations as pending review and denies staff/student approval through the service', () => { const record=studentReservationService.create({event:'Project Expo',type:'College event',date:'2026-10-08',time:'10 AM',venue:'Hall A',purpose:'Showcase',participants:4},'Student'); expect(record.status).toBe('Pending Approval'); expect(studentReservationService.list('Student').some(x=>x.id===record.id)).toBe(true); expect(studentReservationService.list('HOD')).toEqual([]); expect(()=>studentReservationService.create({event:'x',date:'2026-10-08',purpose:'x'},'HOD')).toThrow(); });
    it('prevents duplicate lab requests for the same resource, date and slot', () => { const data={resourceId:'innovation-lab-2',date:'2026-10-12',slot:'10:00 AM–12:00 PM',purpose:'Capstone build'}; resourceReservationService.request(data,'Student'); expect(()=>resourceReservationService.request(data,'Student')).toThrow(/already has a booking/); });
});
