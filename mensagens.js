//classe responsável por construir os textos e botões exibidos para o usuário

const moment = require('moment');

var self = module.exports = {
    ABOUT: 0,
    INITIAL: 1,
    NOTIFICATIONS: 2,
    BNDLIST: 3,
    BNDFULL: 4,
    NOTIPAUSE: 5,
    NOTILIST: 6,
    NOTITOGGLE: 7,

    prepare: prepare,
    prepareForEdit: prepareForEdit,
    getDigestTitle: getDigestTitle,
    getDigestEntry: getDigestEntry    
};

//preparar alguma mensagem (e teclado de resposta) para envio
function prepare(index, params) {
    let wrapper = {};
    wrapper.opts = {};
    wrapper.opts.parse_mode = "Markdown";
    wrapper.opts.reply_markup = {};

    switch(index) {
        case self.ABOUT:
            wrapper.text = `🔹            *BandexBot  v0.8*            🔹
🔹 by @akafts and USPCodeLab at *IME-USP* 🔹

🖥 Quer fazer sistemas como este? Participe do *USPCodeLab*!
🌎 Código disponível no meu GitHub (@akafts)

👍 *Curtiu? Repasse pros amigos!* 👍
`;
            wrapper.opts.reply_markup.inline_keyboard = [
                [
                    {
                        text: '⬅️ Voltar',
                        callback_data: 'DUPE_INITIAL'
                    }
                ]
            ]; 
            break;

        case self.INITIAL:
            wrapper.text = `*Bem-vindo ao BandexBot!* Em que posso ajudar?`;
            wrapper.opts.reply_markup.inline_keyboard = [
                [
                    {
                        text: '☀️ Ver Almoço',
                        callback_data: 'BNDLIST_ALMOCO_0'
                    },
                    {
                        text: '🌙 Ver Janta',
                        callback_data: 'BNDLIST_JANTA_0'
                    }
                ],
                [
                    {
                        text: '⚙️ Gerenciar Notificações',
                        callback_data: 'NOTIFICATIONS'
                    }
                ],
                [
                    {
                        text: 'ℹ️ Sobre o BandexBot',
                        callback_data: 'ABOUT'
                    }
                ]
            ];
            break;

        case self.BNDLIST:
            wrapper.text = (params.time == "ALMOCO") ? "☀️ *Ver Almoço*" : "🌙 *Ver Janta*";
            wrapper.text += "\nSelecione um bandejão:";
            wrapper.opts.reply_markup.inline_keyboard = buildBandexList(params.list, 
                `BNDLIST_${params.time}_${params.page}`, `BNDFULL_${params.time}_`, "INITIAL");
            break;

        case self.BNDFULL:
            wrapper.text = buildMenu(params.menu);
            wrapper.opts.reply_markup.inline_keyboard = [
                [
                    {
                        text: '⬅️ Voltar',
                        callback_data: `DUPE_BNDLIST_${params.time}_0`
                    }
                ]
            ];
            break;

        case self.NOTIFICATIONS:
            let optext;
            wrapper.text = `⚙️ *Gerenciar Notificações*\n`;        
            if(params.paused) {
                wrapper.text += `Suas notificações estão pausadas. Clique em *Resumir Notificações* para ligá-las de novo.`;
                optext = '▶️ Resumir Notificações';
            }
            else {
                wrapper.text += `Você pode configurar suas notificações para almoço e janta, ou desligar todas por um tempo.`;
                optext = '⏸ Pausar Notificações';
            }

            wrapper.opts.reply_markup.inline_keyboard = [
                [
                    {
                        text: '☀️ Almoço',
                        callback_data: 'NOTILIST_ALMOCO_0'
                    },
                    {
                        text: '🌙 Janta',
                        callback_data: 'NOTILIST_JANTA_0'
                    }
                ],           
                [
                    {
                        text: optext,
                        callback_data: 'NOTIPAUSE'
                    }
                ],            
                [
                    {
                        text: '⬅️ Voltar',
                        callback_data: 'BACK_INITIAL'
                    }
                ]
            ]; 
            break;

        case self.NOTIPAUSE:
            if(params.paused)
                wrapper.text = `⏸ *Pausar Notificações*\nSuas notificações foram pausadas.`;
            else
                wrapper.text = `▶️ *Resumir Notificações*\nSuas notificações foram resumidas.`;
            wrapper.opts.reply_markup.inline_keyboard = [          
                [
                    {
                        text: '⬅️ Voltar',
                        callback_data: 'BACK_NOTIFICATIONS'
                    }
                ]
            ]; 
            break;

        case self.NOTILIST:
            if(params.time == "ALMOCO") {
                wrapper.text = "☀️ *Notificações de Almoço*\nToque em um bandejão para ligar ou desligar as notificações dele.\n " 
                    + "Você receberá uma notificação com o cardápio dos bandejões selecionados *todos os dias úteis às 11h30*.";
            }
            else {
                wrapper.text = "🌙 *Notificações de Janta*\nToque em um bandejão para ligar ou desligar as notificações dele.\n " 
                    + "Você receberá uma notificação com o cardápio dos bandejões selecionados *todos os dias úteis às 18h30*.";                
            }
            wrapper.opts.reply_markup.inline_keyboard = buildBandexList(params.list, 
                `NOTILIST_${params.time}_${params.page}`, `NOTITOGGLE_${params.time}_${params.page}_`, "NOTIFICATIONS");
            break;
    }
    return wrapper;
}

