# Intelligent Student 360

A React/Vite prototype for an institutional student and department workspace. It uses deterministic browser mock data and is not connected to a production SIS, ERP, database, or identity provider.

## Local Student 360 Assistant

The app includes an optional floating assistant. Its backend retrieves relevant passages from the approved local guide in `backend/ai/knowledge/documents/`, then sends only those passages and the bounded chat context to a local Ollama server. The browser never calls Ollama. No cloud inference, API key, embedding service, or automatic model download is used.

The configured model is `qwen2.5:3b` (Qwen 2.5 3B Instruct). This machine was inspected during implementation and has `qwen3:8b`, but not the configured 3B model; that 8B model is intentionally not substituted. Until the configured model is installed and Ollama is running, the assistant reports that local AI is unavailable and offers Retry. The rest of the app remains usable.

### Install and run

1. Install [Ollama](https://ollama.com/download) and start it.
2. In a terminal, explicitly download the configured local model: `ollama pull qwen2.5:3b`.
3. Confirm it is installed with `ollama list` (expect `qwen2.5:3b`).
4. Copy `.env.example` to `.env` if you want to change settings. Defaults are `OLLAMA_BASE_URL=http://127.0.0.1:11434`, `OLLAMA_MODEL=qwen2.5:3b`, and a 60-second timeout. The model may take several GB of storage and system memory; response speed depends on available RAM/VRAM and CPU/GPU.
5. In one terminal, run `npm run server`. In another, run `npm run dev`.
6. Open the Vite URL and select **Ask AI** in the lower-right corner.

If Ollama is stopped, the model is missing, or a request times out, the assistant shows an actionable error and retry control. It never falls back to a cloud provider.

### Docker

`initialization/START_DOCKER.bat` starts both the web app and its local AI backend. The backend reaches Ollama on the host through `host.docker.internal:11434`. On systems where Ollama listens only on loopback and Docker cannot reach it, configure Ollama to listen on a host interface reachable from Docker, and restrict that interface with the host firewall to local Docker traffic. Do not expose Ollama to an untrusted network. Set `OLLAMA_MODEL` in the shell or Compose `.env` to the exact locally installed model if you intentionally choose another compatible Qwen 3B-class model. No model is pulled by Docker.

### Backend endpoints

- `GET /api/ai/status` reports whether Ollama and the configured model are available.
- `POST /api/ai/chat` accepts a message (max 2,000 characters) and at most eight prior chat turns; rate limited to 12 requests per minute per client address.
- Backend configuration stays server-side. Ollama is called only by the backend.
- Knowledge retrieval uses local lexical matching and returns source titles. Add approved content as Markdown sections to the documents directory and rebuild is automatic on each request; no vector or embedding model is required.

## Important prototype limits

- CIVORA-related audit notes and the repository were inspected. No CIVORA assistant implementation or model integration exists here; the previous assistant and retrieval services were inactive stubs.
- The role selector is a client-side **DEMO VIEW AS** switch, not authentication. There is no trusted server identity/session in this repository. Consequently, the assistant does not accept role/student identity from the browser and has no live-data tools. It cannot retrieve CGPA, attendance, bookings, requests, or meetings; its prompt explicitly treats these as unavailable. Personal-record and authorization tests cannot be satisfied until trusted authentication and backend data integrations exist.
- Do not enter confidential or identifying information. The assistant is read-only and cannot perform workflow actions.
- Conversation context lives in the open browser panel only and is not persisted or shared with the backend beyond the bounded request context.

## Existing project structure

- `src/App.jsx` and `src/` contain the role-specific prototype interface and mock workflows.
- `src/AssistantWidget.jsx` is the assistant panel.
- `backend/server.js` and `backend/ai/` contain local API, Ollama adapter, and retrieval.
- `backend/ai/knowledge/documents/` contains approved assistant source material.

Run `npm run build` to build the frontend, and `npm test` for the existing project test suite.
