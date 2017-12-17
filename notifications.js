//classe responsável por gerenciar as notificações para usuários

const Storage = require('node-storage');

module.exports = {
    setup: setup,
    togglePause: togglePause,
    isPaused: isPaused,
    fillListWithNotifications: fillListWithNotifications,
    toggleNotifications: toggleNotifications
}

let storage;

//configura o armazenamento de dados e liga as notificações
function setup() {
    storage = new Storage('./storage');

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