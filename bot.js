const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

var token = "455589560:AAE6jITx0Ax-27SFmvUcqLUTQS46EuSsffo";

var bot = new TelegramBot(token, {polling: true});

bot.on('message', (msg) => {
    
    var Hi = "hi";
    if (msg.text.toLowerCase().indexOf(Hi) === 0) {
        bot.sendMessage(msg.chat.id,"Hello dear user");
    } 
    
});

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
scriptSessionId=qEqk7ItaLEzxe*E*86DiBQhKpZl/hKILpZl-dc3rvbwx5`

axios.post('https://uspdigital.usp.br/rucard/dwr/call/plaincall/CardapioControleDWR.obterCardapioRestUSP.dwr', params)
  .then(response => {

    var json_doidao = response.data;
    var json_normal = json_doidao.replace(/[\n]/, "").replace(/[\n]/, "").replace(/[\n]/, "").replace(/[\n]/, "").replace(/[\n]/, "").replace(/[\n]/, "").replace('dwr.engine.remote.handleCallback("1","0",', "").replace("})();", "").trim().replace(");", "");
    // /(.*):/g, "\"$1:\""

    console.log(json_normal);

    var cardapio = JSON.parse(json_normal);

    console.log(cardapio);
  })