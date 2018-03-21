var reactionNumbers = ["1⃣","2⃣","3⃣","4⃣","5⃣","6⃣","7⃣","8⃣","9⃣", "🔟"];
var reactions = ["390223211662540800","390223209930424321","390223211637243905","390223211616534577","390223211456888835","390223210240540683"];
var cooldown = {};

const Discord = require('discord.js');


var random = require("random-number-csprng");
var fs = require("fs");

module.exports = {
	async permCheck(message, commandName, client){
		if(!message.member) message.member = await client.guilds.first().members.fetch(message.author.id)

		if(client.data.perms[commandName] == undefined || message.member.roles.exists("name","🍬 Admin") ||  message.member.roles.exists("name","🍬 Master Developer"))return true;
		var allowedChannel = true;
		var allowed = false;

		if(client.data.perms[commandName].channel.length>0){
			allowedChannel = false;
			client.data.perms[commandName].channel.forEach(function(channel){
				if(channel == message.channel.name){allowedChannel = true}
			})
		}
		if(allowedChannel){
			if(client.data.perms[commandName].role.length==0 && client.data.perms[commandName].user.length==0){return true};

			if(client.data.perms[commandName].role.length>0){
				for(var i=0;i<client.data.perms[commandName].role.length;i++){
					var role = message.member.guild.roles.find("name", client.data.perms[commandName].role[i]);
					if(role != null && message.member.roles.has(role.id)){
						return true;
						i=client.data.perms[commandName].role.length;
					}
				}
			}

			if(!allowed && client.data.perms[commandName].user.length>0){
				for(var i=0;i<client.data.perms[commandName].user.length;i++){
					if(client.data.perms[commandName].user[i] == message.author.id){
						return true;
						i=client.data.perms[commandName].user.length;
					}
				}
			}

		}
		return false;
	},

	async userCheck(id,client){
		client.guilds.first().members.fetch(id).then(async member=>{
			if(member.user.bot) return;

			if(client.data.inventory[id] == undefined) {
				client.data.inventory[id]={badges:[],bgs:[]};
				await module.exports.save(client.data.inventory,"inventory");
			}
			if(client.data.exp[id] == undefined){
				client.data.exp[id] = {"color":colors[await random(0,colors.length-1)], "rank":0,"lvl":1,"exp":0,"money":0,"lastDaily":"Not Collected",};
				await module.exports.save(client.data.exp,"exp");		
			}		
				
			var rankRoles = member.roles.filter(role => role.name.startsWith(`[`));
			if(rankRoles.size>1 || rankRoles.size == 0){
				if (rankRoles.size>1) member.roles.remove(rankRoles);
				var role = member.guild.roles.filter(role => role.name.includes(`[${client.data.exp[id].lvl}]`));
				member.roles.add(role,"Added level role");
			}

			if(member.roles.find("name","☕ Customers") == undefined){
				let roles = [client.data.colorRoles[client.data.exp[member.id].color][client.data.exp[member.id].rank], client.data.groupRoles[client.data.exp[member.id].color]];
				member.roles.add(roles,"User join");
			}
		})	
	},

	react:function(msg){
		reactions.forEach(reaction => {
			msg.react(reaction);
		})
	},

	/*findEmoji:function(emoji){
        for(var i=0;i<10;i++){
            if(reactions[i]==emoji){
                return i+1;
            }
        }
    },*/

	async exp(msg,client){
		if(cooldown[msg.author.id] == undefined && !msg.author.bot){ //checks if the user is not on cooldown and filters bots out
			await module.exports.userCheck(msg.author.id,client)

			//adds random amount (15-25) of exp to the user
			var randomExp = Math.floor(Math.random() * ((25-15)+1) + 15);
			client.data.exp[msg.author.id].exp += randomExp;

			module.exports.save(client.data.exp,"exp");


			if(client.data.exp[msg.author.id].exp > client.data.levels[client.data.inventory[msg.author.id].lvl-1].exp){ //checks if the user has reached enough exp

				var levelroles = msg.member.roles.filter(r=>r.name.includes("[")) //finds all roles that start with [
				await msg.member.roles.remove(levelroles,"Removed level roles"); //removes all lvl roles
				
				client.data.inventory[msg.author.id].lvl += 1;

				await msg.member.roles.add([msg.guild.roles.find("name",`[${client.data.inventory[msg.author.id].lvl}]`)]);

				client.data.inventory[msg.author.id].money += 2000 //adds money reward for leveling up

				module.exports.save(client.data.inventory,"exp");

				if(client.data.levels[client.data.inventory[msg.author.id].lvl].rewards != undefined){
					client.data.levels[client.data.inventory[msg.author.id].lvl].rewards.forEach(async reward => { //checks every reward
						switch(reward.type){
							case "role":
								/*{
									"type": "role",
									"name": "🍧 - Members",
									"remove":"☕ - Customers"
								}*/
								if(!(msg.member.nickname.endsWith("🔰") || msg.member.nickname.endsWith("🍬") || msg.member.nickname.endsWith("🔧") || msg.member.nickname.endsWith("✨") || msg.member.nickname.endsWith("🔖"))){
									await msg.member.roles.add(msg.guild.roles.find("name",reward.name),"Added reward role"); //adds the rewarded role
									await msg.member.roles.remove(msg.guild.roles.find("name",reward.remove),"Removed old rank")

									var nick = msg.member.nickname;
									if(msg.member.nickname.endsWith(reward.remove.split(" ")[0])){
										nick = nick.split(reward.remove.split(" ")[0])[0]
									}
									nick += reward.name.split(" ")[0]

									msg.member.setNickname(nick,"Changed nickname emoji");
									client.data.nicks[msg.member.id] = nick;
									await module.exports.save(client.data.nicks,"nicks");
								}
								break;

							case "rankUP":
								/*{
									"type": "rankUP"
								}*/								
								if(Object.keys(colorRoles) != 0) {
									let result = module.exports.getRoles(client);
									colorRoles = result[0];
									groupRoles = result[1];
								}

								let rank = client.data.inventory[msg.author.id].rank;
								let color = client.data.inventory[msg.author.id].color;
								let oldRoles = [colorRoles[color][rank]];
								let newRoles = [colorRoles[color][rank + 1]];

								await msg.member.roles.remove(oldRoles);
								await msg.member.roles.add(newRoles);

								var nick = msg.member.nickname.split(' ');
								nick[nick.length - 1] = newRoles[1].name.split(' ')[0];
								msg.member.setNickname(nick.join(' '), 'Changed nickname emoji');

								client.data.inventory[msg.author.id].rank += 1;
								break;
						}
					})
				}

			}

			await module.exports.save(client.data.inventory,"exp");

			cooldown[msg.author.id] = true; //sets the user on cooldown and will remove it in 60000 ms (1 minute)
			setTimeout(function(authorID){
				delete cooldown[authorID];
			},90000,msg.author.id)
		}
	},

	talk:function(client,msg){
		if(msg.mentions.channels.size>0){
			client.channels.resolve(msg.mentions.channels.first()).send(msg.content.split(msg.mentions.channels.first()).join(""));
		}
	},

	async save(data,name){
		await fs.writeFile("data/" + name + ".json", JSON.stringify(data, null, 4));
	},


	log:function(client,log){
		console.log(log);
		if(client != null && client.channels.size>0 && client.readyAt != null){			
			client.channels.find("name","bot-logs").send({embed:new Discord.MessageEmbed().setTimestamp().setDescription(log)});
		}
	}
}

