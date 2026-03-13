const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

exports.execute = async (client, message, args) => {
  const user = message.author;
  
  const betOptions = [
    { name: '🔴 Улаан', value: 'red', multiplier: 2 },
    { name: '⚫ Хар', value: 'black', multiplier: 2 },
    { name: '🔵 Тэгш', value: 'even', multiplier: 2 },
    { name: '🟣 Сондгой', value: 'odd', multiplier: 2 },
    { name: '🎯 Тодорхой тоо (0-36)', value: 'number', multiplier: 36 }
  ];

  // Хэрэв аргумент байхгүй бол сонголт харуулах
  if (!args[0]) {
    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('roulette_bet')
          .setPlaceholder('🎲 Бооцооны төрөл сонгох')
          .addOptions(betOptions.map(opt => ({
            label: opt.name,
            value: opt.value,
            emoji: opt.name.split(' ')[0]
          })))
      );

    return message.channel.send({
      content: '🎰 **Рулет - Бооцооны төрөл сонгоно уу**',
      components: [row]
    }).then(msg => {
      const filter = i => i.user.id === user.id;
      const collector = msg.createMessageComponentCollector({ filter, time: 30000, max: 1 });

      collector.on('collect', async (i) => {
        const betType = i.values[0];
        await i.update({ 
          content: `✅ **${betOptions.find(o => o.value === betType)?.name}** сонгогдлоо. Одоо дүнгээ оруулна уу: \`${client.prefix}roulette ${betType} <дүн> [тоо]\``,
          components: [] 
        });
      });
    });
  }

  const betType = args[0].toLowerCase();
  let betNumber = null;
  let amountIndex = 1;

  // Тоо сонгосон эсэх
  if (betType === 'number') {
    betNumber = parseInt(args[1]);
    if (isNaN(betNumber) || betNumber < 0 || betNumber > 36) {
      return message.reply('❌ 0-36 хооронд тоо оруулна уу!');
    }
    amountIndex = 2;
  }

  const amount = parseInt(args[amountIndex]);
  if (isNaN(amount) || amount <= 0) {
    return message.reply('❌ Зөв дүн оруулна уу!');
  }

  // Мөнгө шалгах
  const coins = await client.db.fetch(`coin_${user.id}`) || 0;
  if (coins < amount) {
    return message.reply(`❌ Танд хангалттай зоос байхгүй! Одоогийн зоос: **${coins}** 🪙`);
  }

  // Мөнгө хасах
  await client.db.subtract(`coin_${user.id}`, amount);

  // Animation мессеж
  const spinEmbed = new EmbedBuilder()
    .setColor('#FFA500')
    .setTitle('🎲 Рулет эргүүлж байна...')
    .setDescription(`
**${user.username}**
⚪ Эргүүлж байна...

Бооцоо: **${amount}** 🪙
Сонголт: ${betOptions.find(o => o.value === betType)?.name} ${betNumber !== null ? `(${betNumber})` : ''}
    `)
    .setFooter({ text: 'Түр хүлээнэ үү...' })
    .setTimestamp();

  const msg = await message.channel.send({ embeds: [spinEmbed] });

  // Рулет эргэх animation (3 секунд)
  setTimeout(async () => {
    // Санамсаргүй тоо
    const winningNumber = Math.floor(Math.random() * 37); // 0-36
    const isEven = winningNumber !== 0 && winningNumber % 2 === 0;
    const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(winningNumber);
    const isBlack = !isRed && winningNumber !== 0;

    let win = false;
    let multiplier = 0;

    if (betType === 'red' && isRed) {
      win = true;
      multiplier = 2;
    } else if (betType === 'black' && isBlack) {
      win = true;
      multiplier = 2;
    } else if (betType === 'even' && isEven) {
      win = true;
      multiplier = 2;
    } else if (betType === 'odd' && !isEven && winningNumber !== 0) {
      win = true;
      multiplier = 2;
    } else if (betType === 'number' && betNumber === winningNumber) {
      win = true;
      multiplier = 36;
    }

    // Мөнгө шинэчлэх
    let winAmount = 0;
    if (win) {
      winAmount = amount * multiplier;
      await client.db.add(`coin_${user.id}`, winAmount);
    } else {
      winAmount = -amount;
    }

    const newCoins = await client.db.fetch(`coin_${user.id}`) || 0;

    // Өнгө тодорхойлох
    let colorText = '';
    let colorEmoji = '';
    if (winningNumber === 0) {
      colorText = 'Ногоон';
      colorEmoji = '🟢';
    } else if (isRed) {
      colorText = 'Улаан';
      colorEmoji = '🔴';
    } else {
      colorText = 'Хар';
      colorEmoji = '⚫';
    }

    // Үр дүнгийн embed
    const resultEmbed = new EmbedBuilder()
      .setColor(win ? '#57F287' : '#ED4245')
      .setTitle('🎲 Рулет')
      .setDescription(`
**${user.username}**

┌─────────────┐
│    🎰 ${winningNumber} ${colorEmoji}    │
└─────────────┘

**Гарсан тоо:** ${winningNumber} (${colorEmoji} ${colorText})
**Таны сонголт:** ${betOptions.find(o => o.value === betType)?.name} ${betNumber !== null ? `(${betNumber})` : ''}

${win ? '✅ **ХОЖЛОО!**' : '❌ **ХОЖИГДЛОО!**'}
      `)
      .addFields(
        { name: '💰 Бооцоо', value: `${amount} 🪙`, inline: true },
        { name: '💵 Үр дүн', value: win ? `+${winAmount} 🪙` : `${winAmount} 🪙`, inline: true },
        { name: '💳 Одоогийн зоос', value: `${newCoins} 🪙`, inline: true }
      )
      .setFooter({ text: user.tag, iconURL: user.displayAvatarURL() })
      .setTimestamp();

    await msg.edit({ embeds: [resultEmbed] });

  }, 3000); // 3 секундын дараа үр дүн гарна
};

exports.help = {
  name: 'roulette',
  aliases: ['rlt', 'рулет'],
  usage: 'roulette [улаан/хар/тэгш/сонгодой/тоо] <дүн> [тоо]',
  description: 'Рулет тоглож зоос нэмэх'
};

exports.channels = ['1479439256219811880'];

exports.cooldown = 5;