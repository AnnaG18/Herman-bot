const request = require('request-promise-native');

const qnaAppId = process.env.APPID;
const qnaURL = `https://herman.azurewebsites.net/qnamaker/knowledgebases/${qnaAppId}/generateAnswer`;

/**
 * @param {Session} session
 * @returns {Promise<void>}
 */
const qnaDialog = async (session) => {

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
    // Let the user know that the bot is thinking
    session.sendTyping();
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
        if (score > 60) {
            message = answer;
        } else if (score > 0) {
            message = "Ich bin nicht sicher aber ...\n\n" + answer;
        } else {
            message = `Oh nein, dafür habe ich keine Antwort. Aber frag mich was zum Studium`;
        }
        session.message.attachment = 'save';
       /// console.log (session.message,message, 'testetst');
        session.send(message);


    } catch(err) {
        console.log(err, 'error');
        session.send('Entschuldige, etwas ist schiefgegangen.');
    }
};

module.exports = qnaDialog;
