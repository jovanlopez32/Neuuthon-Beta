
import * as cp from 'child_process'
import { sendMessageWTyping } from "./SendMessage.js";
import { wordsFoundInText } from './WordsFoundInText.js';
import { setProcessFlag, getProcessFlag } from '../server.js';
import { removeQuery } from '../server.js';

export const processAI = (prompt, message, to_phone) => {
  setProcessFlag(true);
  
  console.log("AI PROCESS: " + message + " to: " + to_phone);
  cp.exec(
    `./llama.cpp/main -ngl 32 -m ./llama.cpp/models/openhermes-2-mistral-7b.Q4_K_M.gguf --color -c 2048 --temp 0.7 --repeat_penalty 1.1 -n -1 -p "<|im_start|>system \n ${prompt}. Piensa paso por paso. Eres un asistente de IA desarrollado por Neuuni Universidad. Tu nombre es Nevil.<|im_end|>. \n <|im_start|>user \n ${message.substring(1)} <|im_end|> . \n <|im_start|>assistant " -n 1000`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        sendMessageWTyping({ text: "No pude procesar tu solicitud. Por favor ingrese una consulta mas corta 🤗" }, to_phone);
        removeQuery();
        setTimeout(() => {
          console.log("");
          setProcessFlag(false);
        }, 2000);
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
        
        setTimeout(() => {
          removeQuery();
        }, 2000);
      
        setTimeout(() => {
          console.log("");
          setProcessFlag(false);
        }, 2000);
      }
      
      console.log("THE PROCESS WAS SEND TO : " + to_phone);
      sendMessageWTyping({ text: responseWithFormat }, to_phone);

      setTimeout(() => {
        removeQuery();
      }, 2000);

      setTimeout(() => {
        console.log("");
        setProcessFlag(false);
      }, 2000);
      
    }
  ); 
}