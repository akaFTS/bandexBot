//classe responsável por gerenciar as notificações para usuários

const Storage = require('node-storage');
const { CronJob } = require("cron");
const mensagens = require('./mensagens');
const cardapios = require('./cardapios');

module.exports = {
    setup: setup,
    togglePause: togglePause,
    isPaused: isPaused,
    fillListWithNotifications: fillListWithNotifications,
    toggleNotifications: toggleNotifications
}

let storage;

//configura o armazenamento de dados e liga as notificações
//recebe um callback que contem a ação de envio da mensagem pelo bot
function setup(sendAction) {
    storage = new Storage('../storage/subscriptions');

    //notificações de almoço
    new CronJob({
        cronTime: "00 30 11 * * 1-5", //11h30 de todo dia útil
        start: true,
        onTick: function() {
            sendDigest(0, sendAction);
        }
    });

    //notificações de janta
    new CronJob({
        cronTime: "00 30 18 * * 1-5", //18h30 de todo dia útil
        start: true,
        onTick: function() {
            sendDigest(1, sendAction);
        }
    });
}

//pausa ou despausa as notificações de um determinado usuario
function togglePause(uid) {
    let paused = storage.get(`subscribers.u${uid}.paused`);
    paused = !paused;
    storage.put(`subscribers.u${uid}.paused`, paused);
    return paused;
}

//verifica se um usuario está pausado ou não
function isPaused(uid) {
    return storage.get(`subscribers.u${uid}.paused`) == true;
}

//recebe uma lista de bandejoes, e pra cada um deles
//seta uma propriedade dizendo se estão sendo notificados ou não
function fillListWithNotifications(uid, list, time) {
    time = time.toLowerCase();
    list.forEach(bandex => {
        bandex.subscribed = (storage.get(`subscribers.u${uid}.${time}.${bandex.code}`) == true);
    });

    return list;
}

//recebe usuario, almoco/janta e bandex e liga/desliga notificações para ele
function toggleNotifications(uid, time, code) {
    time = time.toLowerCase();
    let isNoti = storage.get(`subscribers.u${uid}.${time}.${code}`);
    if(!isNoti)
        storage.put(`subscribers.u${uid}.${time}.${code}`, true);
    else
        storage.put(`subscribers.u${uid}.${time}.${code}`, false);
}

//prepara um digest diario de cada bandejão, e envia para os usuarios que escolheram ser notificados
//recebe o momento (almoco/janta) como sendo 0/1 e o callback enviado no setup
function sendDigest(time, sendAction) {

    //preparar textos-base
    let header = mensagens.getDigestTitle(time);
    let bandexes = cardapios.getBandexList();
    let menus = {};
    bandexes.forEach(band => {
        menus[band.code] = mensagens.getDigestEntry(cardapios.fetch(band.code, time));
    });

    //buscar usuarios
    let subscribers = storage.get("subscribers");
    if(!subscribers)
        return;

    //para cada usuario, construir um texto e enviar
    Object.keys(subscribers).forEach(uid => {
        let user = subscribers[uid];
        let moment = time == 0 ? "almoco" : "janta";
        let usertext = "";

        //se o cara não tiver nada cadastrado ou estiver pausado, ignorar
        if(!user[moment] || user.paused)
            return;

        //preencher o texto com os bandejoes que ele escolheu
        Object.keys(user[moment]).forEach(code => {
            if(user[moment][code])
                usertext += menus[code];
        });

        //se o cara tiver tudo cadastrado como falso, ignorar tambem
        if(usertext == "")
            return;

        //retirar o "u" do uid
        let id = uid.substring(1);
        usertext = header + usertext;

        //enviar
        sendAction(usertext, id);
    });
}