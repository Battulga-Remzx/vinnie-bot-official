const { EmbedBuilder } = require('discord.js');

exports.execute = async (client, message, args) => {
    try {
        // Командуудыг категориор нь ангилах
        const categories = {
            info: { name: 'ℹ️ Мэдээлэл', commands: [] },
            economy: { name: '💰 Эдийн засаг', commands: [] },
            bank: { name: '🏦 Банк', commands: [] },
            shop: { name: '🛒 Дэлгүүр', commands: [] },
            inventory: { name: '🎒 Агуулах', commands: [] },
            job: { name: '💼 Ажил', commands: [] },
            games: { name: '🎮 Тоглоом', commands: [] },
            admin: { name: '⚙️ Админ', commands: [] }
        };

        // Командуудыг категорид хуваарилах
        client.commands.forEach((cmd, name) => {
            // Командын файлын замаас категори олох
            let category = 'info'; // default
            const cmdPath = cmd.help?.category;
            if (cmdPath) {
                category = cmdPath;
            } else {
                // Хэрэв category тодорхойлогдоогүй бол файлын нэрээр таах
                if (name.includes('balance') || name.includes('beg') || name.includes('daily') || 
                    name.includes('weekly') || name.includes('work') || name.includes('leaderboard')) {
                    category = 'economy';
                } else if (name.includes('dep') || name.includes('withdraw') || name.includes('transfer')) {
                    category = 'bank';
                } else if (name.includes('shop') || name.includes('buy') || name.includes('sell')) {
                    category = 'shop';
                } else if (name.includes('inv') || name.includes('inventory')) {
                    category = 'inventory';
                } else if (name.includes('job')) {
                    category = 'job';
                } else if (name.includes('slots') || name.includes('roulette') || name.includes('fish')) {
                    category = 'games';
                } else if (name.includes('addmoney') || name.includes('setmoney')) {
                    category = 'admin';
                } else {
                    category = 'info';
                }
            }
            
            if (categories[category]) {
                categories[category].commands.push({
                    name: cmd.help?.name || name,
                    usage: cmd.help?.usage || name,
                    description: cmd.help?.description || 'Тайлбар байхгүй'
                });
            }
        });

        // Тусгай команд хайх (help команд өөрөө)
        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📚 Командуудын жагсаалт')
                .setDescription(`Нийт команд: ${client.commands.size}\nТусламж авах: \`${client.prefix}help <команд>\``)
                .setTimestamp()
                .setFooter({ text: `Vinnie BOT | ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

            // Категори бүрийг нэмэх
            for (const [key, cat] of Object.entries(categories)) {
                if (cat.commands.length > 0) {
                    let cmdList = cat.commands.slice(0, 5).map(c => `\`${c.usage}\``).join(', ');
                    if (cat.commands.length > 5) {
                        cmdList += ` +${cat.commands.length - 5}`;
                    }
                    embed.addFields({ name: cat.name, value: cmdList || 'Команд байхгүй', inline: true });
                }
            }

            return message.channel.send({ embeds: [embed] });
        } else {
            // Тодорхой командын мэдээлэл
            const cmdName = args[0].toLowerCase();
            const cmd = client.commands.get(cmdName) || 
                       client.commands.get(client.aliases.get(cmdName));
            
            if (!cmd) {
                return message.reply(`❌ \`${cmdName}\' нэртэй команд олдсонгүй!`);
            }

            const cmdEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`📋 Командын мэдээлэл: ${cmd.help?.name || cmdName}`)
                .addFields(
                    { name: '🔤 Хэрэглээ', value: `\`${client.prefix}${cmd.help?.usage || cmdName}\``, inline: true },
                    { name: '🔄 Товчлол', value: cmd.help?.aliases?.join(', ') || 'Байхгүй', inline: true },
                    { name: '⏱️ Хүлээх хугацаа', value: `${cmd.cooldown || 3} секунд`, inline: true },
                    { name: '📖 Тайлбар', value: cmd.help?.description || 'Тайлбар байхгүй' }
                )
                .setTimestamp();

            return message.channel.send({ embeds: [cmdEmbed] });
        }
    } catch (error) {
        console.error('Help командын алдаа:', error);
        message.channel.send('❌ Help команд ажиллах үед алдаа гарлаа: ' + error.message);
    }
};

exports.help = {
    name: 'help',
    aliases: ['h', 'commands', 'тусламж'],
    usage: 'help [команд]',
    description: 'Бүх командуудын жагсаалтыг харна',
    category: 'info'
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