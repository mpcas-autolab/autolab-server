
var cl = require(__dirname + '/modules/cl_module');

cl.clearHistory();
cl.title('Autolab server v1.´3','blue');


var argv = process.argv;
var debug_flag = 0;
var wifi_flag = 0;
var no_database = 0;
var login_req = 0;
var register_ena = 0;
var usb_disabled = 0;

//  no_usb,  reg,  no_db,  login,  wifi,  dbg
var argv_list = {
    NO_USB: {
        out: "   > USB DISABLED",
        set_vars: function() {
            usb_disabled = 1;
        }
    },

    REG: {
        out: "   > REGISTRATION ENABLED",
        set_vars: function() {
            register_ena = 1;
        }
    },

    NO_DB: {
        out: "   > NO DATABASE REQUIRED",
        set_vars: function() {
            no_database = 1;
        }
    },

    LOGIN: {
        out: "   > LOGIN REQUIRED",
        set_vars: function() {
            login_req = 1;
        }
    },

    WIFI: {
        out: "   > WIFI CONNECTION ENABLED",
        set_vars: function() {
            wifi_flag = 1;
        }
    },

    DBG: {
        out: "   > DEBUG MODE ACTIVE",
        set_vars: function() {
            debug_flag = 1;
        }
    }
};

if(argv[2]){
	if (argv[2] == "help") {
		console.log(" Available arguments:")
		for (n in argv_list){
			console.log("");
			console.log(" - " + n + argv_list[n].out);
		}
		process.exit(1);
	}
}

for (n in argv) {
    for (m in argv_list) {
        if (argv[n].toUpperCase() == m) {
            argv_list[m].set_vars();
            console.log(argv_list[m].out)
            console.log(' ');
        }
    }
}



/* Own modules */
var initport = require(__dirname + '/modules/serial_conn'); //Includes own method which uses serialport library to test which port the master MCU is connected to.
var protocol_parser = require(__dirname + '/modules/protocol_parser.js'); //Includes method for parsing command list to machine code (Non-standard) which the MCU can understand.
var item_parser = require(__dirname + '/modules/item_parser.js');



/* Node modules */
var url = require('url');
var http = require('http');
var path = require('path');
var filesys = require('fs');
var serialport = require('serialport');
var webSocketClient = require('websocket').client;

var express = require('express');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');

var bcrypt = require('bcrypt')
var passport = require('passport');
var passportLocal = require('passport-local');

/* General variables */
var mcu_flag = false;
var port, cb, cb_arg;
var parsed_list = [];
var item_list = [];
var new_list_interval;
var users_db;

/*Queue list variables*/
var max_no_lists = 3;
var last_list_number;
var chk_flag = 0;
var first_list = true;
var check_active_list_flag;
var centrifuge_busy = false;
var status_busy = false;
var linked_item = false;
var active_list = [];
var number_of_active_lists = 0;
for (i = 0; i < max_no_lists; i++) {
    item_list.push({});
    parsed_list.push({});
    active_list.push({});
    createActiveListElement(active_list[i]);
}



/* SETUP DATABASE */
if ( no_database === 0 ) {
    var mongoose = require('mongoose');
    mongoose.Promise = global.Promise;
    id2obj = mongoose.Types.ObjectId; 

    database = mongoose.createConnection('localhost', 'xargo');
    database.on('open', function() {
        users_db = database.collection('users');
        protocol_db = database.collection('protocols');
    });

    database.on('error', console.error.bind(console, 'connection error:'));
}


/* SETUP SERVER */
var app = express();

app.set( 'view engine', 'ejs' );
app.use( express.static(__dirname + '/public'));
app.use( cookieParser());
app.use( bodyParser.urlencoded({
    extended: false
}));
app.use( expressSession({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false
}));
app.use( flash());

app.use( passport.initialize());
app.use( passport.session());

var server = http.createServer(app);
server.listen(80)




