//classe principal do sistema

const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment');
const winston = require('winston');
const cardapios = require('./cardapios');
const mensagens = require('./mensagens');
const notifications = require('./notifications');

let token = "509006825:AAGd3FWC3cSQnWm7-WYZxfeSMxGhukLnlaM";
let bot = new TelegramBot(token, { polling: true });
winston.add(winston.transports.File, { filename: 'log.txt' });
moment.locale('pt-br');

//SETUP INICIAL
console.log("Server up!");
cardapios.setupCaching();
notifications.setup();

//ao receber qualquer mensagem, printar o menu inicial
bot.on('message', (msg) => {
    comm = mensagens.prepare(mensagens.INITIAL);
    bot.sendMessage(msg.chat.id, comm.text, comm.opts).catch(handleError);
});

//interpretar respostas do teclado interativo
bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    let action = callbackQuery.data;
    let msg = callbackQuery.message;
    let from = callbackQuery.from;
    let userid = from.id;
    let noEdit = false;


    winston.info({action: action, user: from.username, group: msg.chat.title});

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
    //qual dos dois é, qual a pagina da lista de bandejões e a lista toda
    if(action.startsWith("BNDLIST")) {
        let splitter = action.split("_");
        let list = cardapios.getBandexList();
        comm = mensagens.prepareForEdit(mensagens["BNDLIST"], msg, {time: splitter[1], page: splitter[2], list: list});
    }
    //pedido de cardapio, obtemos no bd e passamos como parametro
    //junto com se é almoco/janta
    else if(action.startsWith("BNDFULL")) {
        let splitter = action.split("_");
        let menu = cardapios.fetch(splitter[2], (splitter[1] == "ALMOCO") ? 0 : 1)
        comm = mensagens.prepareForEdit(mensagens["BNDFULL"], msg, {menu: menu, time: splitter[1]});
    }
    else if(action == "NOTIFICATIONS") {
        comm = mensagens.prepareForEdit(mensagens[action], msg, {paused: notifications.isPaused(userid)});
    }
    //ligar/desligar notificações no geral
    else if(action == "NOTIPAUSE") {

        notifications.togglePause(userid);
        comm = mensagens.prepareForEdit(mensagens[action], msg, {paused: notifications.isPaused(userid)});
    }
    //listar bandejões e se eles notificam ou não
    //parametros: almoco/janta e pagina
    else if(action.startsWith("NOTILIST")) {
        let splitter = action.split("_");
        let list = cardapios.getBandexList();
        notifications.fillListWithNotifications(userid, list, splitter[1]);
        comm = mensagens.prepareForEdit(mensagens["NOTILIST"], msg, {list: list, time: splitter[1], page: splitter[2]});
    }
    //ligar/desligar notificações de um bandejão
    //parametros: almoco/janta, pagina e bandex
    //realiza a ação e redireciona pro NOTILIST adequado
    else if(action.startsWith("NOTITOGGLE")) {
        let splitter = action.split("_");
        notifications.toggleNotifications(userid, splitter[1], splitter[3]);
        let list = cardapios.getBandexList();
        notifications.fillListWithNotifications(userid, list, splitter[1]);
        comm = mensagens.prepareForEdit(mensagens["NOTILIST"], msg, {list: list, time: splitter[1], page: splitter[2]});
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
    console.log(error);
}