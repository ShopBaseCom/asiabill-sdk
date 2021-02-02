const redis = require('redis');
const {promisify} = require('util');
const client = redis.createClient(process.env.REDIS);

client.get = promisify(client.get).bind(client);
client.set = promisify(client.set).bind(client);

export default client;
