const memjs = require("memjs");

// Configure the target memcache server for memjs client
const memclient = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
	// MemCachier authentication (required in production)
	username: process.env.MEMCACHIER_USERNAME,
	password: process.env.MEMCACHIER_PASSWORD,

	// Automatic failover to backup servers if primary server is unavailable
	failover: true, // default: false

	// Timeout for memcache ops
	timeout: 1, // default: 0.5 (seconds)

	// Maintain persistent TCP connection to the memcache server (avoid new connection on each request)
	keepAlive: true, // default: false
});

export default memclient;
