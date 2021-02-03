import redis         from 'redis'
import { promisify } from 'util'

const client = redis.createClient(process.env.REDIS as any);

client.get = promisify(client.get).bind(client) as any;
client.set = promisify(client.set).bind(client) as any;

export default client;
