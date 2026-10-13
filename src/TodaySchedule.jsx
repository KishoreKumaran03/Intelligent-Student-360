import { CalendarDays, CheckCircle2, Circle, Clock3, Users } from 'lucide-react';
import { workflowService } from './services/workflowService';
import { workAssignmentService } from './services/workAssignmentService';

const seeds = {
  HOD: [
    { time:'08:45 AM', kind:'Classes', title:'Semester 7 · academic review', detail:'CS Department · Conference room', page:'Academic Intelligence' },
    { time:'11:00 AM', kind:'People to meet', title:'Faculty coordinators · course follow-up', detail:'Review course attendance and assessment updates', page:'Faculty' },
    { time:'02:00 PM', kind:'Events', title:'Department project showcase', detail:'Innovation Hall · CSE student teams', page:'Events & Activities' },
  ],
  Tutor: [
    { time:'09:00 AM', kind:'Classes', title:'CSE-A · mentoring hour', detail:'Semester 7 · Tutorial room 3', page:'Students' },
    { time:'11:30 AM', kind:'People to meet', title:'Assigned mentee check-in', detail:'Follow up on academic and development actions', page:'Students' },
    { time:'03:00 PM', kind:'Events', title:'Tutor coordination meeting', detail:'Mentoring office · case and meeting follow-up', page:'Meetings' },
  ],
};

function Item({ time, title, detail, kind, complete, onClick }) {
  const Mark = complete ? CheckCircle2 : kind === 'People to meet' ? Users : kind === 'Classes' ? Clock3 : Circle;
  return <button className="today-item" onClick={onClick}><span className={`today-mark ${complete?'is-done':''}`}><Mark size={15}/></span><span className="today-item-copy"><small>{time} · {kind}</small><b>{title}</b><span>{detail}</span></span></button>;
}

export default function TodaySchedule({ role, onPage }) {
  const today = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const tasks = role === 'Tutor' ? workAssignmentService.list(role).filter(item => item.status !== 'Completed').slice(0,4) : [];
  const requests = workflowService.listRequests(role).filter(item => !['Completed','Rejected','Cancelled','Approved'].includes(item.status)).slice(0,4);
  const cases = workflowService.listCases(role).filter(item => item.status !== 'Closed').slice(0,4);
  const meetings = workflowService.listMeetings(role).filter(item => !['Completed','Cancelled'].includes(item.status)).slice(0,4);
  const rows = [
    ...tasks.map((item,i)=>({time:item.dueDate===new Date().toISOString().slice(0,10)?'Due today':`By ${item.dueDate}`,kind:role==='HOD'?'Assigned work':'To complete',title:item.title,detail:item.instructions||'Assigned work · follow up on completion',page:role==='HOD'?'Requests & Approvals':'My Assigned Work',complete:false,key:item.id||`task-${i}`})),
    ...requests.map((item,i)=>({time:item.status==='Needs information'?'Respond today':'Needs review',kind:'To complete',title:`${item.type} · ${item.id}`,detail:`${item.who||item.studentName||'Student request'} · ${item.status} · ${item.reason||'Review request'}`,page:'Requests & Approvals',key:item.id||`request-${i}`})),
    ...seeds[role].map((item,i)=>({...item,key:`seed-${i}`})),
    ...meetings.map((item,i)=>({time:item.date||'Scheduled',kind:'Meetings',title:item.title,detail:item.purpose||item.studentName||'Open meeting details and follow-up',page:'Meetings',key:item.id||`meeting-${i}`})),
    ...cases.map((item,i)=>({time:item.due||'Follow-up',kind:'People to meet',title:item.student||item.type,detail:`${item.id} · ${item.type} · ${item.status}`,page:'Cases',key:item.id||`case-${i}`})),
  ];
  return <div className="today-schedule">
    <section className="panel today-header"><span className="today-calendar"><CalendarDays size={20}/></span><div><span className="eyebrow">PERSONAL DAILY BRIEF · {role.toUpperCase()}</span><h2>Today's schedule</h2><p>{today} · Tasks, classes, meetings, people and events in your authorized scope.</p></div><span className="today-total">{rows.length} items</span></section>
    <section className="panel">{rows.length ? rows.map(item=><Item key={item.key} {...item} onClick={()=>onPage(item.page)}/>) : <p className="drawer-note">Nothing is scheduled yet. New tasks and meetings will appear here.</p>}</section>
    {cases.length>0&&<section className="today-footnote"><b>People requiring follow-up</b><span>{cases.map(c=>c.student).filter(Boolean).join(' · ')}</span><button className="text-action" onClick={()=>onPage('Cases')}>Review assigned cases</button></section>}
  </div>;
}
