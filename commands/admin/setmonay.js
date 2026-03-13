const { EmbedBuilder } = require('discord.js');

exports.execute = (client, message, args) => {
  // Зөвхөн админ эрхтэй хэрэглэгч шалгах
  const isAdmin = client.config.admins.includes(message.author.id) || 
                  message.member.permissions.has('Administrator');

  if (!isAdmin) {
    return message.reply('❌ Танд энэ командыг ашиглах эрх байхгүй!');
  }

  // Хэрэглэгч шалгах
  const user = message.mentions.users.first();
  if (!user) {
    return message.reply('❌ Хэрэглэгч тэмдэглэнэ үү!');
  }

  // Дүн шалгах
  const amount = parseInt(args[1]);
  if (isNaN(amount) || amount < 0) {
    return message.reply('❌ Зөв дүн оруулна уу!');
  }

  // Мөнгө тогтоох
  client.db.set(`money_${user.id}`, amount);

  const embed = new EmbedBuilder()
    .setColor('#57F287')
    .setTitle('⚙️ Админ - Мөнгө тогтоох')
    .setDescription(`
      ✅ **${user.tag}** хаягийн мөнгө амжилттай шинэчлэгдлээ!
      
      **Шинэ мөнгө:** ${amount.toLocaleString()} 💰
    `)
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: `Админ: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
    .setTimestamp();

  message.channel.send({ embeds: [embed] });

  // Лог
  console.log(`[ADMIN] ${message.author.tag} set ${user.tag}'s money to ${amount}`);
};

exports.help = {
  name: 'setmoney',
  aliases: ['setm', 'тогтоох'],
  usage: 'setmoney <@хэрэглэгч> <дүн>',
  description: 'Хэрэглэгчийн мөнгийг тогтоох (Зөвхөн админ)'
};