const cdn = require("../../config.json").cdn
const endpoint = require("../../config.json").ur
const version = require("../../config.json").version
const Message = require("./message.js")
const fetch = require("node-fetch")

class Channel {
    #_auth

    constructor(auth ,{name, nsfw, guild_id, type, id, parent_id, topic, last_message_id}, guild){
        console.log(type, "The type")
        if(type === 0){
            this.name = name
            this.topic = topic
            this.id = id
            this.parent = parent_id
            if(nsfw) {
                this.nsfw = nsfw
            }else {
                this.nsfw = false
            }
            this.last_message_id = last_message_id
            this.#_auth = auth
        }

        this.guild = guild
    }

    async get_messages(limit=1) {
        let auth = this.#_auth
        let init = {
            headers: {
                "User-Agent": `DiscordBot (${endpoint}, ${version})`,
                "Authorization": `Bot ${auth}`,
                "Content-Type": "application/json"
            }
        }
        
        let response = await fetch(`${endpoint}/channels/${this.id}/messages?limit=${limit}`, init)
        let data = await response.json();

        return data
    }

    async send(content) {
        let auth = this.#_auth
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
                embed: {
                    
                }

            })
        }
        let response = await fetch(`${endpoint}/channels/${this.id}/messages`, init)
        let msg = await response.json()
        
        return new Message(msg, auth, this.guild)
    }
}


module.exports  = Channel