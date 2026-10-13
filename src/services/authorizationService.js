import { students } from '../data/mock';
import { roleAssignmentService } from './roleAssignmentService';
export const capabilities = [
    'dashboard.view.department', 'dashboard.view.mentoring', 'dashboard.view.faculty', 'dashboard.view.student', 'dashboard.view.office',
    'student.read.self', 'student.read.department', 'student.read.assigned', 'student.read.course', 'faculty.read.department', 'faculty.read.limited',
    'academics.read.self', 'academics.read.assigned', 'academics.read.department', 'journey.read.self', 'journey.update.self', 'journey.read.assigned', 'journey.manage.assigned', 'competency.read.self_actionable', 'competency.read.assigned', 'competency.assess.assigned', 'placement.read.self', 'placement.read.assigned', 'placement.read.department', 'placement.recommend.assigned', 'placement.decide.department',
    'request.create.self', 'request.read.self', 'request.update.self', 'request.cancel.self', 'request.read.assigned', 'request.review.mentor', 'request.review.academic', 'request.decide.mentor', 'request.decide.academic', 'request.decide.department', 'request.process.office',
    'case.read.self', 'case.read.assigned', 'case.read.department', 'case.create.assigned', 'case.update.assigned', 'case.assign.department', 'case.close.department', 'case.escalate.assigned',
    'meeting.request.self', 'meeting.read.self', 'meeting.update.self', 'meeting.read.assigned', 'meeting.schedule.assigned', 'meeting.schedule.department', 'meeting.outcome.assigned', 'placement.apply.self', 'journey.complete.self', 'work.assign.department', 'work.read.assigned', 'work.complete.assigned',
    'activity.read.self', 'activity.read.assigned', 'activity.manage.assigned', 'event.read', 'event.request.self', 'event.approve.department', 'student.portal.read.self',
    'resource.read.self', 'resource.reserve.self', 'resource.read.department', 'resource.review.department', 'resource.manage.office', 'club.reservation.manage.self', 'club.reservation.read.self', 'feedback.submit.self', 'feedback.read.department', 'report.read.self', 'report.read.limited', 'report.read.department', 'report.export.department', 'import.read.department', 'import.create.department', 'settings.manage.department', 'settings.manage.office', 'search.student.assigned', 'search.student.department',
];
const allStudentIds = students.map((s) => s.id);
const tutorMentees = students.filter((s) => s.mentor === 'Dr. Meera Nair').map((s) => s.id);
const facultyStudents = students.filter((s) => s.section.endsWith('B')).map((s) => s.id);
const roleCapabilities = {
    Student: ['dashboard.view.student', 'student.read.self', 'student.portal.read.self', 'academics.read.self', 'journey.read.self', 'journey.update.self', 'journey.complete.self', 'competency.read.self_actionable', 'placement.read.self', 'placement.apply.self', 'request.create.self', 'request.read.self', 'request.update.self', 'request.cancel.self', 'meeting.request.self', 'meeting.read.self', 'meeting.update.self', 'activity.read.self', 'event.read', 'event.request.self', 'feedback.submit.self', 'case.read.self', 'work.read.assigned', 'work.complete.assigned', 'report.read.self'],
    Tutor: ['dashboard.view.mentoring', 'student.read.assigned', 'academics.read.assigned', 'journey.manage.assigned', 'competency.read.assigned', 'competency.assess.assigned', 'placement.read.assigned', 'placement.recommend.assigned', 'request.read.assigned', 'request.review.mentor', 'request.decide.mentor', 'case.read.assigned', 'case.create.assigned', 'case.update.assigned', 'case.escalate.assigned', 'meeting.read.assigned', 'meeting.schedule.assigned', 'meeting.outcome.assigned', 'journey.read.assigned', 'activity.read.assigned', 'activity.manage.assigned', 'event.read', 'report.read.limited', 'search.student.assigned', 'work.read.assigned', 'work.complete.assigned'],
    Faculty: ['dashboard.view.faculty', 'student.read.course', 'faculty.read.limited', 'academics.read.assigned', 'competency.read.assigned', 'competency.assess.assigned', 'placement.read.assigned', 'request.read.assigned', 'request.review.academic', 'request.decide.academic', 'case.read.assigned', 'case.create.assigned', 'case.update.assigned', 'meeting.read.assigned', 'meeting.schedule.assigned', 'meeting.outcome.assigned', 'journey.read.assigned', 'activity.read.assigned', 'activity.manage.assigned', 'event.read', 'report.read.limited', 'search.student.assigned', 'work.read.assigned', 'work.complete.assigned'],
    HOD: ['dashboard.view.department', 'student.read.department', 'faculty.read.department', 'academics.read.department', 'journey.manage.assigned', 'competency.read.assigned', 'competency.assess.assigned', 'placement.read.department', 'placement.decide.department', 'request.read.assigned', 'request.decide.department', 'case.read.department', 'case.create.assigned', 'case.update.assigned', 'case.assign.department', 'case.close.department', 'case.escalate.assigned', 'meeting.read.assigned', 'meeting.schedule.department', 'meeting.outcome.assigned', 'activity.read.assigned', 'activity.manage.assigned', 'event.read', 'event.approve.department', 'resource.read.department', 'resource.review.department', 'feedback.read.department', 'report.read.department', 'report.export.department', 'import.read.department', 'import.create.department', 'settings.manage.department', 'search.student.department', 'work.assign.department'],
    Office: ['dashboard.view.office', 'faculty.read.limited', 'request.read.assigned', 'request.process.office', 'event.read', 'resource.read.department', 'resource.manage.office', 'report.read.limited', 'report.export.department', 'import.read.department', 'import.create.department', 'settings.manage.office'],
};
export const demoActors = {
    Student: { role: 'Student', actorId: '22CS018', departmentId: 'CSE' },
    Tutor: { role: 'Tutor', actorId: 'tutor:meera-nair', departmentId: 'CSE' },
    Faculty: { role: 'Faculty', actorId: 'faculty:karthik-s', departmentId: 'CSE' },
    HOD: { role: 'HOD', actorId: 'hod:priya-nair', departmentId: 'CSE' },
    Office: { role: 'Office', actorId: 'office:cse', departmentId: 'CSE' },
};
const legacyActions = {
    'students:self': 'student.read.self', 'students:read': 'student.read.department', 'faculty:self': 'faculty.read.limited', 'faculty:read': 'faculty.read.department',
    'cases:self': 'case.read.self', 'cases:read': 'case.read.department', 'cases:create': 'case.create.assigned', 'cases:assign': 'case.update.assigned', 'cases:close': 'case.close.department', 'cases:escalate': 'case.escalate.assigned',
    'requests:self': 'request.read.self', 'requests:create': 'request.create.self', 'requests:read': 'request.read.assigned', 'requests:decide': 'request.decide.department',
    'meetings:self': 'meeting.read.self', 'meetings:create': 'meeting.schedule.department', 'reports:self': 'report.read.self', 'reports:read': 'report.read.department', 'reports:export': 'report.export.department',
    'imports:read': 'import.read.department', 'imports:create': 'import.create.department', 'signals:self': 'case.read.self', 'signals:read': 'case.read.assigned', 'signals:assign': 'case.update.assigned', 'signals:dismiss': 'case.update.assigned', 'signals:resolve': 'case.update.assigned',
    'activities:read': 'activity.read.assigned', 'placement:read': 'placement.read.assigned', 'placement:decide': 'placement.decide.department', 'roadmaps:self': 'journey.read.self', 'resources:read': 'resource.read.department',
};
export function actorForRole(role, _actorId) { return demoActors[role]; }
function normalizedStudentId(scope) {
    if (scope.studentId)
        return scope.studentId;
    if (scope.requesterId)
        return scope.requesterId;
    if (scope.studentName)
        return students.find((s) => s.name === scope.studentName)?.id;
    return undefined;
}
function studentIsInScope(role, scope, actor) {
    const id = normalizedStudentId(scope);
    if (!id)
        return false;
    const student = students.find((s) => s.id === id);
    if (!student || (scope.departmentId && scope.departmentId !== actor.departmentId))
        return false;
    if (role === 'Student')
        return id === actor.actorId;
    if (role === 'Tutor')
        return tutorMentees.includes(id) && student.mentor === 'Dr. Meera Nair';
    if (role === 'Faculty')
        return facultyStudents.includes(id) && student.section.endsWith('B');
    if (role === 'HOD')
        return student.program === 'B.Tech Computer Science' && actor.departmentId === 'CSE';
    return false;
}
function requestDecisionCapability(scope) {
    const type = (scope.requestType || '').toLowerCase();
    if (type.includes('mentor') || type.includes('mentoring'))
        return 'request.decide.mentor';
    if (type.includes('attendance') || type.includes('assessment') || type.includes('academic') || type.includes('project'))
        return 'request.decide.academic';
    if (type.includes('od') || type.includes('event') || type.includes('leave') || type.includes('department') || type.includes('grievance') || type.includes('escalat'))
        return 'request.decide.department';
    if (type.includes('document') || type.includes('record') || type.includes('administrative'))
        return 'request.process.office';
    return undefined;
}
function scopeAllowed(role, capability, scope, actor) {
    if (capability.endsWith('.self') || capability === 'student.read.self' || capability === 'placement.read.self' || capability === 'case.read.self')
        return studentIsInScope(role, scope, actor);
    if (capability.includes('.assigned') || capability === 'student.read.assigned' || capability === 'student.read.course') {
        if (scope.studentId || scope.studentName || scope.requesterId)
            return studentIsInScope(role, scope, actor);
        if (scope.ownerId && role === 'Tutor')
            return scope.ownerId === actor.actorId || scope.ownerId === 'Dr. Meera Nair';
        if (scope.ownerId && role === 'Faculty')
            return scope.ownerId === actor.actorId || scope.ownerId === 'Prof. Karthik S';
        if (scope.facultyId && role === 'Faculty')
            return scope.facultyId === actor.actorId || scope.facultyId === 'Prof. Karthik S';
        if (capability === 'meeting.read.assigned')
            return false;
        return !scope.departmentId || scope.departmentId === actor.departmentId;
    }
    if (capability.startsWith('request.decide.') || capability === 'request.process.office' || capability === 'request.read.assigned') {
        if (scope.studentId || scope.studentName || scope.requesterId) {
            if (role === 'Student')
                return studentIsInScope(role, scope, actor);
            if (role === 'Tutor' || role === 'Faculty' || role === 'HOD')
                return studentIsInScope(role, scope, actor);
            return role === 'Office' && (!scope.domain || ['documents', 'records', 'requests', 'attendance'].includes(scope.domain));
        }
    }
    if (capability.includes('.department'))
        return !scope.departmentId || scope.departmentId === actor.departmentId;
    if (capability.includes('.office'))
        return !scope.domain || ['attendance', 'documents', 'requests', 'records', 'reports', 'resources', 'events'].includes(scope.domain);
    return true;
}
export const permissionMatrix = Object.fromEntries(capabilities.map((capability) => [capability, Object.fromEntries(Object.keys(roleCapabilities).map((role) => [role, roleCapabilities[role].includes(capability)]))]));
const navigationByRole = {
    Student: [
        { label: 'OVERVIEW', items: [{ page: 'Command Centre', label: 'My Dashboard', capability: 'dashboard.view.student' }] },
        { label: 'ACADEMICS', items: [{ page: 'My Academics', label: 'My Academics', capability: 'academics.read.self' }, { page: 'My Attendance', label: 'My Attendance', capability: 'academics.read.self' }, { page: 'My Results', label: 'My Results', capability: 'academics.read.self' }, { page: 'Competencies', label: 'My Competencies', capability: 'competency.read.self_actionable' }] },
        { label: 'MY SERVICES', items: [{ page: 'Event Reservations', label: 'Reserve club event space', capability: 'resource.reserve.self' }, { page: 'Resources', label: 'Lab Bookings', capability: 'resource.read.self' }, { page: 'Meetings', label: 'Meet My Tutor', capability: 'meeting.read.self' }, { page: 'Requests & Approvals', label: 'My Requests', capability: 'request.read.self' }] },
        { label: 'DEVELOPMENT', items: [{ page: 'My Projects', label: 'My Projects', capability: 'student.portal.read.self' }, { page: 'My Activities', label: 'My Activities', capability: 'activity.read.self' }, { page: 'Roadmaps & Journeys', label: 'My Journey', capability: 'journey.read.self' }] },
        { label: 'OPPORTUNITIES', items: [{ page: 'Events & Competitions', label: 'Events & Competitions', capability: 'event.read' }, { page: 'Placement', label: 'Internships / Opportunities', capability: 'placement.read.self' }] },
        { label: 'COMMUNICATION', items: [{ page: 'Messages', label: 'Messages', capability: 'student.portal.read.self' }, { page: 'Notifications', label: 'Notifications', capability: 'student.portal.read.self' }] },
        { label: 'ACCOUNT', items: [{ page: 'My Profile', label: 'My Profile', capability: 'student.read.self' }, { page: 'My Responsibilities', label: 'My Responsibilities', capability: 'student.portal.read.self' }, { page: 'My Settings', label: 'Settings', capability: 'student.portal.read.self' }] },
    ],
    Tutor: [
        { label: 'OVERVIEW', items: [{ page: 'Command Centre', label: 'Mentoring Dashboard', capability: 'dashboard.view.mentoring' }, { page: "Today's Schedule", label: "Today's Schedule", capability: 'meeting.read.assigned' }, { page: 'Formal Meetings', label: 'Meeting Minutes', capability: 'meeting.read.assigned' }] },
        { label: 'ACADEMIC', items: [{ page: 'Students', label: 'Mentees', capability: 'student.read.assigned' }, { page: 'Academic Intelligence', label: 'Academic Performance', capability: 'academics.read.assigned' }] },
        { label: 'DEVELOPMENT', items: [{ page: 'Roadmaps & Journeys', label: 'Mentee Journeys', capability: 'journey.manage.assigned' }, { page: 'Competencies', label: 'Competencies', capability: 'competency.read.assigned' }, { page: 'Placement', label: 'Opportunities', capability: 'placement.read.assigned' }] },
        { label: 'OPERATIONS', items: [{ page: 'Requests & Approvals', label: 'Requests to Review', capability: 'request.read.assigned' }, { page: 'Meetings', label: 'Meetings', capability: 'meeting.read.assigned' }, { page: 'Cases', label: 'Cases & Actions', capability: 'case.read.assigned' }, { page: 'Events & Activities', label: 'Events', capability: 'event.read' }, { page: 'Reports', label: 'Download student report', capability: 'report.read.limited' }] },
    ],
    Faculty: [
        { label: 'OVERVIEW', items: [{ page: 'Command Centre', label: 'Faculty Dashboard', capability: 'dashboard.view.faculty' }, { page: 'Formal Meetings', label: 'Meeting Minutes', capability: 'meeting.read.assigned' }] }, { label: 'MY ACTIONS', items: [{ page: 'My Assigned Work', label: 'Department Instructions', capability: 'work.read.assigned' }] },
        { label: 'ACADEMIC', items: [{ page: 'Students', label: 'My Course Students', capability: 'student.read.course' }, { page: 'Academic Intelligence', label: 'Attendance & Assessments', capability: 'academics.read.assigned' }, { page: 'Roadmaps & Journeys', label: 'Student Academic Progress', capability: 'journey.read.assigned' }] },
        { label: 'OPERATIONS', items: [{ page: 'Requests & Approvals', label: 'Academic Requests', capability: 'request.read.assigned' }, { page: 'Meetings', label: 'Meetings', capability: 'meeting.read.assigned' }, { page: 'Cases', label: 'Academic Interventions', capability: 'case.read.assigned' }, { page: 'Events & Activities', label: 'Activities', capability: 'activity.read.assigned' }] },
        { label: 'DEVELOPMENT', items: [{ page: 'Competencies', label: 'Student Competencies', capability: 'competency.read.assigned' }, { page: 'Placement', label: 'Projects & Opportunities', capability: 'placement.read.assigned' }, { page: 'My Responsibilities', label: 'My Responsibilities & Points', capability: 'faculty.read.limited' }, { page: 'Reports', label: 'Download student report', capability: 'report.read.limited' }] },
    ],
    HOD: [
        { label: 'OVERVIEW', items: [{ page: 'Command Centre', label: 'Command Centre', capability: 'dashboard.view.department' }, { page: "Today's Schedule", label: "Today's Schedule", capability: 'meeting.read.assigned' }, { page: 'Formal Meetings', label: 'Meeting Minutes', capability: 'meeting.read.assigned' }] },
        { label: 'PEOPLE', items: [{ page: 'Students', label: 'Year & Class Directory', capability: 'student.read.department' }, { page: 'Faculty', label: 'Faculty 360', capability: 'faculty.read.department' }] },
        { label: 'ACADEMIC', items: [{ page: 'Academic Intelligence', label: 'Course Health & Academic Intelligence', capability: 'academics.read.department' }, { page: 'Competencies', label: 'Competencies', capability: 'competency.read.assigned' }] },
        { label: 'DEVELOPMENT', items: [{ page: 'Placement', label: 'Placement', capability: 'placement.read.department' }, { page: 'Roadmaps & Journeys', label: 'Department Development Intelligence', capability: 'journey.manage.assigned' }, { page: 'Events & Activities', label: 'Activities & Events', capability: 'event.read' }] },
        { label: 'OPERATIONS', items: [{ page: 'Cases', label: 'Cases', capability: 'case.read.department' }, { page: 'Requests & Approvals', label: 'Department Approvals', capability: 'request.read.assigned' }, { page: 'Meetings', label: 'Meetings', capability: 'meeting.read.assigned' }, { page: 'Resources', label: 'Resources', capability: 'resource.read.department' }, { page: 'Club Space Requests', label: 'Club Space Requests', capability: 'resource.review.department' }, { page: 'Club & Faculty Roles', label: 'Club & Faculty Roles', capability: 'settings.manage.department' }] },
        { label: 'INSIGHTS', items: [{ page: 'Intelligence & Engagement', label: 'Intelligence & Engagement', capability: 'report.read.department' }, { page: 'External Intelligence', label: 'External Intelligence', capability: 'report.read.department' }, { page: 'Alumni', label: 'Alumni', capability: 'report.read.department' }, { page: 'Feedback', label: 'Feedback', capability: 'feedback.read.department' }, { page: 'Reports', label: 'Reports', capability: 'report.read.department' }, { page: 'Data Import & Quality', label: 'Data Quality', capability: 'import.read.department' }] },
    ],
    Office: [
        { label: 'OVERVIEW', items: [{ page: 'Command Centre', label: 'Operations Dashboard', capability: 'dashboard.view.office' }] },
        { label: 'OPERATIONS', items: [{ page: 'Requests & Approvals', label: 'Administrative Queue', capability: 'request.read.assigned' }, { page: 'Events & Activities', label: 'Event Records', capability: 'event.read' }, { page: 'Resources', label: 'Resources', capability: 'resource.manage.office' }, { page: 'Data Import & Quality', label: 'Data Quality', capability: 'import.read.department' }, { page: 'Reports', label: 'Administrative Reports', capability: 'report.read.limited' }] },
    ],
};
export function navigationForRole(role) { return navigationByRole[role].map(group => ({ ...group, items: group.items.filter(item => (role === 'Faculty' && item.page === 'Formal Meetings') ? roleAssignmentService.canRecordFormalMinutes('Faculty') : roleCapabilities[role]?.includes(item.capability) || role === 'Student' && ['resource.read.self','resource.reserve.self'].includes(item.capability) && authorizationService.can(role, item.capability, { studentId: demoActors.Student.actorId }) || role === 'Faculty' && item.page === 'My Responsibilities' && roleAssignmentService.list('Faculty').length > 0) })).filter(group => group.items.length > 0); }
export const authorizationService = {
    can(role, capabilityOrLegacyAction, scope = {}, actorId) {
        if (actorId && actorId !== demoActors[role].actorId)
            return false;
        const capability = (legacyActions[capabilityOrLegacyAction] || capabilityOrLegacyAction);
        if (!capabilities.includes(capability))
            return false;
        if (role === 'Student' && ['resource.read.self','resource.reserve.self','club.reservation.read.self','club.reservation.manage.self'].includes(capability)) {
            if (!roleAssignmentService.canReserveAs(role, actorId)) return false;
            if (capability === 'resource.read.self' || capability === 'club.reservation.read.self') return !scope.studentId || scope.studentId === (actorId || demoActors.Student.actorId);
            return !scope.studentId || scope.studentId === (actorId || demoActors.Student.actorId);
        }
        if (!roleCapabilities[role].includes(capability))
            return false;
        const actor = actorForRole(role, actorId);
        if (capability.startsWith('request.decide.') && scope.requestType) {
            const route = requestDecisionCapability(scope);
            if (route !== capability && !(role === 'HOD' && capability === 'request.decide.department'))
                return false;
        }
        if (scope.requestStatus === 'Completed' || scope.requestStatus === 'Rejected' || scope.requestStatus === 'Approved') {
            if (capability.startsWith('request.decide.') || capability === 'request.process.office')
                return false;
        }
        return scopeAllowed(role, capability, scope, actor);
    },
    canAccessStudent(role, studentId, actorId) {
        const capability = role === 'Student' ? 'student.read.self' : role === 'Tutor' ? 'student.read.assigned' : role === 'Faculty' ? 'student.read.course' : 'student.read.department';
        return roleCapabilities[role].includes(capability) && studentIsInScope(role, { studentId }, actorForRole(role, actorId));
    },
    canOpenPage(role, page) {
        const dashboardCapability = { Student: 'dashboard.view.student', Tutor: 'dashboard.view.mentoring', Faculty: 'dashboard.view.faculty', HOD: 'dashboard.view.department', Office: 'dashboard.view.office' };
        if (page === 'Command Centre')
            return roleCapabilities[role].includes(dashboardCapability[role]);
        const studentPortalPages = ['My Academics','My Attendance','My Results','My Projects','My Activities','Events & Competitions','Messages','Notifications','My Profile','My Responsibilities','My Settings'];
        if (studentPortalPages.includes(page) && role === 'Student') return roleCapabilities.Student.includes('student.portal.read.self');
        if (page === 'My Responsibilities' && role === 'Faculty') return roleAssignmentService.list('Faculty').length > 0;
        if (role === 'Student' && page === 'Students')
            return false;
        if (page === "Today's Schedule") return ['HOD', 'Tutor'].includes(role) && roleCapabilities[role].includes('meeting.read.assigned');
        if (page === 'Formal Meetings') return ['HOD', 'Tutor'].includes(role) && roleCapabilities[role].includes('meeting.read.assigned') || role === 'Faculty' && roleAssignmentService.canRecordFormalMinutes('Faculty');
        if (page === 'Club & Faculty Roles') return role === 'HOD' && roleCapabilities.HOD.includes('settings.manage.department');
        if (page === 'Club Space Requests') return role === 'HOD' && roleCapabilities.HOD.includes('resource.review.department');
        if (page === 'Event Reservations' || page === 'Resources' && role === 'Student') return role === 'Student' && this.can(role, 'resource.reserve.self', { studentId: demoActors.Student.actorId });
        const pageCapability = {
            'My Student 360': 'student.read.self',
            Students: role === 'Student' ? 'student.read.self' : role === 'Tutor' ? 'student.read.assigned' : role === 'Faculty' ? 'student.read.course' : 'student.read.department',
            Faculty: 'faculty.read.department', Mentoring: 'student.read.assigned', 'Academic Intelligence': role === 'HOD' ? 'academics.read.department' : 'academics.read.assigned',
            Competencies: role === 'Student' ? 'competency.read.self_actionable' : 'competency.read.assigned', 'Roadmaps & Journeys': role === 'Student' ? 'journey.read.self' : role === 'Faculty' ? 'journey.read.assigned' : 'journey.manage.assigned', Placement: role === 'Student' ? 'placement.read.self' : role === 'HOD' ? 'placement.read.department' : 'placement.read.assigned',
            Cases: role === 'Student' ? 'case.read.self' : role === 'HOD' ? 'case.read.department' : 'case.read.assigned', Meetings: role === 'Student' ? 'meeting.read.self' : 'meeting.read.assigned',
            'Requests & Approvals': role === 'Student' ? 'request.read.self' : 'request.read.assigned', 'Events & Activities': role === 'Student' ? 'event.read' : 'event.read', Resources: role === 'Student' ? 'resource.read.self' : role === 'HOD' ? 'resource.read.department' : 'resource.manage.office', Reports: role === 'Student' ? 'report.read.self' : role === 'HOD' ? 'report.read.department' : 'report.read.limited',
            'Data Import & Quality': 'import.read.department', 'My Assigned Work': 'work.read.assigned', 'Intelligence & Engagement': 'report.read.department', 'External Intelligence': 'report.read.department', Feedback: role === 'Student' ? 'feedback.submit.self' : 'feedback.read.department', Alumni: 'report.read.department',
        };
        const cap = pageCapability[page];
        return !!cap && roleCapabilities[role].includes(cap);
    },
    scopeStudents(role, data, actorId) { return data.filter((student) => this.canAccessStudent(role, student.id, actorId)); },
};
export function assertCapability(role, capability, scope = {}, actorId) {
    if (!authorizationService.can(role, capability, scope, actorId))
        throw new Error(`Forbidden: ${role} cannot ${capability}${scope.studentId ? ` for student ${scope.studentId}` : ''}.`);
}
/** Kept as a migration adapter; all checks resolve through the centralized capability matrix. */
export function assertDemoPermission(role, legacyAction, scope = {}, actorId) { assertCapability(role, legacyAction, scope, actorId); }
