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

function logMessage(source, message) {
    const conversationId = message.address.conversation.id;
    const from = source === 'user' ? message.address.user.name : 'bot' ;
    const to = source === 'bot' ? message.address.user.name : 'bot';
    const conversation = conversations[conversationId] || createConversation(conversationId, {
        user: message.address.user,
        source: message.source,
    });
    conversation.messages.push(getMessageObjectFromEvent(from, to, message));

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
    let conversation;
    try{
        const existingConversation = await Conversation.findOne({id});
        if(existingConversation !== null) {
            conversation = existingConversation;
            //add messages from local conversation to db conversation
            conversation.messages = conversation.messages.concat(localConversation.messages);
        }else{
            conversation = localConversation;
        }
        //deletion of local conversation so we do not log messages twice.
        // Immediately delete (don't wait for save succes),
        // so we won't lose messages arriving in the meantime.
        delete conversations[id];
        await conversation.save();
    }
    catch(err){
        //  if an error occurs while saving (network gone, etc.), re-add the local conversation
        // so we have another got at saving at a later time.
        // Only do this if the conversation was deleted before.
        if(!id in conversations){
           conversations[id] = localConversation;
        }
        console.warn(`Error saving conversation with id ${id}.`, err);
    }
}

const logger = (source) => (event) => {

    switch (event.type) {
        case 'message':
            //console.log( event,  'source');
            logMessage(source, event);
           // saveConversation(event.address.conversation.id);
            break;
        case 'endOfConversation':
            saveConversation(event.address.conversation.id);
            break;
    }
};

module.exports = {
    send: logger('bot'),
    receive: logger('user'),
    persist: (id) => {
        saveConversation(id)
    },
    deleteConversation: (id) => {
        delete conversations[id];
    }
};
