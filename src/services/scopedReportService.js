import { authorizationService } from './authorizationService';
import { studentAccessService } from './studentAccessService';
import { workflowService } from './workflowService';
import { roleAssignmentService } from './roleAssignmentService';

function quote(value) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }

export function exportStudentScopeCsv(role, page = 'Student records') {
  if (!['Tutor', 'Faculty'].includes(role) || !authorizationService.can(role, 'report.read.limited')) {
    throw new Error('This role cannot export scoped student reports.');
  }
  const records = studentAccessService.list(role);
  const headers = ['Student ID', 'Student name', 'Programme', 'Section', 'Semester', 'CGPA', 'Attendance %', 'Assessment average %', 'Credits earned', 'Arrears', 'Assigned tutor', 'Status'];
  const rows = [
    ['Report', `${role} ${page} report`],
    ['Role scope', role === 'Tutor' ? 'Assigned mentees' : 'Assigned course students'],
    ['Record count', records.length],
    ['Generated', new Date().toISOString()],
    [], headers,
    ...records.map(s => [s.id, s.name, s.program, s.section, s.semester, s.cgpa, s.attendance, s.cia, s.credits, s.arrears, s.mentor, s.status || 'Not specified']),
    [],
    ['Source', 'Authorized student records in the current demo workspace'],
    ['Limitations', 'Synthetic demo data; rows are restricted to the current role scope.'],
  ];
  const safeName = `${role}-${page}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const blob = new Blob([rows.map(row => row.map(quote).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `student-360-${safeName}-report.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
  return records.length;
}

export async function exportStudentRecordPdf(student, role) {
  const allowedRoles = ['Student', 'Tutor', 'Faculty', 'HOD'];
  if (!allowedRoles.includes(role) || !student?.id || !studentAccessService.canRead(role, student.id)) {
    throw new Error('This student record is outside your authorized report scope.');
  }
  const rows = [
    ['Student 360 report'], ['Generated', new Date().toISOString()], ['Access scope', role === 'Student' ? 'Own student record' : role === 'HOD' ? 'Department record' : `Assigned ${role.toLowerCase()} scope`], [],
    ['Student ID', student.id], ['Name', student.name], ['Programme', student.program], ['Section', student.section], ['Semester', student.semester], ['Assigned tutor', student.mentor || 'Not assigned'], [],
    ['Academic metric', 'Value'], ['CGPA', student.cgpa], ['Attendance %', student.attendance], ['Assessment average %', student.cia], ['Credits earned', student.credits], ['Active backlogs', student.arrears],
    ...(student.readiness == null ? [] : [['Placement readiness %', student.readiness]]), ['Academic status', student.status || 'Not specified'], [],
    ['Recorded competencies', (student.skills || []).join('; ')], ['Development areas', (student.gaps || student.developmentActions || []).join('; ')], [],
  ];
  const related = record => record.studentId === student.id || record.requesterId === student.id || record.studentName === student.name || record.who === student.name || record.student === student.name;
  const requests = workflowService.listRequests(role).filter(related);
  const cases = workflowService.listCases(role).filter(related);
  const meetings = workflowService.listMeetings(role).filter(record => related(record) || record.title?.includes(student.name));
  const assignments = roleAssignmentService.list(role, role === 'Student' ? student.id : undefined).filter(record => record.personId === student.id);
  rows.push([], ['Related request records'], ['ID', 'Type', 'Status', 'Reason'], ...requests.map(x => [x.id, x.type, x.status, x.reason]), [], ['Related support cases'], ['ID', 'Type', 'Priority', 'Status', 'Owner'], ...cases.map(x => [x.id, x.type, x.priority, x.status, x.owner]), [], ['Related meetings'], ['ID', 'Title', 'Date', 'Status', 'Purpose'], ...meetings.map(x => [x.id, x.title, x.date, x.status, x.purpose]), [], ['Approved additional responsibilities'], ['Role', 'Group', 'Status'], ...assignments.filter(x => x.status === 'Approved').map(x => [x.assignment, x.group, x.status]), [], ['Limitations', 'Illustrative browser demo record; confirm official values against institutional source systems.']);
  const safeId = String(student.id).replace(/[^a-z0-9-]/gi, '-');
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 44;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;
  let y = 52;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(31, 53, 88);
  pdf.text('Student 360 report', margin, y);
  y += 24;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(103, 122, 151);
  pdf.text(`Authorized view for ${role} · Generated ${new Date().toLocaleString()}`, margin, y);
  y += 22;

  rows.slice(4).forEach(row => {
    const values = row.map(value => String(value ?? '—'));
    const isSection = values.length === 1;
    const content = isSection ? values[0] : values.map((value, index) => index === 0 ? value : `  ${value}`).join('    ');
    const lines = pdf.splitTextToSize(content, usableWidth);
    const lineHeight = isSection ? 15 : 13;
    const required = lines.length * lineHeight + (isSection ? 6 : 3);
    if (y + required > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    if (isSection) {
      y += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(49, 88, 207);
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(42, 52, 69);
    }
    pdf.text(lines, margin, y);
    y += required;
  });

  pdf.save(`student-360-${safeId}-report.pdf`);
  return student.id;
}
