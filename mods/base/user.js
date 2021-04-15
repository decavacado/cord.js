const cdn = require("../../config.json").cdn
const config = require("../../config.json")
const events = require("events")
const fetch = require("node-fetch")
const guild = require("./guild.js")
const { EventEmitter } = require("events")

class Client extends EventEmitter {
    constructor(obj, ws, auth){
        super()
        this.username = obj.user.username
        this.bot = obj.user.bot
        this.discriminator = obj.user.discriminator
        this.id = obj.user.id
        this.avatar = obj.user.avatar
        this.image = `${cdn}/avatars/${obj.user.id}/${obj.user.avatar}.png`
        this.guilds = []
        this._ws = ws
        this._auth = auth
    }

    set_presence({game, status}){
        this._ws.send(JSON.stringify({
            "op": 3,
            "d": {
                "since": null,
                "game": game,
                "status": status,
                "afk": false
            }
        }))
    }

    fetch_guild(id){
        let server = this.guilds.find(function(element){
            return element.id === id
        })

        
        return server
    }

    set_guild(guilds){
        this.guilds.push(guilds)
    }

    update_guild(id, guild){
        let server_index = this.guilds.findIndex(function(element){
            return element.id === id
        })

        this.guilds[server_index] = {...this.guilds[server_index] , ...guild}
    }

    set_channel(id, channel) {
        let server_index = this.guilds.findIndex(function(element){
            return element.id === id
        })

        this.guilds[server_index].channels.push(channel)
    }

    update_channel(id, channel) {
        let server_index = this.guilds.findIndex(function(element){
            return element.id === id
        })

        let channel_index = this.guilds[server_index].channels.findIndex(function(element){
            return element.id === channel.id
        })

        this.guilds[server_index].channels[channel_index] = {...this.guilds[server_index].channels[channel_index], ...channel}
    } 

}

module.exports = Client