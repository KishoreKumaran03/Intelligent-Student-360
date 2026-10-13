import { readDemoState, writeDemoState } from '../utils/storage';
const KEY = 'jobs';
const listeners = new Set();
const processors = new Map();
const safeStatuses = { queued: ['running', 'cancelled'], running: ['succeeded', 'failed', 'cancelled'], succeeded: [], failed: ['queued'], cancelled: [] };
const jobs = () => readDemoState(KEY, []);
function emit(job) { for (const listener of listeners)
    listener(job); }
export const jobService = {
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    list() { return jobs(); },
    get(id) { return jobs().find(job => job.id === id) || null; },
    create(kind) { const now = new Date().toISOString(); const job = { id: crypto.randomUUID(), kind, status: 'queued', progress: 0, createdAt: now, updatedAt: now, attempt: 0 }; writeDemoState(KEY, [job, ...jobs()]); emit(job); return job; },
    transition(id, status, patch = {}) { const current = jobs(); const job = current.find(x => x.id === id); if (!job)
        throw new Error(`Job ${id} was not found`); if (!safeStatuses[job.status].includes(status))
        throw new Error(`Cannot move job from ${job.status} to ${status}`); const updated = { ...job, ...patch, status, updatedAt: new Date().toISOString() }; writeDemoState(KEY, current.map(x => x.id === id ? updated : x)); emit(updated); return updated; },
    async run(kind, processor, onProgress) { let job = this.create(kind); processors.set(job.id, processor); job = this.transition(job.id, 'running', { attempt: job.attempt + 1 }); try {
        for (const progress of [15, 38, 62, 84]) {
            await new Promise(resolve => setTimeout(resolve, 90));
            onProgress?.(progress);
            const latest = this.get(job.id);
            if (latest?.status === 'cancelled')
                throw new Error('Job cancelled');
        }
        const result = await processor();
        job = this.transition(job.id, 'succeeded', { progress: 100, resultId: crypto.randomUUID() });
        processors.delete(job.id);
        return { job, result };
    }
    catch (error) {
        if (this.get(job.id)?.status === 'cancelled') {
            processors.delete(job.id);
            throw error;
        }
        job = this.transition(job.id, 'failed', { error: error instanceof Error ? error.message : 'Processing failed' });
        throw Object.assign(error instanceof Error ? error : new Error('Processing failed'), { job });
    } },
    retry(id) { const job = this.get(id); if (!job || job.status !== 'failed')
        throw new Error('Only failed jobs can be retried'); return this.transition(id, 'queued', { progress: 0, error: undefined, attempt: job.attempt }); },
    async retryAndRun(id, onProgress) { const processor = processors.get(id); if (!processor)
        throw new Error('The original processor is no longer available in this browser session.'); let job = this.retry(id); job = this.transition(id, 'running', { attempt: job.attempt + 1 }); try {
        for (const progress of [15, 38, 62, 84]) {
            await new Promise(resolve => setTimeout(resolve, 90));
            onProgress?.(progress);
            if (this.get(id)?.status === 'cancelled')
                throw new Error('Job cancelled');
        }
        const result = await processor();
        job = this.transition(id, 'succeeded', { progress: 100, resultId: crypto.randomUUID() });
        processors.delete(id);
        return { job, result };
    }
    catch (error) {
        if (this.get(id)?.status === 'cancelled')
            throw error;
        job = this.transition(id, 'failed', { error: error instanceof Error ? error.message : 'Processing failed' });
        throw Object.assign(error instanceof Error ? error : new Error('Processing failed'), { job });
    } },
    cancel(id) { return this.transition(id, 'cancelled'); }
};
