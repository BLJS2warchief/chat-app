$(function() {
	document.getElementById("txtUserName").value = "";
	document.getElementById("txtMessage").value = "";
	document.getElementById("txtUserName").focus();
	document.getElementsByClassName("divChat")[0].id = "main";
	document.getElementById("tabMain").userId = "main";
	document.getElementById("tabMain").unread = 0;
	document.getElementById("tabMain").style.backgroundColor = "#ddd";
	document.getElementById("tabMain").addEventListener("click", changeRoom);
	document.getElementById("btnSend").addEventListener("click", sendMessage);
	document.getElementById("btnJoin").addEventListener("click", joinChat);
	document.getElementById("txtMessage").disabled = "true";
	document.getElementById("txtMessage").addEventListener("keydown", function(event) {
        if (event.keyCode === 13) {
			event.preventDefault();
			if(document.getElementById("txtMessage").value != ""){
				document.getElementById("btnSend").click();
			}
        }
    });
	document.getElementById("txtUserName").addEventListener("keydown", function(event) {
        if (event.keyCode === 13) {
			event.preventDefault();
			if(document.getElementById("txtUserName").value != "" && !(document.getElementById("txtUserName").value.includes("'"))){
				document.getElementById("btnJoin").click();
			}
        }
	});
	
	var userId, userCount;
	var uniqueChatSet;
	var roomName = "main";
	// changeRoomName(roomName);
	var joined = false;
	var socket = io();

	
	function joinChat(){
		console.log(document.getElementById("txtUserName").value)
		if(!document.getElementById("txtUserName").value.includes("'") && document.getElementById("txtUserName").value != "main"){
			socket.emit("add user", document.getElementById("txtUserName").value);
		}
	}

	function leaveChat(){
		if(joined){
			if(confirm("You are about to leave the chat")){
				socket.emit("leave chat");
				joined = false;
				location.reload();
			}
		}
	}

	// function skipJoin(userId){
	// 	document.getElementById("divGreeting").innerHTML = userId;
	// 	document.getElementById("btnJoin").removeEventListener("click", joinChat);
	// 	document.getElementById("btnJoin").id = "btnLeave";
	// 	document.getElementById("btnLeave").innerHTML = "Leave";
	// 	document.getElementById("btnLeave").addEventListener("click", leaveChat);
	// 	document.getElementById("txtMessage").disabled = false;
	// 	document.getElementById("btnSend").disabled = false;
	// }

	function handleJoinChat(){
		console.log(status);
		joined = true;
		document.getElementById("divGreeting").innerHTML = userId;
		document.getElementById("btnJoin").id = "btnLeave";
		document.getElementById("btnLeave").innerHTML = "Leave";
		document.getElementById("btnLeave").addEventListener("click", leaveChat);
		document.getElementById("txtMessage").disabled = false;
		document.getElementById("btnSend").disabled = false;
		document.getElementById("txtMessage").focus();
	}

	// function changeRoomName(roomName){
	// 	document.getElementById("roomInfoDiv").innerHTML = roomName;
	// }

	function sendMessage(){
		if(joined && !(document.getElementById("txtMessage").value.includes("'"))){
			messagetext = document.getElementById("txtMessage").value;
			// message.userId = userId;
			// message.text = document.getElementById("txtMessage").value;
			// addSelfMessage(messagetext);
			socket.emit("message", messagetext);
			document.getElementById("txtMessage").value = "";
			// document.getElementById("txtMessage").focus = true;
		}
	}

	function handleNewUser(newUserId){
		newUser = document.createElement("div");
		newUser.id = "divNewUserMsg";
		// newUser.innerHTML = newUserId + " joined the chat";
		newUser.innerHTML = "'" + newUserId + "' joined the chat";
		divChat = document.getElementsByClassName("divChat")[0];
		divChat.appendChild(newUser);
		// divChat.scrollTop = divChat.scrollHeight;

		if(document.getElementById(newUserId)){
			newUser = document.createElement("div");
			newUser.id = "divNewUserMsg";
			newUser.innerHTML = "'" + newUserId + "' joined the chat";
			document.getElementById(newUserId).appendChild(newUser);
			// document.getElementById(newUserId).scrollTop = divChat.scrollHeight;
		}
	}

	function handleUserLeft(leavingUserId){
		leavingUser = document.createElement("div");
		leavingUser.id = "divNewUserMsg";
		leavingUser.innerHTML = "'" + leavingUserId + "' left the chat";
		// leavingUser.innerHTML = leavingUserId + " left the chat";
		divChat = document.getElementsByClassName("divChat")[0];
		divChat.appendChild(leavingUser);
		// divChat.scrollTop = divChat.scrollHeight;

		if(document.getElementById(leavingUserId)){
			leavingUser = document.createElement("div");
			leavingUser.id = "divNewUserMsg";
			leavingUser.innerHTML = "'" + leavingUserId + "' left the chat";
			document.getElementById(leavingUserId).appendChild(leavingUser);
			// document.getElementById(leavingUserId).scrollTop = divChat.scrollHeight;
		}
	}

	function handleNewMessage(message){
		// console.log("look at this -> " + message.length);
		// console.log(message);
		tabBtns = document.getElementsByClassName("tabBtn");
		// init = txt.indexOf('(');
		// fin = txt.indexOf(')');
		for(var i = 0; i < message.length; i++){
			// console.log(i);
			newMessage = document.createElement("div");
			newMessage.id = "newMessage";
			newMessage.innerHTML = message[i].from + ": " + message[i].text;
			newMessageTime = document.createElement("div");
			newMessageTime.id = "newMessageTime";
			newMessageTime.innerHTML = message[i].time;
			if(message[i].to == "main"){
				// console.log(message[i].from);
				divChat = document.getElementById("main");
				divChat.appendChild(newMessage);
				newMessage.appendChild(newMessageTime);
				for(var j = 0; j < tabBtns.length; j++){
					if(tabBtns[j].userId == "main" && message[i].from != userId && roomName != "main"){
						// console.log("adding unread notif");
						messageTab = tabBtns[j];
						messageTab.unread++;
						messageTab.innerHTML = messageTab.userId + "(" + messageTab.unread + ")";
					}
				}
				// unread = messageTab.innerHTML;
				// unread = unread.substr((init+1,fin-init-1));
				// console.log("unread => " + unread);
				// divChat.scrollTop = divChat.scrollHeight;
			}
			else if(message[i].to == userId){
				// console.log(message[i].from);
				if(!document.getElementById(message[i].from)){
					temp = new Array();
					temp.push(message[i].from);
					handlePrevChatsUpdate(temp);
					document.getElementById(message[i].from).style.display = "none";
				}
				for(var j = 0; j < tabBtns.length; j++){
					// console.log("adding unread notif");
					if(tabBtns[j].userId == message[i].from && tabBtns[j].userId != roomName){
						messageTab = tabBtns[j];
						messageTab.unread++;
						messageTab.innerHTML = messageTab.userId + "(" + messageTab.unread + ")";
						break;
					}
				}
				divChat = document.getElementById(message[i].from);
				divChat.appendChild(newMessage);
				newMessage.appendChild(newMessageTime);
				// divChat.scrollTop = divChat.scrollHeight;
			}
			else if(message[i].from == userId){
				// console.log(message[i].from);
				if(!document.getElementById(message[i].to)){
					temp = new Array();
					temp.push(message[i].to);
					handlePrevChatsUpdate(temp);
					document.getElementById(message[i].to).style.display = "none";
				}
				// for(var j = 0; j < tabBtns.length; j++){
				// 	if(tabBtns[j].userId == message[i].to){
				// 		console.log("adding unread notif");
				// 		messageTab = tabBtns[j];
				// 		messageTab.unread++;
				// 		messageTab.innerHTML = messageTab.userId + "(" + messageTab.unread + ")";
				// 	}
				// }
				divChat = document.getElementById(message[i].to);
				divChat.appendChild(newMessage);
				newMessage.appendChild(newMessageTime);
				// divChat.scrollTop = divChat.scrollHeight;
			}
		}
		const audio = new Audio("bell.mp3");
		audio.play();
	}

	// function addSelfMessage(messagetext){
	// 	selfMessage = document.createElement("div");
	// 	selfMessage.id = "selfMessage";
	// 	selfMessage.innerHTML = messagetext;
	// 	divChat = document.getElementById("divChat");
	// 	divChat.appendChild(selfMessage);
	// 	divChat.scrollTop = divChat.scrollHeight;
	// }

	function handleMembersUpdate(userSet){
		document.getElementById("divMembers").innerHTML = "";
		userCount = userSet.length;
		for(var i = 0; i < userCount; i++){
			userBtn = document.createElement("button");
			userBtn.id = "userBtn";
			userBtn.className = "roomBtn";
			// userLink = document.createElement("a");
			// userLink.href = "";
			userBtn.addEventListener("click", changeRoom);
			userBtn.innerHTML = userSet[i];
			userBtn.userId = userSet[i];
			document.getElementById("divMembers").appendChild(userBtn);
			// document.getElementById("userDiv").appendChild(userLink);
		}
	}

	function changeRoom(evt){
		console.log(evt)
		if(evt.currentTarget.userId != userId){
			// console.log("---> " + evt.currentTarget.userId);
			// changeRoomName(evt.currentTarget.userId);
			tabBtns = document.getElementsByClassName("tabBtn");
			for(var i = 0; i < tabBtns.length; i++){
				tabBtns[i].style.background = "transparent";
			}
			if(document.getElementById(evt.currentTarget.userId)){
				console.log("exists");
				evt.currentTarget.style.backgroundColor = "#ddd";
			}
			else{
				chatSet = new Array();
				chatSet.push(evt.currentTarget.userId);
				handlePrevChatsUpdate(chatSet);
			}
			divChats = document.getElementsByClassName("divChat");
			for(var i = 0; i < divChats.length; i++){
				divChats[i].style.display = "none";
			}
			if(document.getElementById(evt.currentTarget.userId)){
				// console.log("exists");
				document.getElementById(evt.currentTarget.userId).style.display = "block";
			}
			// tabBtns = document.getElementsByClassName("tabBtn");
			// for(var i = 0; i < tabBtns.length; i++){
			// 	if(tabBtns[i].userI == ){
			// 		messageTab = document.getElementsByClassName("tabBtn");
			// 		messageTab.unread = 0;
			// 		messageTab.innerHTML = messageTab.userId;
			// 	}
			// }
			// evt.currentTarget.unread = 0;
			tabBtns = document.getElementsByClassName("tabBtn");
			for(var i = 0; i < tabBtns.length; i++){
				if(tabBtns[i].userId == evt.currentTarget.userId){
					// console.log("removing unread notif");
					messageTab = tabBtns[i];
					messageTab.unread = 0;
					messageTab.innerHTML = messageTab.userId;
					messageTab.style.backgroundColor = "#ddd";
				}
			}
			// evt.currentTarget.innerHTML = evt.currentTarget.userId;
			socket.emit("change room", evt.currentTarget.userId);
			roomName = evt.currentTarget.userId;
			// console.log(document.getElementById(evt.currentTarget.userId));
			// evt.currentTarget.style.display = "none";
			// console.log("roomName changed: " + roomName);
		}
		document.getElementById("txtMessage").focus();
	}

	function handlePrevChatsUpdate(chatSet){
		uniqueChatSet = Array.from(new Set(chatSet));
		for(var i = 0; i < uniqueChatSet.length; i++){
			if(uniqueChatSet[i] != "main"){
				var tabBtn = document.createElement("button");
				// var unreadDiv = document.createElement("div");
				tabBtn.className = "tabBtn";
				tabBtn.innerHTML = uniqueChatSet[i];
				tabBtn.userId = uniqueChatSet[i];
				tabBtn.unread = 0;
				tabBtn.style.background = "transparent";
				tabBtn.addEventListener("click", changeRoom);
				// unreadDiv.innerHTML = "14";
				// unreadDiv.id = "unreadDiv";
				// unreadDiv.className = "unreadDiv";
				var divChat = document.createElement("div");
				divChat.id = uniqueChatSet[i];
				divChat.className = "divChat";
				divChat.style.display = "none";
				document.getElementById("roomTabsDiv").appendChild(tabBtn);
				// tabBtn.appendChild(unreadDiv);
				document.getElementById("divAllChats").appendChild(divChat);
				// divChat.after(document.getElementById("main"));
			}
		}
	}

	socket.on("all members", (data) => {
		// console.log(data);
		handleMembersUpdate(data);
	});

	socket.on("prev chats", (data) => {
		// console.log(data);
		handlePrevChatsUpdate(data);
	});

	socket.on("new user", (data) => {
		// console.log(data);
		handleNewUser(data);
	});

	socket.on("join_status", (data) => {
		// console.log(data);
		if (data == true){
			userId = document.getElementById("txtUserName").value;
			handleJoinChat();
		}else{
			alert("Username exists, pick another");
			document.getElementById("txtUserName").value = "";
		}
	});

	socket.on("user left", (data) => {
		// console.log(data);
		handleUserLeft(data);
	});

	socket.on("welcome back", (data) => {
		// console.log(data);
		userId = data;
		handleJoinChat();
	});

	socket.on("new message", (data) => {
		// console.log(data[0]);
		// console.log(roomName);
		
		handleNewMessage(data);

		// if(data[0].to == "main" && roomName != "main"){
		// 	roomName = "main";
		// 	// console.log(data);
		// 	// console.log(document.getElementsByClassName("roomBtn"));
		// 	// if(data[0].to == "main"){
		// 		// console.log("main");
		// 		userBtn = document.getElementById("tabMain");
		// 		userBtn.click();
		// 	// }
		// }
		// if(data[0].to == "main"){
		// }
		// else if(data[0].from != roomName && data[0].from != userId){
		// 	// if() {
		// 		for(i = 0; i < userCount; i++){
		// 			userBtn = document.getElementsByClassName("roomBtn")[i];
		// 			// console.log(userBtn.userId);
		// 			// console.log(data[0].from);
		// 			if(userBtn.userId == data[0].from){
		// 				roomName = data[0].from;
		// 				userBtn.click();
		// 			}
		// 		}
		// 	// }
		// }
		// else if(data[0].to != roomName && data[0].to != userId){
		// 	// if() {
		// 		for(i = 0; i < userCount; i++){
		// 			userBtn = document.getElementsByClassName("roomBtn")[i];
		// 			// console.log(userBtn.userId);
		// 			// console.log(data[0].from);
		// 			if(userBtn.userId == data[0].to){
		// 				roomName = data[0].to;
		// 				userBtn.click();
		// 			}
		// 		}
		// 	// }
		// }
		
		// handleNewMessage(data);
	});
});