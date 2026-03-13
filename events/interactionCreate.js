// events/interactionCreate.js
const { EmbedBuilder } = require('discord.js');

module.exports = async (client, interaction) => {
    if (!interaction.isButton()) return;

    try {
        const userId = interaction.user.id;
        const userMoney = client.db.fetch(`money_${userId}`) || 0;
        const userCoins = client.db.fetch(`coin_${userId}`) || 0;
        const coinPrice = client.db.fetch('coin_lastprice') || 3000;

        // Дэлгүүрийн категориуд
        const categories = {
            coins: {
                name: '🪙 ЗООС',
                items: [
                    { num: 1, name: '1 Coin', emoji: '🪙', price: coinPrice, type: 'coin', amount: 1 },
                    { num: 2, name: '10 Coin', emoji: '🪙', price: coinPrice * 10, type: 'coin', amount: 10 },
                    { num: 3, name: '100 Coin', emoji: '🪙', price: coinPrice * 100, type: 'coin', amount: 100 },
                    { num: 4, name: '1000 Coin', emoji: '🪙', price: coinPrice * 1000, type: 'coin', amount: 1000 }
                ]
            },
            tools: {
                name: '⛏️ АЖЛЫН БАГЦ',
                items: [
                    { num: 5, name: 'Уурхайн хүрз', emoji: '⛏️', price: 5000, type: 'tool', role: 'miner', description: 'Уурхайчны ажлын үр ашиг +10%' },
                    { num: 6, name: 'Эмчийн хэрэгсэл', emoji: '💊', price: 5000, type: 'tool', role: 'doctor', description: 'Эмчийн ажлын үр ашиг +10%' },
                    { num: 7, name: 'Цагдаагийн тэмдэг', emoji: '👮', price: 5000, type: 'tool', role: 'police', description: 'Цагдаагийн ажлын үр ашиг +10%' },
                    { num: 8, name: 'Бүлэглэлийн зэвсэг', emoji: '🔫', price: 10000, type: 'tool', role: 'gang', description: 'Бүлэглэлийн дээрэм +10%' }
                ]
            },
            items: {
                name: '🔧 ХЭРЭГСЭЛ',
                items: [
                    { num: 9, name: 'Багаж', emoji: '🔧', price: 1000, type: 'item', description: 'Дээрэм хийхэд хэрэглэнэ' },
                    { num: 10, name: 'Түлхүүр', emoji: '🔑', price: 2000, type: 'item', description: 'Чухал хаалга нээхэд хэрэглэнэ' },
                    { num: 11, name: 'Эрдэс илрүүлэгч', emoji: '📡', price: 5000, type: 'item', description: 'Уурхайчны олборлолт +20%' }
                ]
            },
            gems: {
                name: '💎 ҮНЭТ ЭДЛЭЛ',
                items: [
                    { num: 12, name: 'Алмааз', emoji: '💎', price: 100000, type: 'resource' },
                    { num: 13, name: 'Алт', emoji: '🪙', price: 50000, type: 'resource' },
                    { num: 14, name: 'Төмөр', emoji: '⛓️', price: 10000, type: 'resource' },
                    { num: 15, name: 'Нүүрс', emoji: '⬛', price: 5000, type: 'resource' }
                ]
            },
            special: {
                name: '🎫 ТУСГАЙ',
                items: [
                    { num: 16, name: 'Аз жаргалын билет', emoji: '🎫', price: 5000, type: 'special', description: 'Супер шагнал хожих боломж' },
                    { num: 17, name: 'Давхар ашиг', emoji: '✨', price: 20000, type: 'special', description: 'Дараагийн ажлаас 2 дахин их мөнгө' },
                    { num: 18, name: 'VIP карт', emoji: '💳', price: 50000, type: 'special', description: 'Бүх ажлын үр ашиг +20% (7 хоног)' }
                ]
            }
        };

        if (interaction.customId === 'shop_coins') {
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(categories.coins.name)
                .setDescription(`
🪙 **1 Coin үнэ:** ${coinPrice.toLocaleString()} 💵
💰 **Таны мөнгө:** ${userMoney.toLocaleString()} 💵
🪙 **Таны зоос:** ${userCoins.toLocaleString()} 🪙

━━━━━━━━━━━━━━━━━━━━━━━━
**БАРААНУУД:**
${categories.coins.items.map(item => 
    `**${item.num}.** ${item.emoji} ${item.name} - ${item.price.toLocaleString()} 💵`
).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━
**Худалдан авах:** \`!shop buy [дугаар]\`
                `);

            await interaction.update({ embeds: [embed], components: [] });
        }
        else if (interaction.customId === 'shop_tools') {
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(categories.tools.name)
                .setDescription(`
💰 **Таны мөнгө:** ${userMoney.toLocaleString()} 💵

━━━━━━━━━━━━━━━━━━━━━━━━
**БАРААНУУД:**
${categories.tools.items.map(item => 
    `**${item.num}.** ${item.emoji} ${item.name} - ${item.price.toLocaleString()} 💵\n└ 📝 ${item.description}`
).join('\n\n')}
━━━━━━━━━━━━━━━━━━━━━━━━
**Худалдан авах:** \`!shop buy [дугаар]\`
                `);

            await interaction.update({ embeds: [embed], components: [] });
        }
        else if (interaction.customId === 'shop_items') {
            const embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle(categories.items.name)
                .setDescription(`
💰 **Таны мөнгө:** ${userMoney.toLocaleString()} 💵

━━━━━━━━━━━━━━━━━━━━━━━━
**БАРААНУУД:**
${categories.items.items.map(item => 
    `**${item.num}.** ${item.emoji} ${item.name} - ${item.price.toLocaleString()} 💵\n└ 📝 ${item.description}`
).join('\n\n')}
━━━━━━━━━━━━━━━━━━━━━━━━
**Худалдан авах:** \`!shop buy [дугаар]\`
                `);

            await interaction.update({ embeds: [embed], components: [] });
        }
        else if (interaction.customId === 'shop_gems') {
            const embed = new EmbedBuilder()
                .setColor('#E67E22')
                .setTitle(categories.gems.name)
                .setDescription(`
💰 **Таны мөнгө:** ${userMoney.toLocaleString()} 💵

━━━━━━━━━━━━━━━━━━━━━━━━
**БАРААНУУД:**
${categories.gems.items.map(item => 
    `**${item.num}.** ${item.emoji} ${item.name} - ${item.price.toLocaleString()} 💵`
).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━
**Худалдан авах:** \`!shop buy [дугаар]\`
                `);

            await interaction.update({ embeds: [embed], components: [] });
        }
        else if (interaction.customId === 'shop_special') {
            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle(categories.special.name)
                .setDescription(`
💰 **Таны мөнгө:** ${userMoney.toLocaleString()} 💵

━━━━━━━━━━━━━━━━━━━━━━━━
**БАРААНУУД:**
${categories.special.items.map(item => 
    `**${item.num}.** ${item.emoji} ${item.name} - ${item.price.toLocaleString()} 💵\n└ 📝 ${item.description}`
).join('\n\n')}
━━━━━━━━━━━━━━━━━━━━━━━━
**Худалдан авах:** \`!shop buy [дугаар]\`
                `);

            await interaction.update({ embeds: [embed], components: [] });
        }
        else if (interaction.customId === 'shop_sell') {
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('💰 ЗАРАХ МЭДЭЭЛЭЛ')
                .setDescription(`
**ЗООС ЗАРАХ:**
\`!shop sellcoin [тоо]\` - Зоосоо мөнгөөр зарах
Жишээ: \`!shop sellcoin 10\`

**ЭРДЭС ЗАРАХ:**
\`!shop sell [эрдэс] [тоо]\` - Эрдэсээ мөнгөөр зарах
Жишээ: \`!shop sell coal 5\`

━━━━━━━━━━━━━━━━━━━━━━━━
**ЭРДЭСИЙН ҮНЭ:**
⬛ Нүүрс: 50 💰
⛓️ Төмөр: 200 💰
🪙 Алт: 1,000 💰
💎 Алмааз: 5,000 💰
⚛️ Антиматтер: 50,000 💰
━━━━━━━━━━━━━━━━━━━━━━━━
                `);

            await interaction.update({ embeds: [embed], components: [] });
        }
        else if (interaction.customId === 'shop_price') {
            const prevPrice = client.db.fetch('coin_prevprice') || coinPrice;
            const change = coinPrice - prevPrice;
            const changePercent = ((change / prevPrice) * 100).toFixed(2);
            const changeEmoji = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('💹 ҮНИЙН МЭДЭЭЛЭЛ')
                .setDescription(`
╔══════════════════════════════╗
║   🪙 **1 COIN = ${coinPrice.toLocaleString()} 💰**   ║
╚══════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━
**ЗООСНЫ ҮНЭ:** ${changeEmoji} ${Math.abs(change).toLocaleString()} 💰 (${changePercent}%)
**Өмнөх үнэ:** ${prevPrice.toLocaleString()} 💰
**Шинэчлэгдсэн:** <t:${Math.floor(Date.now() / 1000)}:R>

━━━━━━━━━━━━━━━━━━━━━━━━
**ЭРДЭСИЙН ҮНЭ:**
⬛ Нүүрс: 50 💰
⛓️ Төмөр: 200 💰
🪙 Алт: 1,000 💰
💎 Алмааз: 5,000 💰
⚛️ Антиматтер: 50,000 💰
━━━━━━━━━━━━━━━━━━━━━━━━
                `)
                .setFooter({ text: `Хүсэлт: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            await interaction.update({ embeds: [embed], components: [] });
        }

    } catch (error) {
        console.error('Button interaction error:', error);
        await interaction.reply({ content: '❌ Алдаа гарлаа!', ephemeral: true });
    }
};