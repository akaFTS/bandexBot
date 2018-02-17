# bandexBot
Um bot para telegram que exibe o cardápio de almoço e janta no dia de hoje para qualquer bandejão da USP, além de enviar notificações diárias com o cardápio de seus bandejões favoritos.

## Como usar
O bot oficial pode ser encontrado em <https://t.me/uspbandexbot>. A partir daí, é só ir clicando nos menus - a interação é  feita através de botões e não comandos de texto.

## Como contribuir
1. Clone este repositório
2. Crie um bot de teste no [@botFather](https://t.me/botFather) e guarde o token gerado
3. Adicione o token em sua devida variável de ambiente no `docker-compose.yml`
4. Faça as mudanças que quiser e rode o bot usando `docker-compose up`
5. Converse com ele via Telegram
6. Quando terminar, submeta um PR informando o username do seu bot de teste para que eu possa verificar se está tudo funcionando. Se estiver, o PR ser incorporado ao bot principal.

## TO-DO
- Permitir ao usuário escolher o horário para ser notificado

### Créditos
Este bot foi desenvolvido por **Gustavo Silva** (eu) como parte do grupo **USPCodeLab**. :)