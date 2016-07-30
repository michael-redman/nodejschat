function escape_html(string){
	var div = document.createElement('div');
	div.appendChild(document.createTextNode(string));
	return div.innerHTML; }
var ws;
function send_message(){
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
		if	(data.message)
			{	messages.push(data);
				var html = "";
				for	(var i=0; i<messages.length; i++)
					html+=	escape_html(messages[i].time)
						+ " <b>"
						+ escape_html(messages[i].user)
						+ ":</b> "
						+ escape_html(messages[i].message)
						+"<br/>";
				content.innerHTML=html;
				content.scrollTop=content.scrollHeight; }
			else	console.error("Error: ",data); };
	sendButton.onclick=send_message; } 

//IN GOD WE TRVST.