/* AUTHENTICATION */
passport.use( new passportLocal.Strategy({
    passReqToCallback: true
}, function( req, username, password, next) {
    if ( no_database ) {
        console.log(" User automatically authenticated since database is disabled. ")
        next(null, {
            id: 1,
            name: username
        })
    } else if (users_db) {
        users_db.findOne({"username": username}, function(err, items) {
            if (items) {
                bcrypt.compare(password, items.password, function(err, res) {
                    if (err){
                        return next(err)
                    }
                    if (res) {//If match -> res == true
                        next(
                            null, 
                            {id: items._id, name: username}, 
                            req.flash('loginMessage', '')
                        );
                    }
                    else{
                        next(null, false, req.flash('loginMessage', 'Username or password incorrect!'));
                    }
                });
            } else {
                next(null, false, req.flash('loginMessage', 'Username or password incorrect!'));
            }
        });
    } else {
        console.log(" Not connected to users database");
    }

}));
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(function(id, done) {
    if ( no_database == 0 ){
        users_db.findOne( {"_id": id2obj(id)},function (err, user) {
            if( user ){
                done(null, {
                    id: id,
                    username: user.username
                });
            }
        });
    }
    else {
         done(null, { id: id });
    }
});

/*function leftApp(req, res, next) {

    if (req.method === 'GET' & req.isAuthenticated()){
        if (req.url != '/app') {
            req.logout();
        }
    }
    next();
}
app.use(leftApp);*/



/* HTML METHODS */
app.get('/', function(req, res) {
    if ( req.isAuthenticated() ){
        filesys.writeFile("req.txt", req.toString(), function(err) {});
        res.render('index', { login_status: req.user.username });
    }
    else{
        res.render('index', { login_status: "log in" });
    }
});
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/about', function(req, res) {
    res.render('about');
});

app.route('/register')
    .get(function(req, res) {
        req.flash('info', " ")
        res.render('register',{info:req.flash('info')});
    })
    .post(function(req, res) {
        if (register_ena & users_db.conn._hasOpened) {
            users_db.findOne({"username": req.body.username}, function(err, item) {
                if (!item){
                    bcrypt.hash(req.body.password, 10, function(err, hash) {
                        users_db.insertOne({
                            "username": req.body.username,
                            "password": hash
                        });
                        res.redirect('/')
                    });
                }
                else {
                    req.flash('info', "Username taken!")
                    res.render('register',{info:req.flash('info')});
                }
            });
        }
    })

app.route('/app')
    .get(function(req, res) {
        if (!login_req || req.isAuthenticated()) {
            res.render('robotapp');
        } else {
            res.render('login', {
                message: req.flash('loginMessage'),
                login_status: "log in"
            });
        }
    })
    .post(passport.authenticate('local', {
        failureRedirect: 'back'
    }), function(req, res) {
        res.redirect('/app');
    })

app.route('/login')
    .get(function(req, res) {
        if (req.isAuthenticated()) {
            req.logout();
            res.redirect('/');
        } else
            res.render('login.ejs', {
                message: req.flash('loginMessage')
            });
    })
    .post(passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    }));



/* SOCKETS */
var io = require('socket.io').listen(server);
var socket;
io.on('connection', function(in_socket) {
    socket = in_socket;
    socket.on('admitList', list_fn = function(list) { //Admit protocol for parsing (Server-sided) and forwarding to MCU
        console.log('\n Protocol received from user: ' + socket.id)
        protocol_list = list.protocol_list;

        if ( port || wifi_connection || debug_flag ) {
                if ((free_slot = existSlot()) > -1) { //Do not just delete/change existSlot(), sets first_list variable
                    number_of_active_lists++;

                    active_list[free_slot].active = true;
                    active_list[free_slot].bool = true;
                    active_list[free_slot].timestamp = Date.now();

                    item_parser.makeList(list, free_slot);
                    parsed_list[free_slot] = protocol_parser.makeList(protocol_list, free_slot);
                    console.log(parsed_list[free_slot])
                    for (n in parsed_list[free_slot]) {
                        active_list[free_slot].total_len += parsed_list[free_slot][n].length;
                    }

                    filesys.writeFile("latest_list.txt", JSON.stringify(parsed_list[free_slot]), function(err) {});

                    if ( first_list ) {
                        first_list = false;
                        sendList(free_slot);
                    } else {
                        defaultProceedList();
                    }
                } else{
                    console.log('\n No slot for list')
                }
        } 
        
    });

    socket.on('saveList', function(list) { //Accept protocol for local storage on server.
        saveList(socket, list);
    });

    socket.on('loadList', function(list_req) { //Accept protocol for local storage on server.
        loadList(socket, list_req);
    });

    socket.on('requestLists', function(req) { //Accept protocol for local storage on server.
        cl.out('User ' + socket.id + ' requested protocols.', "blue", 2)
        filesys.readdir(__dirname + /protocols/, function(err, data) {
            if (err)
                console.log(err)
            else {
                socket.emit('listNames', data);
                console.log(' Available protocols: ')
                for (n in data) {
                    console.log('  - ' + data[n])
                }
            }
        })
    });

});


