const Discord = require("discord.js");
const channelCheck = require('../utils/channelCheck');
const colorUtil = require('../utils/color');

module.exports = async (client, message) => {
  if (!message.guild || message.author.bot) return;
  
  // Серверийн угтварыг ачаалах
  client.prefix = client.db.fetch(`prefix_${message.guild.id}`) || client.config.prefix;
  
  if (!message.content.startsWith(client.prefix)) return;
  
  const args = message.content.slice(client.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  const command = client.commands.get(commandName) || 
                  client.commands.get(client.aliases.get(commandName));
  
  if (!command) return;
  
  // ===== СУВАГ ШАЛГАХ =====
  const allowedChannels = command.channels || [];
  if (allowedChannels.length > 0) {
    const check = channelCheck(client, message, allowedChannels);
    if (!check.allowed) {
      return message.reply(check.message).then(msg => {
        setTimeout(() => msg.delete(), 5000);
      });
    }
  }
  
  // ===== АДМИН ЭРХ ШАЛГАХ =====
  if (command.adminOnly) {
    const isAdmin = client.config.admins.includes(message.author.id) || 
                    message.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator);
    if (!isAdmin) {
      return message.reply('❌ Танд энэ командыг ашиглах эрх байхгүй!');
    }
  }
  
  // ===== COOLDOWN ШАЛГАХ =====
  if (!client.cooldowns.has(command.help.name)) {
    client.cooldowns.set(command.help.name, new Discord.Collection());
  }
  
  const now = Date.now();
  const timestamps = client.cooldowns.get(command.help.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;
  
  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
    
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(`⏱️ ${timeLeft.toFixed(1)} секундын дараа дахин оролдоно уу.`);
    }
  }
  
  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
  
  // Командыг ажиллуулах
  try {
    await command.execute(client, message, args);
  } catch (error) {
    console.error(`❌ Командын алдаа (${command.help.name}):`, error);
    
    const errorEmbed = new Discord.EmbedBuilder()
      .setColor(colorUtil.getColor(client, 'error'))
      .setTitle(`❌ Алдаа гарлаа`)
      .setDescription('Командыг гүйцэтгэхэд алдаа гарлаа. Дахин оролдоно уу.')
      .setTimestamp();
    
    message.reply({ embeds: [errorEmbed] });
  }
};