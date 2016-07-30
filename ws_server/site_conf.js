const fs = require('fs');

module.exports = {
	//TCP
	db_url:'postgres://michael:somesecret@192.168.68.66/nodejschat',
	//Unix socket:
	/*db_url: {
		user: 'devel',
		host: '/var/run/postgresql',
		database: 'nodejschat' }, */
	port: 56412,
	user: 'nodejschat',
	group: 'nogroup',
	control_pid_file: '/tmp/nodejschat_ws_server.pid',
	cert: fs.readFileSync('ssl/cert.pem'),
	key: fs.readFileSync('ssl/key.pem'),
	//cert: fs.readFileSync('../private/compute-1_michael-redman_name.crt'),
	//key: fs.readFileSync('../private/compute-1.michael-redman.name.key'),
/*	ca: [
		fs.readFileSync('../private/AddTrustExternalCARoot.crt','utf8'),
		fs.readFileSync('../private/COMODORSAAddTrustCA.crt','utf8'),
		fs.readFileSync('../private/COMODORSADomainValidationSecureServerCA.crt','utf8') ],*/
	};
