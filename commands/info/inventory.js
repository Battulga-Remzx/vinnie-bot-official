const { EmbedBuilder } = require('discord.js');

exports.execute = (client, message, args) => {
  const author = message.author;
  
  // Агуулахын зүйлс
  const items = {
    '🍔 Хоол': client.db.fetch(`food_${author.id}`) || 0,
    '💧 Ус': client.db.fetch(`water_${author.id}`) || 0,
    '⚡ Энерджи Дринк': client.db.fetch(`energyD_${author.id}`) || 0,
    '📱 Утас': client.db.fetch(`phone_${author.id}`) || 0,
    '🪙 Зоос': client.db.fetch(`coin_${author.id}`) || 0,
    '🔑 Түлхүүр': client.db.fetch(`key_${author.id}`) || 0,
    '🔧 Багаж': client.db.fetch(`tool_${author.id}`) || 0,
    '⚛️ Антиматтер': client.db.fetch(`antimatter_${author.id}`) || 0,
    '💎 Алмааз': client.db.fetch(`diamond_${author.id}`) || 0,
    '🪙 Алт': client.db.fetch(`gold_${author.id}`) || 0,
    '⛓️ Төмөр': client.db.fetch(`iron_${author.id}`) || 0,
    '⬛ Нүүрс': client.db.fetch(`coal_${author.id}`) || 0
  };

  // Зөвхөн 0-ээс их утгатай зүйлсийг харуулах
  let content = '';
  let hasItems = false;

  for (const [name, amount] of Object.entries(items)) {
    if (amount > 0) {
      content += `**${name}** : ${amount.toLocaleString()}\n`;
      hasItems = true;
    }
  }

  if (!hasItems) {
    content = '📍 Агуулах хоосон байна. Дэлгүүрээс зүйлс худалдан авч болно!';
  }

  // Мөнгөний үлдэгдэл
  const money = client.db.fetch(`money_${author.id}`) || 0;

  const embed = new EmbedBuilder()
    .setTitle(`🎒 ${author.username} - Агуулах`)
    .setColor('#5865F2')
    .setDescription(content)
    .addFields({
      name: '💵 Бэлэн мөнгө',
      value: `${money.toLocaleString()} 💰`,
      inline: true
    })
    .setThumbnail(author.displayAvatarURL({ dynamic: true, size: 256 }))
    .setFooter({ 
      text: `${client.prefix}buy - зүйл худалдан авах | ${client.prefix}sell - зүйл зарах`,
      iconURL: client.user.displayAvatarURL()
    })
    .setTimestamp();

  // DM-р илгээх эсвэл сувагт харуулах сонголт
  if (args[0] === 'dm') {
    message.channel.send('📬 Агуулахыг DM-р илгээж байна...');
    author.send({ embeds: [embed] }).catch(() => {
      message.reply('❌ DM илгээх боломжгүй байна. DM-ээ нээлттэй эсэхийг шалгана уу.');
    });
  } else {
    message.channel.send({ embeds: [embed] });
  }
};

exports.help = {
  name: 'inventory',
  aliases: ['inv', 'bag', 'агуулах'],
  usage: 'inventory [dm]',
  description: 'Өөрийн агуулах дахь зүйлсийг харна'
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

exports.cooldown = 3;