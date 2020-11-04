class Member {
    constructor({user, nick, roles}, owner=false){
        this.user = user
        this.nick = nick
        this.roles = roles
        this.owner = owner
    }
}

module.exports = Member