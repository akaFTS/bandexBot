//classe responsável por gerenciar as notificações para usuários

const Storage = require('node-storage');
const { CronJob } = require("cron");
const mensagens = require('./mensagens');
const cardapios = require('./cardapios');

var self = module.exports = {
    setup: setup,
    togglePause: togglePause,
    isPaused: isPaused,
    getTimes: getTimes,
    setTime: setTime,
    fillListWithNotifications: fillListWithNotifications,
    toggleNotifications: toggleNotifications
}

let storage;

//configura o armazenamento de dados e liga as notificações
//recebe um callback que contem a ação de envio da mensagem pelo bot
function setup(sendAction) {
    storage = new Storage('../storage/subscriptions');

    //buscamos o primeiro horario, vamos adicionando meia hora a partir dele
    let firsttier = mensagens.getTimeForTier(0, 1);
    let firstsplit = firsttier.split(":");
    let hour = parseInt(firstsplit[0]);
    let minutes = parseInt(firstsplit[1]);

    //quatro horários de notificação de almoço
    for(let i = 1; i < 5; i++) {
        new CronJob({
            cronTime: `00 ${minutes} ${hour} * * 1-5`,
            start: true,
            onTick: function() {
                sendDigest(0, i, sendAction);
            }
        });
        minutes += 30;
        minutes %= 60;
        if(minutes == 0)
            hour++;
    }

    //buscamos o primeiro horario, vamos adicionando meia hora a partir dele
    firsttier = mensagens.getTimeForTier(1, 1);
    firstsplit = firsttier.split(":");
    hour = parseInt(firstsplit[0]);
    minutes = parseInt(firstsplit[1]);

    //quatro horários de notificação de janta
    for(let i = 1; i < 5; i++) {
        new CronJob({
            cronTime: `00 ${minutes} ${hour} * * 1-5`,
            start: true,
            onTick: function() {
                sendDigest(1, i, sendAction);
            }
        });
        minutes += 30;
        minutes %= 60;
        if(minutes == 0)
            hour++;
    }
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

//recebe os horários que o usuário é notificado (1 a 4, almoço e janta)
function getTimes(uid) {
    let times = {};
    times.day = storage.get(`subscribers.u${uid}.daytime`) || '2';
    times.night = storage.get(`subscribers.u${uid}.nighttime`) || '2';
    return times;
}

//seta o horario de notificação de um usuário (almoço/janta, 1 a 4)
function setTime(uid, dinner, time) {
    let moment = dinner ? 'nighttime' : 'daytime';
    storage.put(`subscribers.u${uid}.${moment}`, time);
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
//recebe o momento (almoco/janta) como sendo 0/1, a hora de notificar (1-4) e o callback enviado no setup
function sendDigest(time, tier, sendAction) {

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

        //retirar o "u" do uid
        let id = uid.substring(1);

        //se o cara não tiver nada cadastrado ou estiver pausado, ignorar
        if(!user[moment] || user.paused)
            return;

        //verificar se este é o horário de notificar este usuário
        let times = self.getTimes(id);
        let preftime = time ? times.night : times.day;
        if(preftime != tier)
            return;


        //preencher o texto com os bandejoes que ele escolheu
        Object.keys(user[moment]).forEach(code => {
            if(user[moment][code])
                usertext += menus[code];
        });

        //se o cara tiver tudo cadastrado como falso, ignorar tambem
        if(usertext == "")
            return;
        usertext = header + usertext;

        //enviar
        sendAction(usertext, id);
    });
}