//TO-DO:
// - Adicionar outros bandejoes
// - Adicionar comandos start, about e help
// - Deixar codigo decente
// - Enviar automaticamente o cardapio 11h da manha

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const moment = require('moment');
moment.locale('pt-br');

var token = "455589560:AAE6jITx0Ax-27SFmvUcqLUTQS46EuSsffo";

var bot = new TelegramBot(token, {polling: true});

bot.on('message', (msg) => {
    
    let tindex = moment().format('d') - 1;
    let today = moment().format('dddd');
    
    if(msg.text.indexOf('/almoco') === 0) {

        let comidas = cardapio[tindex * 2].cdpdia.split('<br>');

        let text = `🍱 CARDÁPIO DE HOJE (${today} - Almoço) 🍱

           🍚 ${comidas[0]}
           🍗 ${comidas[1]}
           🌿 ${comidas[2]}
           🍠 ${comidas[3]}
           🥗 ${comidas[4]}
           🎂 ${comidas[5]}
           🍞 ${comidas[6]}

        🔭 Restaurante da Física`;
        bot.sendMessage(msg.chat.id, text);        
    }
    else if(msg.text.indexOf('/janta') === 0) {

        let comidas = cardapio[tindex * 2 + 1].cdpdia.split('<br>');

        let text = `🍱 CARDÁPIO DE HOJE (${today} - Janta) 🍱

           🍚 ${comidas[0]}
           🍗 ${comidas[1]}
           🌿 ${comidas[2]}
           🍠 ${comidas[3]}
           🥗 ${comidas[4]}
           🎂 ${comidas[5]}
           🍞 ${comidas[6]}

        🔭 Restaurante da Física`;
        bot.sendMessage(msg.chat.id, text);        
    }
    
});


// 8 -> fisica
// 9 -> quimica
// 7 -> prefeitura
// 6 -> central

//parametros da API do bandex
var params = `callCount=1\n
windowName=\n
nextReverseAjaxIndex=0\n
c0-scriptName=CardapioControleDWR\n
c0-methodName=obterCardapioRestUSP\n
c0-id=0\n
c0-param0=string:8\n
batchId=1\n
instanceId=0\n
page=%2Frucard%2FJsp%2FcardapioSAS.jsp%3Fcodrtn%3D8\n
scriptSessionId=qEqk7ItaLEzxe*E*86DiBQhKpZl/hKILpZl-dc3rvbwx5`;

var cardapio;

axios.post('https://uspdigital.usp.br/rucard/dwr/call/plaincall/CardapioControleDWR.obterCardapioRestUSP.dwr', params)
  .then(response => {

    var json_doidao = response.data;
    var json_normal = json_doidao.split('\n').slice(6).join('\n').replace('dwr.engine.remote.handleCallback("1","0",', "").replace("})();", "").trim().replace(");", "")
    var json_melhor = json_normal.replace(/([\[{,])([a-z][a-z0-9]+):/g, "$1\"$2\":");

    cardapio = JSON.parse(json_melhor);
  })