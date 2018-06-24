const builder = require('botbuilder');
const botMsg = require('./messages/de_DE');

const acceptDsgvoRegex = /ok|ja|zustimmen|akzeptieren|klar|affirmativ|positiv/gi;

const acceptDsgvo = [
    function (session) {
        const msg = new builder.Message(session)
            .text(botMsg.AcceptDSGVO)
            .suggestedActions(
                builder.SuggestedActions.create(
                    session, [
                        builder.CardAction.imBack(session, botMsg.accept, botMsg.accept)
                    ]
                )
            );
        builder.Prompts.text(session, msg, ["akzeptieren"]);
    },
    function (session, results) {
        if (acceptDsgvoRegex.test(results.response)) {
            session.privateConversationData.userAcceptedDSGVO = true;
            session.send(botMsg.acceptedDSGVO);
            session.send(botMsg.StartQnA);
            session.endDialog();
        } else {
            session.reset();
        }
    }
];

module.exports = acceptDsgvo;