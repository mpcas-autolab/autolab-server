
/* Insert protocol here */
var m_code_list = []

var webSocketClient = require('websocket').client;
var ws = new webSocketClient();
var wifi_connection;
var transmit;

ws.on('connectFailed', function(error) {
    console.log('Websocket connect Error: ' + error.toString());
});
ws.on('connect', function(conn) {
    console.log('- WebSocket connected');
    wifi_connection = conn;
	transmission();

    conn.on('message', function(message){
		process.stdin.once('data', function () {
 			transmission();
    	});
    });
    
    function sendText(output) {
        if (conn.connected) {
            conn.sendUTF(output);
        }
    }
}); 
ws.connect('ws://192.168.4.1:80/');

function transmission(){
	if( (transmit = m_code_list.shift()) != null ){ 
		console.log("Sending: " + transmit + " \t \t  -   Next: " + m_code_list[0]);

		if (transmit.charAt(0) !== '#' ){
			wifi_connection.sendUTF( transmit );
		}
		else {
			process.stdin.once('data', function () {
 				transmission();
    		});
		}
	}
}
