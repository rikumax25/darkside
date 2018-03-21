const Discord = require('discord.js');
var fs = require("fs");
var glob = require('glob');

var colors = ["pink","d-blue","purple","l-blue","green","orange","red"];
var util = require('./utilities.js');

const client = new Discord.Client();
client.commands = new Discord.Collection();

let commandFiles = glob.sync(`commands/**/*`);
let dataFiles = glob.sync(`data/*`);

for (const file of commandFiles) {
	if(!file.endsWith(".js")) continue;	
	const command = require(`./${file}`);

	let path_array = file.split("/");
	let name = path_array[path_array.length - 1].split(".js")[0];
	client.commands.set(name, command);
	client.commands.get(name).type = path_array[path_array.length-2];
	if(command.alias){
		command.alias.forEach(alias => client.commands.set(alias, command))
	}	
}

client.data = {};
for (const file of dataFiles) {	
	const data = require(`./${file}`);

	let path_array = file.split("/");
	let name = path_array[path_array.length - 1].split(".json")[0];
	client.data[name] = data
}

client.on('ready', async () => {
	await util.log(client,'I am ready!');
	let colorRoles = {};
	let groupRoles = {};

	let guild = client.guilds.first();
	let roles = guild.roles.filter(role  => role.position < guild.roles.find('name','//Colors').position && role.position > guild.roles.find('name','//End Colors').position).sort(function (a, b) {return a.position- b.position})
	let roles2 = guild.roles.filter(role  => role.position < guild.roles.find('name','//Groups').position && role.position > guild.roles.find('name','//End Groups').position && !role.name.startsWith('🔮') && role.name != "--------").sort(function (a, b) {return a.position- b.position})
	let section = [];
	roles.forEach(role => {	
		if(role.name == "--------"){
			colorRoles[colors[Object.keys(colorRoles).length]] = section;
			section = [];
		}else{
			section.push(role);
		}
	})
	colorRoles[colors[Object.keys(colorRoles).length]] = section;

	roles2.forEach(role => {	
		groupRoles[colors[Object.keys(groupRoles).length]] = role;
	})

	client.data.colorRoles = colorRoles;
	client.data.groupRoles = groupRoles;
});

client.on("guildMemberAdd", async member => {
	await util.userCheck(member.id,client)
	var name = member.user.username;
	if(client.data.nicks[member.id] == undefined) {
		member.setNickname(name + " ☕");
		client.data.nicks [member.id] = name + " ☕";
		util.save(nicks,"nicks");
	}else{
		member.setNickname(client.data.nicks[member.id],"Locked nickname");
	}
	member.guild.channels.find("name","main-lounge").send(`Welcome to Fandom Circle, ${member}! Have Fun`);
});

client.on("guildMemberUpdate", async (oldMember,newMember) => {
	if(oldMember.nickname != newMember.nickname){
		console.log("hello")
		client.data.nicks[newMember.id] = newMember.nickname;
		await util.save(client.data.nicks,"nicks");
	}
})

client.on('message', async message => {
		//util.exp(message,client);
		var prefix = ">";

		if(message.content.startsWith(prefix) || message.content.startsWith("<@!" + client.user.id + ">")){			
			var param = message.content.split(" ");

			if(message.content.startsWith(prefix)){
				param[0] = param[0].split(prefix)[1];
			}else{
				param.splice(0,1);
			}

			
			const commandName = param[0].toLowerCase();
			var command = client.data.commands[commandName];
			if(await util.permCheck(message,commandName, client)){				
				if(command == undefined){command = {}; command.type = param[0].toLowerCase()};
				if (!client.commands.has(command.type)) return;				
				client.commands.get(command.type).execute(client, message, param);
			}
		}

		switch(message.channel.name){
			case "nickname-change":
				if(!message.author.bot){
					var emoji = message.member.nickname.split(" ").pop();

					var namechange = message.content + " " + emoji;
					if(namechange.length < 32){
						client.data.nicks[message.member.id] = namechange;

						message.member.setNickname(namechange,"Name Change sponsored by Monokuma").then(()=>{
							util.save(client.data.nicks,"nicks").then(()=>{
								message.delete(namechange);
								message.member.roles.remove(message.guild.roles.find("name","⭕ Nickname Change"),"Nickname change")
							})							
						})
					}else{
						message.delete();
						message.author.send("That nickname is too long");
					}
				}
				break;
						
			case "akira":
				util.talk(client,message);
				break;
		}
});

process.on('unhandledRejection', err => util.log(client,err.stack));
client.login(client.data.tokens.akira);