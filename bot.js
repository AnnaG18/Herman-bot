const builder = require('botbuilder');

const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// set up default dialog to use QnA Maker
const bot = new builder.UniversalBot(connector, require('./qnadialog.js'));
const logMessage = require('./middleware/logMessages');

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded && message.membersAdded.length > 0) {
        // Only send message if the bot is added to the conversation.
        const isBotAdded = message.address.bot.id === message.membersAdded[0].id;
        if (!isBotAdded) {
            return;
        }

        // Say hello
        const isGroup = message.address.conversation.isGroup;
        const txt = isGroup ? "Hallo zusammen!" : "Hallo, ich bin Herman. Du kannst mir Fragen zum Services Computing Studium stellen.";
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
                    .text("Auf Wiedersehen! Bis zum nächsten Mal.");
                bot.send(reply);
                break;
            }
        }
    }
});

// Middleware for logging
bot.use({
    receive: logMessage.receive,
    send: logMessage.send
});

module.exports = bot;