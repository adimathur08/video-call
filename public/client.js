// let Peer = require('simple-peer');

const socket = io();
// import Peer from 'simple-peer';

const message = document.getElementById('message'),
    handle = document.getElementById('handle'),
    output = document.getElementById('output'),
    button = document.getElementById('button')
// disconnect_button = document.getElementById('disconnect_button')
var Users = {}

var incomingCallAudio = new Audio('/incomingCall.mp3');



function getLvideo() {

    navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia
    var constraints = {

        audio: true,
        video: true
    }
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        window.localstream = stream;
        recStream(stream, 'lVideo')
    }).catch((error) => {
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
            button.setAttribute('class', "btn btn-sm btn-outline-info ")
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
    console.log("Back to hey ....connecting peer" + callerid)
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

socket.on("cancel_incomingCall", ()=>{

    incomingCallAudio.pause();
    incomingCallAudio.currentTime = 0;
    outcall_status = 0
    const parent = document.getElementById("callerinfo");
    while (parent.firstChild) {
        parent.firstChild.remove();
    }

    var caller_name = document.createElement("span")
    caller_name.innerHTML = "<strong  style='color:#FF0000'> **** Call Missed **** </strong>\n"
    var alluser = document.getElementById("callerinfo");
    alluser.appendChild(caller_name)
    call_not_answered(5000)
})



function display_calling(id) {
    outcall_status = 1
    var caller_name = document.createElement("span")
    caller_name.innerHTML = "<strong> Calling " + Users[id] + " </strong>\n"
    var alluser = document.getElementById("callerinfo");

    var endcall = document.createElement("button");
    endcall.setAttribute('class', "btn btn-sm btn-danger ")
    endcall.innerHTML = "Cancel"
    endcall.style.margin = "5px"
    endcall.addEventListener("click", function () {
        call_not_answered(1)
        console.log("CAnce : " + id)
        socket.emit("call_cancel", id)
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
    const peer = new Peer(
            {
            host: '9000-e779bce0-9311-445f-a23c-9d52d7c180b6.ws-us02.gitpod.io',
            port: '443',
            path: '/',
            secure: true
        }
    )

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

        document.getElementById('callerinfo').scrollIntoView()

        socket.emit("callUser", { userToCall: id, signalData: data, from: yourID, fromName: document.getElementById('name').value })
        callerid = id
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

        document.getElementById('canvas_btn').style.display = 'block'

        call.on('stream', function (stream) {

            document.getElementById('disconnect_button').style.display = 'block'
            console.log("5")

            window.peer_stream = stream;
            recStream(stream, 'rVideo')
        });


        call.on('close', function () {

            document.getElementById('disconnect_button').style.display = 'None'
            disconnectCall(peer)

            // hiding canvas
            document.getElementById("canvas").style.display = "none"
            document.getElementById('canvas_btn').style.display = "none"
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

    // hiding canvas
    document.getElementById("canvas").style.display = "none"
    document.getElementById('canvas_btn').style.display = "none"
}



function acceptCall() {

    incomingCallAudio.pause();
    incomingCallAudio.currentTime = 0;
    callAccepted = true
    console.log("Connecting to Peer server")
    const peer = new Peer()
    console.log("Connected to Peer server")
    peer.on("open", data => {

        socket.emit("call_accepted", callerid)  

        document.getElementById('canvas_btn').style.display = 'block'

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
            incomingCallAudio.pause();
            incomingCallAudio.currentTime = 0;
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

        document.getElementById('incoming-call').scrollIntoView()

        console.log("inside ifff")
        var caller_name = document.createElement("span")
        caller_name.innerHTML = "<strong> " + caller + " is calling you </strong>\n"

        var acceptbutton = document.createElement("button");
        acceptbutton.id = caller
        acceptbutton.setAttribute('class', "btn btn-sm btn-success ")
        acceptbutton.style.margin = "5px"
        acceptbutton.innerHTML = "Accept Call"
        acceptbutton.addEventListener("click", function () {
            acceptCall()
            call_not_answered(1)

        });

        var rejectbutton = document.createElement("button");
        rejectbutton.setAttribute('class', "btn btn-sm btn-danger ")
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

        
        incomingCallAudio.play()

        call_not_answered(20000)



    }
}






























function showDisableAlert( message, alerttype ) {

    $('#alert_placeholder').append( $('#alert_placeholder').append(
        '<div id="alertdiv" class="alert alert-warning alert-dismissible fade show" style="padding: 5px; text-align: center;" role="alert">' +
        message +
        '<button type="button" class="close" data-dismiss="alert" style=" padding: 5px;" aria-label="Close">'+
        '<span aria-hidden="true">&times;</span>' +
      '</button>' +
    '</div>' )
    );
    setTimeout( function() {
        $("#alertdiv").fadeOut(300, function(){ $(this).remove();});
    }, 5000 );

}

function showEnableAlert( message, alerttype ) {

    $('#alert_placeholder_enable').append( $('#alert_placeholder_enable').append(
        '<div id="alertdiv" class="alert alert-success alert-dismissible fade show" style="padding: 5px; text-align: center;" role="alert">' +
        message +
        '<button type="button" class="close" data-dismiss="alert" style=" padding: 5px;" aria-label="Close">'+
        '<span aria-hidden="true">&times;</span>' +
      '</button>' +
    '</div>' )
    );
    setTimeout( function() {
        $("#alertdiv").fadeOut(300, function(){ $(this).remove();});
    }, 5000 );

}


// Disable scroll inside canvas
document.getElementById( "canvas" ).onwheel = function(event){
    event.preventDefault();
};

document.getElementById( "canvas" ).onmousewheel = function(event){
    event.preventDefault();
};



socket.on('enable_canvas', ()=>{

    if (document.getElementById("canvas").style.display == "none") {
        canvas_btn.innerHTML = "Hide Canvas"
        document.getElementById("canvas").style.display = "block"

        showEnableAlert( "Canvas Enabled by Remote User", "alert-info" )
        document.getElementById('canvas').scrollIntoView()
    }
    else {
        canvas_btn.innerHTML = "Show Canvas"
        document.getElementById("canvas").style.display = "none"

        showDisableAlert( "Canvas Disabled by Remote User", "alert-info" )
        document.getElementById('alert_placeholder').scrollIntoView()


    }
})




var canvas_btn = document.getElementById("canvas_btn")
canvas_btn.addEventListener('click', () => {
    if (document.getElementById("canvas").style.display == "none") {
        canvas_btn.innerHTML = "Hide Canvas"
        document.getElementById("canvas").style.display = "block"
        document.getElementById('canvas').scrollIntoView()

    }
    else {
        canvas_btn.innerHTML = "Show Canvas"
        document.getElementById("canvas").style.display = "none"
    }
    socket.emit('enable_canvas', callerid)

})


var canvas = document.getElementsByClassName('whiteboard')[0];
var colors = document.getElementsByClassName('color');
var context = canvas.getContext('2d');

var current = {
    color: 'black'
};
var drawing = false;

canvas.addEventListener('mousedown', onMouseDown, false);
canvas.addEventListener('mouseup', onMouseUp, false);
canvas.addEventListener('mouseout', onMouseUp, false);
canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

//Touch support for mobile devices
canvas.addEventListener('touchstart', onMouseDown, false);
canvas.addEventListener('touchend', onMouseUp, false);
canvas.addEventListener('touchcancel', onMouseUp, false);
canvas.addEventListener('touchmove', throttle(onMouseMove, 10), false);

for (var i = 0; i < colors.length; i++) {
    colors[i].addEventListener('click', onColorUpdate, false);
}

socket.on('drawing', onDrawingEvent);

window.addEventListener('resize', onResize, false);
onResize();


function drawLine(x0, y0, x1, y1, color, emit) {
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    if (color == "white"){
        context.lineWidth = 30;
    }
    else{
        context.lineWidth = 2;
    }
    
    context.stroke();
    context.closePath();

    if (!emit) { return; }
    var w = canvas.width;
    var h = canvas.height;

    socket.emit('drawing', {
        x0: x0 / w,
        y0: y0 / h,
        x1: x1 / w,
        y1: y1 / h,
        color: color,
        callerid
    });
}

function onMouseDown(e) {
    drawing = true;
    current.x = e.clientX || e.touches[0].clientX;
    current.y = e.clientY || e.touches[0].clientY;
}

function onMouseUp(e) {
    if (!drawing) { return; }
    drawing = false;
    drawLine(current.x, current.y, e.clientX || e.touches[0].clientX, e.clientY || e.touches[0].clientY, current.color, true);
}

function onMouseMove(e) {
    if (!drawing) { return; }
    drawLine(current.x, current.y, e.clientX || e.touches[0].clientX, e.clientY || e.touches[0].clientY, current.color, true);
    current.x = e.clientX || e.touches[0].clientX;
    current.y = e.clientY || e.touches[0].clientY;
}

function onColorUpdate(e) {
    current.color = e.target.className.split(' ')[1];
    console.log("color changed : " + current.color )
}

// limit the number of events per second
function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function () {
        var time = new Date().getTime();

        if ((time - previousCall) >= delay) {
            previousCall = time;
            callback.apply(null, arguments);
        }
    };
}

function onDrawingEvent(data) {

    var w = canvas.width;
    var h = canvas.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
}

// make the canvas fill its parent
function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
