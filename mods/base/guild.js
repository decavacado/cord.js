const cdn = require("../../config.json").cdn
const url = require("../../config.json").ur
const version = require("../../config.json").version
const fetch = require("node-fetch")
const Member = require("./member.js")
const Channel = require("./channel.js")


class Guild {
    constructor(auth, {id ,name, owner_id, icon, region, description, member_count, channels}, _base){
        this.guild_id = id
        this.name = name
        this.member_count = member_count
        this.region = region
        this.description = description
        this.icon = icon
        this.owner_id = owner_id 
        this.icon_image = `${cdn}/icons/${id}/${icon}.png`

        let owner = _base.members.find(function(e){
            return e.user.id === this.owner_id
        }.bind(this))

    if(owner){
        this.owner = {
            username: owner.user.username,
            id: owner.user.id,
            discriminator: owner.user.discriminator,
            nickname: owner.nick,
        }
    }
        

        this._auth = auth
        this._base = _base
    }

    get_channel(id){
        let channel = this._base.channels.find(function(e){
            return e.id === id
        })
        
        return new Channel(this._auth , channel, this)
    }
}

module.exports = Guild