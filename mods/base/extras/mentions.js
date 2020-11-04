class Mentions {
    constructor(mentions){
        this.mentions = mentions
    }


    first(){
        return this.mentions[0]
    }

    last(){
        return this.mentions[this.mentions.length - 1]
    }

    get(index) {
        //pass
    }
}

module.exports = Mentions