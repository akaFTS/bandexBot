//classe responsavel por buscar e gerenciar os cardapios na base da USP

const moment = require('moment');
const axios = require('axios');
const Q = require("q");
const { CronJob } = require("cron");
const bandejoes = require('./bandejoes');
let curdate;
let menus;

module.exports = {
    setupCaching: setupCaching,
    getBandexList: getBandexList,
    fetch: fetch
};

//faz um caching inicial e configura o cron pra fazer todo dia
function setupCaching() {
    cache();
    new CronJob({
        cronTime: "00 30 00 * * *", //toda meia-noite e meia de todo dia
        start: true,
        onTick: cache
    });
}

//baixa informações de todos os bandejões para o dia de hoje e armazena em cache
//retorna uma promise que é resolvida quando toda a info estiver disponivel
function cache() {

    //só cacheia de novo se for outro dia
    if(isCacheValid())
        return;
    curdate = moment();


    menus = [];
    let promises = [];
    console.log("Started caching menus...");
    Object.keys(bandejoes.codes).forEach(key => {
        let index = bandejoes.codes[key];
        let prom = getTodayMenu(index).then(entry => {
            menus[index] = entry;
        }, error => {
            console.log("Something bad happened at " + key);
            console.log(error);
        })

        //guardamos cada chamada da API para depois verificar quando tudo terminou
        promises.push(prom);
    });

    Q.all(promises).then(() => {
        console.log("Menus cached successfully.");
    });
}

//busca o menu de hoje de um determinado bandex
//retorna objeto com almoco e janta na forma de promise
function getTodayMenu(index) {
    return fetchMenuFromApi(index).then(cardapio => {
        //API retorna um array onde a posição 0 é almoço de segunda, 1 é janta de segunda
        //e por ai vai. Buscamos as posições relacionadas ao dia atual
        let today = moment().format('d') - 1;
        let menu = [];
        menu[0] = cardapio[today * 2] ? cardapio[today * 2].cdpdia.split('<br>') : [];
        menu[1] = cardapio[today * 2 + 1] ? cardapio[today * 2 + 1].cdpdia.split('<br>') : [];

        return menu;
    });
}

//busca na API cagada da USP o cardapio da semana pra um determinado bandex
//retorna o cardapio atraves de uma promise
function fetchMenuFromApi(index) {
    let params = `callCount=1\n
windowName=\n
nextReverseAjaxIndex=0\n
c0-scriptName=CardapioControleDWR\n
c0-methodName=obterCardapioRestUSP\n
c0-id=0\n
c0-param0=string:${index}\n
batchId=1\n
instanceId=0\n
page=%2Frucard%2FJsp%2FcardapioSAS.jsp%3Fcodrtn%3D8\n
scriptSessionId=qEqk7ItaLEzxe*E*86DiBQhKpZl/hKILpZl-dc3rvbwx5`;
    
    let deferred = Q.defer();
    axios.post('https://uspdigital.usp.br/rucard/dwr/call/plaincall/CardapioControleDWR.obterCardapioRestUSP.dwr', params)
        .then(response => {

        let json_doidao = response.data;
        let json_normal = json_doidao.split('\n').slice(6).join('\n').replace('dwr.engine.remote.handleCallback("1","0",', "").replace("})();", "").trim().replace(");", "")
        let json_melhor = json_normal.replace(/([\[{,])([a-z][a-z0-9]+):/g, "$1\"$2\":");
        let cardapio = JSON.parse(json_melhor);

        deferred.resolve(cardapio);
    });

    return deferred.promise;
}

//verifica se os dados são válidos para o dia de hoje
function isCacheValid() {
    return curdate && moment().isSame(curdate, "day");
}

//retorna uma lista de objetos contendo nome legível e código
//dos bandejões. Não está em ordem númerica.
function getBandexList() {

    let fulllist = [];
    bandejoes.orderlist.forEach(key => {
        fulllist.push({
            code: key,
            name: bandejoes.names[key]
        });
    });
    return fulllist;
}

//busca o cardapio para hoje, do bandejao solicitado,
//no momento solicitado (0 para almoco e 1 para janta)
//e algumas infos adicionais como nome legivel do bandex e dia da semana
function fetch(bandex, time) {
    let menu = {};
    menu.date = moment().format('dddd');
    menu.time = (time == 0) ? "Almoço" : "Janta";
    menu.place = bandejoes.names[bandex];
    try {    
        menu.foods = menus[bandejoes.codes[bandex]][time];
    } catch(error) {}
    return menu;
}
