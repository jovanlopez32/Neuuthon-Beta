import { wss } from "../server.js";
import { delay } from "@whiskeysockets/baileys";

export const sendMessageWTyping = async(msg, jid) => {
    await wss.presenceSubscribe(jid)
    await delay(500)
    await wss.sendPresenceUpdate('composing', jid)
    await delay(2000)
    await wss.sendPresenceUpdate('paused', jid)
    await wss.sendMessage(jid, msg)
};