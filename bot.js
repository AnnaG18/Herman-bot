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

// set up bot and define default dialog to use QnA Maker and other waterfall steps
/*const bot = new builder.UniversalBot(connector, [
    function (session) {
        session.beginDialog('greeting');
    },
    function (session) {
        session.beginDialog('acceptDsgvo');
    },
    function (session, results) {
        session.beginDialog('qnadialogStart');
    },
    //start qna dialog
    function (session) {
        session.beginDialog('qna');
    }
]);*/

// Make a new bot and set the QNA dialog as the default dialog. That way, the
// bot will enter QNA mode whenever there is no other active dialog on the
// stack.
const bot = new builder.UniversalBot(connector, qnaDialog);

//acceptDSGVO dialog triggered after conversationUpdate start message
bot.dialog('acceptDsgvo', acceptDsgvoDialog);

//show qnadialogStart dialog message
bot.dialog('c', function (session) {
    builder.Prompts.text(session, botMsg.StartQnA);
});


bot.on('conversationUpdate', (message) => {
    // Only send message if the user is added to the conversation. As the bot
    // does not enter group conversations, there is no difference if the user
    // is greeted by the bot or the bot says hello to everyone in the channel.
    const memberAdded = message.membersAdded && message.membersAdded.length > 0;
    const userIsAddedMember = message.address && message.address.user.id === message.membersAdded[0].id;
    // Start the greeting and terms of service / DSGVO dialog
    if (memberAdded && userIsAddedMember) {
        const reply = new builder.Message()
            .address(message.address)
            .text(botMsg.WelcomeMsg);
        bot.send(reply);

        bot.beginDialog(message.address, 'acceptDsgvo', null);
    }
});

// Middleware for logging
bot.use({
    /* send messages from user to bot*/
    botbuilder: (session, next) => {
        //  console.log(session.message, 'session');
        logMessage.receive(session.message);
        if (session.privateConversationData.userAcceptedDSGVO) {
            logMessage.persist(session.message.address.conversation.id);
        } else {
            logMessage.deleteConversation(session.message.address.conversation.id)
        }
        next();
    },

    /* send messages from bot to user*/
   /* send: function (message, next) {
        bot.loadSession(message.address, function (error, session) {
            const messageCopy = {...message, address: message.address || session.message.address};
            //console.log('message.address', error, session, 'ausgabe');
            logMessage.send(messageCopy);

            if (session.privateConversationData.userAcceptedDSGVO) {
                logMessage.persist(messageCopy.address.conversation.id);
            }
        });
        next();
    },*/

});

module.exports = bot;