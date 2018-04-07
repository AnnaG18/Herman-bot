 'use strict';

const request = require('request');

module.exports = (session, args, next) => {
    session.sendTyping();
    const question = session.message.text;
    const bodyText = JSON.stringify({question: question});
    const uri = `https://westus.api.cognitive.microsoft.com/qnamaker/v1.0/knowledgebases/${process.env.KBID}/generateAnswer`;
    console.log(uri);

    request.post(uri, { body: bodyText }, (err, code, body) => {
        if(err) {
            console.log(err);
            session.endConversation('Entschuldige, etwas ist schiefgegangen.');
        } else {
            const response = JSON.parse(body);
    console.log(response);
    if(response.score > 75) {
        session.endConversation(response.answer);
    } else if (response.score > 0) {
        session.send(`Ich bin nicht sicher aber ...`);
        session.endConversation(response.answer);
    } else {
        session.endConversation(`Oh nein, dafür habe ich keine Antwort. Aber frag mich was zum Studium`);
    }
}
}).setHeader('Ocp-Apim-Subscription-Key', process.env.SUBSCRIPTION_KEY);
};
