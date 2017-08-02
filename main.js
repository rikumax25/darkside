const Discord = require('discord.js');
var fs = require("fs");
const client = new Discord.Client();
var util = require('./utilities.js');
var id=194614248511504385;
let prefix = ">";

var commands = JSON.parse(fs.readFileSync('commands.json', 'utf8'));
var words =JSON.parse(fs.readFileSync('words.json', 'utf8'));

var express = require('express');
var app = express();

// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

app.listen(port, function() {});

client.on('ready', () => {
  console.log('I am ready!');
});

client.on('message', message => {
    if(message.author.id == id){
        if(message.content.startsWith(prefix)){
            var param = message.content.split(" ");
            param[0] = param[0].split(prefix)[1];
            var command = util.checkalias(param[0]);
            
            if(command.type == "execute"){command.type = param[0]};
            switch(command.type){
                /*case "prune":
                    message.channel.search({
                      author: message.author,
                        channel: message.channel,
                        limit: Number(param[1])
                    }).then(res => {           
                            const hit = res.messages[0].find(m => m.hit).content;
                            console.log(`I found: **${hit}**, total results: ${res.totalResults}`);
                    })
                    
                    break;*/
                    
                case "play":
                    param.shift();
                    message.client.user.setGame(param.join(" "));
                    break;
                    
                case "simple":
                    message.edit(command.content);
                    break;
                    
                case "embed":
                    var embed = new Discord.RichEmbed()
                    .setColor(0x00AE86)
                    .setImage(command.content);
                     message.edit({embed});
                    break;
                    
                case "add":
                    var name = param[2];
                    var type = param[1];
                    param.shift();
                    param.shift();
                    param.shift();
                    commands[name] = {
                        "type":type,
                        "content": (param.join(" ")).split("\\n").join("\n"),
                        "alias":[]
                    };
                    fs.writeFileSync('commands.json',JSON.stringify(commands), 'utf8');
                    message.reply("Command added");
                    message.delete();
                    break;
                    
                case "alias":
                    if(!commands[param[1]].alias){commands[param[1]].alias = [];};
                    commands[param[1]].alias.push( param[2]);
                    fs.writeFileSync('commands.json',JSON.stringify(commands), 'utf8');
                    message.edit("Alias added");
                    break;
                    
                case "show":
                    console.log(JSON.parse(fs.readFileSync(param[1] + ".json", 'utf8')));
                    break;
                
                case "word":
                    var name = param[1];
                    param.shift();
                    param.shift();

                    words[name] = param.join(" ");
                    fs.writeFileSync('words.json',JSON.stringify(words), 'utf8')
                    break;
                    
                case "remove":
                    delete commands[param[1]];
                    fs.writeFileSync('commands.json',JSON.stringify(commands), 'utf8');
                    message.reply("Command removed");
                    message.delete();
                    break;
                
                case "default":
                default:
                    message.reply('This command is not on our realm');
                    break;
            }
        }else{
            util.correct(message);
        }
    }
});

client.login("MTk0NjE0MjQ4NTExNTA0Mzg1.Cl2j8Q.cjF6x4ggFAODL_2xX-bkEZi_T0k");
