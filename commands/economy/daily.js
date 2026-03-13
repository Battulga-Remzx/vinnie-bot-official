const { EmbedBuilder } = require('discord.js');

exports.execute = async (client, message, args) => {
  // Санамсаргүй дүн үүсгэх (1000-4000 хооронд)
  const randomAmount = Math.floor(Math.random() * 3000) + 1000;
  
  const result = client.eco.daily(message.author.id, randomAmount);
  
  if (result.onCooldown) {
    const cooldownEmbed = new EmbedBuilder()
      .setColor('#ED4245')
      .setTitle('⏱️ Хүлээнэ үү')
      .setDescription(`Өдрийн урамшууллаа дахин авахад **${result.time.hours}** цаг **${result.time.minutes}** минут **${result.time.seconds}** секунд үлдлээ.`)
      .setTimestamp();
    
    return message.reply({ embeds: [cooldownEmbed] });
  }
  
  const successEmbed = new EmbedBuilder()
    .setColor('#57F287')
    .setTitle('📅 Өдрийн урамшуулал')
    .setDescription(`✅ Та **${result.amount}** 💰 авлаа!`)
    .addFields(
      { name: '💰 Одоогийн мөнгө', value: `${result.after} 💰`, inline: true },
      { name: '➕ Авсан мөнгө', value: `${result.amount} 💰`, inline: true }
    )
    .setFooter({ text: 'Маргааш дахин авах боломжтой' })
    .setTimestamp();

  message.reply({ embeds: [successEmbed] });
};

exports.help = {
  name: 'daily',
  aliases: ['day', 'өдөр'],
  usage: 'daily',
  description: 'Өдрийн урамшууллаа авах'
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