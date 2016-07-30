const WebSocket = require('ws');

if	(process.argv.length!=6)
	{	console.error('USE: nodejs client.js n_connections ws://some.host.com:port/path session_key talk_interval_in_seconds');
		process.exit(1); }
const n_connections=process.argv[2];
const url = process.argv[3];
const session_key = process.argv[4];
const talk_interval=process.argv[5];

var sockets=[];

function talk(i,ws){ return function(){
	console.error(new Date().toISOString() + ' setting interval for connection ' + i);
	setInterval(
		function(){
			if	(!(Math.floor(Math.random()*talk_interval)))
				ws.send(JSON.stringify({message: Math.random()})); }
		, 1000); }}

for	(var i=0;i<n_connections;i++)
	{	//var ws = new WebSocket(url+'?session_key='+session_key);
		var ws = new WebSocket(
			url+'?session_key='+session_key,
			null,
			{ rejectUnauthorized: false });
		ws.on('error',function(error){
			console.error(new Date().toISOString() + ' ' + error); });
		ws.on('close',function(code,message){
			console.error(new Date().toISOString() + ' socket closed: ' + code + ' ' + message); });
		ws.on('open', talk(i,ws));
		ws.on('message',function(data,flags){
			//if	(flags.binary)
				//console.log(new Date().toISOString() + ' binary data received');
			//	else console.log(new Date().toISOString() + ' ' + data); });
			json=JSON.parse(data);
			console.log(new Date().toISOString() + ' ' + json.user + ': '+json.message); });
		sockets[i]=ws; }

//IN GOD WE TRVST.
