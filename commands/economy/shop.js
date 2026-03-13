// commands/economy/shop.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

exports.execute = async (client, message, args) => {
    try {
        const userId = message.author.id;
        const userMoney = client.db.fetch(`money_${userId}`) || 0;
        const userCoins = client.db.fetch(`coin_${userId}`) || 0;
        
        // coin_lastprice утгыг шалгах - хэрэв байхгүй бол 3000 ашиглах
        let coinPrice = client.db.fetch('coin_lastprice');
        if (coinPrice === null || coinPrice === undefined) {
            coinPrice = 3000;
        }

        // Дэлгүүрийн категориуд
        const categories = [
            {
                name: '🪙 ЗООС',
                items: [
                    { num: 1, name: '1 Coin', emoji: '🪙', price: coinPrice, type: 'coin', amount: 1 },
                    { num: 2, name: '10 Coin', emoji: '🪙', price: coinPrice * 10, type: 'coin', amount: 10 },
                    { num: 3, name: '100 Coin', emoji: '🪙', price: coinPrice * 100, type: 'coin', amount: 100 },
                    { num: 4, name: '1000 Coin', emoji: '🪙', price: coinPrice * 1000, type: 'coin', amount: 1000 }
                ]
            },
            {
                name: '⛏️ АЖЛЫН БАГЦ',
                items: [
                    { num: 5, name: 'Уурхайн хүрз', emoji: '⛏️', price: 5000, type: 'tool', role: 'miner', description: 'Уурхайчны ажлын үр ашиг +10%', emoji2: '⛏️' },
                    { num: 6, name: 'Эмчийн хэрэгсэл', emoji: '💊', price: 5000, type: 'tool', role: 'doctor', description: 'Эмчийн ажлын үр ашиг +10%', emoji2: '💊' },
                    { num: 7, name: 'Цагдаагийн тэмдэг', emoji: '👮', price: 5000, type: 'tool', role: 'police', description: 'Цагдаагийн ажлын үр ашиг +10%', emoji2: '👮' },
                    { num: 8, name: 'Бүлэглэлийн зэвсэг', emoji: '🔫', price: 10000, type: 'tool', role: 'gang', description: 'Бүлэглэлийн дээрэм +10%', emoji2: '🔫' }
                ]
            },
            {
                name: '🔧 ХЭРЭГСЭЛ',
                items: [
                    { num: 9, name: 'Багаж', emoji: '🔧', price: 1000, type: 'item', key: 'tool', description: 'Дээрэм хийхэд хэрэглэнэ' },
                    { num: 10, name: 'Түлхүүр', emoji: '🔑', price: 2000, type: 'item', key: 'key', description: 'Чухал хаалга нээхэд хэрэглэнэ' },
                    { num: 11, name: 'Эрдэс илрүүлэгч', emoji: '📡', price: 5000, type: 'item', key: 'detector', description: 'Уурхайчны олборлолт +20%' }
                ]
            },
            {
                name: '💎 ҮНЭТ ЭДЛЭЛ',
                items: [
                    { num: 12, name: 'Алмааз', emoji: '💎', price: 100000, type: 'resource', key: 'diamond', amount: 1 },
                    { num: 13, name: 'Алт', emoji: '🪙', price: 50000, type: 'resource', key: 'gold', amount: 1 },
                    { num: 14, name: 'Төмөр', emoji: '⛓️', price: 10000, type: 'resource', key: 'iron', amount: 1 },
                    { num: 15, name: 'Нүүрс', emoji: '⬛', price: 5000, type: 'resource', key: 'coal', amount: 1 }
                ]
            },
            {
                name: '🎫 ТУСГАЙ',
                items: [
                    { num: 16, name: 'Аз жаргалын билет', emoji: '🎫', price: 5000, type: 'special', key: 'lottery', description: 'Супер шагнал хожих боломж' },
                    { num: 17, name: 'Давхар ашиг', emoji: '✨', price: 20000, type: 'special', key: 'boost', description: 'Дараагийн ажлаас 2 дахин их мөнгө' },
                    { num: 18, name: 'VIP карт', emoji: '💳', price: 50000, type: 'special', key: 'vip', description: 'Бүх ажлын үр ашиг +20% (7 хоног)' }
                ]
            }
        ];

        // Бүх барааг нэг жагсаалтад
        const allItems = [];
        categories.forEach(cat => {
            cat.items.forEach(item => {
                allItems.push(item);
            });
        });

        // Хэрэв аргумент байхгүй бол дэлгүүрийн жагсаалт харуулах
        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('🏪 ДЭЛГҮҮР')
                .setDescription(`
👋 Сайн уу, ${message.author.username} тавтай морил!

💰 **Таны мөнгө:** ${userMoney.toLocaleString()} 💵
🪙 **Таны зоос:** ${userCoins.toLocaleString()} 🪙
💹 **1 Coin үнэ:** ${coinPrice.toLocaleString()} 💵

━━━━━━━━━━━━━━━━━━━━━━━━
**Худалдан авах:** \`!shop buy [дугаар]\`
**Зоос худалдаж авах:** \`!shop buycoin [тоо]\`
**Зоос зарах:** \`!shop sellcoin [тоо]\`
**Эрдэс зарах:** \`!shop sell [эрдэс] [тоо]\`
━━━━━━━━━━━━━━━━━━━━━━━━
                `)
                .setFooter({ text: '⬇️ Дэлгүүрийн категориудыг үзэхийн тулд доорх товчнуудыг дарна уу' });

            // Категорийн товчнууд
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('shop_coins')
                        .setLabel('🪙 Зоос')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('shop_tools')
                        .setLabel('⛏️ Ажлын багц')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('shop_items')
                        .setLabel('🔧 Хэрэгсэл')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('shop_gems')
                        .setLabel('💎 Үнэт эдлэл')
                        .setStyle(ButtonStyle.Primary)
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('shop_special')
                        .setLabel('🎫 Тусгай')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('shop_sell')
                        .setLabel('💰 Зарах')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('shop_price')
                        .setLabel('💹 Үнэ мэдээлэл')
                        .setStyle(ButtonStyle.Secondary)
                );

            return message.reply({ embeds: [embed], components: [row, row2] });
        }

        // ========== BUY - ХУДАЛДАН АВАХ (дугаараар) ==========
        if (args[0].toLowerCase() === 'buy' && args[1]) {
            const itemIndex = parseInt(args[1]) - 1;
            
            if (itemIndex < 0 || itemIndex >= allItems.length) {
                return message.reply('❌ Буруу барааны дугаар! 1-18 хооронд дугаар оруулна уу.');
            }

            const item = allItems[itemIndex];
            
            // Мөнгөний шалгалт
            if (userMoney < item.price) {
                return message.reply(`❌ Танд хүрэлцэх мөнгө байхгүй! Танд: ${userMoney.toLocaleString()} 💵, Үнэ: ${item.price.toLocaleString()} 💵`);
            }

            // Барааны төрлөөр худалдан авалт хийх
            switch (item.type) {
                case 'coin':
                    const currentCoins = client.db.fetch(`coin_${userId}`) || 0;
                    client.db.set(`coin_${userId}`, currentCoins + item.amount);
                    client.db.subtract(`money_${userId}`, item.price);
                    
                    await message.reply(`✅ Та **${item.amount} Coin** худалдан авлаа! 🪙\n💰 Үлдэгдэл: ${(userMoney - item.price).toLocaleString()} 💵`);
                    break;

                case 'tool':
                    // Ажлын хэрэгслийн шалгалт
                    const userJob = client.db.fetch(`job_${userId}`);
                    if (userJob !== item.role) {
                        return message.reply(`❌ Энэ хэрэгслийг зөвхөн **${item.role}** ажилчид ашиглах боломжтой!`);
                    }

                    // Хэрэгсэл аль хэдийн байгаа эсэх
                    const hasTool = client.db.fetch(`tool_${userId}_${item.role}`);
                    if (hasTool) {
                        return message.reply(`❌ Танд энэ хэрэгсэл аль хэдийн байна!`);
                    }

                    client.db.set(`tool_${userId}_${item.role}`, true);
                    client.db.set(`tool_${userId}_${item.role}_price`, item.price);
                    client.db.subtract(`money_${userId}`, item.price);

                    await message.reply(`✅ Та **${item.name}** худалдан авлаа! ${item.emoji}\n📝 ${item.description}`);
                    break;

                case 'item':
                    const currentItem = client.db.fetch(`${item.key}_${userId}`) || 0;
                    client.db.set(`${item.key}_${userId}`, currentItem + 1);
                    client.db.subtract(`money_${userId}`, item.price);

                    await message.reply(`✅ Та **${item.name}** худалдан авлаа! ${item.emoji}\n📝 ${item.description || ''}`);
                    break;

                case 'resource':
                    const currentResource = client.db.fetch(`${item.key}_${userId}`) || 0;
                    client.db.set(`${item.key}_${userId}`, currentResource + item.amount);
                    client.db.subtract(`money_${userId}`, item.price);

                    await message.reply(`✅ Та **${item.name}** худалдан авлаа! ${item.emoji}`);
                    break;

                case 'special':
                    if (item.key === 'lottery') {
                        client.db.set(`lottery_${userId}`, true);
                    } else if (item.key === 'boost') {
                        client.db.set(`boost_${userId}`, Date.now() + 3600000); // 1 цаг
                    } else if (item.key === 'vip') {
                        client.db.set(`vip_${userId}`, Date.now() + 604800000); // 7 хоног
                    }
                    client.db.subtract(`money_${userId}`, item.price);

                    await message.reply(`✅ Та **${item.name}** худалдан авлаа! ${item.emoji}\n📝 ${item.description}`);
                    break;

                default:
                    return message.reply('❌ Энэ барааг худалдан авах боломжгүй!');
            }

            console.log(`[SHOP] ${message.author.tag} bought ${item.name} for ${item.price}💰`);
        }

        // ========== BUYCOIN - ЗООС АВАХ (мөнгөөр) ==========
        else if (args[0].toLowerCase() === 'buycoin' && args[1]) {
            const amount = parseInt(args[1]);
            if (isNaN(amount) || amount <= 0) {
                return message.reply('❌ Зөв тоо оруулна уу!');
            }

            const totalPrice = amount * coinPrice;

            if (userMoney < totalPrice) {
                return message.reply(`❌ Танд хүрэлцэх мөнгө байхгүй! Хэрэгтэй: ${totalPrice.toLocaleString()} 💵, Танд: ${userMoney.toLocaleString()} 💵`);
            }

            client.db.subtract(`money_${userId}`, totalPrice);
            client.db.add(`coin_${userId}`, amount);

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('✅ ЗООС ХУДАЛДАН АВЛАА')
                .setDescription(`
🪙 **Авсан:** ${amount} Coin
💰 **Үнэ:** ${totalPrice.toLocaleString()} 💵
📊 **1 Coin үнэ:** ${coinPrice.toLocaleString()} 💵

💳 **Шинэ үлдэгдэл:**
├ 🪙 Coin: ${(userCoins + amount).toLocaleString()}
└ 💰 Мөнгө: ${(userMoney - totalPrice).toLocaleString()}
                `)
                .setFooter({ text: `Хүсэлт: ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        }

        // ========== SELLCOIN - ЗООС ЗАРАХ ==========
        else if (args[0].toLowerCase() === 'sellcoin' && args[1]) {
            const amount = parseInt(args[1]);
            if (isNaN(amount) || amount <= 0) {
                return message.reply('❌ Зөв тоо оруулна уу!');
            }

            if (userCoins < amount) {
                return message.reply(`❌ Танд ${amount} Coin байхгүй! Танд: ${userCoins} 🪙`);
            }

            const totalPrice = amount * coinPrice;
            
            client.db.subtract(`coin_${userId}`, amount);
            client.db.add(`money_${userId}`, totalPrice);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ ЗООС ЗАРАГДЛАА')
                .setDescription(`
🪙 **Зарагдсан:** ${amount} Coin
💰 **Үнэ:** ${totalPrice.toLocaleString()} 💵
📊 **1 Coin үнэ:** ${coinPrice.toLocaleString()} 💵

💳 **Шинэ үлдэгдэл:**
├ 🪙 Coin: ${(userCoins - amount).toLocaleString()}
└ 💰 Мөнгө: ${(userMoney + totalPrice).toLocaleString()}
                `)
                .setFooter({ text: `Хүсэлт: ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        }

        // ========== SELL - ЭРДЭС ЗАРАХ ==========
        else if (args[0].toLowerCase() === 'sell' && args[1] && args[2]) {
            const resourceType = args[1].toLowerCase();
            const amount = parseInt(args[2]);
            
            if (isNaN(amount) || amount <= 0) {
                return message.reply('❌ Зөв тоо оруулна уу!');
            }

            // Зарах боломжтой эрдэсүүд
            const sellableResources = {
                'coal': { name: 'Нүүрс', emoji: '⬛', price: 50 },
                'iron': { name: 'Төмөр', emoji: '⛓️', price: 200 },
                'gold': { name: 'Алт', emoji: '🪙', price: 1000 },
                'diamond': { name: 'Алмааз', emoji: '💎', price: 5000 },
                'antimatter': { name: 'Антиматтер', emoji: '⚛️', price: 50000 }
            };

            if (!sellableResources[resourceType]) {
                return message.reply(`❌ Зарах боломжтой эрдэсүүд: ${Object.keys(sellableResources).map(r => `\`${r}\``).join(', ')}`);
            }

            const resource = sellableResources[resourceType];
            const userResource = client.db.fetch(`${resourceType}_${userId}`) || 0;

            if (userResource < amount) {
                return message.reply(`❌ Танд ${amount} ${resource.name} байхгүй! Танд: ${userResource} ${resource.emoji}`);
            }

            const totalPrice = amount * resource.price;
            
            client.db.subtract(`${resourceType}_${userId}`, amount);
            client.db.add(`money_${userId}`, totalPrice);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ ЭРДЭС ЗАРАГДЛАА')
                .setDescription(`
${resource.emoji} **Зарагдсан:** ${amount} ${resource.name}
💰 **Үнэ:** ${totalPrice.toLocaleString()} 💵
📊 **1 ширхэг үнэ:** ${resource.price.toLocaleString()} 💵

💳 **Шинэ үлдэгдэл:**
├ ${resource.emoji} ${resource.name}: ${(userResource - amount).toLocaleString()}
└ 💰 Мөнгө: ${(userMoney + totalPrice).toLocaleString()}
                `)
                .setFooter({ text: `Хүсэлт: ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        }

        // ========== PRICE - ҮНЭ МЭДЭЭЛЭЛ ==========
        else if (args[0].toLowerCase() === 'price' || args[0].toLowerCase() === 'үнэ') {
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
                .setFooter({ text: `Хүсэлт: ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        }

        else {
            return message.reply('❌ Буруу команд! \n`!shop` - Дэлгүүр нээх\n`!shop buy [дугаар]` - Худалдан авах\n`!shop buycoin [тоо]` - Зоос авах\n`!shop sellcoin [тоо]` - Зоос зарах\n`!shop sell [эрдэс] [тоо]` - Эрдэс зарах\n`!shop price` - Үнийн мэдээлэл');
        }

    } catch (error) {
        console.error('Shop command error:', error);
        message.reply('❌ Алдаа гарлаа: ' + error.message);
    }
};

exports.help = {
    name: 'shop',
    aliases: ['дэлгүүр', 'store', 'market'],
    usage: 'shop [buy/buycoin/sellcoin/sell/price] [тоо]',
    description: 'Дэлгүүрээс бараа худалдан авах, зоос зарах/авах, эрдэс зарах',
    category: 'economy'
};

// Зөвшөөрөгдсөн сувгууд
exports.channels = ['1479439485782593576'];

exports.cooldown = 3;