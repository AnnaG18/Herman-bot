const builder = require('botbuilder');

const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// set up default dialog to use QnA Maker
const bot = new builder.UniversalBot(connector);
    // require('./qnadialog.js'));
const logMessage = require('./middleware/logMessages');

//import of messages.JSON
const botMsg = require('./messages/de_DE');

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded && message.membersAdded.length > 0) {
        // Only send message if the bot is added to the conversation.
        const isBotAdded = message.address.bot.id === message.membersAdded[0].id;
        if (!isBotAdded) {
            return;
        }

        // Say hello
        const isGroup = message.address.conversation.isGroup;
        const txt = isGroup ? botMsg.Greeting : botMsg.WelcomeMsg;
        const reply = new builder.Message()
            .address(message.address)
            .text(txt);
        bot.send(reply);

    } else if (message.membersRemoved) {
        // See if bot was removed
        const botId = message.address.bot.id;
        for (let i = 0; i < message.membersRemoved.length; i++) {
            if (message.membersRemoved[i].id === botId) {
                // Say goodbye
                const reply = new builder.Message()
                    .address(message.address)
                    .text(botMsg.GoodBye);
                bot.send(reply);
                break;
            }
        }
    }
});

bot.dialog('qnadialog', [function(session){
    session.send( botMsg.StartQnA );
}, require('./qnadialog')]);


//TODO: trigger this after conversationUpdate start message
bot.dialog('/', [
    function (session) {

        const msg = new builder.Message(session)
            .text(botMsg.AcceptDSGVO)
            .suggestedActions(
                builder.SuggestedActions.create(
                    session,[
                        builder.CardAction.imBack(session, botMsg.accept, botMsg.accept)
                    ]
                )
            );
        builder.Prompts.choice(session, msg, ["akzeptieren"]);

    },
    function(session, results) {
        let regex = /ok|ja|zustimmen|akzeptieren|klar\!|affirmativ|positiv/gi;
        if (regex.test(results.response)) {
            session.send( botMsg.acceptedDSGVO );

        }

        session.beginDialog('*:qnadialog');
    }
]);

/*
bot.dialog('/', [
    function (session) {
        var msg = new builder.Message(session)
            .text("Akzeptieren?DSGVO")
            .suggestedActions(
                builder.SuggestedActions.create(
                    session,[
                        builder.CardAction.imBack(session, "ja!", "ja!"),
                        builder.CardAction.imBack(session, "nein.", "nein.")
                    ]
                )
            );
      //  builder.Prompts.text(session, msg);
        session.send(msg);
    },
    function(session, results) {
        let regex = /yeah|yes|sure|of course|i do\!|affirmative|positive/gi;
        if (regex.test(results.response)) {
            session.beginDialog("Accepted");
        } else {
            session.beginDialog("NotAccepted");
        }
    }]);

bot.dialog("Accepted", function(session) {
    let yesAndMoreRegex = /|akzeptieren/gi;
    if (yesAndMoreRegex.test(session.message.text)) {
        session.endDialog("You like other foods too?  Awesome!  But pizza is the best!");
    } else {
        session.endDialog("Who doesn't like pizza?!");
    }


});

bot.dialog("NotAccepted", function(session) {
    let noButRegex = /but|although|better/gi;
    if (noButRegex.test(session.message.text)) {
        session.endDialog("True, there's foods other than pizza.  There's something for everyone!");
    } else {
        session.endDialog("Well, pizza's not for everyone, I guess...");
    }

});

*/

// Middleware for logging
bot.use({
    receive: logMessage.receive,
    send: logMessage.send
});

module.exports = bot;