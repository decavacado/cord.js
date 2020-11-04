const cdn = require("../../config.json").cdn
const endpoint = require("../../config.json").ur
const version = require("../../config.json").version
const fetch = require("node-fetch")
const channel = require("./channel.js")
const mentions = require("./extras/mentions.js")

class Message {
    constructor(mess, auth, guild){
        this.message = mess.content
        this.channel_id = mess.channel_id
        this.message_id = mess.id
        this.unix_time = Date.parse(mess.timestamp)
        this.author = {
            username: mess.author.username,
            id: mess.author.id,
            discriminator: mess.author.discriminator,
            image: `${cdn}/avatars/${mess.author.id}/${mess.author.avatar}.png`,
            avatar: mess.author.avatar,
            get ment() {
                return `<@!${this.id}>`
            }
        }
        this.guild = guild
        this.channel = guild.get_channel(mess.channel_id)
        this._auth = auth

        if(mess.mentions){
            this.ments= new mentions(mess.mentions)
        }else {
            this.ments = null
        }
    }

    edit(content){
        let auth = this._auth
        let init = {
            method: "PATCH", 
            headers: {
                "User-Agent": `DiscordBot (${endpoint}, ${version})`,
                "Authorization": `Bot ${auth}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: content,
                tts: false,
                embed: {
                    
                }

            })
        }
        fetch(`${endpoint}/channels/${this.channel_id}/messages/${this.message_id}`, init)
            .then(function(res){
                return res.json()
            })
            .then(function(obj){
                console.log("MHM")
                console.log(obj)
            })
    }

    embed(em, content=""){
        let auth = this._auth
        let init = {
            method: "POST", 
            headers: {
                "User-Agent": `DiscordBot (${endpoint}, ${version})`,
                "Authorization": `Bot ${auth}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: content,
                tts: false,
                embed: em

            })
        }
        fetch(`${endpoint}/channels/${this.channel_id}/messages`, init)
            .then(function(res){
                return res.json()
            })
            .then(function(obj){
                console.log("EMBED")
                console.log(obj)
            })
    }

    reply(content){
        let auth = this._auth
        let mention = `<@!${this.author.id}>`
        let init = {
            method: "POST", 
            headers: {
                "User-Agent": `DiscordBot (${endpoint}, ${version})`,
                "Authorization": `Bot ${auth}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: `${mention}${content}`,
                tts: false,
                embed: {
                    
                }

            })
        }
        fetch(`${endpoint}/channels/${this.channel_id}/messages`, init)
            .then(function(res){
                return res.json()
            })
            .then(function(obj){
                console.log("MHM")
                console.log(obj)
            })
    }

}


module.exports = Message