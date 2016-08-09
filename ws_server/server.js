const http = require('http');
const https = require('https');
const pg = require('pg');
const url = require('url');
const WebSocketServer = require('ws').Server;

const setuidgid=require('../setuidgid.js');
const site_conf = require('./site_conf.js');

var db, wss, n_sockets=0, sockets=[], users=[], rooms=[];

function authenticate(db,session_key,socket,success_callback,error_callback){
	db.query(
		'select sessions.user as user, sessions.room as room from sessions where key=$1::text',
		[session_key],
		function(err,result){
			if	(err)
				{	console.error(new Date().toISOString() + ' ' + err);
					error_callback(); }
				else	if	(result && result.rows.length>0 && typeof result.rows[0].user != undefined)
						{	console.error(new Date().toISOString() + ' In authenticate before add: users.length=' + users.length);
							sockets[n_sockets]=socket;
							users[n_sockets]=result.rows[0].user;
							rooms[n_sockets]=result.rows[0].room;
							n_sockets++;
							console.error(new Date().toISOString() + ' In authenticate after add: users.length=' + users.length);
							success_callback(); }
						else error_callback(); }); }

function pre_auth_close_handler(code,message){
	console.error(new Date().toISOString() + ' socket closed (unauthenticated user): '+code+' ' + message); }

function delete_from_array(ar,val){
	var index = ar.indexOf(val);
	if (index>-1) ar.splice(index,1); }

function broadcast(room,time,user,message){
	for	(var i=0; i<n_sockets; i++)
		{	if (rooms[i]!=room) continue;
			var client=sockets[i];
			if (client.readyState==client.OPEN) client.send(JSON.stringify({
				time: time,
				user: user,
				message: message})); }}

function db_notify_handler(msg){
	console.error(new Date().toISOString() +' Received notify, message ' + msg.payload);
	db.query(
		'select * from log where message_id=$1::integer',
		[msg.payload],
		function(err,result){
			if	(err)
				{	console.error(new Date().toISOString() + ' ' + err);
					return; }
			broadcast(
				result.rows[0].room,
				result.rows[0].time,
				result.rows[0].user,
				result.rows[0].message); }); }

module.exports = {
	init: function(){
		db  = new pg.Client(site_conf.db_url);
		db.connect(function(err){
			if	(err)
				{	console.error(new Date().toISOString() + ' ' + err);
					process.exit(1); }
			db.on('notification',db_notify_handler);
			db.query('listen nodejschat',function(err,result){
				if	(err)
					{	console.error(new Date().toISOString() + ' ' + err);
						process.exit(1); }});
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
			wss=new WebSocketServer({server: _http});
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
							var index=sockets.indexOf(ws);
							delete_from_array(users,users[index]);
							delete_from_array(rooms,rooms[index]);
							delete_from_array(sockets,ws);
							n_sockets--;
							console.error(new Date().toISOString() + ' Sockets array length after close: '+sockets.length);
							}})(ws,users[sockets.indexOf(ws)]));
						ws.removeListener('close',pre_auth_close_handler);
						ws.on('message',(function(user){ return function(message){
							var json=JSON.parse(message);
							console.error(new Date().toISOString() + ' received ('+user+'): ' + json.message);
							db.query(
								'select new_message($1::integer,now(),$2::text,$3::text)',
								[	rooms[sockets.indexOf(ws)],
									users[sockets.indexOf(ws)],
									json.message],
								function(err,result){
									if	(err)
										{	console.error(new Date().toISOString()+' '+err);
											ws.close(); } });
							}})(users[sockets.indexOf(ws)]));
						db.query(
							"select * from log where room=$1::integer order by time",
							[rooms[sockets.indexOf(ws)]],
							function(err,result){
								if (err) console.error(new Date().toISOString() + ' ' + err);
								if (!result) return;
								for	(var i=0; i<result.rows.length; i++)
									if (ws.readyState==ws.OPEN) ws.send(JSON.stringify({
										time: result.rows[i].time,
										user: result.rows[i].user,
										message: result.rows[i].message })); });
						if	(ws.readyState!=ws.CLOSING && ws.readyState!=ws.CLOSED)
							ws.send(JSON.stringify({ authenticated: true }));
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
