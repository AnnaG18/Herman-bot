const mongoose = require('mongoose');
mongoose.connect(process.env.LOGGING_DB).catch(err => console.warn(`Could not connect to logging database. Reason: `, err));

const Message = new mongoose.Schema({
    text: String,
    from: String,
    to: String,
    timestamp: Date
});

const Conversation = mongoose.model('Conversation', {
    id: String,
    messages: [Message],
    user: Object,
    source: String
});

const conversations = {};

function createConversation(id, data) {
    if (!(id in conversations)) {
        const conversation = new Conversation({
            id,
            messages: [],
            user: data.user,
            source: data.source,
        });

        conversations[id] = conversation;
        return conversation;
    }
}

function logMessage(source, event) {
    const conversationId = event.address.conversation.id;
    const from = source === 'user' ? event.address.user.name : 'bot' ;
    const to = source === 'bot' ? event.address.user.name : 'bot';
    const conversation = conversations[conversationId] || createConversation(conversationId, {
        user: event.address.user,
        source: event.source,
    });
    conversation.messages.push(getMessageObjectFromEvent(from, to, event));

    return conversation;
}

function getMessageObjectFromEvent(from, to, event) {
    return {
        text: event.text,
        from, to,
        timestamp: Date.now()
    };
}

async function saveConversation(id) {
    const localConversation = conversations[id];
    try{
        const conversation = await Conversation.findOne({id});
        if(conversation !== null) {
            //add messages from local conversation to db conversation
            conversation.messages = conversation.messages.concat(localConversation.messages);
            conversation.save();

        }else{
            localConversation.save();
        }
        //deletion of local conversation so we do not log messages twice.
        // Immediately delete (don't wait for save succes),
        // so we won't lose messages arriving in the meantime.
        delete conversations[id];
    }
    catch(err){
        //  if an error occurs while saving (network gone, etc.), re-add the local conversation
        // so we have another got at saving at a later time.
        // Only do this if the conversation was deleted before.
        if(!id in conversations){
           conversations[id] = localConversation;
        }
            console.warn(` Error saving conversation with id $(id).`);
    }
}

const logger = (source) => (event, next) => {
    switch (event.type) {
        case 'message':
            logMessage(source, event);
            break;
        case 'endOfConversation':
            saveConversation(event.address.conversation.id);
            break;
    }

    next();
};

module.exports = {
    send: logger('bot'),
    receive: logger('user')
};
