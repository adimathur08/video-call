// let Peer = require('simple-peer');

const socket = io();
// import Peer from 'simple-peer';

const message = document.getElementById('message'),
    handle = document.getElementById('handle'),
    output = document.getElementById('output'),
    button = document.getElementById('button')
// disconnect_button = document.getElementById('disconnect_button')
var Users = {}

function getLvideo() {

//     navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia
    var constraints = {

        audio: true,
        video: true
    }
    navigator.mediaDevices.getUserMedia(constraints).then((stream)=>{
        window.localstream = stream;
        recStream(stream, 'lVideo')
    }).catch((error)=>{
        alert("Cannot Access your Camera! \nPlease provide permission manually or check if other application is using the Camera")
        console.log(err)
    })
}

function recStream(stream, elemid) {

    var video = document.getElementById(elemid)
    video.srcObject = stream
    window.peer_stream = stream

    console.log("setting stream for id : " + elemid)

}

getLvideo()



var conn;
var peer_id;
var receivingCall = false
var caller = ""
var callerid
var callerSignal
var callAccepted = false
var outcall_status // 0: no out call,   1: ringing/calling ,   2: Rejected/disconnected  

socket.on("yourID", id => {
    document.getElementById("socketId").innerHTML = id;
    socket.emit("addname", {
        username: document.getElementById('username').value,
        id: id,
        name: document.getElementById('name').value
    })
    console.log("cookie sending.. " + document.getElementById('username').value)
})
// socket.on("allUsers", (users, name) => {
socket.on("allUsers", obj => {




    Users = (obj['users'])
    names = (obj['names'])

    console.log("lFINALLYY  " + JSON.stringify(Users) + "\n\n names : " + JSON.stringify(names))
    var i
    document.getElementById("alluser").innerHTML = ""



    for (x in Users) {
        var yourID = document.getElementById("socketId").innerHTML
        if (x != yourID) {


            console.log("COMPARE  :  " + x + " AND  " + yourID)
            var button = document.createElement("button");
            button.innerHTML = "Call : " + names[x] + " (" + Users[x] + ") ";
            button.setAttribute('id', x)
            button.setAttribute('class', "btn btn-outline-info ")
            button.style.margin = "5px"
            button.addEventListener("click", function () {
                callPeer(this.id)
            });
            var alluser = document.getElementById("alluser");
            // alluser.appendChild("<br>");
            alluser.appendChild(button);
            // alluser.appendChild(document.createElement("br"))
            // alluser.appendChild(document.createElement("br"))
        }
        else {
            // console.log("USER CALL BTN SKIPPED : "+x)
        }

    }


})

socket.on("hey", (data) => {
    receivingCall = true
    caller = data.fromName
    callerid = data.from
    callerSignal = data.signal
    console.log("Back to hey ....connecting peer")
    showIncomingCall()

})


socket.on('call_reject_status', () => {

    outcall_status = 2

    const parent = document.getElementById("callerinfo");
    while (parent.firstChild) {
        parent.firstChild.remove();
    }

    var caller_name = document.createElement("span")
    caller_name.innerHTML = "<strong  style='color:#FF0000'> **** Call Rejected **** </strong>\n"
    var alluser = document.getElementById("callerinfo");
    alluser.appendChild(caller_name)
    call_not_answered(5000)
    //disconnectPeer()

})

socket.on('call_accept_status', () => {

    outcall_status = 0
    const parent = document.getElementById("callerinfo");
    while (parent.firstChild) {
        parent.firstChild.remove();
    }

})



function display_calling(id) {
    outcall_status = 1
    var caller_name = document.createElement("span")
    caller_name.innerHTML = "<strong> Calling " + Users[id] + " </strong>\n"
    var alluser = document.getElementById("callerinfo");

    var endcall = document.createElement("button");
    endcall.setAttribute('class', "btn btn-danger ")
    endcall.innerHTML = "Cancel"
    endcall.style.margin = "5px"
    endcall.addEventListener("click", function () {
        call_not_answered(1)
    });

    alluser.appendChild(caller_name)
    alluser.appendChild(endcall)
    call_not_answered(19500).then((response) => {

        if (outcall_status === 1) {

            var caller_name = document.createElement("span")
            caller_name.innerHTML = "<strong style='color:#FF0000'> **** Call Not Answered **** </strong>\n"
            var alluser = document.getElementById("callerinfo");
            alluser.appendChild(caller_name)

            setTimeout(() => {
                const parent = document.getElementById("callerinfo");
                while (parent.firstChild) {
                    parent.firstChild.remove();
                }
            }, 5000);
            outcall_status = 0

        }


    }).catch()

}




