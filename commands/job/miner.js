// commands/job/mine.js
const { EmbedBuilder } = require('discord.js');

exports.execute = async (client, message, args) => {
  const user = message.author;
  
  // Ажлыг шалгах
  const job = client.db.fetch(`job_${user.id}`);
  const working = client.db.fetch(`working_${user.id}`);
  
  if (!working || job !== 'miner') {
    return message.reply('❌ Та уурхайчны ажилд ороогүй байна! `!job miner`');
  }

  // Cooldown шалгах
  const cooldown = client.db.fetch(`miner_cd_${user.id}`);
  const now = Date.now();
  const cooldownTime = 30000; // 30 секунд

  if (cooldown && now - cooldown < cooldownTime) {
    const left = Math.ceil((cooldownTime - (now - cooldown)) / 1000);
    return message.reply(`⏱️ Дараагийн олборлолт хийхэд **${left}** секунд үлдлээ.`);
  }

  // Олдворууд (магадлалтай)
  const items = [
    { name: '⬛ Нүүрс', emoji: '⬛', value: 'coal', min: 1, max: 5, chance: 50 },
    { name: '⛓️ Төмөр', emoji: '⛓️', value: 'iron', min: 1, max: 3, chance: 25 },
    { name: '🪙 Алт', emoji: '🪙', value: 'gold', min: 1, max: 2, chance: 15 },
    { name: '💎 Алмааз', emoji: '💎', value: 'diamond', min: 1, max: 1, chance: 8 },
    { name: '⚛️ Антиматтер', emoji: '⚛️', value: 'antimatter', min: 1, max: 1, chance: 2 }
  ];

  // Санамсаргүй сонголт (магадлалаар)
  const rand = Math.random() * 100;
  let cumulative = 0;
  let foundItem = items[0]; // default

  for (const item of items) {
    cumulative += item.chance;
    if (rand < cumulative) {
      foundItem = item;
      break;
    }
  }

  // Хэдэн ширхэг олсон
  const amount = Math.floor(Math.random() * (foundItem.max - foundItem.min + 1)) + foundItem.min;

  // Өмнөх тоо
  const current = client.db.fetch(`${foundItem.value}_${user.id}`) || 0;

  // Нэмэх
  client.db.add(`${foundItem.value}_${user.id}`, amount);
  client.db.set(`miner_cd_${user.id}`, now);

  // Үнэлгээ (зарахад хэр их мөнгө болох)
  const sellPrices = client.sellprice;
  const worth = sellPrices[foundItem.value] * amount;

  const embed = new EmbedBuilder()
    .setColor('#CD7F32')
    .setTitle('⛏️ УУРХАЙЧНЫ ОЛБОРЛОЛТ')
    .setDescription(`
**${user.username}** уурхайд ажиллаж байна...

━━━━━━━━━━━━━━━━━━━━━
🎁 **Олдвор:** ${foundItem.emoji} ${foundItem.name}
🔢 **Тоо хэмжээ:** ${amount} ширхэг
📊 **Одоогийн тоо:** ${current + amount} ширхэг

💰 **Үнэ цэнэ:** ${worth.toLocaleString()} 🪙 (зарахад)
━━━━━━━━━━━━━━━━━━━━━
    `)
    .setFooter({ text: '⏱️ Дараагийн олборлолт: 30 секунд' })
    .setTimestamp();

  message.channel.send({ embeds: [embed] });
};

exports.help = {
  name: 'mine',
  aliases: ['m', 'олборлох'],
  usage: 'mine',
  description: '⛏️ Уурхайчнаас эрдэс бодис олборлох'
};

// Зөвхөн цагдаагийн сувагт
exports.channels = ['1479438471021199473'];

exports.cooldown = 30;