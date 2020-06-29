const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const session = require('express-session')
const mongoose = require('mongoose')
const enforce = require('express-sslify')
// const cookieParser = require('cookie-parser')
// const cookie = require('cookie')



mongoose.connect('mongodb+srv://admin:admin@videocall-a3qyf.mongodb.net/<dbname>?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true }, (error) => {

    if (error) {
        console.log("Error in DB connection " + error)
    }
    else {
        console.log("DB CONNECTION SUCCESSS")
    }

})

const dbuserSchema = new mongoose.Schema({
    name: String,
    username: String,
    password: String
})
const dbuser = mongoose.model("allusers", dbuserSchema)

const userFriendSchema = new mongoose.Schema({
    user:String,
    friends:[Array]
})
const dbuserFriends = mongoose.model("friends", userFriendSchema)


// var dbdata = { user:"admin", friends:"['aditya'], ['adimathur08']"}
// var savedb = new dbuserFriends(dbdata)
// savedb.save()
var Allusers = []
dbuser.find({}).then( (data)=>{
    Allusers =  (data)
}).catch()


dbuserFriends.find({}).then( (data)=>{
    for (var x in data){

        console.log("HI : " + data[x]["user"] + " : " +(data[x])["friends"])
 
    }
    console.log(typeof data)
}).catch()



const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }))
app.use(enforce.HTTPS({ trustProtoHeader: true }));
app.set('view engine', 'ejs')

const users = {}
const usersName = {}
// const Allusers = [{ id: 1, name: 'Admin M', username: 'admin', password: 'admin' },
// { id: 2, name: 'Aditya', username: 'aditya', password: 'aditya' }
// ];

//Setting PORT number
http.listen(PORT, () => {

    console.log('listening on port : ' + PORT)
})




app.use(session({
    name: 'sid',
    resave: false,
    saveUninitialized: false,
    secret: 'hi',

    cookie: {
        httpOnly: false,
        maxAge: 1000 * 60 * 60 * 24 * 30, // 1  month
        sameSite: true,
        signed: false
    }
}))



const redirectLogin = (req, res, next) => {

    console.log("CHECKING LOGIN AUTH : ")
    console.log(req.session)
    if (!req.session.userId) {
        console.log("1")
        res.redirect('/login')
    }
    else {
        console.log("2")

        next()
    }

}

const redirectHome = (req, res, next) => {

    if (req.session.userId) {
        res.redirect('/')
    }
    else {
        next()
    }

}

app.get('/', redirectLogin, (req, res) => {

    console.log(req.session)
    res.render("index", { 'name': req.session.name, 'id': req.session.userId, 'username': req.session.username })
})

app.get('/login', redirectHome, (req, res) => {

    var error = ""
    // dbuser.find({}).then( (data)=>{
    //     Allusers =  (data)
    // }).catch()
    res.render("login", { 'error':error })
    // res.sendFile(__dirname + "/login.html")
})

app.post('/login', (req, res) => {

    const { username, password } = req.body

    if (username && password) {


        const user = Allusers.find(user => user.username === username && user.password === password)
        if (user) {
            req.session.userId = user._id
            req.session.name = user.name
            req.session.username = user.username
            // console.log(req.session.userId,".............")
            return res.redirect('/')
        }
        else {
            res.render('login', {'error':"Invalid Credentials"})
        }

    }
    res.redirect('/login')
})

app.get('/register', redirectHome, (req, res) => {

    res.render("registration", { 'error':"" })
})

app.post('/register', (req, res) => {

    const { username, password, name } = req.body
    if (username && password && name) {
        console.log("inside if...")

        if (!Allusers.find(user => user.username===username)){
        
            var dbdata = { name:name, username:username, password:password}
            var savedb = new dbuser(dbdata)
            savedb.save().then((data)=>{
    
                dbuser.find({}).then( (data)=>{
    
                    Allusers =  (data)
                    const user = Allusers.find(user => user.username === username && user.password === password)
                    console.log("BEFORE ")
                    console.log(req.session)
                    req.session.userId = user._id
                    req.session.name = user.name
                    req.session.username = user.username               
                    console.log("AFTER :")
                    console.log(req.session)
                    console.log("INSIDE IF REDIRECT NOW>>>>>>>>.")
                    return res.redirect('/')
                    
                }).catch()
                console.log("AFTER CATCH 1...")
            }).catch()
            console.log("redirecting now...")
        }
        else{
            res.render("registration", {'error':"Username is taken, Please try again"})
        }

        

    }
    else{
        res.render('registration', {'error':"Please Register Again"})
    }
})


app.get('/logout', redirectLogin, (req, res) => {

    req.session.destroy(err => {
        if (err) {
            console.log(err)
            return redirect('/')
        }
        res.clearCookie('sid')
        res.redirect('/login')
    })
})







//Setting static folder
app.use(express.static('public'))


io.on('connection', (socket) => {

    socket.emit("yourID", socket.id)

    socket.on("addname", (data) => {

        usersName[socket.id] = data['name']
        users[socket.id] = data['username'];
        io.sockets.emit("allUsers", { 'users': users, 'names': usersName });
        console.log("ALL USERS : " + JSON.stringify(users))
    })

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.sockets.emit("allUsers", { 'users': users, 'names': usersName });
    })

    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit('hey', { signal: data.signalData, from: data.from, fromName: data.fromName });
    })

    socket.on("acceptCall", (data) => {
        io.to(data.to).emit('callAccepted', data.signal);
    })


    // FOR MESSAGES
    socket.on('userMessage', (data) => {
        console.log(data)
        io.sockets.emit("userMessage", data)
    });

    socket.on('call_rejected', data => {

        io.to(data).emit('call_reject_status')
    })

    socket.on('call_accepted', data => {

        io.to(data).emit('call_accept_status')
    })

    socket.on("disconnect_current_call", callerid => {

        io.to(callerid).emit('disconnect_request')
    })

    socket.on("call_cancel", callerid=>{

        io.to(callerid).emit('cancel_incomingCall')
    })

    socket.on('drawing', (data) => {

        io.to(data.callerid).emit('drawing', data)
    });

    socket.on('enable_canvas', data =>{

        io.to(data).emit('enable_canvas')
    })




});
