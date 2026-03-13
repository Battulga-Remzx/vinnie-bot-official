// auto/leaderboard.js
const { EmbedBuilder } = require('discord.js');

async function updateLeaderboard(client) {
  try {
    // Лидербордын суваг
    const channelId = '1479455728740728913';
    const channel = client.channels.cache.get(channelId);
    
    if (!channel) return;

    const categories = [
      { name: '💰 БЭЛЭН МӨНГӨ', value: 'money', emoji: '💰' },
      { name: '🏦 БАНК', value: 'bank', emoji: '🏦' },
      { name: '🪙 ЗООС', value: 'coin', emoji: '🪙' },
      { name: '💎 АЛМААЗ', value: 'diamond', emoji: '💎' }
    ];

    const embeds = [];

    for (const category of categories) {
      const data = client.db.all()
        .filter(item => item.ID.startsWith(`${category.value}_`))
        .filter(item => item.data > 0) // Зөвхөн 0-ээс их утгатай
        .sort((a, b) => b.data - a.data)
        .slice(0, 5); // ТОП 5

      if (data.length === 0) continue;

      let description = '';
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

      // Хэрэглэгчдийг fetch хийх
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const userId = item.ID.split('_')[1];
        
        // Хэрэглэгчийг fetch хийх (cache-д байхгүй бол API-аас авах)
        let user;
        try {
          user = await client.users.fetch(userId).catch(() => null);
        } catch {
          user = null;
        }
        
        const username = user ? user.username : 'Unknown User';
        const amount = item.data || 0;
        
        // Тэмдэглэгээ: өөрчлөлтийг харуулах
        let changeEmoji = '🔴'; // default
        if (i === 0) changeEmoji = '🟢';
        else if (i === 1) changeEmoji = '🟡';
        
        description += `${medals[i]} **${username}** - ${amount.toLocaleString()} ${category.emoji} ${changeEmoji}\n`;
      }

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`🏆 ТОП 5 - ${category.name}`)
        .setDescription(description)
        .setFooter({ text: `⏱️ Шинэчлэгдсэн: ${new Date().toLocaleString('mn-MN')}` })
        .setTimestamp();

      embeds.push(embed);
    }

    if (embeds.length === 0) return;

    // Хуучин мессежүүдийг устгах
    const messages = await channel.messages.fetch({ limit: 10 });
    const oldMessages = messages.filter(m => 
      m.embeds[0]?.title?.includes('ТОП 5') && 
      m.author.id === client.user.id
    );

    for (const msg of oldMessages.values()) {
      await msg.delete().catch(() => {});
    }

    // Шинэ мессежүүдийг илгээх
    for (const embed of embeds) {
      await channel.send({ embeds: [embed] });
    }
    
    console.log(`[AUTO LB] Лидерборд шинэчлэгдсэн: ${new Date().toLocaleString()}`);
    
  } catch (error) {
    console.error('Leaderboard update error:', error);
  }
}

module.exports = { updateLeaderboard };