import { parentPort } from 'worker_threads';
import * as cp from 'child_process'
import { wordsFoundInText } from './WordsFoundInText.js';

function processAI (prompt, message, to_phone) {    
    cp.exec(
        `./llama.cpp/main -ngl 32 -m ./llama.cpp/models/openhermes-2-mistral-7b.Q4_K_M.gguf --color -c 2048 --temp 0.7 --repeat_penalty 1.1 -n -1 -p "<|im_start|>system \n ${prompt}. Eres un asistente de IA desarrollado por Neuuni Universidad. Tu nombre es Nevil. Si no tienes conocimiento o información sobre la consulta solicitada, informa que no contienes esos datos. No tienes permitido inventar información. Trata de incluir emojis en cada respuesta. <|im_end|>. \n <|im_start|>user \n ${message} <|im_end|> . \n <|im_start|>assistant " -n 500`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            console.log("object");
            /* sendMessageWTyping({ text: "No pude procesar tu solicitud. Por favor ingrese una consulta mas corta 🤗" }, to_phone); */
            return;
          }
          //console.log(`stdout: ${stdout}`);
          //console.error(`stderr: ${stderr}`);
  
          // extract the message after "Assistant:"
          const regex = />assistant(.*)/s;
          const match = regex.exec(stdout);
         
          /* Init two variables for the response */
          let response;
          let responseWithFormat;
          if (match && match[1]) {
            /* This variable contains the AI format (<|im_end|>), sometimes no.  */
            response = match[1].trim();
            /* Check if contain the AI format */
            if(wordsFoundInText(response.toString(), ['<|im_end|>'])) 
              responseWithFormat = response.split('<|im_end|>')[0];
            else 
              responseWithFormat = response;
  
          } else {
            responseWithFormat = 'No se pudo entender la respuesta del asistente';
          }
          console.log("THE PROCESS WAS SEND.");
          parentPort.postMessage(responseWithFormat);
        }
    );

    
    
}

parentPort.on('message', (message) => {
    processAI(message.prompt, message.query, message.to_phone);
});