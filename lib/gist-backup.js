'use strict';

const axios = require('axios');

const GIST_API = 'https://api.github.com/gists';

let config = {};

const init = (gistId, token) => {
    config = { gistId, token };
};

const upload = async (data) => {
    if (!config.gistId || !config.token) return false;
    try {
        await axios.patch(`${GIST_API}/${config.gistId}`, {
            files: { 'database.json': { content: JSON.stringify(data, null, 2) } },
        }, {
            headers: {
                Authorization: `Bearer ${config.token}`,
                'Content-Type': 'application/json',
            },
            timeout: 15000,
        });
        return true;
    } catch (e) {
        console.error('[GIST] Errore upload:', e.response?.data?.message || e.message);
        return false;
    }
};

const download = async () => {
    if (!config.gistId || !config.token) return null;
    try {
        const res = await axios.get(`${GIST_API}/${config.gistId}`, {
            headers: { Authorization: `Bearer ${config.token}` },
            timeout: 15000,
        });
        const content = res.data?.files?.['database.json']?.content;
        return content ? JSON.parse(content) : null;
    } catch (e) {
        console.error('[GIST] Errore download:', e.response?.data?.message || e.message);
        return null;
    }
};

const uploadAuth = async (authFiles) => {
    if (!config.gistId || !config.token) return false;
    try {
        await axios.patch(`${GIST_API}/${config.gistId}`, {
            files: { 'auth_backup.json': { content: JSON.stringify(authFiles) } },
        }, {
            headers: {
                Authorization: `Bearer ${config.token}`,
                'Content-Type': 'application/json',
            },
            timeout: 15000,
        });
        return true;
    } catch (e) {
        console.error('[GIST] Errore upload auth:', e.response?.data?.message || e.message);
        return false;
    }
};

const downloadAuth = async () => {
    if (!config.gistId || !config.token) return null;
    try {
        const res = await axios.get(`${GIST_API}/${config.gistId}`, {
            headers: { Authorization: `Bearer ${config.token}` },
            timeout: 15000,
        });
        const content = res.data?.files?.['auth_backup.json']?.content;
        return content ? JSON.parse(content) : null;
    } catch (e) {
        console.error('[GIST] Errore download auth:', e.response?.data?.message || e.message);
        return null;
    }
};

const clearAuth = async () => {
    if (!config.gistId || !config.token) return false;
    try {
        await axios.patch(`${GIST_API}/${config.gistId}`, {
            files: { 'auth_backup.json': { content: '{}' } },
        }, {
            headers: {
                Authorization: `Bearer ${config.token}`,
                'Content-Type': 'application/json',
            },
            timeout: 15000,
        });
        console.log('[GIST] Backup auth cancellato (sessione scaduta).');
        return true;
    } catch (e) {
        console.error('[GIST] Errore cancellazione auth:', e.response?.data?.message || e.message);
        return false;
    }
};

module.exports = { init, upload, download, uploadAuth, downloadAuth, clearAuth };
