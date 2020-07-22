const MAIN_MAX_SAVED_MESSAGES = 100;
const PRIVATE_MAX_SAVED_MESSAGES = 100;

var express = require('express');
var path = require('path');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var moment = require('moment');
var sqlite3 = require('sqlite3').verbose();
allUserIds = ["main"];

var db = new sqlite3.Database(':memory:', (err) => {
	if (err) {
		return console.error(err.message);
	}
	console.log('Connected to the in-memory SQlite database.');
});

db.run("CREATE TABLE messages (msgfrom TEXT, msgto TEXT, msgtext TEXT, msgtime TEXT)", [], function(err) {
	if (err) {
		  return console.log(err.message);
	}
	// get the last insert id
	console.log("A table has been created");
});

// db.close((err) => {
// 	if (err) {
// 		return console.error(err.message);
// 	}
// 	console.log('Close the database connection.');
// });

sharedsession = require("express-socket.io-session");

// prevMessages = new Array();
// prevMessagesCount = 0;
// console.log("Prev messages initialized");

session = require("express-session")({
    secret: "my-secret",
    resave: true,
    saveUninitialized: true
}),

app.use(session);
app.use(express.static(path.join(__dirname, 'public')));

io.use(sharedsession(session));

// app.get('/', function(req, res){
// });

