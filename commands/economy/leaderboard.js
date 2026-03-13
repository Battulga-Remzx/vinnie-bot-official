// commands/economy/leaderboard.js
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

exports.execute = async (client, message, args) => {
  const categories = [
    { name: '💰 Бэлэн мөнгө', value: 'money', emoji: '💰' },
    { name: '🏦 Банк', value: 'bank', emoji: '🏦' },
    { name: '🪙 Зоос', value: 'coin', emoji: '🪙' },
    { name: '💎 Алмааз', value: 'diamond', emoji: '💎' },
    { name: '⚛️ Антиматтер', value: 'antimatter', emoji: '⚛️' }
  ];

  const createLeaderboard = async (type) => {
    let data = client.db.all()
      .filter(item => item.ID.startsWith(`${type}_`))
      .filter(item => item.data > 0)
      .sort((a, b) => b.data - a.data)
      .slice(0, 10);

    if (data.length === 0) {
      return {
        embed: new EmbedBuilder()
          .setColor('#FEE75C')
          .setTitle('🏆 Лидерборд')
          .setDescription('❌ Одоогоор мэдээлэл байхгүй байна.')
          .setTimestamp()
      };
    }

    let description = '';
    const medals = ['🥇', '🥈', '🥉'];

    // Хэрэглэгчдийг fetch хийх
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const userId = item.ID.split('_')[1];
      
      // Хэрэглэгчийг fetch хийх
      let user;
      try {
        user = await client.users.fetch(userId).catch(() => null);
      } catch {
        user = null;
      }
      
      const username = user ? user.username : 'Unknown User';
      const amount = item.data || 0;
      
      const medal = i < 3 ? medals[i] : `${i + 1}.`;
      description += `${medal} **${username}** - ${amount.toLocaleString()} ${getEmoji(type)}\n`;
    }

    // Өөрийн байрлал
    const userData = data.find(item => item.ID === `${type}_${message.author.id}`);
    if (userData) {
      const userRank = data.findIndex(item => item.ID === `${type}_${message.author.id}`) + 1;
      description += `\n📍 **Таны байрлал:** ${userRank}-р байр`;
    } else {
      const allData = client.db.all()
        .filter(item => item.ID.startsWith(`${type}_`))
        .sort((a, b) => b.data - a.data);
      
      const userRank = allData.findIndex(item => item.ID === `${type}_${message.author.id}`) + 1;
      if (userRank > 0) {
        description += `\n📍 **Таны байрлал:** ${userRank}-р байр`;
      }
    }

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`🏆 ${message.guild.name} - Лидерборд`)
      .setDescription(description)
      .setFooter({ 
        text: `${categories.find(c => c.value === type)?.name}`,
        iconURL: client.user.displayAvatarURL()
      })
      .setTimestamp();

    return { embed };
  };

  const getEmoji = (type) => {
    const emojis = {
      money: '💰',
      bank: '🏦',
      coin: '🪙',
      diamond: '💎',
      antimatter: '⚛️'
    };
    return emojis[type] || '⭐';
  };

  // Хэрэв аргумент байхгүй бол сонголттой меню харуулах
  if (!args[0]) {
    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('leaderboard_select')
          .setPlaceholder('📊 Лидерборд сонгох')
          .addOptions(categories.map(cat => ({
            label: cat.name,
            value: cat.value,
            emoji: cat.emoji
          })))
      );

    message.channel.send({
      content: '📊 **Лидербордын төрөл сонгоно уу:**',
      components: [row]
    }).then(msg => {
      const filter = i => i.user.id === message.author.id;
      const collector = msg.createMessageComponentCollector({ filter, time: 30000 });

      collector.on('collect', async (i) => {
        const result = await createLeaderboard(i.values[0]);
        await i.update({ embeds: [result.embed], components: [] });
      });

      collector.on('end', (collected) => {
        if (collected.size === 0) {
          msg.edit({ content: '⏱️ Хугацаа дууссан.', components: [] });
        }
      });
    });
    return;
  }

  // Аргументтай бол шууд харуулах
  const type = args[0].toLowerCase();
  if (!categories.some(c => c.value === type)) {
    return message.reply(`❌ Боломжит төрлүүд: ${categories.map(c => `\`${c.value}\``).join(', ')}`);
  }

  const result = await createLeaderboard(type);
  message.channel.send({ embeds: [result.embed] });
};

exports.help = {
  name: 'leaderboard',
  aliases: ['lb', 'top', 'ranking'],
  usage: 'leaderboard [төрөл]',
  description: 'Топ хэрэглэгчдийн жагсаалтыг харна',
  category: 'economy'
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

exports.cooldown = 5;