import { students } from '../data/mock';
import { actorForRole } from './authorizationService';
import { readDemoState, writeDemoState } from '../utils/storage';

const KEY = 'institution.role-assignments';
const seed = [
  { id:'ROLE-101', personType:'Student', personId:'22CS018', personName:'Ananya Rao', assignment:'Secretary', group:'GitHub Campus Club', requestedBy:'Club interview panel', status:'Pending HOD approval', requestedAt:'2026-09-29T09:15:00+05:30' },
  { id:'ROLE-102', personType:'Student', personId:'22CS032', personName:'Diya Joseph', assignment:'Joint Secretary', group:'GitHub Campus Club', requestedBy:'Club interview panel', status:'Pending HOD approval', requestedAt:'2026-09-29T10:00:00+05:30' },
  { id:'ROLE-103', personType:'Student', personId:'22CS055', personName:'Rohan Das', assignment:'Event Lead', group:'Your Right Club', requestedBy:'Club interview panel', status:'Pending HOD approval', requestedAt:'2026-09-29T10:45:00+05:30' },
  { id:'ROLE-104', personType:'Faculty', personId:'faculty:karthik-s', personName:'Prof. Karthik S', assignment:'Faculty Development Coordinator', group:'CSE Department', requestedBy:'HOD', status:'Approved', approvedBy:'Dr. Priya Nair', approvedAt:'2026-09-15T09:00:00+05:30', points:20, pointEntries:[{id:'FP-001',title:'Advanced Database Systems certification',points:12,date:'2026-09-12',status:'Approved'},{id:'FP-002',title:'Faculty mentoring workshop',points:8,date:'2026-09-14',status:'Approved'}] },
  { id:'ROLE-105', personType:'Faculty', personId:'faculty:karthik-s', personName:'Prof. Karthik S', assignment:'Department Meeting Recorder', group:'CSE Department', requestedBy:'HOD', status:'Pending HOD approval', requestedAt:'2026-09-29T12:00:00+05:30' },
];
// Restore the presentation's original pending Secretary approval once for browsers
// that already saved a prior demo approval. Other demo records remain untouched.
const approvalDemoResetKey = 'student360.demo.role-approval-reset-v1';
try {
  if (!localStorage.getItem(approvalDemoResetKey)) {
    const rows = readDemoState(KEY, seed);
    const secretary = rows.find(x => x.id === 'ROLE-101');
    if (secretary && secretary.status !== 'Pending HOD approval') {
      writeDemoState(KEY, rows.map(x => x.id === 'ROLE-101'
        ? { ...x, status: 'Pending HOD approval', approvedBy: undefined, approvedAt: undefined }
        : x));
    }
    localStorage.setItem(approvalDemoResetKey, 'done');
  }
} catch { /* Browser storage can be disabled. */ }
function all(){return readDemoState(KEY,seed)}
export const roleAssignmentService={
  clubs:['GitHub Campus Club','Your Right Club'],
  list(role='HOD', actorId){if(!['HOD','Student','Faculty','Tutor'].includes(role))return[];const id=actorId||actorForRole(role)?.actorId;if(role==='HOD')return all().map(x=>({...x,pointEntries:x.pointEntries||[]}));return all().filter(x=>x.personId===id&&x.status==='Approved').map(x=>({...x,pointEntries:x.pointEntries||[]}));},
  pending(){return all().filter(x=>x.status==='Pending HOD approval').map(x=>({...x}));},
  nominate(input,role,actorId){if(role!=='HOD'||actorId&&actorId!==actorForRole('HOD').actorId)throw new Error('Only the HOD can submit a role appointment for formal approval.');if(!['Student','Faculty'].includes(input.personType))throw new Error('Choose a student or faculty candidate.');if(!this.clubs.includes(input.group)&&!(input.personType==='Faculty'&&input.group==='CSE Department'))throw new Error('Choose a registered club or department.');const person=input.personType==='Student'?students.find(s=>s.id===input.personId):null;if(input.personType==='Student'&&!person)throw new Error('Choose a student in the department.');if(input.personType==='Faculty'&&(!String(input.personId).startsWith('faculty:')||!input.personName))throw new Error('Choose a faculty member in the department.');const allowed=input.personType==='Student'?['Secretary','Joint Secretary','Executive Member','Technical Lead','Event Lead']:input.group==='CSE Department'?['Faculty Development Coordinator','Project Coordinator','Department Meeting Recorder']:['Club Faculty Advisor'];if(!allowed.includes(input.assignment))throw new Error('That responsibility is not valid for the selected candidate and group.');if(all().some(x=>x.personId===input.personId&&x.group===input.group&&x.assignment===input.assignment&&['Pending HOD approval','Approved'].includes(x.status)))throw new Error('This person already has this pending or active responsibility.');const entry={id:`ROLE-${Date.now()}`,personType:input.personType,personId:input.personId,personName:person?.name||input.personName,assignment:input.assignment,group:input.group,requestedBy:actorForRole('HOD').actorId,status:'Pending HOD approval',requestedAt:new Date().toISOString()};writeDemoState(KEY,[entry,...all()]);return {...entry};},
  approve(id,role,actorId){if(role!=='HOD'||actorId&&actorId!==actorForRole('HOD').actorId)throw new Error('Only the HOD may approve a role assignment.');const rows=all();const item=rows.find(x=>x.id===id);if(!item||item.status!=='Pending HOD approval')throw new Error('Pending role assignment was not found.');const updated={...item,status:'Approved',approvedBy:'Dr. Priya Nair',approvedAt:new Date().toISOString(),points:item.personType==='Faculty'?0:undefined,pointEntries:[]};writeDemoState(KEY,rows.map(x=>x.id===id?updated:x));return {...updated};},
  revoke(id,role,actorId){if(role!=='HOD'||actorId&&actorId!==actorForRole('HOD').actorId)throw new Error('Only the HOD may revoke an approved responsibility.');const rows=all();const item=rows.find(x=>x.id===id);if(!item||item.status!=='Approved')throw new Error('Active role assignment was not found.');const updated={...item,status:'Revoked',revokedBy:'Dr. Priya Nair',revokedAt:new Date().toISOString()};writeDemoState(KEY,rows.map(x=>x.id===id?updated:x));return {...updated};},
  canReserveAs(role,actorId){if(role!=='Student')return false;const id=actorId||actorForRole(role)?.actorId;return all().some(x=>x.personId===id&&x.personType==='Student'&&x.status==='Approved'&&x.assignment==='Secretary'&&this.clubs.includes(x.group));},
  secretaryClubs(role,actorId){if(role!=='Student')return[];const id=actorId||actorForRole(role)?.actorId;return [...new Set(all().filter(x=>x.personId===id&&x.personType==='Student'&&x.status==='Approved'&&x.assignment==='Secretary'&&this.clubs.includes(x.group)).map(x=>x.group))];},
  canRecordFormalMinutes(role,actorId){const id=actorId||actorForRole(role)?.actorId;return role==='HOD'||all().some(x=>x.personId===id&&x.personType==='Faculty'&&x.status==='Approved'&&x.assignment==='Department Meeting Recorder');},
  addFacultyPoints(input,role,actorId){if(role!=='HOD'||actorId&&actorId!==actorForRole('HOD').actorId)throw new Error('Only the HOD may review faculty development points.');const rows=all();const item=rows.find(x=>x.personType==='Faculty'&&x.personId===input.personId&&x.status==='Approved');if(!item)throw new Error('No active approved responsibility found for this faculty member.');const points=Number(input.points);if(!input.title?.trim()||!Number.isFinite(points)||points<=0||points>100)throw new Error('Enter a course title and points from 1 to 100.');const pointEntry={id:`FP-${Date.now()}`,title:input.title.trim(),points,date:new Date().toISOString().slice(0,10),status:'Approved'};const updated={...item,points:(item.points||0)+points,pointEntries:[pointEntry,...(item.pointEntries||[])]};writeDemoState(KEY,rows.map(x=>x.id===item.id?updated:x));return {...updated};},
};
