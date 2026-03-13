const { EmbedBuilder } = require('discord.js');

exports.execute = async (client, message, args) => {
  // Санамсаргүй дүн үүсгэх (5000-15000 хооронд)
  const randomAmount = Math.floor(Math.random() * 10000) + 5000;
  
  const result = client.eco.weekly(message.author.id, randomAmount);
  
  if (result.onCooldown) {
    const cooldownEmbed = new EmbedBuilder()
      .setColor('#ED4245')
      .setTitle('⏱️ Хүлээнэ үү')
      .setDescription(`Долоо хоногийн урамшууллаа дахин авахад **${result.time.days}** өдөр **${result.time.hours}** цаг **${result.time.minutes}** минут **${result.time.seconds}** секунд үлдлээ.`)
      .setTimestamp();
    
    return message.reply({ embeds: [cooldownEmbed] });
  }
  
  const successEmbed = new EmbedBuilder()
    .setColor('#57F287')
    .setTitle('📆 Долоо хоногийн урамшуулал')
    .setDescription(`✅ Та **${result.amount}** 💰 авлаа!`)
    .addFields(
      { name: '💰 Одоогийн мөнгө', value: `${result.after} 💰`, inline: true },
      { name: '➕ Авсан мөнгө', value: `${result.amount} 💰`, inline: true }
    )
    .setFooter({ text: 'Долоо хоног бүр авах боломжтой' })
    .setTimestamp();

  message.reply({ embeds: [successEmbed] });
};

exports.help = {
  name: 'weekly',
  aliases: ['week', 'долоо'],
  usage: 'weekly',
  description: 'Долоо хоногийн урамшууллаа авах'
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

exports.cooldown = 0;