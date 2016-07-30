const fs = require('fs');

module.exports = {
	port: 56411,
	user: 'nodejschat',
	group: 'nogroup',
	access_log: '/var/log/nodejschat/access_log',
	control_pid_file: '/tmp/nodejschat_http_server.pid',
	ws_server_proto: 'wss',
	ws_server_hostname: 'localhost',
	ws_server_port: '56412',
	cert: fs.readFileSync('ssl/cert.pem'),
	key: fs.readFileSync('ssl/key.pem'),
	//cert: fs.readFileSync('../private/compute-1_michael-redman_name.crt'),
	//key: fs.readFileSync('../private/compute-1.michael-redman.name.key'),
/*	ca: [
		fs.readFileSync('../private/AddTrustExternalCARoot.crt','utf8'),
		fs.readFileSync('../private/COMODORSAAddTrustCA.crt','utf8'),
		fs.readFileSync('../private/COMODORSADomainValidationSecureServerCA.crt','utf8') ],*/
	};
