'use strict';

const normalizeJid = jid => typeof jid === 'string' ? jid.trim().replace(/:\d+(?=@)/, '') : '';

const sameJid = (first, second) => {
    const a = normalizeJid(first);
    const b = normalizeJid(second);
    return Boolean(a && b && a === b);
};

const isAdminParticipant = (participant, jid) => {
    if (!['admin', 'superadmin'].includes(participant?.admin)) return false;
    return [participant.id, participant.jid, participant.lid, participant.phoneNumber]
        .filter(Boolean)
        .some(participantJid => sameJid(participantJid, jid));
};

async function getGroupAdminState(sock, groupJid, senderJids) {
    const metadata = await sock.groupMetadata(groupJid);
    const participants = Array.isArray(metadata?.participants) ? metadata.participants : [];
    const isAdmin = jids => jids.filter(Boolean)
        .some(jid => participants.some(participant => isAdminParticipant(participant, jid)));

    return {
        isBotAdmin: isAdmin([sock.user?.id, sock.user?.lid]),
        isSenderAdmin: isAdmin(senderJids),
    };
}

module.exports = { getGroupAdminState, normalizeJid, sameJid };
