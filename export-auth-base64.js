const fs = require('fs');
const path = require('path');
const AUTH_DIR = path.join(__dirname, 'auth_info_baileys');

if (!fs.existsSync(AUTH_DIR)) {
    console.log('[-] auth_info_baileys/ non trovato. Avvia il bot e scansiona il QR prima.');
    process.exit(1);
}

const files = {};
const entries = fs.readdirSync(AUTH_DIR, { withFileTypes: true });
for (const entry of entries) {
    if (entry.isFile()) {
        const fp = path.join(AUTH_DIR, entry.name);
        files[entry.name] = fs.readFileSync(fp, 'utf-8');
    }
}

const json = JSON.stringify(files);
const base64 = Buffer.from(json).toString('base64');
console.log(base64);
