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
      .setTitle('🏦 Банк - Татан авалт')
      .setDescription(`
        **Одоогийн үлдэгдэл:**
        💵 Бэлэн мөнгө: ${money.toLocaleString()} 💰
        🏦 Банк: ${bank.toLocaleString()} 💰

        **Хэрэглээ:**
        \`${client.prefix}withdraw <дүн>\` - Тодорхой дүн татах
        \`${client.prefix}withdraw all\` - Бүх мөнгөө татах
      `)
      .setFooter({ text: user.tag, iconURL: user.displayAvatarURL() })
      .setTimestamp();
    
    return message.channel.send({ embeds: [infoEmbed] });
  }

  // Бүх мөнгө татах
  if (args[0].toLowerCase() === 'all') {
    if (bank <= 0) {
      return message.reply('❌ Банкинд мөнгө байхгүй байна!');
    }

    client.db.subtract(`bank_${user.id}`, bank);
    client.db.add(`money_${user.id}`, bank);

    const successEmbed = new EmbedBuilder()
      .setColor('#57F287')
      .setTitle('✅ Татан авалт амжилттай')
      .setDescription(`**${bank.toLocaleString()}** 💰 банкнаас татагдлаа.`)
      .addFields(
        { name: '💵 Шинэ бэлэн мөнгө', value: `${(money + bank).toLocaleString()} 💰`, inline: true },
        { name: '🏦 Шинэ банк', value: '0 💰', inline: true }
      )
      .setTimestamp();

    return message.channel.send({ embeds: [successEmbed] });
  }

  // Тодорхой дүн татах
  const amount = parseInt(args[0]);
  if (isNaN(amount) || amount <= 0) {
    return message.reply('❌ Зөв дүн оруулна уу!');
  }

  if (bank < amount) {
    return message.reply(`❌ Банкинд хангалттай мөнгө байхгүй! Одоогийн банк: **${bank}** 💰`);
  }

  client.db.subtract(`bank_${user.id}`, amount);
  client.db.add(`money_${user.id}`, amount);

  const newMoney = money + amount;
  const newBank = bank - amount;

  const embed = new EmbedBuilder()
    .setColor('#57F287')
    .setTitle('✅ Татан авалт амжилттай')
    .setDescription(`**${amount.toLocaleString()}** 💰 банкнаас татагдлаа.`)
    .addFields(
      { name: '💵 Шинэ бэлэн мөнгө', value: `${newMoney.toLocaleString()} 💰`, inline: true },
      { name: '🏦 Шинэ банк', value: `${newBank.toLocaleString()} 💰`, inline: true }
    )
    .setTimestamp();

  message.channel.send({ embeds: [embed] });
};

exports.help = {
  name: 'withdraw',
  aliases: ['wd', 'take', 'татах'],
  usage: 'withdraw <дүн/all>',
  description: 'Банкнаас мөнгө татах'
};

exports.channels = ['1479442233852694549'];

exports.cooldown = 3;