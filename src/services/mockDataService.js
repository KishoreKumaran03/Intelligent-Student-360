import { students, cases, requests, meetings } from '../data/mock';
import { filterRecords } from './analyticsService';
import { buildDepartmentDashboard } from './analyticsService';
export const mockDataService = {
    async loadStudents(filters = {}) { await Promise.resolve(); return filterRecords(students, filters); },
    async loadDashboard() { await Promise.resolve(); return buildDepartmentDashboard({ students, studentCount: 486, attendanceMeanOverride: 85.4, cgpaMeanOverride: 8.06, facultyCount: 32, activeCases: cases.filter(c => !['Resolved', 'Closed'].includes(c.status)).length, pendingApprovals: requests.filter(r => r.status === 'Pending').length, pendingRequests: requests.filter(r => !['Approved', 'Rejected', 'Completed'].includes(r.status)).length, placementRate: 78 }); },
    async loadOperationalSnapshot() { await Promise.resolve(); return { cases, requests, meetings }; }
};
