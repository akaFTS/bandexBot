//TO-DO:
// - Adicionar outros bandejoes
// - Adicionar comandos start, about e help
// - Deixar codigo decente
// - Enviar automaticamente o cardapio 11h da manha

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const moment = require('moment');
const winston = require('winston');
const cardapios = require('./cardapios');
const mensagens = require('./mensagens');

let token = "509006825:AAGd3FWC3cSQnWm7-WYZxfeSMxGhukLnlaM";
let bot = new TelegramBot(token, { polling: true });
winston.add(winston.transports.File, { filename: 'log.txt' });
moment.locale('pt-br');

//SETUP INICIAL
console.log("Server up!");
cardapios.setupCaching();

//ao receber qualquer mensagem
bot.on('message', (msg) => {

    comm = mensagens.prepare(mensagens.INITIAL);
    bot.sendMessage(msg.chat.id, comm.text, comm.opts).catch(handleError);
});

//interpretar respostas do teclado interativo
bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    let action = callbackQuery.data;
    let msg = callbackQuery.message;
    let noEdit = false;

    console.log(callbackQuery);

    winston.info({action: action, user: msg.chat.username});

    //pra voltar pro anterior sempre começa com back 
    if(action.startsWith("BACK")) {
        action = action.split(/_(.+)/)[1]; //regex para splitar apenas no primeiro "_"
    }
    //se for pra voltar pro anterior mas preservando a mensagem atual, é dupe
    else if(action.startsWith("DUPE")) {
        action = action.split(/_(.+)/)[1];
        noEdit = true;
    }


    //listagem de bandejões para almoço/janta, passamos como parametro
    //qual dos dois é e qual a pagina da lista de bandejões
    if(action.startsWith("BNDLIST")) {
        let splitter = action.split("_");
        comm = mensagens.prepareForEdit(mensagens["BNDLIST"], msg, {time: splitter[1], page: splitter[2]});
    }

    //pedido de cardapio, passamos como parametro
    //se é almoco/janta e qual bandex
    else if(action.startsWith("BNDFULL")) {
        let splitter = action.split("_");
        comm = mensagens.prepareForEdit(mensagens["BNDFULL"], msg, {time: splitter[1], place: splitter[2]});
    }
    else {
        comm = mensagens.prepareForEdit(mensagens[action], msg);
    }

    if(noEdit)
        bot.sendMessage(msg.chat.id, comm.text, comm.opts).catch(handleError);
    else
        bot.editMessageText(comm.text, comm.opts).catch(handleError);
});

//tratar erros
bot.on('polling_error', handleError);
function handleError(error) {
    console.log(error.response.body.description);
}