var path = require("path")
var util = require("../../utilities.js")
const modRole = '🍬 Admin';
const devRole = '🍬 Master Developer';

module.exports = {
    desc:"This is a description",
    execute(client, message, param){
        if (!message.member.roles.exists("name", modRole) && !message.member.roles.exists("name", devRole)) {
            message.channel.send({embed: {
                color: 10181046,
                author: {
                    name: message.author.username,
                    icon_url: message.author.avatarURL()
                },
                fields: [{
                    name: "Add Money",
                    value: '**You need the role `' + modRole + '` to use this command...**'
                }]
            }})
            return;
        }

        if (!param[1]) {
            message.channel.send({embed: {
                color: 10181046,
                author: {
                    name: message.author.username,
                    icon_url: message.author.avatarURL()
                },

                fields: [{
                    name: "Add Money",
                    value: `**You need to define an amount. Usage: >BALSET <amount> <user>**`
                }]
            }})
            return;
        }

        if (isNaN(param[1])) {
            message.channel.send({embed: {
                color: 10181046,
                author: {
                    name: message.author.username,
                    icon_url: message.author.avatarURL()
                },

                fields: [{
                    name: "Add Money",
                    value: `**The amount has to be a number. Usage: >addmoney <amount> <user>**`
                }]
            }});
            return;
        }
        var id = message.author.id;
        if(message.mentions.users.size > 0) id = message.mentions.users.first().id;
        
        client.data.exp[id].money += parseInt(param[1])
        util.save(client.data.exp,"exp");
        message.channel.send(`**User defined had ${param[1]} added/subtraction from their account.**`)
    }
}