const { EmbedBuilder } = require('discord.js');

exports.execute = (client, message, args) => {
  const sender = message.author;
  
  // Хүлээн авагч шалгах
  const receiver = message.mentions.users.first();
  if (!receiver) {
    return message.reply('❌ Мөнгө шилжүүлэх хэрэглэгчээ тэмдэглэнэ үү!');
  }

  if (receiver.id === sender.id) {
    return message.reply('❌ Өөртөө мөнгө шилжүүлэх боломжгүй!');
  }

  // Дүн шалгах
  const amount = parseInt(args[1]);
  if (isNaN(amount) || amount <= 0) {
    return message.reply('❌ Зөв дүн оруулна уу!');
  }

  // Мөнгө шалгах
  const senderMoney = client.db.fetch(`money_${sender.id}`) || 0;
  if (senderMoney < amount) {
    return message.reply(`❌ Танд хангалттай мөнгө байхгүй! Одоогийн мөнгө: **${senderMoney}** 💰`);
  }

  // Шилжүүлэх
  client.db.subtract(`money_${sender.id}`, amount);
  client.db.add(`money_${receiver.id}`, amount);

  const embed = new EmbedBuilder()
    .setColor('#57F287')
    .setTitle('💸 Мөнгө шилжүүлэг')
    .setDescription(`
      ✅ **${amount.toLocaleString()}** 💰 амжилттай шилжүүллээ!

      **Илгээгч:** ${sender.tag}
      **Хүлээн авагч:** ${receiver.tag}
    `)
    .addFields(
      { 
        name: '💰 Илгээгчийн үлдэгдэл', 
        value: `${(senderMoney - amount).toLocaleString()} 💰`, 
        inline: true 
      },
      { 
        name: '💳 Хүлээн авагчийн үлдэгдэл', 
        value: `${(client.db.fetch(`money_${receiver.id}`) || 0).toLocaleString()} 💰`, 
        inline: true 
      }
    )
    .setThumbnail(receiver.displayAvatarURL({ dynamic: true }))
    .setTimestamp();

  message.channel.send({ embeds: [embed] });
};

exports.help = {
  name: 'transfer',
  aliases: ['give', 'send', 'шилжүүлэх'],
  usage: 'transfer <@хэрэглэгч> <дүн>',
  description: 'Өөр хэрэглэгч рүү мөнгө шилжүүлэх'
};

exports.channels = ['1479442233852694549'];

exports.cooldown = 5;