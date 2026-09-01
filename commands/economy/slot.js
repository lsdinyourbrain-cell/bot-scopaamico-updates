'use strict';

const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const crypto = require('crypto');
const EV = require('../../lib/events');

module.exports = {
    name: 'slot',
    aliases: [],
    description: "Slot machine 5x3 jungle con grafica ricca.",

    async run(sock, msg, args, context) {
        const { from, sender, reply, services } = context;
        const { db, saveDB, getUser, applyTax } = services;

        const puntata = 20;
        const uDB = getUser(sender, from);
        if (uDB.money < puntata) return reply(`❌ Costa _${puntata}€_ girare la slot. Saldo attuale: _${uDB.money}€_.`);

        uDB.money -= puntata;

        // --- Logica appresa dal file fornito (5 rulli, 3 righe, pesi e paytable) ---
        const labels = ['🍒','🍋','🔔','💎','7','BAR'];
        const weights = [30,25,18,12,8,7];
        const pays = [2,3,5,8,12,20];
        const patterns = [[0,0,0,0,0],[1,1,1,1,1],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2]];

        function pick() {
            const n = Math.random()*100;
            let s=0;
            for(let i=0;i<weights.length;i++){ s+=weights[i]; if(n<s) return i; }
            return 0;
        }
        function boardValue(board, col, row){ return board[col][row]; }

        // Genera board 5x3 random pesata
        const board = Array.from({length:5}, () => Array.from({length:3}, () => pick()));
        // Calcola vincita
        let totalWin = 0;
        for(const p of patterns){
            const a = boardValue(board, 0, p[0]);
            let count=1;
            for(let x=1;x<5 && boardValue(board, x, p[x])===a; x++) count++;
            if(count>=3){
                const mult = count===3?1:count===4?2:5;
                totalWin += Math.floor(puntata * pays[a] * mult);
            }
        }
        const evMult = EV.isActive(db, from, 'slotoro') ? 3 : 1;
        totalWin = totalWin * evMult;

        const taxed = applyTax(totalWin, uDB.money);
        uDB.money += taxed.net;
        saveDB();

        const taxLine = taxed.tax > 0 ? ` (tassa ${taxed.tax}€)` : '';
        const evLine = evMult > 1 && totalWin > 0 ? `\n▸ 🎰 _Evento: vincita x${evMult}_` : '';
        const risultato = totalWin > 0 ? `🎊 Vinci ${totalWin}€!` : `💀 Hai perso ${puntata}€`;
        const frasiIronicheSlot = [
            "Sei il Robin Hood del gruppo, rubi ai poveri per dare a te stesso 😏",
            "Hai le mani più veloci di un borseggiatore a Napoli 🏃‍♂️",
            "A questo punto potresti comprare il gruppo... o rapinarlo direttamente 🏦💰",
            "Sei così ricco che la slot ti paga l'affitto 😂",
            "Hai più soldi di Paperone, ma continui a giocare come un ragazzino 🦆💸",
            "Attento, con tutto quel malloppo la Finanza ti sta già cercando 🕵️‍♂️"
        ];
        const extraRiccoSlot = uDB.money > 5000 ? `\n▸ _${frasiIronicheSlot[Math.floor(Math.random()*frasiIronicheSlot.length)]}_` : '';
        const boardStr = board[0].map((_,r) => labels[board[0][r]]+' | '+labels[board[1][r]]+' | '+labels[board[2][r]]+' | '+labels[board[3][r]]+' | '+labels[board[4][r]]).join('\n');
        const resultText =
`🎰 _[ ${board[0].map((_,r)=>r).length } ]_ 
${boardStr}
▸ ${risultato}${evLine}${extraRiccoSlot}
▸ ${totalWin > 0 ? `Lordo: _+${totalWin}€_ ▸ Netto: _+${taxed.net}€_${taxLine}\n▸ Saldo: _${uDB.money}€_` : `Saldo: _${uDB.money}€_`}
▸ Jungle Slot — 5 rulli, 5 linee`;

        // --- Invio grafica ricca IDENTICA al file fornito (nessuna modifica al payload) ---
        const slotsPayload = `<html><head><style>
*{box-sizing:border-box}html,body{margin:0;width:100%;overflow:hidden;background:transparent;font-family:Arial,sans-serif;overscroll-behavior:none}body{padding:9px;background:radial-gradient(circle at 50% 12%,#5b2d18,#160908 55%,#030202)}.machine{position:relative;overflow:hidden;padding:13px 34px 18px 13px;border:4px solid #2b0c05;border-radius:30px;background:linear-gradient(105deg,#1e0704,#8c3515 8%,#3b1008 20%,#611e0c 52%,#2b0906 82%,#9c401b 94%,#2a0b06);box-shadow:inset 0 0 0 3px #e6a139,inset 0 0 0 7px #5d210b,inset 0 20px 35px #ffb52a22,0 8px 0 #210705,0 14px 24px #000c;touch-action:none}.machine:before{content:"";position:absolute;inset:8px;border:2px solid #ffba3d;border-radius:22px;pointer-events:none;box-shadow:inset 0 0 11px #ff7b00}.lights{height:9px;margin:0 14px 8px;border:2px solid #6f2608;border-radius:8px;background:repeating-radial-gradient(circle at 6px 50%,#fffbd3 0 2px,#ffbd00 3px 5px,#641800 6px 12px);box-shadow:0 0 12px #ff8a00;animation:lights .55s steps(2) infinite}.title{padding:11px 4px 8px;border:3px solid #ffc54c;border-radius:50% 50% 11px 11px/30% 30% 10px 10px;color:#fff2a1;background:radial-gradient(ellipse at 50% 0,#12b2bc,#075165 58%,#06182a);box-shadow:inset 0 0 0 4px #74300d,inset 0 -11px 18px #001726,0 4px 0 #3b1207;text-align:center;font:25px Impact,Arial Black,sans-serif;letter-spacing:1px;text-shadow:0 3px #8f1c0c,2px 0 #8f1c0c,-2px 0 #8f1c0c}.jackpot{width:75%;margin:5px auto 8px;padding:4px;border:2px solid #ffcf5b;border-radius:10px;color:#ffe7a1;background:linear-gradient(#741523,#29060e);box-shadow:inset 0 2px 5px #ff667744;text-align:center;font:bold 10px monospace;letter-spacing:1px}.stats{display:flex;margin:0 2px 9px;padding:5px;border:2px solid #b66b20;border-radius:9px;background:linear-gradient(#210c08,#070303);box-shadow:inset 0 0 9px #000,0 3px 0 #4a1909}.stat{flex:1;border-right:1px solid #754016;color:#d6a15b;text-align:center;font:bold 10px monospace}.stat:last-child{border:0}.stat b{display:block;margin-top:2px;color:#fff0bb;font-size:15px;text-shadow:0 0 6px #f80}.frame{position:relative;padding:9px;border:5px solid #9b4e12;border-radius:18px;background:linear-gradient(90deg,#4b1c08,#ffd873 5%,#6a2709 10%,#6a2709 90%,#ffd873 95%,#421506);box-shadow:inset 0 0 0 3px #2b0d05,0 4px 0 #301005,0 8px 15px #000b}.reelbox{position:relative;display:grid;grid-template-columns:repeat(5,1fr);height:192px;overflow:hidden;border:3px solid #1d0804;border-radius:11px;background:#140604;box-shadow:inset 0 13px 20px #000,inset 0 -13px 20px #000}.reel{position:relative;overflow:hidden;border-right:2px solid #6e421e;background:linear-gradient(90deg,#a58149,#fffce4 17%,#fffdf0 50%,#f7e9bd 82%,#8e6a38);box-shadow:inset 7px 0 8px #573b1d66,inset -7px 0 8px #573b1d66}.reel:last-child{border:0}.reel:after{content:"";position:absolute;z-index:2;inset:0;pointer-events:none;background:linear-gradient(#3b1d0fbb 0,transparent 18%,transparent 80%,#281208cc 100%);box-shadow:inset 0 9px 11px #0005,inset 0 -9px 11px #0005}.strip{position:absolute;left:0;right:0;top:0;transform:translate3d(0,0,0);will-change:transform,filter}.strip.moving{filter:blur(1.4px) saturate(1.2)}.sym{height:64px;display:grid;place-items:center;border-bottom:1px solid #9f7e4f66;color:#d30f1c;font-family:Apple Color Emoji,Segoe UI Emoji,Arial Black,sans-serif;font-size:clamp(26px,8vw,40px);line-height:1;text-shadow:0 3px 0 #721018,0 0 4px #fff;transform:translateZ(0)}.sym.s4{font:900 42px Impact,Arial Black,sans-serif;color:#ef1726;-webkit-text-stroke:2px #850815;text-shadow:0 3px #5d0509,0 0 5px #fff}.sym.s5{font:900 16px Arial Black,sans-serif;color:#fff4c4;background:radial-gradient(ellipse at center,#e22d35 0,#6f0910 52%,transparent 54%);text-shadow:0 2px #401010}.sym.win{animation:win .5s ease-in-out infinite;background:radial-gradient(circle,#fff8a9,#ffae00 55%,transparent 72%)}.shine{position:absolute;z-index:3;inset:4px 8% 55%;border-radius:50%;background:linear-gradient(#fff7,transparent);pointer-events:none}.payline{position:absolute;z-index:4;left:9px;right:9px;height:3px;opacity:0;background:#fff5a1;box-shadow:0 0 7px #fff,0 0 14px #ff3d00;pointer-events:none}.payline.on{animation:line 1s ease infinite}.p0{top:20%}.p1{top:50%}.p2{top:80%}.message{height:34px;margin:9px 2px 7px;display:grid;place-items:center;border:2px solid #a55c19;border-radius:8px;color:#ffd46a;background:#150504;box-shadow:inset 0 0 8px #000;text-align:center;font:bold 14px monospace;text-shadow:0 0 7px #f60}.console{display:grid;grid-template-columns:1fr 1.7fr;gap:8px;margin:0 3px;padding:10px 9px 13px;border:3px solid #8e4914;border-radius:9px 9px 17px 17px;background:linear-gradient(#d69a49,#63300f 37%,#2a0b06 39%,#4b1509);box-shadow:inset 0 2px #ffe0a0,0 5px #1c0704,0 9px 12px #0008;transform:perspective(300px) rotateX(4deg)}button{height:53px;border:3px solid #351006;border-radius:13px;color:#fff;font-weight:900;touch-action:none}.bet{background:linear-gradient(#42c4df,#086184 53%,#03334c);box-shadow:inset 0 4px 4px #fff8,0 4px #051e2a}.spin{background:radial-gradient(circle at 50% 32%,#8aff77,#20a72d 47%,#075b17 76%);box-shadow:inset 0 4px 5px #e3ffdc,0 4px #07350e,0 0 14px #3cff4a;font-size:18px;text-shadow:0 2px #06420d}.tray{width:49%;height:19px;margin:14px auto 0;border:4px solid #48200b;border-radius:4px 4px 10px 10px;background:#090303;box-shadow:inset 0 6px 9px #000,0 3px #c47c29}.leverTrack{position:absolute;z-index:5;right:9px;top:211px;width:20px;height:150px;border:2px solid #3d1809;border-radius:13px;background:linear-gradient(90deg,#321006,#df9a39,#52200a);box-shadow:inset 0 0 5px #000}.lever{position:absolute;left:-4px;top:8px;width:28px;height:112px;transform-origin:50% 88%;transition:transform .34s cubic-bezier(.2,.8,.2,1);touch-action:none}.lever:before{content:"";position:absolute;left:11px;top:17px;width:7px;height:86px;border:2px solid #333;border-radius:4px;background:linear-gradient(90deg,#444,#fff 48%,#666 64%,#222)}.lever:after{content:"";position:absolute;left:0;width:29px;height:29px;border:3px solid #650000;border-radius:50%;background:radial-gradient(circle at 35% 25%,#fff,#ff7777 13%,#ed1720 37%,#850007 74%);box-shadow:inset -5px -6px 7px #490000,0 4px 5px #000,0 0 9px #f22}.lever.pull{transform:rotate(36deg)}.over{position:absolute;z-index:10;inset:0;display:grid;place-items:center;text-align:center;color:#ffe5a0;background:#080100ed}.over.off{display:none}.over h2{margin:0 0 8px;color:#ff3449;text-shadow:0 0 12px #f00}.over button{padding:0 22px;background:#ffd15a;color:#271204}@keyframes lights{50%{filter:brightness(1.7)}}@keyframes win{50%{transform:scale(1.09);filter:brightness(1.4)}}@keyframes line{50%{opacity:1}}
</style><style>.reelbox{display:block;height:205px;padding:0;background:#160704}
#reelCanvas{display:block;width:100%;height:100%;border-radius:8px;touch-action:none}
</style><style>body{padding:15px 13px 29px;perspective:950px}
.machine{transform-origin:50% 88%;transform:perspective(850px) rotateX(1.2deg) translateZ(0);box-shadow:inset 0 0 0 3px #f0b64b,inset 0 0 0 8px #501708,inset 14px 0 24px #ffb3421f,inset -15px 0 25px #16030199,0 9px 0 #180503,0 17px 0 #421508,0 27px 35px #000e}
.machine:after{content:"";position:absolute;z-index:-2;left:7%;right:7%;bottom:-30px;height:30px;border-radius:50%;background:radial-gradient(ellipse,#000d 0,#0008 42%,transparent 73%);filter:blur(4px)}
.title{transform:perspective(500px) rotateX(-3deg) translateZ(8px);box-shadow:inset 0 0 0 4px #74300d,inset 0 -13px 20px #001522,0 5px 0 #351006,0 10px 16px #0009}
.frame{transform:perspective(650px) rotateX(-1.5deg) translateZ(7px);box-shadow:inset 0 0 0 3px #2b0d05,inset 0 12px 13px #fff2b21c,0 6px 0 #291006,0 13px 19px #000c}
.console{transform:perspective(420px) rotateX(8deg) translateZ(5px);transform-origin:50% 0;box-shadow:inset 0 3px #ffe4ac,0 7px #1b0704,0 15px 20px #000b}
</style><style>body{background:radial-gradient(circle at 50% 8%,#1d6a50,#0f4938 48%,#07291f)!important}
.machine{border-color:#071f18!important;background:linear-gradient(110deg,#061e17,#1b644b 10%,#0b382a 24%,#15543f 54%,#092f24 82%,#28775a 94%,#071f18)!important;box-shadow:inset 0 0 0 2px #b9954d,inset 0 0 0 5px #163f31,inset 0 14px 24px #73d2a31c!important}
.machine:before{border-color:#b59349!important;box-shadow:inset 0 0 9px #4fa57a66!important}
.lights{border-color:#123d2f!important;background:repeating-radial-gradient(circle at 6px 50%,#dfffdc 0 2px,#82c878 3px 5px,#164936 6px 12px)!important;box-shadow:0 0 9px #67b881!important}
.title{border-color:#b99a54!important;color:#e9e3bc!important;background:radial-gradient(ellipse at 50% 0,#2b8a6c,#11513f 58%,#082a24)!important;box-shadow:inset 0 0 0 4px #244f3d,inset 0 -10px 17px #061e19,0 4px 0 #071d16!important;text-shadow:0 2px #193f31,2px 0 #193f31,-2px 0 #193f31!important}
.jackpot{border-color:#a98c4d!important;color:#ded7ad!important;background:linear-gradient(#245d48,#0b3025)!important;box-shadow:inset 0 2px 5px #8ed3a233!important}
.stats,.message{border-color:#537d64!important;background:linear-gradient(#102d24,#061812)!important}
.stat{border-color:#416452!important;color:#91b59f!important}.stat b,.message{color:#e3dfbb!important;text-shadow:0 0 6px #62a77d!important}
.frame{border-color:#315c47!important;background:linear-gradient(90deg,#09271e,#b49a59 5%,#174936 10%,#174936 90%,#b49a59 95%,#09271e)!important;box-shadow:inset 0 0 0 3px #071b15,0 4px 0 #09271e,0 8px 15px #000a!important}
.reelbox{border-color:#071c15!important;background:#071a14!important;box-shadow:inset 0 9px 15px #0009,inset 0 -9px 15px #0009!important}
.console{border-color:#416a53!important;background:linear-gradient(#9c8c59,#315d48 37%,#0a2e22 39%,#123e2f)!important;box-shadow:inset 0 2px #d9c992,0 5px #061d16,0 9px 12px #0008!important}
.bet{background:linear-gradient(#4f9a77,#216348 53%,#103d2d)!important;box-shadow:inset 0 4px 4px #d8ffe055,0 4px #092a20!important}
.spin{background:radial-gradient(circle at 50% 32%,#a8d96f,#4b8d46 47%,#1e542f 76%)!important;box-shadow:inset 0 4px 5px #e8ffd488,0 4px #12351e,0 0 12px #79b85c88!important}
.tray{border-color:#244d3a!important;background:#061a13!important;box-shadow:inset 0 6px 9px #000,0 3px #897945!important}
</style><style>
.payline{height:3px!important;background:linear-gradient(90deg,transparent,#dfff8a 18%,#fff5b0 50%,#7fe091 82%,transparent)!important;box-shadow:0 0 7px #efffa8,0 0 15px #65c984!important;transform:scaleX(.15);transform-origin:50% 50%}
.payline.on{opacity:1!important;animation:jungleLine 1.15s cubic-bezier(.2,.8,.2,1) infinite!important}
.machine.winner .message{animation:jungleDisplay .7s ease-in-out 2!important}
.machine.winner .lights{animation:jungleLights .22s steps(2) 6!important}
.machine.winner .title{animation:jungleTitle .7s ease-in-out 2!important}
@keyframes jungleLine{0%{transform:scaleX(.08);filter:brightness(1)}45%{transform:scaleX(1);filter:brightness(1.8)}75%,100%{transform:scaleX(1);opacity:0}}
@keyframes jungleDisplay{50%{color:#fff8bd;box-shadow:inset 0 0 14px #7ddc8a,0 0 13px #74ce82;filter:brightness(1.35)}}
@keyframes jungleLights{50%{filter:brightness(2.2) saturate(1.4)}}
@keyframes jungleTitle{50%{filter:brightness(1.35);text-shadow:0 0 12px #cfff91,0 2px #193f31}}
</style></head><body><div class="machine" id="machine"><div class="lights"></div><div class="title">FRUIT BONANZA</div><div class="jackpot">JACKPOT · 10,000 CREDITS</div><div class="stats"><div class="stat">CREDITS<b id="credits">${uDB.money}</b></div><div class="stat">BET<b id="betValue">${puntata}</b></div><div class="stat">BEST WIN<b id="best">${Math.max(0, totalWin)}</b></div></div><div class="frame"><div id="reelbox" class="reelbox"><canvas id="reelCanvas"></canvas></div><div class="shine"></div><i class="payline p0"></i><i class="payline p1"></i><i class="payline p2"></i></div><div id="message" class="message">${ totalWin>0 ? (totalWin>=puntata*20?'JACKPOT +'+totalWin:'WIN +'+totalWin) : 'YOU LOOSER' }</div><div class="console"><button id="bet" class="bet">BET +</button><button id="spin" class="spin">SPIN</button></div><div class="tray"></div><div id="over" class="over off"><div><h2>GAME OVER</h2><p>Keine Credits mehr.<br>Best Win: <b id="finalBest">0</b></p><button id="restart">NEW GAME</button></div></div></div>`;

        const slots = {
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        messageType: 1,
                        unifiedResponse: {
                            data: Buffer.from(JSON.stringify({
                                __typename: "GenAIUnifiedResponse",
                                response_id: crypto.randomUUID(),
                                sections: [{
                                    __typename: "GenAIUnifiedResponseSection",
                                    view_model: {
                                        __typename: "GenAISingleLayoutViewModel",
                                        primitive: {
                                            __typename: "FOAHtmlPrimitiveDemoDONOTUSE",
                                            trusted_sources: [],
                                            payload: slotsPayload
                                        }
                                    }
                                }]
                            })).toString("base64"),
                        },
                        contextInfo: {
                            isForwarded: true,
                            forwardOrigin: 4
                        }
                    }
                }
            }
        };

        const msgOut = generateWAMessageFromContent(from, slots, { userJid: sock.user.id });
        await sock.relayMessage(from, msgOut.message, { messageId: msgOut.key.id });
    },
};
