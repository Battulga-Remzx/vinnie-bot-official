const Discord = require("discord.js");

exports.execute = (client, message, args) => {
  const { EmbedBuilder } = Discord;
  
  let user = message.mentions.users.first() || message.author;
  
  // Өгөгдөл авах
  let money = client.db.fetch(`money_${user.id}`) || 0;
  let bank = client.db.fetch(`bank_${user.id}`) || 0;
  let vip = client.db.fetch(`vip_${user.id}`) || false;
  
  // Зэрэглэл тодорхойлох
  let allMoney = client.db.all()
    .filter(data => data.ID.startsWith('money_'))
    .sort((a, b) => b.data - a.data);
  
  let position = allMoney.findIndex(data => data.ID === `money_${user.id}`) + 1;
  
  let rankEmoji = '🏆';
  if (position === 1) rankEmoji = '🥇';
  else if (position === 2) rankEmoji = '🥈';
  else if (position === 3) rankEmoji = '🥉';
  
  const embed = new EmbedBuilder()
    .setColor(client.config.color.primary)
    .setTitle(`${user.username} - Профайл`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields(
      { 
        name: '💳 Санхүү', 
        value: `**Гар дээрх мөнгө:** ${money.toLocaleString()} ${client.config.emoji.money}\n**Банк:** ${bank.toLocaleString()} ${client.config.emoji.bank}`,
        inline: false
      },
      {
        name: '👑 Зэрэглэл',
        value: `${rankEmoji} **${position}**-р байр`,
        inline: true
      },
      {
        name: '💎 ВИП статус',
        value: vip ? '✅ Тийм' : '❌ Үгүй',
        inline: true
      },
      {
        name: '📅 Нэгдсэн',
        value: `<t:${Math.floor(message.member.joinedTimestamp / 1000)}:R>`,
        inline: true
      }
    )
    .setFooter({ text: `ID: ${user.id}`, iconURL: client.user.displayAvatarURL() })
    .setTimestamp();
  
  message.channel.send({ embeds: [embed] });
};

exports.help = {
  name: "profile",
  aliases: ["pro", "p"],
  usage: "profile [@хэрэглэгч]",
  description: "Өөрийн эсвэл өөр хэрэглэгчийн профайлыг харна"
};

exports.channels = [
    '1479438402897317900',
    '1479438435612885024',
    '1479438471021199473',
    '1479447028110196767',
    '1479439212418961429',
    '1479439256219811880',
    '1479442233852694549',
    '1479439485782593576',
];

exports.cooldown = 2;