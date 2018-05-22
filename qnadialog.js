const request = require('request-promise-native');

const qnaAppId = process.env.APPID;
const qnaURL = `https://herman.azurewebsites.net/qnamaker/knowledgebases/${qnaAppId}/generateAnswer`;

/**
 * @param {Session} session
 * @param args
 * @returns {Promise<void>}
 */
const qnaDialog = async (session, args) => {
    // Let the user know that the bot is thinking
    session.sendTyping();

    // Prepare request to QNAMaker
    const {message} = session;
    const {text: question} = message;
    const reqBody = {question};

    const options = {
        method: 'POST',
        uri: qnaURL,
        body: reqBody,
        json: true,
        headers: {
            'Authorization': `EndpointKey ${process.env.KBAUTH}`
        }
    };

    try {

        // Send request. Promise rejections are handled in catch
        const response = await request(options);

        // Let the user know that the bot is thinking
        session.sendTyping();

        // Extract data from response
        const {answers} = response;
        const [bestAnswer] = answers;
        const {score, answer} = bestAnswer;

        let message;

        // Handle the top answer found by QNAMaker
        if (score > 75) {
            message = answer;
        } else if (score > 0) {
            message = "Ich bin nicht sicher aber ...\n\n" + answer;
        } else {
            message = `Oh nein, dafür habe ich keine Antwort. Aber frag mich was zum Studium`;
        }

        // This is only QNA, so end the conversation with the answer.
        session.endConversation(message);
    } catch(err) {
        console.log(err, 'error');
        session.endConversation('Entschuldige, etwas ist schiefgegangen.');
    }
};

module.exports = qnaDialog;
