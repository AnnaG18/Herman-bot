const builder = require('botbuilder');

const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

const logMessage = require('./middleware/logMessages');

//import of messages.JSON
const botMsg = require('./messages/de_DE');

//import dialogs
const qnaDialog = require('./qnadialog');
const acceptDsgvoDialog = require('./acceptDsgvo');

// Make a new bot and set the QNA dialog as the default dialog. That way, the
// bot will enter QNA mode whenever there is no other active dialog on the
// stack.
const bot = new builder.UniversalBot(connector, [
    function (session) {
        session.beginDialog('acceptDsgvo');
    },
    function (session) {
        session.beginDialog('qnadialogStart');
    },
    function (session) {
        session.beginDialog('qna');
    },
] );

//acceptDSGVO dialog triggered after conversationUpdate start message
bot.dialog('acceptDsgvo', acceptDsgvoDialog);

//show qnadialogStart dialog message
bot.dialog('qnadialogStart', function (session) {
    builder.Prompts.text(session, botMsg.StartQnA);
});

bot.dialog('qna', qnaDialog);


bot.on('conversationUpdate', (message) => {
    // Only send message if the bot is added to the conversation. As the bot
    // does not enter group conversations, there is no difference if the user
    // is greeted by the bot or the bot says hello to everyone in the channel.
    const memberAdded = message.membersAdded && message.membersAdded.length > 0;
    const botIsAddedMember = message.address && message.address.bot.id === message.membersAdded[0].id;
    // Start the greeting
    if (memberAdded && botIsAddedMember) {
        message.membersAdded.forEach(function (identity){
           if(identity.id === message.address.bot.id){
               const reply = new builder.Message()
                   .address(message.address)
                   .text(botMsg.WelcomeMsg);
               bot.send(reply);
           } else{
               const address = Object.create(message.address);
               address.user = identity;
               const reply = new builder.Message()
                   .address(message.address)
                   .text(botMsg.WelcomeMsg + identity.name);
               bot.send(reply);
           }
        });
    }
});

// Middleware for logging
bot.use({
    /* send messages from user to bot*/
    botbuilder: (session, next) => {
        if (!session || !session.message || !session.message.text) {
            return next();
        }
        logMessage.receive(session.message);
        if (session.privateConversationData.userAcceptedDSGVO) {
            logMessage.persist(session.message.address.conversation.id);
        } else {
            logMessage.deleteConversation(session.message.address.conversation.id)
        }
        next();
    },

    /* send messages from bot to user*/
    send: function (message, next) {
        if (message.type !== 'message') {
            return next();
        }

        bot.loadSession(message.address, async function (error, session) {
            const messageCopy = {...message, address: message.address || session.message.address};

            logMessage.send(messageCopy);

            if (session.privateConversationData.userAcceptedDSGVO) {
                await logMessage.persist(messageCopy.address.conversation.id);
                next();
            } else {
                next();
            }
        });
    },

});

module.exports = bot;