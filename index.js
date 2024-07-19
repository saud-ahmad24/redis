const { createClient } = require('redis');

const client = createClient({
    host: '192.168.110.128',
    port: 6379
});

client.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
    try {
        await client.connect();
        console.log('Connected to Redis Server');

        await client.set("name", "Saud Shah");
        await client.set("age", 30);
        const cacheResults = await client.get("name");
        const cacheResults1 = await client.get("age");
        console.log(cacheResults, cacheResults1);
    } catch (error) {
        console.error('Failed to connect to Redis', error);
    }
})();
