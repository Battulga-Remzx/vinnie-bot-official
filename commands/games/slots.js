const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

exports.execute = async (client, message, args) => {
  const user = message.author;
  
  // Бооцооны дүн
  const amount = parseInt(args[0]);
  if (isNaN(amount) || amount <= 0) {
    return message.reply('❌ Зөв дүн оруулна уу! Жишээ: `!slots 100`');
  }

  // Зоос шалгах
  const coins = await client.db.fetch(`coin_${user.id}`) || 0;
  if (coins < amount) {
    return message.reply(`❌ Танд хангалттай зоос байхгүй! Одоо: **${coins}** 🪙`);
  }

  // Мөнгө хасах
  await client.db.subtract(`coin_${user.id}`, amount);

  // Символууд
  const symbols = ['🍋', '🍒', '🍇', '🍉', '7️⃣', '💎', '💰', '🎰'];
  
  // Санамсаргүй тоонууд
  const num = [];
  for (let i = 0; i < 3; i++) {
    num.push(Math.floor(Math.random() * symbols.length));
  }

  // Эхний мессеж
  const startEmbed = new EmbedBuilder()
    .setColor('#FFA500')
    .setTitle('🎰 Слот машин')
    .setDescription(`
**${user.username}**
🧊 | 🧊 | 🧊

🔄 Эргүүлж байна... **${amount}** 🪙
    `)
    .setFooter({ text: 'Бооцоо хасагдлаа' })
    .setTimestamp();

  const msg = await message.channel.send({ embeds: [startEmbed] });

  // Animation 1 (1 секунд)
  setTimeout(() => {
    const embed1 = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('🎰 Слот машин')
      .setDescription(`
**${user.username}**
${symbols[num[0]]} | 🧊 | 🧊

🔄 Эргүүлж байна...
      `)
      .setTimestamp();
    msg.edit({ embeds: [embed1] });
  }, 2000);

  // Animation 2 (2 секунд)
  setTimeout(() => {
    const embed2 = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('🎰 Слот машин')
      .setDescription(`
**${user.username}**
${symbols[num[0]]} | ${symbols[num[1]]} | 🧊

🔄 Эргүүлж байна...
      `)
      .setTimestamp();
    msg.edit({ embeds: [embed2] });
  }, 2000);

  // Үр дүн (3 секунд)
  setTimeout(async () => {
    let win = 0;
    let text = '';
    let color = '#ED4245';

    if (num[0] === num[1] && num[1] === num[2]) {
      win = amount * 10;
      text = '🎉 ЖАКПОТ!';
      color = '#FFD700';
    } else if (num[0] === num[1] || num[1] === num[2] || num[0] === num[2]) {
      win = amount * 2;
      text = '🎊 ХОЖЛОО!';
      color = '#57F287';
    } else {
      win = -amount;
      text = '😢 ХОЖИГДЛОО';
    }

    if (win > 0) {
      await client.db.add(`coin_${user.id}`, win);
    }

    const total = await client.db.fetch(`coin_${user.id}`) || 0;

    const resultEmbed = new EmbedBuilder()
      .setColor(color)
      .setTitle('🎰 Слот машин')
      .setDescription(`
**${user.username}**
${symbols[num[0]]} | ${symbols[num[1]]} | ${symbols[num[2]]}

${text}
      `)
      .addFields(
        { name: '💰 Бооцоо', value: `${amount} 🪙`, inline: true },
        { name: '💵 Үр дүн', value: win > 0 ? `+${win} 🪙` : `${win} 🪙`, inline: true },
        { name: '💳 Нийт', value: `${total} 🪙`, inline: true }
      )
      .setFooter({ text: user.username })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('again')
          .setLabel('🔄 Дахин тоглох')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(total < amount)
      );

    await msg.edit({ embeds: [resultEmbed], components: [row] });

    // Дахин тоглох
    const filter = i => i.user.id === user.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 30000 });

    collector.on('collect', async i => {
      if (i.customId === 'again') {
        await i.deferUpdate();
        
        const now = await client.db.fetch(`coin_${user.id}`) || 0;
        if (now < amount) {
          return i.followUp({ content: '❌ Мөнгө хүрэлцэхгүй!', ephemeral: true });
        }

        await client.db.subtract(`coin_${user.id}`, amount);

        const newNum = [];
        for (let i = 0; i < 3; i++) {
          newNum.push(Math.floor(Math.random() * symbols.length));
        }

        let w = 0;
        let t = '';
        let clr = '#ED4245';

        if (newNum[0] === newNum[1] && newNum[1] === newNum[2]) {
          w = amount * 10;
          t = '🎉 ЖАКПОТ!';
          clr = '#FFD700';
        } else if (newNum[0] === newNum[1] || newNum[1] === newNum[2] || newNum[0] === newNum[2]) {
          w = amount * 2;
          t = '🎊 ХОЖЛОО!';
          clr = '#57F287';
        } else {
          w = -amount;
          t = '😢 ХОЖИГДЛОО';
        }

        if (w > 0) {
          await client.db.add(`coin_${user.id}`, w);
        }

        const newTotal = await client.db.fetch(`coin_${user.id}`) || 0;

        const newEmbed = new EmbedBuilder()
          .setColor(clr)
          .setTitle('🎰 Слот машин')
          .setDescription(`
**${user.username}**
${symbols[newNum[0]]} | ${symbols[newNum[1]]} | ${symbols[newNum[2]]}

${t}
          `)
          .addFields(
            { name: '💰 Бооцоо', value: `${amount} 🪙`, inline: true },
            { name: '💵 Үр дүн', value: w > 0 ? `+${w} 🪙` : `${w} 🪙`, inline: true },
            { name: '💳 Нийт', value: `${newTotal} 🪙`, inline: true }
          )
          .setFooter({ text: user.username })
          .setTimestamp();

        await i.editReply({ 
          embeds: [newEmbed], 
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('again')
              .setLabel('🔄 Дахин тоглох')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(newTotal < amount)
          )] 
        });
      }
    });

    collector.on('end', () => {
      msg.edit({ components: [] }).catch(() => {});
    });

  }, 3000);
};

exports.help = {
  name: 'slots',
  aliases: ['slot'],
  usage: 'slots <бооцоо>',
  description: 'Слот машин тоглох'
};

exports.channels = ['1479439212418961429'];

exports.cooldown = 5;