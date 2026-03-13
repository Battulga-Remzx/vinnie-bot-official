const { EmbedBuilder } = require('discord.js');
const colorUtil = require('../../utils/color');

exports.execute = async (client, message, args) => {
    try {
        const user = message.mentions.users.first() || message.author;
        const userId = user.id;
        
        // Мөнгө, банк, зоос авах
        let money = client.db.fetch(`money_${userId}`) || 0;
        let bank = client.db.fetch(`bank_${userId}`) || 0;
        let coin = client.db.fetch(`coin_${userId}`) || 0;
        
        const embed = new EmbedBuilder()
            .setColor(colorUtil.getColor(client, 'success'))
            .setTitle(`${user.username} - Үлдэгдэл`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '💵 Гар дээрх мөнгө', value: `${money.toLocaleString()} 💰`, inline: true },
                { name: '🏦 Банк', value: `${bank.toLocaleString()} 💰`, inline: true },
                { name: '🪙 Зоос', value: `${coin.toLocaleString()} 🪙`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `ID: ${userId}` });

        message.channel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Balance error:', error);
        message.reply('❌ Алдаа гарлаа');
    }
};

exports.help = {
    name: 'balance',
    aliases: ['bal', 'money', 'үлдэгдэл'],
    usage: 'balance [@хэрэглэгч]',
    description: 'Мөнгөний үлдэгдлийг харна',
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

exports.cooldown = 3;