//prepara a mensagem e o teclado, mas adiciona campos extras para edição de mensagem
function prepareForEdit(index, msg, params) {
    let wrapper = prepare(index, params);

    wrapper.opts.chat_id = msg.chat.id;
    wrapper.opts.message_id = msg.message_id;
    return wrapper;
}

//prepara um keyboard de seleção de bandejões, com 6 bandejões por pagina
//recebe a lista de bandejoes, o estado atual, um prefixo para o callback_data, e o estado para onde voltar
function buildBandexList(list, state, preffix, back) {
    let splitter = state.split("_");
    let keyboard = [];
    let row;
    let page = +splitter[2];
    let index = page*6;
    let text;

    //adicionamos os bandejoes, de 2 em 2
    while(index < (page+1)*6 && index < 16) {
        row = [];
        text = list[index].name;
        if(typeof list[index].subscribed != "undefined") {
            if(list[index].subscribed) 
                text = "🔔 " + text;
            else
                text = "🔕 " + text;
        }
        row.push({
            text: text,
            callback_data: preffix+list[index].code
        });
        text = list[index+1].name;
        if(typeof list[index+1].subscribed != "undefined") {
            if(list[index+1].subscribed) 
                text = "🔔 " + text;
            else
                text = "🔕 " + text;
        }
        row.push({
            text: text,
            callback_data: preffix+list[index+1].code
        });  
        keyboard.push(row);    
        index += 2;          
    }

    //adicionar paginaçao
    row = [];
    if(page > 0)
        row.push({
            text: "◀️ Anterior",
            callback_data: `${splitter[0]}_${splitter[1]}_${page-1}`
        });

    if(page < 2)
        row.push({
            text: "▶️ Próximo",
            callback_data: `${splitter[0]}_${splitter[1]}_${page+1}`
        });
    keyboard.push(row);


    //adicionar voltar
    row = [];
    row.push({
        text: "⬅️ Voltar",
        callback_data: "BACK_" + back
    });
    keyboard.push(row);

    return keyboard;
}

//recebe o menu e prepara sua exibiçao
function buildMenu(menu) {
    let text = `🍱 *CARDÁPIO DE HOJE* (${menu.date} - ${menu.time}) 🍱
        🏛 *${menu.place}* 🏛`;

    if(menu.foods.length > 3) {
        text += `

        🍚  ${menu.foods[0]}
        🍗  ${menu.foods[1]}
        🌿  ${menu.foods[2]}
        🍠  ${menu.foods[3]}
        🥗  ${menu.foods[4]}
        🎂  ${menu.foods[5]}
        🍞  ${menu.foods[6]}
        `;
    }
    else {
        text += `

        🚫 Nada consta, provavelmente fechado 🚫
        `;
    }
    return text;
}


//gera uma mensagem que será o cabeçalho do digest de notificação
function getDigestTitle(time) {
    date = moment().format('dddd');
    time = (time == 0) ? "Almoço" : "Janta";
    return `🌮 *HOJE NO BANDEJÃO* (${date} - ${time}) 🌮\n\n`;
}

//gera um pequeno texto a partir de um menu de um bandejão
function getDigestEntry(menu) {
    let text = `        🏛 *${menu.place}* 🏛\n`;

    if(menu.foods.length > 3) {
        text += `       🍚  ${menu.foods[0]}
        🍗  ${menu.foods[1]}
        🌿  ${menu.foods[2]}
        🍠  ${menu.foods[3]}
        🥗  ${menu.foods[4]}
        🎂  ${menu.foods[5]}
        🍞  ${menu.foods[6]}\n\n`;
    }
    else {
        text += `       🚫 Nada consta, provavelmente fechado 🚫\n\n`;
    }
    return text;
}