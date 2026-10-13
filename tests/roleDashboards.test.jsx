import React from 'react';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { TutorDashboard, FacultyDashboard } from '../src/App';
import { students } from '../src/data/mock';
import Student360View from '../src/Student360View';
import { StudentDashboard, StudentPortalWorkspace } from '../src/StudentPortal';
import { studentAccessService } from '../src/services/studentAccessService';
class MemoryStorage {
    data = new Map();
    getItem(k) { return this.data.get(k) ?? null; }
    setItem(k, v) { this.data.set(k, v); }
    removeItem(k) { this.data.delete(k); }
    clear() { this.data.clear(); }
    key(i) { return [...this.data.keys()][i] ?? null; }
    get length() { return this.data.size; }
}
beforeEach(() => { Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true }); });
describe('role dashboard rendering', () => {
    it('renders the student-owned Student 360 route without a blank screen', () => { const html = renderToString(React.createElement(Student360View, { student: studentAccessService.get('Student', '22CS018'), role: 'Student', onBack: () => { }, onPage: () => { }, onEvidence: () => { }, onAction: () => { } })); expect(html).toContain('YOUR STUDENT RECORD'); expect(html).toContain('MY STUDENT 360'); expect(html).toContain('Academics'); });
    it('renders the tutor mentoring page from assigned mentee data', () => { const html = renderToString(React.createElement(TutorDashboard, { students: students.filter(s => s.mentor === 'Dr. Meera Nair'), onStudent: () => { }, onPage: () => { }, onAction: () => { } })); expect(html).toContain('Guide your assigned mentees'); expect(html).toContain('MENTEE WELLBEING'); expect(html).toContain('MENTORING CASES'); });
    it('renders the faculty course page from assigned course data', () => { const html = renderToString(React.createElement(FacultyDashboard, { students: students.filter(s => s.section.endsWith('B')), onStudent: () => { }, onPage: () => { }, onAction: () => { } })); expect(html).toContain('Course performance and academic intervention'); expect(html).toContain('ASSIGNED COURSES'); expect(html).toContain('ACADEMIC INTERVENTION'); });
    it('renders the command-center quick actions and key personal snapshot', () => { const html=renderToString(React.createElement(StudentDashboard,{onPage:()=>{}})); expect(html).toContain('QUICK ACTIONS'); expect(html).toContain('Reserve an Event'); expect(html).toContain('Meet My Tutor'); expect(html).toContain('Ananya'); expect(html).toContain('Your current goal'); });
    it('renders the event reservation workflow without student approval controls', () => { const html=renderToString(React.createElement(StudentPortalWorkspace,{page:'Event Reservations',onPage:()=>{},onAction:()=>{}})); expect(html).toContain('Reserve an event'); expect(html).toContain('Submit reservation'); expect(html).toContain('pending until reviewed'); expect(html).not.toContain('Approve reservation'); });
});
