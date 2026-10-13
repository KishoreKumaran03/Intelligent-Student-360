import { students } from '../data/mock';
const knownPages = new Set([
    'Command Centre', 'My Student 360', 'Students', 'Faculty', 'Mentoring', 'Academic Intelligence',
    'Competencies', 'Roadmaps & Journeys', 'Placement', 'Cases', 'Meetings',
    'Requests & Approvals', 'Events & Activities', 'Resources', 'Reports',
    'Data Import & Quality', 'Intelligence & Engagement', 'My Assigned Work', 'External Intelligence', 'Feedback', 'Alumni',
    'My Academics', 'My Attendance', 'My Results', 'Event Reservations', 'My Projects', 'My Activities', 'Events & Competitions', 'Messages', 'Notifications', 'My Profile', 'My Settings',
    "Today's Schedule",
    'Formal Meetings', 'Club & Faculty Roles', 'Club Space Requests', 'My Responsibilities',
]);
export function parseAppRoute(hash) {
    const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    if (parts[0] === 'student' && parts[1]) {
        const student = students.find((item) => item.id === parts[1]);
        return student ? { page: 'Students', studentId: student.id } : { page: 'Students' };
    }
    const page = parts[0] ? decodeURIComponent(parts[0].replaceAll('-', ' ')) : 'Command Centre';
    return { page: knownPages.has(page) ? page : 'Command Centre' };
}
export function appRouteHash(page, studentId) {
    if (studentId)
        return `#/student/${encodeURIComponent(studentId)}`;
    return `#/${encodeURIComponent(page.replaceAll(' ', '-'))}`;
}
