const Websocket = require("ws")
const os  = require("os")
const http = require("https")
const fetch = require("node-fetch")
const config = require("../config.json")
const Client = require("./base/user.js")
const Message = require("./base/message.js")
const Guild = require("./base/guild.js")

function data_parser(data) {
    return JSON.parse(data)
}

function data_encoder(data) {
    return JSON.stringify(data)
}

function login(token, callback, options) {
    const discord_connection = new Websocket(config.gate)

    //Waiting for an open Connection
    function gateway(token, callback, discord_connection, client=undefined, resume=undefined) {
        discord_connection.on("open", function(){
            let ACK = undefined
            let SEQ = resume && resume.SEQ ? resume.SEQ : null
            let interval_check = 0
            let GUILDS = 0;
            let GUILDS_COUNT = 0
            let SESSION_ID = resume && resume.SESSION_ID ? resume.SESSION_ID : undefined
            let heart = undefined
            if(options.logging) {
                console.log(`[cord.js]Connection established with Discord Gateway version ${config.version}`)
            }

            //Other Events
            process.on("SIGINT", function(){
                process.exit()
            })

            process.on("beforeExit", function(){
                discord_connection.send(data_encoder({
                    op: 3,
                    d: {
                        status: "offline",
                        afk: false
                    }
                }))

            })

            //Resume check
            if(resume && resume.resuming) {
                discord_connection.send(data_encoder({
                    op: 6,
                    d: {
                        token: token,
                        session_id: resume.SESSION_ID,
                        seq: resume.SEQ
                    }
                }))

                if(options.logging) {
                    console.log("[cord.js]Resume Payload Session ID and Sequence" ,resume.SESSION_ID, resume.SEQ)
                    console.log(console.log(`[cord.js]Resume Payload Sent ${config.version}`))
                }
            }

            console.log("This")

            //Discord Events

            discord_connection.on("message", function(data){
                let g_data = data_parser(data)
                console.log(g_data)
                SEQ = g_data.s ? g_data.s : SEQ

                if(options.logging) {
                    console.log(`[cord.js] Sequence: ${SEQ}`)
                }
                
                
                //Initial Hello Payload
                if(config.gateway_opcodes[g_data.op.toString()] === "Hello") {
                    if(options.logging) {
                        console.log(`[cord.js]Hello payload recieved`)
                    }
                    ACK = g_data.d.heartbeat_interval

                    //Heartbeat Interval 
                    heart = setInterval(() => {
                        if(interval_check === 0) {
                            discord_connection.send(data_encoder({
                                op: 1,
                                d: SEQ
                            }))
                            interval_check = 1
                            if(options.logging) {
                                console.log(`[cord.js] Heartbeat sent intervel is ${ACK}`)
                            }
                        }else if(interval_check === 1) {
                            if(options.logging) {
                                console.log(`[cord.js] Gateway did not respond to last heartbeat. Reconnecting`)                               
                            }
                            discord_connection.close(1014)
                            process.removeAllListeners("SIGINT").removeAllListeners("beforeExit")
                            clearInterval(heart)
                            discord_connection = new Websocket(config.gate)
                            client._ws = discord_connection
                            gateway(token, callback, discord_connection, client, {SEQ: SEQ, SESSION_ID: SESSION_ID, resuming: true});
                        }
                    }, ACK)
                    if(!client) {
                        discord_connection.send(data_encoder({
                            op: 2,
                            d: {
                                token: token,
                                intents: 32767,
                                properties: {
                                    $os: os.platform(),
                                    $browser: config.lib_name,
                                    $device: config.lib_name
                                },
                                presence: {
                                    status: "online",
                                }
                            }
                        }))
                    }
                }else if(config.gateway_opcodes[g_data.op.toString()] === "Heartbeat ACK" && interval_check === 1) {
                    interval_check = 0;
                    if(options.logging) {
                        console.log(`[cord.js] Heartbeat confirmed intervel is ${ACK}`)
                    }
                }else if(config.gateway_opcodes[g_data.op.toString()] === "Dispatch") {
                    if(g_data.t === "READY") {
                        SESSION_ID = g_data.d.session_id
                        client = new Client(g_data.d, discord_connection, token);
                        GUILDS = g_data.d.guilds.length

                        if(options.logging) {
                            console.log(`[cord.js] Ready Event`)
                        }
                    }else if(g_data.t === "GUILD_CREATE") {
                        client.set_guild(g_data.d)
                        GUILDS_COUNT++

                        if(GUILDS_COUNT === GUILDS) {
                            callback(client)
                            client.emit("ready", client)
                        }

                        if(options.logging) {
                            console.log(`[cord.js] Guilds Array Updated`)
                        }
                    }else if(g_data.t === "MESSAGE_CREATE") {
                        if(client) {
                            let guild = client.fetch_guild(g_data.d.guild_id)
                            let msg = new Message(g_data.d, token, new Guild(token, guild, guild))
                            client.emit("message", msg)

                            if(options.logging) {
                                console.log(`[cord.js] Message Event recieved`)
                            }
                        }else {
                            if(options.logging) {
                                console.log(`[cord.js] Message Event recieved but client not ready`)
                            }
                        }
                    }else if(g_data.t === "GUILD_UPDATE") {
                        if(client) {
                            client.update_guild(g_data.d.id, g_data.d)
                        }else {
                            if(options.logging) {
                                console.log(`[cord.js] Guild Update Event recieved but client not ready`)
                            }
                        }
                    }else if(g_data.t === "CHANNEL_CREATE") {
                        if(client) {
                            client.set_channel(g_data.d.guild_id, g_data.d)
                        }else {
                            if(options.logging) {
                                console.log(`[cord.js] New Channel Event recieved but client not ready`)
                            }
                        }
                    }else if(g_data.t === "CHANNEL_UPDATE") {
                        if(client) {
                            client.update_channel(g_data.d.guild_id, g_data.d)
                        }
                    }else {
                        if(options.logging) {
                            console.log(`[cord.js] Channel Update Event recieved but client not ready`)
                        }
                    }
                }else if(config.gateway_opcodes[g_data.op.toString()] === "Identify") {
                    
                }else if(config.gateway_opcodes[g_data.op.toString()] === "Invalid Session") {
                    console.log(`[cord.js] Invalid Session please try restarting`)
                    process.exit()
                }else if(config.gateway_opcodes[g_data.op.toString()] === "Reconnect") {
                    discord_connection.close(1014)
                    process.removeAllListeners("SIGINT").removeAllListeners("beforeExit")
                    clearInterval(heart)
                    discord_connection = new Websocket(config.gate)
                    client._ws = discord_connection
                    gateway(token, callback, discord_connection, client, {SEQ: SEQ, SESSION_ID: SESSION_ID, resuming: true});
                }
            })
        })
    }

    gateway(token, callback, discord_connection)
}