function callPeer(id) {
    console.log("Setting up peer connection")
    const peer = new Peer()

    var reconnect = 0

    function reconnectPeer() {

        console.log("Reconnecting peer...")
        reconnect = 1
        const peer = new Peer()
    }


    peer.on('open', data => {

        console.log("PEER ID : " + peer.id)
        document.getElementById("displayId").innerHTML = peer.id

        console.log("CALLING PEER WITH SOCKET : " + id + "\n SIGNAL DATA  :   " + data)
        var yourID = document.getElementById("socketId").innerHTML
        display_calling(id)
        socket.emit("callUser", { userToCall: id, signalData: data, from: yourID, fromName: document.getElementById('name').value })

        function disconnectPeer() {
            console.log("REJCECT 1 : " + peer)
            peer.disconnect()
            peer.destroy()
            console.log("REJECT 2 : " + peer)
        }
    })

    peer.on("signal", data => {

        console.log("PEER CONNECTED " + peer.id)
        var yourID = document.getElementById("socketId").innerHTML
        socket.emit("callUser", { userToCall: id, signalData: data, from: yourID })

    })
    peer.on("disconnected", val => {


        peer.destroy()
        console.log("INSIDE DISCONNECTED")
        // if (reconnect === 1) {
        //     console.log("Reconnecting inside disconnected")
        //     const peer = new Peer()
        // }
        // else {
        //     document.getElementById("displayId").innerHTML = "Disconnected"
        // }
    })

    peer.on("error", err => {

        console.log("ERROR IN CONNECTING PEER : " + err)
        console.log("Trying to reconnect")
        reconnectPeer()
    })

    peer.on("stream", stream => {
        if (partnerVideo.current) {
            partnerVideo.current.srcObject = stream;
        }
    });

    socket.on("callAccepted", signal => {
        callAccepted = true
        peer.signal(signal);
    })



    socket.on('disconnect_request', () => {
        disconnectCall(peer)
    })



    peer.on('call', function (call) {


        console.log("INSIDE CALL")
        call.answer(window.localstream);
        console.log("CALL ANSWERED")

        call.on('stream', function (stream) {

            document.getElementById('disconnect_button').style.display = 'block'
            console.log("5")

            window.peer_stream = stream;
            recStream(stream, 'rVideo')
        });


        call.on('close', function () {

            document.getElementById('disconnect_button').style.display = 'None'
            disconnectCall(peer)
        })


        disconnect_button.addEventListener("click", () => {
            console.log("BTN CLICKED")
            call.disconnect()
            disconnectCall(peer)
        })


    })

}



function disconnectCall(peer) {

    document.getElementById('disconnect_button').style.display = 'None'
    alert('The call has ended');
    console.log("Peer destroying... : " + peer.id)
    peer.disconnect()
    peer.destroy()
    console.log("Peer destroyed : " + peer.id)
    document.getElementById("displayId").innerHTML = " Not Connected to Server"
}



function acceptCall() {

    callAccepted = true
    console.log("Connecting to Peer server")
    const peer = new Peer()
    console.log("Connected to Peer server")
    peer.on("open", data => {

        socket.emit("call_accepted", callerid)

        document.getElementById('disconnect_button').style.display = 'block'
        console.log("PEER ID : " + peer.id)
        document.getElementById("displayId").innerHTML = peer.id


        if (callerSignal) {
            conn = peer.connect(callerSignal)
            console.log("CONNECTED TO CALLER : " + callerSignal + "\n\n RESULT : ", conn)
        } else {
            alert("Caller Not Connected");
            return false;
        }

        var call = peer.call(callerSignal, window.localstream);

        call.on('stream', function (stream) {
            window.peer_stream = stream;
            recStream(stream, 'rVideo');
        })

        disconnect_button.addEventListener("click", () => {
            console.log("BTN CLICKED " + callerid)
            disconnectCall(peer)
            socket.emit("disconnect_current_call", callerid)
        })

    })
    peer.on("error", () => {
        acceptCall()
    })


    // var disconnect_button = document.createElement("button");
    // disconnect_button.addEventListener("click", function () {
    //     disconnectCall()
    // });
    // var disconnectbtn = document.getElementById("disconnectBtn");
    // disconnectbtn.appendChild(disconnect_button);

    // peer.on("signal", data => {
    //     socket.emit("acceptCall", { signal: data, to: caller })
    // })

    // peer.on("stream", stream => {
    //     partnerVideo.current.srcObject = stream;
    // });

    // peer.signal(callerSignal); 
}


async function call_not_answered(time) {
    return new Promise((resolve, reject) => {

        setTimeout(() => {
            const parent = document.getElementById("callerinfo");
            while (parent.firstChild) {
                parent.firstChild.remove();
            }
            resolve()
        }, time);

    })

}





function showIncomingCall() {


    if (receivingCall) {

        console.log("inside ifff")
        var caller_name = document.createElement("span")
        caller_name.innerHTML = "<strong> " + caller + " is calling you </strong>\n"

        var acceptbutton = document.createElement("button");
        acceptbutton.id = caller
        acceptbutton.setAttribute('class', "btn btn-success ")
        acceptbutton.style.margin = "5px"
        acceptbutton.innerHTML = "Accept Call"
        acceptbutton.addEventListener("click", function () {
            acceptCall()
            call_not_answered(1)

        });

        var rejectbutton = document.createElement("button");
        rejectbutton.setAttribute('class', "btn btn-danger ")
        rejectbutton.innerHTML = "Reject Call"
        rejectbutton.style.margin = "5px"
        rejectbutton.addEventListener("click", function () {
            call_not_answered(1)
            socket.emit("call_rejected", callerid)
        });

        var alluser = document.getElementById("callerinfo");
        alluser.appendChild(caller_name)
        alluser.appendChild(acceptbutton)
        alluser.appendChild(rejectbutton)
        call_not_answered(20000)



    }
}



