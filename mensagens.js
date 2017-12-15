const cardapios = require('./cardapios');

var self = module.exports = {
    ABOUT: 0,
    INITIAL: 1,
    NOTIFICATIONS: 2,
    BNDLIST: 3,

    prepare: prepare,
    prepareForEdit: prepareForEdit    
};

//preparar alguma mensagem (e teclado de resposta) para envio
function prepare(index, params) {
    let wrapper = {};
    wrapper.opts = {};
    wrapper.opts.parse_mode = "Markdown";
    wrapper.opts.reply_markup = {};

    if(index == self.ABOUT) {
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
    }

    if(index == self.INITIAL) {
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
    }
    else if(index == self.NOTIFICATIONS) {
        wrapper.text = `⚙️ *Gerenciar Notificações*\nEssa funcionalidade ainda não está disponível 😕`;
        wrapper.opts.reply_markup.inline_keyboard = [
            [
                {
                    text: '⬅️ Voltar',
                    callback_data: 'BACK_INITIAL'
                }
            ]
        ]; 
    }
    else if(index == self.BNDLIST) {
        wrapper.text = (params.time == "ALMOCO") ? "☀️ *Ver Almoço*" : "🌙 *Ver Janta*";
        wrapper.text += "\nSelecione um bandejão:";
        wrapper.opts.reply_markup.inline_keyboard = getBandexList(`BNDLIST_${params.time}_${params.page}`, 
                                                                    `BNDFULL_${params.time}_`, "INITIAL");
    }

    else if(index == self.BNDFULL) {
        wrapper.text = makeMenu(params.place, params.time);
        wrapper.opts.reply_markup.inline_keyboard = [
            [
                {
                    text: '⬅️ Voltar',
                    callback_data: `DUPE_BNDLIST_${params.time}_0`
                }
            ]
        ];
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
//recebe o estado atual, um prefixo para o callback_data, e o estado para onde voltar
function getBandexList(state, preffix, back) {
    let splitter = state.split("_");
    let keyboard = [];
    let row;
    let page = +splitter[2];

    let list = cardapios.getBandexList();
    let index = page*6;

    //adicionamos os bandejoes, de 2 em 2
    while(index < (page+1)*6 && index < 16) {
        row = [];
        row.push({
            text: list[index].name,
            callback_data: preffix+list[index].code
        });
        row.push({
            text: list[index+1].name,
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

//recebe o codigo de um bandex e o momento (almoco/janta),
//busca o cardapio na base e prepara sua exibiçao
function makeMenu(bandex, time) {
    let menu = cardapios.fetch(bandex, (time == "ALMOCO") ? 0 : 1)

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

        🚫 *Nada consta, provavelmente fechado* 🚫
        `;
    }
    return text;
}