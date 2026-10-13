# Intelligent Student 360

A standalone React prototype for a connected institutional student and department workspace. It uses deterministic mock data only and does not connect to CIVORA, an ERP, SIS, LMS, external API, production database, prediction model, or AI assistant.

## Run locally

```sh
npm install
npm run dev
```

The role switcher is a development demo context. It is not authentication or authorization.

## Structure

- `src/App.jsx` — responsive shell, role-specific navigation, dashboard, connected workspaces, student profile, evidence drawer, and mock interactions.
- `src/data/mock.js` — student, case, meeting, request, opportunity, evidence, and role navigation records.
- `src/services/` — explicit integration seams for future authorization, institutional integrations, prediction, and AI. Each is an inactive stub.
- `src/styles.css` — responsive visual system with light/dark mode.

## Demo paths

- HOD: Command Centre → student → evidence → case status → roadmap → meeting → follow-up action.
- Student: personal dashboard → journey → competency gaps → mentor meeting → requests/events.
- Event: participant matching summary → generated OD queue → simulated tutor approval → audit feedback.
- Opportunity: required competencies → surfaced candidate context and workload → human review.
- Data: sample CSV → preview → column mapping → validation → simulated processing summary.

All workflow updates are local demonstration state. Attendance changes, approval decisions, and record updates do not reach an institutional system. No forecasting, predictive model, AI copilot, RAG, or external live intelligence is implemented.

## CIVORA transfer notes

The read-only reference project at `Practice Projects/Data Visualization` uses React/Vite, Recharts, reusable chart components, stateful filters, interactive drill-down, export utilities, and a preview-to-column-mapping ingestion path. Student 360 transfers those generic patterns with student, attendance, course, competency, and activity dimensions. No retail concepts or CIVORA source files are included here.