module.exports = login


// discord_connection.on("open", function(){
//     let ACK = undefined
//     let SEQ = null
//     let interval_check = 0
//     let client = undefined
//     let GUILDS = 0;
//     let GUILDS_COUNT = 0
//     let SESSION_ID = undefined
//     if(options.logging) {
//         console.log(`[cord.js]Connection established with Discord Gateway version ${config.version}`)
//     }

//     //Other Events
//     process.on("SIGINT", function(){
//         process.exit()
//     })

//     process.on("beforeExit", function(){
//         discord_connection.send(data_encoder({
//             op: 3,
//             d: {
//                 status: "offline",
//                 afk: false
//             }
//         }))
//     })

//     //Discord Events

//     discord_connection.on("message", function(data){
//         let g_data = data_parser(data)
//         console.log(g_data)
//         SEQ = g_data.s
        
//         //Initial Hello Payload
//         if(config.gateway_opcodes[g_data.op.toString()] === "Hello") {
//             if(options.logging) {
//                 console.log(`[cord.js]Hello payload recieved`)
//             }
//             ACK = g_data.d.heartbeat_interval

//             //Heartbeat Interval 
//             setInterval(() => {
//                 if(interval_check === 0) {
//                     discord_connection.send(data_encoder({
//                         op: 1,
//                         d: SEQ
//                     }))
//                     interval_check = 1
//                     if(options.logging) {
//                         console.log(`[cord.js] Heartbeat sent intervel is ${ACK}`)
//                     }
//                 }else if(interval_check === 1) {
//                     if(options.logging) {
//                         console.log(`[cord.js] Gateway did not respond to last heartbeat. Reconnecting`)
//                         discord_connection.close(1014)
                        
//                     }
//                 }
//             }, ACK)

//             discord_connection.send(data_encoder({
//                 op: 2,
//                 d: {
//                     token: token,
//                     intents: 32767,
//                     properties: {
//                         $os: os.platform(),
//                         $browser: config.lib_name,
//                         $device: config.lib_name
//                     },
//                     presence: {
//                         status: "online",
//                     }
//                 }
//             }))
//         }else if(config.gateway_opcodes[g_data.op.toString()] === "Heartbeat ACK" && interval_check === 1) {
//             interval_check = 0;
//             if(options.logging) {
//                 console.log(`[cord.js] Heartbeat confirmed intervel is ${ACK}`)
//             }
//         }else if(config.gateway_opcodes[g_data.op.toString()] === "Dispatch") {
//             if(g_data.t === "READY") {
//                 SESSION_ID = g_data.d.session_id
//                 client = new Client(g_data.d, discord_connection, token);
//                 GUILDS = g_data.d.guilds.length

//                 if(options.logging) {
//                     console.log(`[cord.js] Ready Event`)
//                 }
//             }else if(g_data.t === "GUILD_CREATE") {
//                 client.set_guild(g_data.d)
//                 GUILDS_COUNT++

//                 if(GUILDS_COUNT === GUILDS) {
//                     callback(client)
//                     client.emit("ready", client)
//                 }

//                 if(options.logging) {
//                     console.log(`[cord.js] Guilds Array Updated`)
//                 }
//             }else if(g_data.t === "MESSAGE_CREATE") {
//                 if(client) {
//                     let guild = client.fetch_guild(g_data.d.guild_id)
//                     let msg = new Message(g_data.d, token, new Guild(token, guild, guild))
//                     client.emit("message", msg)

//                     if(options.logging) {
//                         console.log(`[cord.js] Message Event recieved`)
//                     }
//                 }else {
//                     if(options.logging) {
//                         console.log(`[cord.js] Message Event recieved but client not ready`)
//                     }
//                 }
//             }
//         }else if(config.gateway_opcodes[g_data.op.toString()] === "Identify") {
            
//         }else if(config.gateway_opcodes[g_data.op.toString()] === "Invalid Session") {
//             console.log(`[cord.js] Invalid Session please try restarting`)
//             process.exit()
//         }
//     })
// })