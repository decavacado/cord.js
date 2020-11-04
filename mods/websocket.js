const websocket = require("ws")
const os  = require("os")
const http = require("https")
const fetch = require("node-fetch")
const config = require("../config.json")
const User = require("./base/user.js")
const Message = require("./base/message.js")
const Guild = require("./base/guild.js")

function data_parser(data) {
    return JSON.parse(data)
}

function login(token, callback, reconnecting=false, seq=0, reconnect, bot_ess) {
    let interval_code = 0
    let last_seq = seq ? seq : 0

    if (reconnect && reconnect.session_id) {
        var rec = reconnect
    }else {
        var rec = {
            token: token,
        }
    }
    let socket = new websocket(`${config.gate}`)

    if(bot_ess && bot_ess.user) {
        //pass
    }else {
        var bot_ess = {

        }
    }

    if(reconnecting) {
        console.log(socket, "SOCKET IN HERE")
        console.log(last_seq, "Reconnect seq")
    }

    socket.on("message", function(data){
        let json = data_parser(data)
        if(json.op === 10 || json.op === 11){
            //skip
        }else {
            last_seq = json.s ? json.s : 0
            if(last_seq){
                rec.seq = json.s
            }
        }


        console.log(json)
        if(reconnecting){

        }
        console.log("Seq Number:",last_seq)

        //Error Opcode 9 (Invalid Session)
        if(json.op === 9) {
            if(!reconnecting) {
                console.log("Session Invalid: Restart (This could be due to rate limiting)")
                process.exit()
            }else {
                let random_wait = Math.floor(Math.random() * (5000 - 1000)) + 1000

                setTimeout(function(){
                    socket.send(JSON.stringify({
                        op: 2,
                        d: {
                            token: token,
                            properties: {
                                "$os": os.platform(),
                                "$browser": "cord.js",
                                "$device": "cord.js"
                            },
                            presence: {
                                status: "online",
                                "afk": false
                            },
                            intents: 1 + 2 + 8 + 256 + 512
                        }
                    }))
                }, random_wait)
            }
        }

        //Reconnect 

        if(json.op === 7) {
            console.log("Reconnecting")
            clearInterval(interval_code)

            socket.close(1000)


            console.log("Interval Cleared")

        }
        

        //Heartbeat
        if(json.op === 10){
            interval_code = setInterval(function(){
                console.log(last_seq)
                socket.send(JSON.stringify({
                    "op": 1,
                    "d": last_seq ? last_seq : null
                }))
            }, json.d.heartbeat_interval)


            //Resiming
            if(reconnecting) {

                socket.send(JSON.stringify({
                    op: 6,
                    d: {
                      token: rec.token,
                      session_id: rec.session_id,
                      seq: last_seq ? last_seq : null
                    }
                }))
            }

            console.log(interval_code)


            //Identify Payload
            if(!reconnecting) {
                socket.send(JSON.stringify({
                    op: 2,
                    d: {
                        token: token,
                        properties: {
                            "$os": os.platform(),
                            "$browser": "cord.js",
                            "$device": "cord.js"
                        },
                        presence: {
                            status: "online",
                            "afk": false
                        },
                        intents: 1 + 2 + 8 + 256 + 512
                    }
                }))
            }
        }

        //Ready Event

        if(json.t === "READY"){
            rec.session_id = json.d.session_id
            bot_ess.user = new User(json.d, socket, token)
            bot_ess.guild_count = json.d.guilds.length

            console.log(bot_ess)
            console.log("Ready event fired", rec)
        }

        if(json.t === "MESSAGE_CREATE") {
            let msg_guild = new Guild(token, bot_ess.user.fetch_guild(json.d.guild_id), bot_ess.user.fetch_guild(json.d.guild_id))
            bot_ess.user.fetch_guild(json.d.guild_id)
            bot_ess.user.emit("message", new Message(json.d, token, msg_guild))

        }

        //Guild Cache
        if(json.t === "GUILD_CREATE") {
            bot_ess.user.set_guild(json.d)

            if(bot_ess.user.guilds.length === bot_ess.guild_count){
                callback(bot_ess.user)
                bot_ess.user.emit("ready", bot_ess.user)
            }
        }
    })

    socket.on("open", function(){
        console.log(`Connection opened with ${config.gate}`)
    })

    socket.on("close", function(error){
        console.log(error)
        login(token, callback, true, last_seq, rec, bot_ess)
    })

    socket.on("error", function(err){
        console.log(err)
    })

    process.on("SIGINT", function(){
        console.log('Exiting Ctrl + C')
        
        socket.send(JSON.stringify({
            "op": 3,
            "d": {
                "status": "offline",
                "afk": false
            }
        }))

        process.exit()
    })

    
}

module.exports = login
