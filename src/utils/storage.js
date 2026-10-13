const PREFIX = 'student360.demo.';
export function readDemoState(key, fallback) { try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
}
catch {
    return fallback;
} }
export function writeDemoState(key, value) { try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
}
catch {
    return false;
} }
export function clearDemoState(key) { try {
    if (key)
        localStorage.removeItem(PREFIX + key);
    else
        Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k));
}
catch { /* Browser storage can be disabled. */ } }
