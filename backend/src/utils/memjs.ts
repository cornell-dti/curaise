const memjs = require("memjs");

// Configure the target memcache server for memjs client
// Note that the env variables MEMCACHIER_SERVERS, MEMCACHIER_USER, MEMCACHIER_PASSWORD are only available in prod
// When testing locally ensure that u have memcache installed and initialized by running:
//	- `brew install memcached`
//  - `brew services start memcached`
//	- `brew services list` to check that Memcached is running
// https://devcenter.heroku.com/articles/expressjs-memcache
const memclient = memjs.Client.create(process.env.MEMCACHIER_SERVERS, {
	// Automatic failover to backup servers if primary server is unavailable
	failover: true, // default: false

	// Timeout for memcache ops
	timeout: 1, // default: 0.5 (seconds)

	// Maintain persistent TCP connection to the memcache server (avoid new connection on each request)
	keepAlive: true, // default: false
});

export default memclient;
