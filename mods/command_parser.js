function parser(content){
    let content_arrs = content.split(" ")
    console.log(content_arrs)

    let command = content_arrs.shift()

    return {
        command: command,
        arguments: [...content_arrs]
    }
}


module.exports = parser