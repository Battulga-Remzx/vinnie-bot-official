const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

exports.execute = async (client, message, args) => {
  // Зоосны үнэ
  const coinPrice = client.db.fetch(`coin_lastprice`) || 5000;
  const lastPrice = client.db.fetch(`coin_prevprice`) || coinPrice;
  const change = coinPrice - lastPrice;
  const changePercent = ((change / lastPrice) * 100).toFixed(2);
  const priceEmoji = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
  const priceColor = change > 0 ? '#57F287' : change < 0 ? '#ED4245' : '#FEE75C';

  // Топ мөнгөтэй 3 хэрэглэгч
  const topMoney = client.db.all()
    .filter(item => item.ID.startsWith('money_'))
    .sort((a, b) => b.data - a.data)
    .slice(0, 3);

  let topList = '';
  const medals = ['🥇', '🥈', '🥉'];
  
  topMoney.forEach((item, i) => {
    const userId = item.ID.split('_')[1];
    const user = client.users.cache.get(userId);
    const username = user ? user.username : 'Unknown';
    topList += `${medals[i]} **${username}** - ${item.data.toLocaleString()} 💰\n`;
  });

  // Ботын статистик
  const totalUsers = client.users.cache.size;
  const totalServers = client.guilds.cache.size;
  const totalCommands = client.commands.size;
  const uptime = process.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('📊 VINNIE BOT - МЭДЭЭЛЛИЙН САМБАР')
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription(`
╔══════════════════════════════╗
║     🪙 **COIN PRICE**        ║
╚══════════════════════════════╝
**1 COIN = ${coinPrice} 💰** ${priceEmoji} ${Math.abs(change)} (${changePercent}%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
╔══════════════════════════════╗
║     🏆 **ТОП 3 ТОГЛОГЧ**     ║
╚══════════════════════════════╝
${topList || '❌ Мэдээлэл байхгүй'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
╔══════════════════════════════╗
║     🤖 **БОТЫН СТАТИСТИК**   ║
╚══════════════════════════════╝
└ 👥 Нийт хэрэглэгч: **${totalUsers}**
└ 🏠 Нийт сервер: **${totalServers}**
└ 📚 Нийт команд: **${totalCommands}**
└ ⏱️ Ажилласан хугацаа: **${days}ө ${hours}ц ${minutes}м**

🔄 **Сүүлд шинэчлэгдсэн:** ${new Date().toLocaleString('mn-MN')}
    `)
    .setFooter({ text: `Хүсэлт: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('refresh')
        .setLabel('🔄 Шинэчлэх')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('coinprice')
        .setLabel('🪙 Зоосны үнэ')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('leaderboard')
        .setLabel('🏆 Лидерборд')
        .setStyle(ButtonStyle.Primary)
    );

  const msg = await message.channel.send({ embeds: [embed], components: [row] });

  const filter = i => i.user.id === message.author.id;
  const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

  collector.on('collect', async (i) => {
    if (i.customId === 'refresh') {
      await i.deferUpdate();
      exports.execute(client, message, args); // Дахин ачаалах
    } else if (i.customId === 'coinprice') {
      await i.deferUpdate();
      const cmd = client.commands.get('coinprice');
      if (cmd) cmd.execute(client, message, args);
    } else if (i.customId === 'leaderboard') {
      await i.deferUpdate();
      const cmd = client.commands.get('autolb');
      if (cmd) cmd.execute(client, message, args);
    }
  });
};

exports.help = {
  name: 'dashboard',
  aliases: ['db', 'board', 'самбар'],
  usage: 'dashboard',
  description: '📊 Мэдээллийн самбар харуулах'
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

exports.cooldown = 10;