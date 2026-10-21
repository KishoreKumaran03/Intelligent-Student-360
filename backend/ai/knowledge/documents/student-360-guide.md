---
title: Student 360 prototype guide
audience: all
---
# Student 360 prototype guide

Student 360 is a browser-based institutional workspace prototype. It presents role-specific workspaces for students, tutors, faculty, HODs, and office staff. The current repository uses deterministic mock data in the browser. It is not connected to a production student information system, institutional database, or live identity provider.

## Finding features

Use the left navigation to open the pages available to the selected demo role. Students can find My Academics, My Attendance, My Results, My Competencies, Lab Bookings (Resources), Meetings, My Requests, My Projects, My Activities, My Journey, Events & Competitions, and Placement. The top search is a student directory search for staff views; it is not a universal help search.

## Lab and resource bookings

Open Resources from the navigation and review the available resources and slots. Booking controls and permissions are part of the normal application workflow. The assistant is read-only and cannot place or approve a booking. This prototype's records are mock data; confirm operational instructions with the institution before relying on them.

## Requests and approvals

Open My Requests (student) or Requests & Approvals (staff) to review the requests available in the current demo view. Students submit requests through the request form; authorized staff review them through the application workflow. A student cannot approve their own request. The assistant cannot submit, modify, or approve requests.

## Meetings

Students can open Meetings and request a meeting with their assigned tutor using the meeting form. Staff meeting controls depend on their demo role. The assistant can explain navigation but cannot schedule or change a meeting.

## Academic and development information

Students can open My Academics, My Attendance, and My Results for academic views, and My Competencies, My Projects, My Activities, and My Journey for development views. Values in this prototype are demonstration records, not verified institutional records. The assistant does not retrieve personal academic records.

## Demo roles and privacy

The role selector is labeled DEMO VIEW AS. It is a client-side demonstration switch, not authentication. The current application has no trusted server identity or session authorization. No student-specific data, staff notes, request details, or departmental records are provided to the assistant. Do not enter confidential or identifying information into the assistant.