io.on('connection', function(socket){
	var roomName = "main";
	prevChats = new Array();
	// socket.join(roomName);
	// console.log('a user connected');
	// console.log("# sockets connected = " + Object.keys(io.sockets.sockets).length);

	// if(Object.keys(io.sockets.sockets).length == 1) {
	// 	// io.sockets.roomId = new Array();
	// 	// io.sockets.roomId[roomName] = new Object();
	// }

	// if(io.sockets.roomId[roomName]){
	// 	if(prevMessagesCount > 0){
	// 		socket.emit('new message', io.sockets.roomId[roomName].prevMessages);
	// 	}
	// }

	if(socket.handshake.session.userId){
		// console.log(socket.handshake.session.userId);
		socket.emit("welcome back", socket.handshake.session.userId);
		userSet = new Array();
		// console.log('Connected user: ' + socket.handshake.session.userId);
		socket.userId = socket.handshake.session.userId;

		socket.broadcast.emit('new user', socket.userId);
		Object.keys(io.sockets.sockets).forEach(function(id) {
			// console.log("ID:",id);
			var socketObj = io.of("/").connected[id];
			// console.log("userId:", socketObj.userId);
			if(socketObj.userId){
				userSet.push(socketObj.userId);
			}
		});
		// console.log(userSet);
		io.emit('all members', userSet);
	}

	db.all("SELECT DISTINCT(msgto) as msgto FROM messages WHERE msgfrom='" + socket.userId + "' AND msgto!='main' UNION SELECT DISTINCT(msgfrom) as msgto FROM messages WHERE msgto='" + socket.userId + "'", [], (err, rows) => {
	// db.all("SELECT msgto FROM messages", [], (err, rows) => {
		if (err) {
			console.log("prevchats");
			return console.error(err.message);
		}
		rows.forEach((row) => {
			// console.log(row.msgto);
			var temp = row.msgto;
			prevChats.push(temp);
			// message.to = row.msgto;
		});
		if(prevChats.length > 0){
			// console.log(prevChats);
			socket.emit('prev chats', prevChats);
		}
	});
	
	// db.all("SELECT DISTINCT(msgfrom) FROM messages", [], (err, row) => {
	// // db.all("SELECT msgfrom FROM messages", [], (err, rows) => {
	// 	if (err) {
	// 		console.log("prevchats");
	// 		return console.error(err.message);
	// 	}
	// 	rows.forEach((row) => {
	// 		console.log(row.msgfrom);
	// 		var temp = row.msgfrom;
	// 		prevChats.push(temp);
	// 		// message.from = row.msgfrom;
	// 	});
	// });

	// for(i = 0; i < prevMessagesCount; i++){
	// 	if(prevMessages[i].to == socket.userId){
	// 		prevChats.push(prevMessages[i].from);
	// 	}
	// 	else if(prevMessages[i].from == socket.userId && prevMessages[i].to != "main"){
	// 		prevChats.push(prevMessages[i].to);
	// 	}
	// }

	// if(prevChats.length > 0){
	// }

	sendMessageSet = new Array();

	// console.log("look only at this");
	// for(i = 0; i < prevMessagesCount; i++){
	// 	// console.log(prevMessages[i] + " ===== " + socket.userId);
	// 	if(prevMessages[i].to == socket.userId || prevMessages[i].from == socket.userId || prevMessages[i].to == "main"){
	// 		sendMessageSet.push(prevMessages[i]);
	// 	}
	// }

	db.all("SELECT * FROM messages WHERE msgto='" + socket.userId + "' OR msgfrom='" + socket.userId + "'OR msgto='main'", [], (err, rows) => {
		if (err) {
			console.log("prevmessages");
			return console.error(err.message);
		}
		rows.forEach((row) => {
			message = new Object();
			message.from = row.msgfrom;
			message.to = row.msgto;
			message.text = row.msgtext;
			message.time = row.msgtime;
			sendMessageSet.push(message);
			// console.log(message);
		});
		if(sendMessageSet.length > 0){
			socket.emit('new message', sendMessageSet);
		}
	});

	// console.log(sendMessageSet);

	socket.on("add user", function(userId){
		// console.log("let me check your name, " + userId);
		if(!allUserIds.includes(userId)){
			socket.emit('join_status', true);
			allUserIds.push(userId);
			userSet = new Array();
			// console.log('Connected user: ' + userId);
			socket.userId = userId;

			socket.handshake.session.userId = userId;
			socket.handshake.session.save();
			// console.log("Session variable saved");

			io.emit('new user', socket.userId);
			Object.keys(io.sockets.sockets).forEach(function(id) {
				// console.log("ID:",id);
				var socketObj = io.of("/").connected[id];
				// console.log("userId:", socketObj.userId);
				if(socketObj.userId){
					userSet.push(socketObj.userId);
				}
			});
			// console.log(userSet);
			io.emit('all members', userSet);
		}
		else{
			socket.emit('join_status', false);
		}
	});

	socket.on("message", (messageTxt) => {
		// console.log(socket.userId + ": " + message);

		// console.log(typeof(io.sockets.roomId[roomName].prevMessages) + " vfvbk " + io.sockets.roomId[roomName].prevMessages);
		message = new Object();
		message.from = socket.userId;
		message.to = roomName;
		message.text = messageTxt;
		message.time = moment().format('MMMM Do YYYY, h:mm:ss a');
		// prevMessages.push(message);
		// if(prevMessagesCount == MAX_SAVED_MESSAGES){
		// 	prevMessages.shift();
		// }
		// else{
		// 	prevMessagesCount++;
		// }

		db.run(`INSERT INTO messages(msgfrom, msgto, msgtext, msgtime) VALUES(?, ?, ?, ?)`, [socket.userId, roomName, messageTxt, moment().format('MMMM Do YYYY, h:mm:ss a')], function(err) {
			if (err) {
				console.log("insert");
			  	return console.log(err.message);
			}
			// get the last insert id
			console.log(`A row has been inserted with rowid ${this.lastID}`);
		});

		// db.all("SELECT DISTINCT(msgfrom) FROM messages", [], (err, rows) => {
		// 	if (err) {
		// 		return console.error(err.message);
		// 	}
		// 	rows.forEach((row) => {
		// 		message = new Object();
		// 		message.from = row.msgfrom;
		// 		message.to = row.msgto;
		// 		message.text = row.msgtext;
		// 		message.time = row.msgtime;
		// 		console.log(message);
		// 	});
		// });

		// db = new sqlite3.Database(':memory:', (err) => {
		// 	if (err) {
		// 		return console.error(err.message);
		// 	}
		// 	console.log('Connected to the in-memory SQlite database to add a message.');
		// });

		// stmt = db.prepare("INSERT INTO messages(msgfrom, msgto, msgtxt, msgtime) VALUES (" + socket.userId + "," + roomName + "," + messageTxt + "," + messageTime + ")");
		// stmt.run();

		// db.close((err) => {
		// 	if (err) {
		// 	  	return console.error(err.message);
		// 	}
		// 	console.log('Close the database connection.');
		// });

		// db = new sqlite3.Database(':memory:', (err) => {
		// 	if (err) {
		// 		return console.error(err.message);
		// 	}
		// 	console.log('Connected to the in-memory SQlite database to read all messages.');
		// });

		// // console.log("hai");
		// sql = ;
		// console.log(sql);

		// db.close((err) => {
		// 	if (err) {
		// 	  	return console.error(err.message);
		// 	}
		// 	console.log('Close the database connection.');
		// });
		
		// db.each("SELECT * FROM messages", function(err, row) {
		// 	message = new Object();
		// 	message.from = row.msgfrom;
		// 	message.to = row.msgto;
		// 	message.text = row.msgtext;
		// 	message.time = row.msgtime;
		// 	console.log(message);
		// });
		// console.log(prevMessages);

		newMessage = new Array();
		newMessage.push(message);
		if(roomName != "main"){
			socket.emit('new message', newMessage);
			Object.keys(io.sockets.sockets).forEach(function(id) {
				// console.log("ID:",id);
				var socketObj = io.of("/").connected[id];
				// console.log("userId:", socketObj.userId);
				if(socketObj.userId == message.to){
					socketObj.emit('new message', newMessage);
				}
			});
		}
		else {
			io.emit('new message', newMessage);
		}
		
	});

	socket.on("change room", function(data){
		// console.log(data);
		if(data == "main") {
			roomName = "main"
		}
		else {
			// socket.join("a");
			roomName = data;
		}

		// sendMessageSet = new Array();

		// for(i = 0; i < prevMessagesCount; i++){
		// 	if(roomName != "main"){
		// 		if((prevMessages[i].to == socket.userId && prevMessages[i].from == roomName) || (prevMessages[i].to == roomName && prevMessages[i].from == socket.userId)){
		// 			sendMessageSet.push(prevMessages[i]);
		// 		}
		// 	}
		// 	else{
		// 		if(prevMessages[i].to == roomName){
		// 			sendMessageSet.push(prevMessages[i]);
		// 		}
		// 	}
		// }

		// if(prevMessagesCount > 0){
		// 	socket.emit('new message', sendMessageSet);
		// }
	});

	socket.on("leave chat", function(){
		userSet = new Array();

		delete socket.handshake.session.userId;
		socket.handshake.session.save();
		socket.disconnect(true);

		Object.keys(io.sockets.sockets).forEach(function(id) {
			// console.log("ID:",id);
			var socketObj = io.of("/").connected[id];
			// console.log("userId:", socketObj.userId);
			if(socketObj.userId){
				userSet.push(socketObj.userId);
			}
		});
		
		io.emit('all members', userSet);
	});

	socket.on("disconnect", function(){
		// console.log('user disconnected');
		io.emit('user left', socket.userId);
	});
	
});

http.listen(3000, '0.0.0.0', function(){
	console.log('listening on *:3000');
});