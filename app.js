
const restify = require('restify');
require('dotenv').config();

const bot = require('./bot.js');

//Set up Restify Server
const server = restify.createServer();

//Listen for messages from user
server.post('/api/messages', bot.connector('*').listen());
server.listen(process.env.PORT, () => {
    console.log(`${server.name} listening to ${server.url}`);
});