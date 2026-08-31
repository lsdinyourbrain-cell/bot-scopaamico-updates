'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const { getFfmpegPath, isFfmpegVerified } = require('../../lib/ffmpeg-path');

module.exports = {
    name: 'diagnostica',
    aliases: ['diag', 'testbot'],
    description: "Diagnostica il sistema del bot (solo Owner): ffmpeg, yt-dlp, conversione audio e video.",

    async run(sock, msg, args, context) {
        const { from, reply, services } = context;
        if (!context.isOwner) {
            return reply(`${sec('ACCESSO NEGATO')}
${boxOpen()}
${line('Comando riservato')}
${line("all'Owner del bot.")}
${boxEnd()}`);
        }

        await reply('🩺 *Diagnostica in corso...* (un attimo)');

        const out = [];
        const add = (label, ok, detail) => {
            out.push(`▸ ${ok ? '✅' : '❌'} _${label}_${detail ? ` — ${String(detail).trim().slice(0, 400)}` : ''}`);
        };

        const runSh = async (label, script) => {
            try {
                const { stdout, stderr } = await execFileAsync('sh', ['-c', script + ' 2>&1'], { timeout: 25000, maxBuffer: 1024 * 1024 });
                const first = String(stdout || '').trim().split('\n').slice(0, 3).join('\n');
                add(label, true, first || '(nessun output)');
            } catch (e) {
                add(label, false, String(e.stdout || e.stderr || e.message || '').trim().slice(0, 400) || 'comando non trovato');
            }
        };

        // 1) Ambiente base
        add('Node.js', true, process.version);
        add('Termux/Android', true, process.env.ANDROID_ROOT ? 'sì (Android)' : 'no');
        const resolved = getFfmpegPath();
        add('ffmpeg risolto dal bot', isFfmpegVerified(), `${resolved} ${isFfmpegVerified() ? '(verificato)' : '(NON verificato)'}`);

        // 2) Binari di sistema
        await runSh('ffmpeg (posizione)', 'command -v ffmpeg || which ffmpeg || echo NON TROVATO');
        await runSh('ffmpeg (versione)', 'ffmpeg -version');
        await runSh('ffprobe (posizione)', 'command -v ffprobe || which ffprobe || echo NON TROVATO');
        await runSh('yt-dlp (versione)', 'yt-dlp --version');

        // 3) Test reale: conversione di un tono in mp3 (riproduce l'errore
        //    "conversione fallita" se ffmpeg o libmp3lame sono rotti)
        const tmpMp3 = path.join(os.tmpdir(), `diag-${Date.now()}.mp3`);
        try {
            await execFileAsync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1', '-c:a', 'libmp3lame', '-q:a', '9', tmpMp3], { timeout: 30000 });
            const size = fs.existsSync(tmpMp3) ? fs.statSync(tmpMp3).size : 0;
            add('conversione audio -> mp3', size > 0, size > 0 ? `ok (${size} byte)` : 'file vuoto');
        } catch (e) {
            add('conversione audio -> mp3', false, String(e.stderr || e.message || '').trim().slice(0, 400));
        } finally {
            try { fs.unlinkSync(tmpMp3); } catch (_) {}
        }

        // 4) Test reale: merge/rimux video (serve per i video .mp4)
        const tmpIn = path.join(os.tmpdir(), `diag-${Date.now()}.mp4`);
        const tmpOut = path.join(os.tmpdir(), `diag-${Date.now()}-out.mp4`);
        try {
            await execFileAsync('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'testsrc=duration=1:size=160x90:rate=10', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', tmpIn], { timeout: 60000 });
            await execFileAsync('ffmpeg', ['-y', '-i', tmpIn, '-c', 'copy', tmpOut], { timeout: 60000 });
            const size = fs.existsSync(tmpOut) ? fs.statSync(tmpOut).size : 0;
            add('creazione/merge video -> mp4 h264', size > 0, size > 0 ? `ok (${size} byte)` : 'file vuoto');
        } catch (e) {
            add('creazione/merge video -> mp4 h264', false, String(e.stderr || e.message || '').trim().slice(0, 400));
        } finally {
            try { fs.unlinkSync(tmpIn); } catch (_) {}
            try { fs.unlinkSync(tmpOut); } catch (_) {}
        }

        // 5) Salva il report e invialo
        const report = out.join('\n');
        try {
            fs.mkdirSync(path.join(services.projectDir, 'logs'), { recursive: true });
            fs.writeFileSync(path.join(services.projectDir, 'logs', 'diagnostica.txt'), report + '\n', 'utf-8');
        } catch (_) {}

        const header = `🩺 *_Diagnostica del bot_*\n\n`;
        const chunks = [];
        let current = header;
        for (const line of out) {
            if (current.length + line.length + 1 > 3800) { chunks.push(current); current = ''; }
            current += line + '\n';
        }
        if (current) chunks.push(current);
        chunks[chunks.length - 1] = chunks[chunks.length - 1].trimEnd() + '\n\n📄 _Report salvato in logs/diagnostica.txt_\n';
        for (const c of chunks) {
            await sock.sendMessage(from, { text: c }, { quoted: msg });
        }
    },
};