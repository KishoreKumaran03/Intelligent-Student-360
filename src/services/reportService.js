export function buildDepartmentReport(data) { return { title: 'Department Intelligence Summary', generatedAt: data.generatedAt, scope: `${data.scope.department} · ${data.scope.programme} · Semester ${data.scope.semester}`, metrics: [{ label: 'Students', value: data.metrics.studentCount, source: data.sources[0], calculation: 'Count of students in the selected scope' }, { label: 'Average attendance', value: data.metrics.attendanceMean == null ? null : `${data.metrics.attendanceMean.toFixed(1)}%`, source: data.sources[1], calculation: 'Mean of present attendance values; missing values excluded' }, { label: 'Average CGPA', value: data.metrics.cgpaMean == null ? null : data.metrics.cgpaMean.toFixed(2), source: data.sources[2], calculation: 'Mean of present CGPA values; missing values excluded' }, { label: 'Students requiring attention', value: data.metrics.attentionCount, source: data.sources[1], calculation: 'Rule: attendance < 75% or active arrears > 0' }, { label: 'Active cases', value: data.metrics.activeCases, source: data.sources[3], calculation: 'Count of non-closed support cases' }, { label: 'Placement rate', value: `${data.metrics.placementRate}%`, source: 'placement-register.demo.v1', calculation: 'Placed students / eligible graduating students' }], notes: data.limitations }; }
function saveBlob(blob, fileName) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = fileName; a.click(); setTimeout(() => URL.revokeObjectURL(url), 500); }
function quoteCsv(value) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }
export function exportReportCsv(report) { const rows = [['Report', report.title], ['Scope', report.scope], ['Generated', report.generatedAt], [], ['Metric', 'Value', 'Source', 'Calculation'], ...report.metrics.map(m => [m.label, m.value ?? 'Missing', m.source, m.calculation]), [], ['Limitations'], ...report.notes.map(n => [n])]; saveBlob(new Blob([rows.map(row => row.map(quoteCsv).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }), 'student-360-department-report.csv'); }
export async function exportReportPdf(report) { const { jsPDF } = await import('jspdf'); const doc = new jsPDF(); let y = 18; doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.text(report.title, 16, y); y += 8; doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text(`Scope: ${report.scope}`, 16, y); y += 5; doc.text(`Generated: ${report.generatedAt}`, 16, y); y += 9; for (const metric of report.metrics) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${metric.label}: ${metric.value ?? 'Missing'}`, 16, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(`Source: ${metric.source} · Calculation: ${metric.calculation}`, 175);
    doc.text(lines, 18, y);
    y += 5 * lines.length + 4;
    if (y > 270) {
        doc.addPage();
        y = 18;
    }
} doc.setFont('helvetica', 'bold'); doc.text('Limitations', 16, y); y += 6; doc.setFont('helvetica', 'normal'); for (const note of report.notes) {
    const lines = doc.splitTextToSize(`• ${note}`, 175);
    doc.text(lines, 18, y);
    y += 5 * lines.length + 2;
} doc.save('student-360-department-report.pdf'); }
export async function exportPanelPng(element, fileName = 'student-360-chart.png') { const { default: html2canvas } = await import('html2canvas'); const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 2 }); const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png')); if (!blob)
    throw new Error('PNG export did not produce an image'); saveBlob(blob, fileName); }
