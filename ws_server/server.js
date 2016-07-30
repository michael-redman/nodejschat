const http = require('http');
const https = require('https');
const pg = require('pg');
const url = require('url');
const WebSocketServer = require('ws').Server;

const setuidgid=require('../share/setuidgid.js');
const site_conf = require('./site_conf.js');

var n_sockets=0, sockets=[], users=[];

function authenticate(db,session_key,socket,success_callback,error_callback){
	db.query(
		'select sessions.user as user from sessions where key=$1::text',
		[session_key],
		function(err,result){
			if	(err)
				{	console.error(new Date.toISOString() + ' ' + error);
					error_callback(); }
				else	if	(result.rows.length>0 && typeof result.rows[0].user != undefined)
						{	console.error(new Date().toISOString() + ' In authenticate before add: users.length=' + users.length);
							sockets[n_sockets]=socket;
							users[n_sockets]=result.rows[0].user;
							n_sockets++;
							console.error(new Date().toISOString() + ' In authenticate after add: users.length=' + users.length);
							success_callback(); }
						else error_callback(); }); }

function pre_auth_close_handler(code,message){
	console.error(new Date().toISOString() + ' socket closed (unauthenticated user): '+code+' ' + message); }

function delete_from_array(ar,val){
	var index = ar.indexOf(val);
	if (index>-1) ar.splice(index,1); }

module.exports = {
	init: function(){
		const db  = new pg.Client(site_conf.db_url);
		db.connect(function(err){
			if	(err)
				{	console.error(new Date().toISOString() + ' ' + err);
					server.close();
					process.exit(1); }
			var _http;

			if	(site_conf.cert)
				{	const credentials={key: site_conf.key, cert: site_conf.cert, ca: site_conf.ca};
					_http = https.createServer(credentials); }
				else _http = http.createServer();
			if	(!_http.listen(site_conf.port))
				{	_http.once('listening',function(){
						setuidgid(site_conf.user,site_conf.group);
						console.error(new Date().toISOString()+" process " + process.pid + " listening on port " + site_conf.port); }); }
				else	{	setuidgid(site_conf.user,site_conf.group);
						process.on('SIGUSR2',function(){
							process.kill(process.pid,'SIGHUP'); });
						console.error(new Date().toISOString()+" worker process " + process.pid + " listening https on port " + site_conf.port); }

			var wss=new WebSocketServer({server: _http});
			setuidgid(site_conf.user,site_conf.group);
			wss.on('error', function(error){
				console.error(new Date().toISOString() + ' ' + error); });
			process.on('SIGHUP',function(){
				wss.close();
				db.end();
				process.exit(0); });
			wss.on('connection',function connection(ws){
				ws.on('error', function(error){
					console.error(new Date().toISOString() + ' ' +error); });
				ws.on('close', pre_auth_close_handler);
				var session_key=url.parse(ws.upgradeReq.url,true).query.session_key;
				console.error(new Date().toISOString() + ' session key: ' + session_key);
				authenticate(db,session_key,ws,
					(function(ws){ return function(){
						ws.on('close',(function(ws,user){ return function(code,message){
							console.error(new Date().toISOString() + ' socket closed ('+user+'): '+code+' ' + message);
							console.error(new Date().toISOString() + ' Sockets array length before close: '+sockets.length);
							delete_from_array(users,users[sockets.indexOf(ws)]);
							delete_from_array(sockets,ws);
							n_sockets--;
							console.error(new Date().toISOString() + ' Sockets array length after close: '+sockets.length);
							}})(ws,users[sockets.indexOf(ws)]));
						ws.removeListener('close',pre_auth_close_handler);
						ws.on('message',(function(user){ return function(message){
							var json=JSON.parse(message);
							console.error(new Date().toISOString() + ' received ('+user+'): ' + json.message);
							wss.clients.forEach(function each(client){ if (client.readyState==client.OPEN) client.send(JSON.stringify({
								time: new Date().toISOString(),
								user: user,
								message: json.message})); });
							db.query('insert into chat_log values(now(),$1::text,$2::text)',[users[sockets.indexOf(ws)],json.message],function(err,result){
								if	(err)
									{	console.error(new Date().toISOString()+' '+err);
										ws.close(); } });
							}})(users[sockets.indexOf(ws)]));
						db.query("select * from chat_log",null,function(err,result){
							if	(err) {	console.error(new Date.toISOString() + ' ' + error); }
							for	(var i=0; i<result.rows.length; i++)
								if (ws.readyState==ws.OPEN) ws.send(JSON.stringify({
									time: result.rows[i].time,
									user: result.rows[i].user,
									message: result.rows[i].message })); });
						console.error(new Date().toISOString() + ' ' + users[sockets.indexOf(ws)]+' connected.');
						}})(ws),
					function(){
						console.error(new Date().toISOString() + ' could not authenticate');
						ws.close();
						}
					);
				});
			});
		}
	}

module.exports.init();

//IN GOD WE TRVST.
