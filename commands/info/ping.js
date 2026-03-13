const Discord = require("discord.js");
const colorUtil = require('../../utils/color');

exports.execute = (client, message, args) => {
  const { EmbedBuilder } = Discord;
  
  const sent = Date.now();
  
  message.channel.send('🏓 Пинг шалгаж байна...').then(msg => {
    const ping = Date.now() - sent;
    const apiPing = client.ws.ping;
    
    const embed = new EmbedBuilder()
      .setColor(colorUtil.getColor(client, 'primary'))
      .setTitle('🏓 Понг!')
      .addFields(
        { name: '📨 Мессежний пинг', value: `${ping}ms`, inline: true },
        { name: '🤖 API пинг', value: `${apiPing}ms`, inline: true },
        { name: '💓 Ботын төлөв', value: '✅ Онлайн', inline: true }
      )
      .setTimestamp();
    
    msg.edit({ content: null, embeds: [embed] });
  }).catch(err => {
    console.error('Пинг команд алдаа:', err);
    message.reply('❌ Алдаа гарлаа');
  });
};

exports.help = {
  name: "ping",
  aliases: ["pong", "latency"],
  usage: "ping",
  description: "Ботын пингийг шалгана",
  category: "info"
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

exports.cooldown = 2;