/* ADMITTED LIST FUNCTIONS */
function createActiveListElement(e) {
    e.active = false; //Active until list is emptied
    e.bool = false; //Is in queue?
    e.prio = 1; //Priority in queue
    e.timestamp = 0; //Time of last call
    e.total_len = 0;
    e.sent_len = 0;
}

function existSlot() {
    var counter = 0;
    var return_value = -1;
    for (n in parsed_list) {
        if (active_list[n].active == false) {
            counter++;
            return_value = n;
        }
    }
    if (counter == max_no_lists) {
        first_list = true;
    }
    return return_value;
}

function saveList(socket, list) { //Function for saving protocol file
    protocol = list.protocol_list;
    items = list.item_list;
    name = list.name_list.name;
    
    var save_list = {
        protocol,
        items
    };

    filesys.writeFile(__dirname + '/protocols/' + name + '.txt', JSON.stringify(save_list), function(err) {
        if (err)
            console.log(err);
        else
            console.log('\n Data written to ' + name + '.txt by user:' + socket.id);
    });
}

function loadList(socket, protocol_name) { //Function for loading protocol file
    filesys.readFile(__dirname + '/protocols/' + protocol_name + '.txt', 'utf8', function(err, data) {
        if (err) {
            console.log(err);
        } else {
            cl.out(" Sending " + protocol_name + '.txt to user: ' + socket.id, 'blue', 2);
            //socket.to(socket.id).
            socket.emit('protocol', data);
        }
    });
}



/* MCU COMMUNICATIONS */
var wifi_connection;
var ws = new webSocketClient();
if (wifi_flag){

    ws.on('connectFailed', function(error) {
        console.log('Websocket connect Error: ' + error.toString());
    });
 
    ws.on('connect', function(conn) {
        console.log('- WebSocket connected');
        wifi_connection = conn;

        conn.on('message', function(message){
            handleInData(message,"wifi")
        });
    
        function sendText(output) {
            if (conn.connected) {
                conn.sendUTF(output);
            }
        }
    });
    console.log("Attempting websocket connection to MCU.")
    ws.connect('ws://192.168.4.1:80/');
}

if ( !usb_disabled ){
    searchPort();
} 
function searchPort(callback, cb_arg, socket) { // Search all COM units for MCU master, utilizes initport module
    initport.findSerial(
        function(port_adress) { //Calls initport with callback function for setting available port_adresses
            mcu_flag = (port_adress); //If a port adress exists mcu_flag is set to 1(TRUE);
            if (port_adress) {
                //setTimeout(function(){
                COMconnection(port_adress, callback, cb_arg, socket); //Attempts connection to found MCU master
                //}, 10); // Wait for port.close() from search function
            }
        }
    );
}
function COMconnection(port_adress, callback, cb_arg, socket) { // Connect to serial unit with standard settings (Parity, LSB, Bits, baudrate)
    console.log('\n Connecting to MCU at ' + port_adress);
    port = new serialport(port_adress, {
        baudRate: 115200
    });
    port.on('open', function() {
        setTimeout(function() {
            console.log('\n Ready for protocols, open slots: ' + max_no_lists);
            if (callback)
                callback(cb_arg, socket);
        }, 2000);
    })
    port.on('data', handleInData(data));
}

