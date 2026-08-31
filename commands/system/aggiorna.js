'use strict';

const { sec, boxOpen, boxEnd, line, cmd } = require('../../lib/ui');

const fs = require('fs');
const os = require('os');
const path = require('path');

const UPDATE_REPO_BRANCH = 'master';
const UPDATE_REPO_URL = 'https://github.com/lsdinyourbrain-cell/bot-scopaamico-updates.git';

async function runGit(execFileAsync, cwd, args) {
    const { stdout, stderr } = await execFileAsync('git', args, {
        cwd,
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
    });
    return { stdout: String(stdout || ''), stderr: String(stderr || '') };
}

module.exports = {
    name: 'aggiorna',
    aliases: ['update', 'aggiornamento'],
    description: "Controlla se ci sono aggiornamenti sul repo e li applica, poi riavvia il bot.",

    async run(sock, msg, args, context) {
        const { from, reply, services } = context;
        const { execFileAsync, sameJid, ownerNumber } = services;
        const projectDir = context.services.projectDir;

        if (!context.isOwner) {
            return reply(`${sec('ACCESSO NEGATO')}
${boxOpen()}
${line('Comando riservato')}
${line("all'Owner del bot.")}
${boxEnd()}`);
        }

        // 1) Verifica che la cartella sia un repo git
        try {
            const { stdout } = await runGit(execFileAsync, projectDir, ['rev-parse', '--is-inside-work-tree']);
            if (String(stdout).trim() !== 'true') throw new Error('non-repo');
        } catch (_) {
            return reply(`${sec('ERRORE')}
${boxOpen()}
${line('La cartella del bot non è un repo Git. Su Termux esegui: \`git init\` \`git remo...')}
${boxEnd()}`);
        }

        // 1b) Imposta sempre il remote ufficiale, così il bot scarica SEMPRE
        //     il codice giusto anche se origin punta a un repo vecchio/diverso.
        try {
            await runGit(execFileAsync, projectDir, ['remote', 'set-url', 'origin', UPDATE_REPO_URL]);
        } catch (_) {}

        await reply("🔍 *Controllo aggiornamenti...*");

        // 2) Fetch del ramo remoto
        try {
            await runGit(execFileAsync, projectDir, ['fetch', 'origin', UPDATE_REPO_BRANCH]);
        } catch (e) {
            console.error('[aggiorna] fetch fallito:', e.message);
            return reply("❌ Non riesco a contattare il repository GitHub.\nControlla la connessione internet.");
        }

        // 3) Confronto hash locale vs remoto
        let localHead, remoteHead;
        try {
            ({ stdout: localHead } = await runGit(execFileAsync, projectDir, ['rev-parse', 'HEAD']));
            ({ stdout: remoteHead } = await runGit(execFileAsync, projectDir, ['rev-parse', 'FETCH_HEAD']));
            localHead = localHead.trim();
            remoteHead = remoteHead.trim();
        } catch (e) {
            console.error('[aggiorna] rev-parse fallito:', e.message);
            return reply("❌ Impossibile leggere lo stato del repo. Prova più tardi.");
        }

        if (localHead === remoteHead) {
            // Anche se gli hash coincidono, ripulisci eventuali file vecchi
            // NON tracciati da git (es. codice di un altro progetto rimasto
            // nella cartella): potrebbero causare errori come il bug Last.fm.
            try {
                await runGit(execFileAsync, projectDir, ['clean', '-fd', '-e', 'node_modules', '-e', '.env', '-e', 'auth_info_baileys', '-e', 'data', '-e', 'temp', '-e', 'logs']);
            } catch (_) {}
            return reply(
`✨ *_TUTTO AGGIORNATO_*
▸ ✅ Il bot è già alla
  versione più recente!
▸ 🔖 Build attuale:
  \`${localHead.slice(0, 7)}\`
▸ 🚀 Non c'è nulla di nuovo,
  ma la qualità è sempre
  al massimo. 💎
`);
        }

        // 4) Changelog dei nuovi commit
        let changelog = '';
        try {
            const { stdout } = await runGit(execFileAsync, projectDir, ['log', '--no-merges', '--oneline', `${localHead}..${remoteHead}`]);
            changelog = stdout.trim();
        } catch (_) {}

        // 5) Controlla se package.json è cambiato (serve npm install)
        let depsChanged = false;
        try {
            const { stdout } = await runGit(execFileAsync, projectDir, ['diff', '--name-only', localHead, remoteHead]);
            depsChanged = String(stdout).split('\n').some(f => f.trim() === 'package.json');
        } catch (_) {}

        // 6) Verifica sintassi dei file .js nuovi PRIMA di applicare
        let changedJs = [];
        try {
            const { stdout } = await runGit(execFileAsync, projectDir, ['diff', '--name-only', localHead, remoteHead]);
            changedJs = String(stdout).split('\n').map(f => f.trim()).filter(f => f.endsWith('.js'));
        } catch (_) {}

        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aggiorna-'));
        let syntaxBroken = null;
        try {
            for (const file of changedJs) {
                const { stdout } = await runGit(execFileAsync, projectDir, ['show', `${remoteHead}:${file}`]);
                const tmpFile = path.join(tmpDir, path.basename(file));
                fs.writeFileSync(tmpFile, stdout, 'utf-8');
                try {
                    await execFileAsync('node', ['--check', tmpFile]);
                } catch (e) {
                    syntaxBroken = file;
                    break;
                }
            }
        } catch (_) {}
        fs.rmSync(tmpDir, { recursive: true, force: true });

        if (syntaxBroken) {
            return reply(`❌ *Aggiornamento bloccato.*\n\n▸ Il file \`${syntaxBroken}\` nella nuova versione ha errori di sintassi.\n▸ Non ho applicato nulla.`);
        }

        // 7) Info aggiornamento
        const shortRemote = remoteHead.slice(0, 7);
        const infoParts = [
            '📦 *_Nuovo aggiornamento disponibile!_*',
            '',
            changelog ? `▸ 📝 *Modifiche:*\n${changelog}` : '▸ 📝 Nessun commit dettagliato.',
            `▸ 🔄 Applico la versione \`${shortRemote}\`...`,
        ];
        if (depsChanged) infoParts.push('▸ 📥 Installerò anche le nuove dipendenze.');
        infoParts.push('', '');
        await reply(infoParts.join('\n'));

        // 8) Applica la versione remota
        try {
            await runGit(execFileAsync, projectDir, ['reset', '--hard', remoteHead]);
            // Rimuovi eventuali file vecchi non tracciati (codice orfano),
            // preservando dati e dipendenze.
            await runGit(execFileAsync, projectDir, ['clean', '-fd', '-e', 'node_modules', '-e', '.env', '-e', 'auth_info_baileys', '-e', 'data', '-e', 'temp', '-e', 'logs']);
        } catch (e) {
            console.error('[aggiorna] reset fallito:', e.message);
            return reply("❌ Errore nell'applicazione dell'aggiornamento. Riprova.");
        }

        // 9) npm install se serve
        if (depsChanged) {
            await reply('📥 *Installazione dipendenze...* (potrebbe volerci qualche minuto)');
            try {
                await execFileAsync('npm', ['install', '--legacy-peer-deps', '--no-audit', '--no-fund'], {
                    cwd: projectDir,
                    timeout: 600000,
                    maxBuffer: 10 * 1024 * 1024,
                });
            } catch (e) {
                console.error('[aggiorna] npm install fallito:', e.message);
                return reply(`${sec('ERRORE')}
${boxOpen()}
${line('Aggiornamento applicato ma *npm install* è fallito. Esegui a mano: \`npm insta...')}
${boxEnd()}`);
            }
        }

        // 10) Segna la conferma da inviare dopo il riavvio
        try {
            fs.writeFileSync(
                path.join(projectDir, '.restart-msg.json'),
                JSON.stringify({
                    from,
                    message: `🔄 *_Aggiornamento completato e bot riavviato._*\n\n▸ Nuova versione: \`${shortRemote}\`\n▸ ✅ Bot operativo.\n\n`,
                }),
                'utf-8'
            );
        } catch (_) {}

        // 10b) Riavvia anche la dashboard se è in esecuzione
        try {
            const dashDir = path.join(projectDir, 'dashboard');
            const dashRestart = path.join(dashDir, '.restart');
            const dashPidFile = path.join(dashDir, '.pid');
            // Segnala restart via file (la dashboard lo watcherà e uscirà)
            try { fs.writeFileSync(dashRestart, String(Date.now()), 'utf-8'); } catch (_) {}
            // Prova a terminare il vecchio processo dashboard
            try {
                if (fs.existsSync(dashPidFile)) {
                    const pid = Number(String(fs.readFileSync(dashPidFile, 'utf-8')).trim());
                    if (pid && pid !== process.pid) {
                        try { process.kill(pid, 'SIGTERM'); } catch (_) {}
                        console.log(`[aggiorna] Dashboard PID ${pid} terminato`);
                    }
                }
            } catch (_) {}
            // Riavvia dashboard in background (detached) dopo un attimo
            setTimeout(() => {
                try {
                    const { spawn } = require('child_process');
                    const child = spawn(process.execPath, [path.join(dashDir, 'server.js')], {
                        cwd: projectDir,
                        detached: true,
                        stdio: 'ignore',
                        env: { ...process.env },
                    });
                    child.unref();
                    console.log('[aggiorna] Dashboard riavviata in background');
                } catch (e) { console.error('[aggiorna] Dashboard restart fallito:', e.message); }
            }, 1200);
        } catch (e) { console.error('[aggiorna] Dashboard restart errore:', e.message); }

        await reply('✅ *Aggiornamento applicato.*\n▸ Riavvio bot + dashboard in corso... torno operativo tra qualche secondo. 🔄');
        setTimeout(() => process.exit(0), 1500);
    },
};
