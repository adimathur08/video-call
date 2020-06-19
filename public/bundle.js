(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// let Peer = require('simple-peer');

const socket = io();
// import Peer from 'simple-peer';

const message = document.getElementById('message'),
    handle = document.getElementById('handle'),
    output = document.getElementById('output'),
    button = document.getElementById('button')

var Users = {}


//..............VIDEO CHAT

//GET THE LOCAL VIDEO AND DISPLAY IT WITH PERMISSION

function getLvideo(callbacks) {

    navigator.mediaDevices.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia

    var constraints = {

        audio: true,
        video: true
    }
    navigator.getUserMedia(constraints, callbacks.success, callbacks.error)
}

function recStream(stream, elemid) {

    var video = document.getElementById(elemid)
    video.srcObject = stream
    window.peer_stream = stream

}

getLvideo(
    {
        success: function (stream) {
            window.localstream = stream;
            recStream(stream, 'lVideo')
        },
        error: function (err) {
            alert("Cannot Access your Camera")
            console.log(err)
        }
    }
)



var conn;
var peer_id;



socket.on("yourID", id => {
    document.getElementById("socketId").innerHTML = id;
})
socket.on("allUsers", users => {
    Users = (users)
    var i
    document.getElementById("alluser").innerHTML = ""

    console.log("user length" + Object.keys(Users).length + " " + typeof Users)


    for (x in Users) {
        var yourID = document.getElementById("socketId").innerHTML
        if (x != yourID) {


            console.log("COMPARE  :  " + x + " AND  " + yourID)
            var button = document.createElement("button");
            button.innerHTML = "Call : " + x;
            button.addEventListener("click", function () {
                callPeer(x)
            });
            var alluser = document.getElementById("alluser");
            // alluser.appendChild("<br>");
            alluser.appendChild(button);
        }
        else {
            // console.log("USER CALL BTN SKIPPED : "+x)
        }

    }


})







function callPeer(id) {
    const peer = new Peer({
        initiator: true,
        trickle: false,
        config: {

            iceServers: [
                {
                    urls: "stun:numb.viagenie.ca",
                    username: "sultan1640@gmail.com",
                    credential: "98376683"
                },
                {
                    urls: "turn:numb.viagenie.ca",
                    username: "sultan1640@gmail.com",
                    credential: "98376683"
                }
            ]
        },
        stream: window.localstream,
    });

    peer.on('open', function () {

        console.log("PEER ID : " + peer.id)
        document.getElementById("displayId").innerHTML = peer.id
    }).then(peer.on("signal", data => {

        console.log("PEER CONNECTED " + peer.id)
        var yourID = document.getElementById("socketId").innerHTML
        socket.emit("callUser", { userToCall: id, signalData: data, from: yourID })

    }))

    peer.on("error", err => {

        console.log("ERROR IN CONNECTING PEER : " + err)
    })

    peer.on("stream", stream => {
        if (partnerVideo.current) {
            partnerVideo.current.srcObject = stream;
        }
    });

    socket.on("callAccepted", signal => {
        setCallAccepted(true);
        peer.signal(signal);
    })

}
},{}]},{},[1]);
