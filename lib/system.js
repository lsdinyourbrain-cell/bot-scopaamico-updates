'use strict';

const os = require('os');

const getCpuSnapshot = () => os.cpus().reduce((snapshot, cpu) => {
    const times = cpu.times || {};
    snapshot.idle += times.idle || 0;
    snapshot.total += Object.values(times).reduce((total, value) => total + value, 0);
    return snapshot;
}, { idle: 0, total: 0 });

// os.loadavg() è sempre zero su Windows: usiamo il delta delle CPU reali.
const getCpuUsage = (sampleMs = 500) => new Promise(resolve => {
    const start = getCpuSnapshot();
    setTimeout(() => {
        const end = getCpuSnapshot();
        const totalDelta = end.total - start.total;
        if (totalDelta <= 0) return resolve(null);
        const usage = (1 - (end.idle - start.idle) / totalDelta) * 100;
        resolve(Math.max(0, Math.min(100, usage)));
    }, sampleMs);
});

async function getSysInfo(cpuUsagePromise = getCpuUsage()) {
    const totalBytes = os.totalmem();
    const usedBytes = totalBytes - os.freemem();
    const uptimeSeconds = process.uptime();
    const cpus = Array.isArray(os.cpus()) ? os.cpus() : [];
    const processMemory = process.memoryUsage();
    const cpuUsage = await cpuUsagePromise;
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);

    // Android/Termux: os.cpus() può essere vuoto e availableParallelism() può
    // non essere supportato o restituire valori strani.
    let cpuCores = 'N/D';
    try {
        cpuCores = os.availableParallelism ? String(os.availableParallelism()) : String(cpus.length);
    } catch (_) {
        cpuCores = cpus.length ? String(cpus.length) : 'N/D';
    }

    let cpuModel = 'Sconosciuto';
    try {
        cpuModel = cpus[0]?.model?.replace(/\s+/g, ' ').trim() || 'Sconosciuto';
        if (cpuModel === 'Sconosciuto' && os.arch() === 'arm64') cpuModel = 'ARM64';
    } catch (_) {}

    // Rilevamento Android/Termux
    const isAndroid = String(process.env.TERMUX_VERSION || '').length > 0 || os.type().toLowerCase().includes('android');
    const platform = isAndroid
        ? `Android/Termux (${os.arch()})`
        : `${os.type()} ${os.release()} (${os.arch()})`;

    return {
        ramUsed: (usedBytes / 1024 ** 3).toFixed(2),
        ramTotal: (totalBytes / 1024 ** 3).toFixed(2),
        ramPercent: ((usedBytes / totalBytes) * 100).toFixed(1),
        cpu: cpuUsage === null ? 'N/D' : `${cpuUsage.toFixed(1)}%`,
        cpuModel,
        cpuCores,
        processRam: (processMemory.rss / 1024 ** 2).toFixed(1),
        heapUsed: (processMemory.heapUsed / 1024 ** 2).toFixed(1),
        uptime: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
        platform,
        node: process.version,
    };
}

module.exports = { getCpuUsage, getSysInfo };
