const { EmbedBuilder } = require('discord.js');

exports.execute = (client, message, args) => {
  const user = message.author;
  
  // Мөнгө шалгах
  let money = client.db.fetch(`money_${user.id}`) || 0;
  let bank = client.db.fetch(`bank_${user.id}`) || 0;

  // Хэрэв аргумент байхгүй бол мэдээлэл харуулах
  if (!args[0]) {
    const infoEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🏦 Банк - Хадгаламж')
      .setDescription(`
        **Одоогийн үлдэгдэл:**
        💵 Бэлэн мөнгө: ${money.toLocaleString()} 💰
        🏦 Банк: ${bank.toLocaleString()} 💰

        **Хэрэглээ:**
        \`${client.prefix}deposit <дүн>\` - Тодорхой дүн хадгалах
        \`${client.prefix}deposit all\` - Бүх мөнгөө хадгалах
      `)
      .setFooter({ text: user.tag, iconURL: user.displayAvatarURL() })
      .setTimestamp();
    
    return message.channel.send({ embeds: [infoEmbed] });
  }

  // Бүх мөнгө хадгалах
  if (args[0].toLowerCase() === 'all') {
    if (money <= 0) {
      return message.reply('❌ Танд хадгалах мөнгө байхгүй байна!');
    }

    client.db.subtract(`money_${user.id}`, money);
    client.db.add(`bank_${user.id}`, money);

    const successEmbed = new EmbedBuilder()
      .setColor('#57F287')
      .setTitle('✅ Хадгаламж амжилттай')
      .setDescription(`**${money.toLocaleString()}** 💰 банкинд хадгалагдлаа.`)
      .addFields(
        { name: '💵 Шинэ бэлэн мөнгө', value: '0 💰', inline: true },
        { name: '🏦 Шинэ банк', value: `${(bank + money).toLocaleString()} 💰`, inline: true }
      )
      .setTimestamp();

    return message.channel.send({ embeds: [successEmbed] });
  }

  // Тодорхой дүн хадгалах
  const amount = parseInt(args[0]);
  if (isNaN(amount) || amount <= 0) {
    return message.reply('❌ Зөв дүн оруулна уу!');
  }

  if (money < amount) {
    return message.reply(`❌ Танд хангалттай мөнгө байхгүй! Одоогийн бэлэн мөнгө: **${money}** 💰`);
  }

  client.db.subtract(`money_${user.id}`, amount);
  client.db.add(`bank_${user.id}`, amount);

  const newMoney = money - amount;
  const newBank = bank + amount;

  const embed = new EmbedBuilder()
    .setColor('#57F287')
    .setTitle('✅ Хадгаламж амжилттай')
    .setDescription(`**${amount.toLocaleString()}** 💰 банкинд хадгалагдлаа.`)
    .addFields(
      { name: '💵 Шинэ бэлэн мөнгө', value: `${newMoney.toLocaleString()} 💰`, inline: true },
      { name: '🏦 Шинэ банк', value: `${newBank.toLocaleString()} 💰`, inline: true }
    )
    .setTimestamp();

  message.channel.send({ embeds: [embed] });
};

exports.help = {
  name: 'deposit',
  aliases: ['dep', 'store', 'хадгалах'],
  usage: 'deposit <дүн/all>',
  description: 'Мөнгөө банкинд хадгалах'
};

exports.channels = ['1479442233852694549'];

exports.cooldown = 3;