const { EmbedBuilder } = require('discord.js');

exports.execute = async (client, message, args) => {
  const donors = [
    '🍔 Макдоналдс',
    '🏦 Банк',
    '👨‍💼 Захирал',
    '👵 Эмээ',
    '👴 Өвөө',
    '🤵 Баян хүн',
    '💼 Бизнесмэн',
    '🎓 Багш',
    '👨‍🌾 Тариаланч',
    '🦸 Супер баатар'
  ];

  const donor = donors[Math.floor(Math.random() * donors.length)];
  
  // Санамсаргүй дүн үүсгэх (70-570 хооронд)
  const randomAmount = Math.floor(Math.random() * 500) + 70;
  
  // randomAmount-г дамжуулж байна
  const result = client.eco.beg(message.author.id, randomAmount, { canLose: true });
  
  if (result.onCooldown) {
    const cooldownEmbed = new EmbedBuilder()
      .setColor('#ED4245')
      .setTitle('⏱️ Хүлээнэ үү')
      .setDescription(`Дараагийн удаа **${result.time.seconds}** секундын дараа.`)
      .setTimestamp();
    
    return message.reply({ embeds: [cooldownEmbed] });
  }
  
  if (result.lost) {
    const loseEmbed = new EmbedBuilder()
      .setColor('#ED4245')
      .setTitle('❌ Амжилтгүй')
      .setDescription(`**${donor}:** "Өнөөдөр авах юм алга, зайл!"`)
      .setTimestamp();
    
    return message.channel.send({ embeds: [loseEmbed] });
  }
  
  const successEmbed = new EmbedBuilder()
    .setColor('#57F287')
    .setTitle('✅ Гуйлт амжилттай')
    .setDescription(`**${donor}** танд **${result.amount}** 💰 хандивлалаа!`)
    .addFields(
      { name: '💰 Одоогийн мөнгө', value: `${result.after} 💰`, inline: true },
      { name: '➕ Авсан мөнгө', value: `${result.amount} 💰`, inline: true }
    )
    .setTimestamp();

  message.reply({ embeds: [successEmbed] });
};

exports.help = {
  name: 'beg',
  aliases: ['гуйх', 'beggar'],
  usage: 'beg',
  description: 'Хүмүүсээс мөнгө гуйх'
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

exports.cooldown = 30;