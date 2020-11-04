class Embed {
    constructor(title,color=0x696969,description=""){
        this.title = title
        this.type = "rich"
        this.description = description
        this.fields = []
        this.color = color
    }

    addField(name,value,inline=false){
        this.fields.push({name: name, value: value, inline: inline})
        return this
    }

    addFields(array){
        this.fields = [...this.fields, ...array]
    }
    
    addFooter(content, icon=""){
        this.footer = {
            text: content,
            icon_url: icon
        }
        return this
    }

    addImage(url){
        this.image = {
            url,
        }

        return this
    }
}


module.exports = Embed