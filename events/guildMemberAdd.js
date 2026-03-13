const Discord = require("discord.js");
// const colorUtil = require('../utils/color'); // Хэрэв color.js байхгүй бол энэ мөрийг хаах

module.exports = (client, member) => {
  try {
    // Автомат роль
    const userRole = member.guild.roles.cache.find(r => r.name === "User");
    if (userRole) member.roles.add(userRole).catch(console.error);
    
    // Welcome суваг - ID-аар хайх
    const welcomeChannelId = client.config.channels?.info?.welcome;
    if (!welcomeChannelId) {
      console.log('Welcome сувгийн ID тохируулаагүй байна');
      return;
    }
    
    // ID-аар сувгийг хайх
    const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
    
    if (welcomeChannel) {
      // Default өнгө
      const embedColor = client.config?.color?.primary || '#5865F2';
      
      const welcomeEmbed = new Discord.EmbedBuilder()
        .setColor(embedColor)
        .setTitle(`👋 Тавтай морил!`)
        .setDescription(`**${member.user.username}** серверт нэгдлээ!`)
        .addFields(
          { name: '📊 Гишүүдийн тоо', value: `${member.guild.memberCount}`, inline: true },
          { name: '📅 Бүртгүүлсэн', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setImage("https://cdn.glitch.global/1cf686b0-913a-46e4-97b7-1fdc280c579e/7a1b84b0d02802cca66d976556d8699d.gif")
        .setTimestamp();
      
      welcomeChannel.send({ embeds: [welcomeEmbed] }).catch(err => {
        console.error('Welcome мессеж илгээхэд алдаа:', err);
      });
      
      console.log(`👋 Шинэ гишүүн: ${member.user.tag} (${member.guild.memberCount} гишүүн)`);
    } else {
      console.log(`Welcome суваг олдсонгүй: ${welcomeChannelId}`);
    }
  } catch (error) {
    console.error('Guild member add error:', error);
  }
};