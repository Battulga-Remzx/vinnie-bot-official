const Discord = require("discord.js");

exports.execute = (client, message, args) => {
  const { EmbedBuilder } = Discord;
  
  // Админ эрх шалгах
  if (!client.config.admins.includes(message.author.id) && !message.member.permissions.has('Administrator')) {
    return message.reply('❌ Танд энэ командыг ашиглах эрх байхгүй!');
  }
  
  const user = message.mentions.users.first();
  if (!user) {
    return message.reply('❌ Хэрэглэгч тэмдэглэнэ үү!');
  }
  
  const amount = parseInt(args[1]);
  if (isNaN(amount) || amount < 0) {
    return message.reply('❌ Зөв дүн оруулна уу!');
  }
  
  client.db.add(`money_${user.id}`, amount);
  
  const embed = new EmbedBuilder()
    .setColor(client.config.color.success)
    .setTitle('✅ Мөнгө нэмэгдлээ')
    .setDescription(`${user.tag} хаягт **${amount.toLocaleString()}**💰 нэмэгдлээ.`)
    .setTimestamp();
  
  message.channel.send({ embeds: [embed] });
};

exports.help = {
  name: "addmoney",
  aliases: ["addm"],
  usage: "addmoney @хэрэглэгч дүн",
  description: "Хэрэглэгчид мөнгө нэмэх (Зөвхөн админ)"
};