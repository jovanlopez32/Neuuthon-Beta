import x from '@whiskeysockets/baileys'
const { makeWASocket, AnyMessageContent, DisconnectReason, fetchLatestBaileysVersion, getAggregateVotesInPollMessage, makeCacheableSignalKeyStore, makeInMemoryStore, proto, useMultiFileAuthState, WAMessageContent, WAMessageKey, Browsers } = x;
import { rm } from 'fs';
import { sendMessageWTyping } from './functions/SendMessage.js';
import { wordsFoundInText } from './functions/WordsFoundInText.js';
import { processAI } from './functions/ProcessAI.js';
import { numberInArray } from './functions/NumberInArray.js';
import { readFile } from 'fs/promises';
import { Worker } from 'worker_threads';
const file = await readFile('./prompts/prompt.json', 'utf-8')


/* Get the prompts.json */
const prompts = JSON.parse(file)
/* Creamos un array de objetos para checar las solicitudes que tenemos */
let queriesAI = new Array();
/* Creamos una variable para poner el prompt a cada consulta depende lo que trate */
let promptSelect = '';
/* Creamos una bandera para checar si hay un proceso activo */
let processFlag = false
let wss;

function removeQuery () {
    queriesAI.shift();
}

function checkQueries () {
    setInterval(() => {
        if( queriesAI.length > 0 && processFlag == false) {
            //console.log("Process in queue: " + queriesAI.length);
            processAI(queriesAI[0].prompt, queriesAI[0].query, queriesAI[0].to_phone)
        } 
    }, 1000)  
}

function setProcessFlag(value) {    processFlag = value;    }
function getProcessFlag () {    return processFlag; }


/* Start: WhatsApp Socket */
const startSock = async () => { 

    const { state, saveCreds } = await useMultiFileAuthState("wss_auth_info");
    const { version, isLatest } = await fetchLatestBaileysVersion();

    console.log("{ version: (" + version + "), isLatest: " + isLatest + " }");

    const sock = makeWASocket({
		version,
		printQRInTerminal: true,
		browser: Browsers.macOS('Desktop'),
		auth: state,
		generateHighQualityLinkPreview: true,
	});

    /* Back to connect if the connection needs update. */
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if(connection === 'close') {
            if(lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                startSock();
            } else {
                console.log("Connection closed. Reconnecting...");
                rm("wss_auth_info", {recursive: true}, (err) => {
                    if (err && err.code == "ENOENT") {
                        console.log("Folder doesn't exist, won't remove it.");
                    } else if(err) {
                        console.log("Error occurred while trying to remove folder.");
                    }
                });
                startSock();
            }
        }
        /* Put the sock variable in global variable */
        wss = sock;
        sock.ev.on("creds.update", async () => {
            await saveCreds();
        });
    });

    /* Listeners Process */
    sock.ev.process(
        async (events) => {
            /* received a new message */ 
            if (events['messages.upsert']) {
                const upsert = events['messages.upsert']
				//console.log('recv messages ', JSON.stringify(upsert, undefined, 2))
				if(upsert.type === 'notify') {
					for(const msg of upsert.messages) {
						if(!msg.key.fromMe) {
                            //Here we save the content of the received message.
                            //console.log(msg.message.extendedTextMessage.text);
                            let messageReceived = '';

                            if(msg.hasOwnProperty('message')) {
                                /* Check if is a personal chat */
                                if(msg.message.hasOwnProperty('extendedTextMessage'))
                                    messageReceived = msg.message.extendedTextMessage.text;
                                /* Check if is a group chat */
                                if(msg.message.hasOwnProperty('conversation'))
                                    messageReceived = msg.message.conversation;
                            }
                            
                            
                            //Check if the message is an AI query.
                            //if(messageReceived.startsWith('#')){

                            await sock.readMessages([msg.key]);
                            
                            /* Checamos si ese IDNUMBER ya tiene una peticion */
                            if(!numberInArray(msg.key.remoteJid, queriesAI)){

                                /* Checamos que prompt vamos a poner */
                                if(wordsFoundInText(messageReceived, ["Jorge Argamasilla", "Argamasilla Silvestre", "Cofundador de neuuni", "Fundador de neuuni"]))
                                    promptSelect = prompts.Pjorge_argamasilla;

                                if(wordsFoundInText(messageReceived, ["Margarita Silvestre", "Margarita Oramas", "Silvestre Oramas", "Rectora de Neuuni Universidad", "Fundadora de Neuuni Universidad"]))
                                    promptSelect = prompts.Pmargarita_silvestre;

                                if(wordsFoundInText(messageReceived, ["José Zilberstein", "Director de Neuuni", "Director actual de neuuni", "José Zilberstein Toruncha", "José Toruncha", "Jose Zilberstein"]))
                                    promptSelect =prompts.Pjose_zilberstein

                                if(wordsFoundInText(messageReceived, ["Neuuni", "Neuuni Universidad", "Universidad Neuuni"]))
                                    promptSelect = prompts.Pneuuni_Universidad
                                
                                if(wordsFoundInText(messageReceived, ["Axel Salas", "Axel Salas Camacho"]))
                                    promptSelect = prompts.Paxel_salas

                                if(wordsFoundInText(messageReceived, ["Dante Larrauri", "Carlos Dante Larrauri Solano"]))
                                    promptSelect = prompts.Pdante_larrauri

                                if(wordsFoundInText(messageReceived, ["Jovan Lopez", "Jorge Jovan Liñan Lopez"]))
                                    promptSelect = prompts.Pjovan_lopez

                                queriesAI.push({ "prompt": promptSelect, "query": messageReceived, "to_phone": msg.key.remoteJid });

                                promptSelect = "";

                                sendMessageWTyping({ text: 'Tu solicitud está en proceso 🤗, dame un momento.\nNo tardo 🌎🚀' }, msg.key.remoteJid);
                                
                            } else {
                                sendMessageWTyping({ text: 'Porfavor espera a que terminemos de procesar tu última solicitud.' }, msg.key.remoteJid);
                            }
                               
                        
                                //await sendMessageWTyping({ text: messageReceived }, msg.key.remoteJid);
                            //}  
                            
                            
						}
					}
				}
            }
        }
    );
}

startSock();
checkQueries();
/* Export the socket */
export { wss };
export { removeQuery }
export { setProcessFlag, getProcessFlag }