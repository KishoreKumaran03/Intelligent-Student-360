export const integrationService = {
    async load() {
        throw new Error('External integrations are not configured in this prototype.');
    },
    async write() {
        throw new Error('External integrations are not configured in this prototype.');
    },
};
