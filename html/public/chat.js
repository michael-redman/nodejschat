function escape_html(string){
	var div = document.createElement('div');
	div.appendChild(document.createTextNode(string));
	return div.innerHTML; }
var ws;
var authenticated=0;
var log_html="", message_received=0;
function send_message(){
	if	(!authenticated)
		{	alert("Cannot send message yet because not yet authenticated.");
			return; }
	var text=input_text.value;
	ws.send(JSON.stringify({
		session_key: session_key,
		message: text}));
	input_text.value=''; }
window.onload = function(){
	var messages=[];
	var field = document.getElementById("input_text");
	var sendButton = document.getElementById("send");
	var content = document.getElementById("chat_log");
	var name = document.getElementById("name");
	setInterval(
		function(){
			if (!message_received) return;
			content.innerHTML=log_html;
			content.scrollTop=content.scrollHeight;
			message_received=0; },
		1000);
	//ws = new WebSocket(chat_server,{headers: { Cookie: 'nodejschat_session_key='+session_key}});
	ws = new WebSocket(chat_server+'?session_key='+session_key);
	ws.onerror=function(error){
		alert(new Date().toISOString() + ' ' + error); };
	ws.onclose=function(code,message){
		alert(new Date().toISOString() + ' socket closed: ' + code + ' ' + message); };
	ws.onopen=function(){ alert('Socket open'); };
	ws.onmessage=function(event){
		//if	(flags.binary)
			//console.log(new Date().toISOString() + ' binary data received');
		data=JSON.parse(event.data);
		if (data.authenticated) authenticated=1;
		if	(data.message)
			{	messages.push(data);
				var new_html=
					escape_html(data.time)
					+ " <b>"
					+ escape_html(data.user)
					+ ":</b> "
					+ escape_html(data.message)
					+"<br/>";
				log_html+=new_html;
				message_received=1; }
			else	console.error("Error: ",data); };
	sendButton.onclick=send_message; } 

//IN GOD WE TRVST.