function handleInData(data, source){
    if ( source == "wifi"){
        data = data.utf8Data;
    }
    sender = data.toString().substring(0, 3);
    status_message = data.toString().substring(3, 4);

    if (status_message == 'U'){
        console.log(sender + " command incorrectly transferred.");
    }
    else if (status_message == 'F') {

        if (sender == "CTR") {
            active_list[last_centrifuge_caller].bool = true;
            active_list[last_centrifuge_caller].prio = 2;
            centrifuge_busy = false;
        }
        status_busy = false;

        defaultProceedList();
    }
}
function defaultProceedList() { // Decides what list (if any) to send next

    if (!status_busy) {
        list_number = last_list_number;

        if (!linked_item && check_active_list_flag) {

                highestPrio = 0;
                for (n in active_list){
                    if (active_list[n].active && active_list[n].bool) {

                        var ctr_flag = false;
                        if (centrifuge_busy){ //Check if upcoming list needs centrifuge
                            for (p in parsed_list[n][0]){
                                if (parsed_list[n][0][p].order == "CTR"){
                                    ctr_flag = true; //Set flag if centrifuge needed and busy
                                }
                            }
						}

                        if (!ctr_flag){

                            if ( active_list[n].prio == highestPrio ) { 
                                if (active_list[n].timestamp < active_list[list_number].timestamp) {
                                    list_number = n;
                                }
                            } 

                            else if ( active_list[n].prio > highestPrio ) {
                                    list_number = n;	
                            }

                        }


                    }
                }

            
        }

        linked_item = false;

        //if (active_list[list_number].bool){
        check_active_list_flag = false;
        sendList(list_number) //Calls the sendList() function to proceed with next machine command
        //}
    }
}

function sendList(list_number) { // Sends the first element of chosen list MCU master
    if ( port || wifi_connection || debug_flag ) {
        status_busy = true;
        last_list_number = list_number;
        active_list[list_number].sent_len++;

        current_message = parsed_list[list_number][0].shift();
        if (current_message.order != "LINK") {
            var transmit = "";
            for (n in current_message)
                transmit += current_message[n] + ":"; // Generate transmit of all objects in JSON with : as separator

            var tmp_message = "";
            for (var n in (active_list)) {
                if (active_list[n].active) {
                    var percentage = Math.floor(100 * active_list[n].sent_len / active_list[n].total_len);

                    var tmp_string = " L" + (max_no_lists - n) + ":[" + percentage + "%] --";
                    tmp_message += tmp_string;
                }
            }

            if ( port ) {
                port.write( transmit ); //Send the message
            }
            else if ( wifi_connection ){
                wifi_connection.sendUTF( transmit )
            }

            tmp_message += " sending: " + transmit + "                            \r";
            process.stdout.write(tmp_message);
        }


        if (current_message.order == "CTR") {
            active_list[list_number].bool = false;
            active_list[list_number].timestamp = Date.now();
            last_centrifuge_caller = list_number;
            check_active_list_flag = true;
            centrifuge_busy = true;
            status_busy = false;
        } else if (current_message.order == "INC" || current_message.order == "HOT" || current_message.order == "COL") {
            active_list[list_number].bool = false;
            check_active_list_flag = true;
            status_busy = false;

            var timeout_length = current_message.time * 1000 * 60;  // minutes to milliseconds
            if (current_message.order == "INC"){
                timeout_length = current_message.time * 1000 + 2000; // add 2000 milliseconds for incubator to stop and line up.
            }

            setTimeout(function() {
                active_list[list_number].bool = true;
                active_list[list_number].prio = 3;
                active_list[list_number].timestamp = Date.now()
                if ( (!debug_flag) ) {
                    defaultProceedList();
                }
            }, timeout_length); 
        } else {
            active_list[list_number].prio = 1;
        }


        if ( parsed_list[list_number][0].length == 0 ) {
            parsed_list[list_number].shift();
            active_list[list_number].timestamp = Date.now();
            check_active_list_flag = true;

            if ( parsed_list[list_number].length == 0 ) {
                cleanUpAfterList(list_number);
            }
            else if (current_message.order == "LINK") {
                linked_item = true;
                status_busy = false;
                if ( !debug_flag ) {
                    defaultProceedList();
                }
            }
        } 

    } 

    else {
        console.log("No connection with MCU!");
    }

    if ( (debug_flag) && (!port) && (!wifi_connection) && (active_list[list_number].active)) {
        console.log('Press any key to continue.');
        process.stdin.once('data', function () {
            sendList(list_number);
        });
        //setTimeout(function() {
            //sendList(list_number)
       // }, 200);
    }
}
function cleanUpAfterList(list_number) {
    active_list[list_number].active = false;
    active_list[list_number].bool = false;
    active_list[list_number].sent_len = 0;
    number_of_active_lists--;
    console.log('\n\n Finished list: ' + list_number);
}
