const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');
const js_string_escape = require('js-string-escape');
const morgan = require('morgan');

const site_conf = require('./site_conf.js');
const setuidgid = require('../setuidgid.js');

var _http;

var _express = express();
var access_log = fs.createWriteStream(site_conf.access_log, { flags: "a" });
_express.use(morgan('combined', { stream: access_log }));

_express.use('/public',express.static(__dirname + '/public'));

function html(request,response){
	response.header('Content-Type','text/html');
		response.send(
'<!DOCTYPE html>\n'+
'<html>	<head>	<meta charset="UTF-8"/>\n'+
'		<meta	name="vieport"\n'+
'			content="width=device-width, initial-scale=1.0"/>\n'+
'		<link rel="stylesheet" type="text/css" href="public/chat.css"/>'+
'		<title>Chat</title>\n'+
'		<script type="text/javascript">\n'+
'			var chat_server="' + site_conf.ws_server_proto + "://" + site_conf.ws_server_hostname + ":" + site_conf.ws_server_port + '";\n'+
'			var session_key="'+js_string_escape(request.query.session_key,'"')+'";\n'+
'			</script>\n'+
'		<script src="/public/chat.js"></script>\n'+
'		</head>\n'+
'	<body>	<div id="user_id"></div>\n'+
'		<div id="chat_log"></div>\n'+
'		<div	id="controls">\n'+
'			<input	id="input_text"\n'+
'				onkeypress="if (event.keyCode==13) send_message();"/>\n'+
'			<input id="send" type="button" value="send"/>\n'+
'			</div>\n'+
'			</body>\n'+
'			</html>'+
'<!--IN GOD WE TRVST.-->'); }

_express.get('/chat',html);

if	(site_conf.cert)
	{	const credentials={key: site_conf.key, cert: site_conf.cert, ca: site_conf.ca};
		_http = https.createServer(credentials,_express); }
	else _http = http.createServer(_express);
if	(!_http.listen(site_conf.port))
	{	_http.once('listening',function(){
			setuidgid(site_conf.user,site_conf.group);
			console.error(new Date().toISOString()+" process " + process.pid + " listening on port " + site_conf.port); }); }
	else	{	setuidgid(site_conf.user,site_conf.group);
			process.on('SIGUSR2',function(){
				process.kill(process.pid,'SIGHUP'); });
			console.error(new Date().toISOString()+" worker process " + process.pid + " listening https on port " + site_conf.port); }

//IN GOD WE TRVST.
