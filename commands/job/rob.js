// commands/job/rob.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

exports.execute = async (client, message, args) => {
  try {
    const user = message.author;
    
    // Ажлыг шалгах
    const job = client.db.fetch(`job_${user.id}`);
    const working = client.db.fetch(`working_${user.id}`);
    
    if (!working || job !== 'gang') {
      return message.reply('❌ Та бүлэглэлийн ажилд ороогүй байна! `!job gang`');
    }

    // Cooldown шалгах
    const cooldown = client.db.fetch(`rob_cd_${user.id}`);
    const now = Date.now();
    const cooldownTime = 60000; // 1 минут

    if (cooldown && now - cooldown < cooldownTime) {
      const left = Math.ceil((cooldownTime - (now - cooldown)) / 1000);
      return message.reply(`⏱️ Дараагийн дээрэм хийхэд **${left}** секунд үлдлээ.`);
    }

    // Багаж, түлхүүр шалгах
    const tools = client.db.fetch(`tool_${user.id}`) || 0;
    const keys = client.db.fetch(`key_${user.id}`) || 0;

    // Зорилтууд
    const targets = [
      { 
        name: '🏪 Жижиг дэлгүүр', 
        min: 500, 
        max: 2000, 
        difficulty: 0.3, 
        tool: 1, 
        key: 0,
        emoji: '🏪'
      },
      { 
        name: '🏧 Банкны АТМ', 
        min: 2000, 
        max: 5000, 
        difficulty: 0.5, 
        tool: 2, 
        key: 1,
        emoji: '🏧'
      },
      { 
        name: '🏦 Банк', 
        min: 5000, 
        max: 15000, 
        difficulty: 0.7, 
        tool: 3, 
        key: 2,
        emoji: '🏦'
      },
      { 
        name: '💎 Алмаазны дэлгүүр', 
        min: 10000, 
        max: 30000, 
        difficulty: 0.8, 
        tool: 4, 
        key: 2,
        emoji: '💎'
      },
      { 
        name: '💰 Мөнгөний ачааны машин', 
        min: 15000, 
        max: 50000, 
        difficulty: 0.9, 
        tool: 5, 
        key: 3,
        emoji: '🚚'
      }
    ];

    // Багажны нэмэлт
    const hasTool = client.db.fetch(`tool_${user.id}_gang`);
    const toolBonus = hasTool ? 0.1 : 0; // 10% нэмэлт

    // Аргумент шалгах (зорилтоо сонгох)
    if (!args[0]) {
      const embed = new EmbedBuilder()
        .setColor('#8B0000')
        .setTitle('👹 ДЭЭРЭМ ХИЙХ')
        .setDescription(`
**${user.username}** та дээрэм хийх зорилтоо сонгоно уу:

━━━━━━━━━━━━━━━━━━━━━
🛠️ **Танд байгаа:** 
• Багаж: ${tools} 🔧
• Түлхүүр: ${keys} 🔑
${hasTool ? '🔧 **Бүлэглэлийн багаж:** +10% нэмэлт' : ''}

━━━━━━━━━━━━━━━━━━━━━
        `);

      targets.forEach((target, index) => {
        const canRob = tools >= target.tool && keys >= target.key;
        embed.addFields({
          name: `${index + 1}. ${target.emoji} ${target.name} ${canRob ? '✅' : '❌'}`,
          value: `└ 💰 Мөнгө: ${target.min.toLocaleString()}-${target.max.toLocaleString()} 🪙\n└ 🔧 Багаж: ${target.tool} | 🔑 Түлхүүр: ${target.key}\n└ 🎲 Амжилт: ${(100 - target.difficulty * 100)}%\n└ 🎮 Дээрэм хийх: \`!rob ${index + 1}\``,
          inline: false
        });
      });

      return message.channel.send({ embeds: [embed] });
    }

    const targetIndex = parseInt(args[0]) - 1;
    if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= targets.length) {
      return message.reply(`❌ Зөв зорилт сонгоно уу! 1-${targets.length} хооронд.`);
    }

    const target = targets[targetIndex];

    // Багаж, түлхүүр шалгах
    if (tools < target.tool) {
      return message.reply(`❌ Энэ дээрэм хийхэд **${target.tool}** 🔧 багаж хэрэгтэй. Танд **${tools}** 🔧 байна. Дэлгүүрээс худалдаж аваарай!`);
    }

    if (keys < target.key) {
      return message.reply(`❌ Энэ дээрэм хийхэд **${target.key}** 🔑 түлхүүр хэрэгтэй. Танд **${keys}** 🔑 байна. Дэлгүүрээс худалдаж аваарай!`);
    }

    // Баталгаажуулах товч
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('rob_yes')
          .setLabel('🔫 Дээрэм хийх')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('rob_no')
          .setLabel('❌ Цуцлах')
          .setStyle(ButtonStyle.Secondary)
      );

    const confirmMsg = await message.channel.send({
      content: `${target.emoji} **${target.name}** дээрэм хийхэд **${target.tool}** 🔧 багаж, **${target.key}** 🔑 түлхүүр зарцуулагдана. Үргэлжлүүлэх үү?`,
      components: [row]
    });

    const filter = i => i.user.id === user.id;
    const collector = confirmMsg.createMessageComponentCollector({ filter, time: 15000, max: 1 });

    collector.on('collect', async (i) => {
      if (i.customId === 'rob_yes') {
        await i.deferUpdate();

        // Амжилтын магадлал
        const successChance = Math.random() > target.difficulty;
        
        // Багаж, түлхүүр хасах
        client.db.subtract(`tool_${user.id}`, target.tool);
        client.db.subtract(`key_${user.id}`, target.key);

        if (successChance) {
          // Амжилттай
          let amount = Math.floor(Math.random() * (target.max - target.min + 1)) + target.min;
          
          // Багажны нэмэлт
          if (hasTool) {
            const bonus = Math.floor(amount * 0.1);
            amount += bonus;
          }
          
          client.db.add(`money_${user.id}`, amount);
          client.db.set(`rob_cd_${user.id}`, now);

          const successEmbed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('✅ ДЭЭРЭМ АМЖИЛТТАЙ')
            .setDescription(`
**${user.username}** ${target.emoji} ${target.name}-г амжилттай дээрэмдлээ!

━━━━━━━━━━━━━━━━━━━━━
💰 **Олсон мөнгө:** +${amount.toLocaleString()} 🪙
🔧 **Зарцуулсан багаж:** -${target.tool}
🔑 **Зарцуулсан түлхүүр:** -${target.key}
💳 **Шинэ үлдэгдэл:** ${(client.db.fetch(`money_${user.id}`) || 0).toLocaleString()} 🪙
━━━━━━━━━━━━━━━━━━━━━
            `)
            .setTimestamp();

          await i.editReply({ content: null, embeds: [successEmbed], components: [] });
        } else {
          // Бүтэлгүйтэл - баригдах магадлал
          const caught = Math.random() > 0.5; // 50% баригдах магадлал
          
          if (caught) {
            // Баригдсан - торгууль төлөх
            const fine = Math.floor(target.min * 0.5); // 50% торгууль
            const currentMoney = client.db.fetch(`money_${user.id}`) || 0;
            
            if (currentMoney >= fine) {
              client.db.subtract(`money_${user.id}`, fine);
            }
            
            const failEmbed = new EmbedBuilder()
              .setColor('#ED4245')
              .setTitle('👮 БАРИГДЛАА')
              .setDescription(`
**${user.username}** ${target.emoji} ${target.name}-г дээрэмдэх гэж оролдсон ч баригдлаа!

━━━━━━━━━━━━━━━━━━━━━
🔧 **Зарцуулсан багаж:** -${target.tool}
🔑 **Зарцуулсан түлхүүр:** -${target.key}
💰 **Торгууль:** -${fine.toLocaleString()} 🪙
⏱️ **Хүлээх хугацаа:** 2 минут
━━━━━━━━━━━━━━━━━━━━━
            `)
            .setTimestamp();
            
            client.db.set(`rob_cd_${user.id}`, now + 60000); // 2 минут cooldown
            await i.editReply({ content: null, embeds: [failEmbed], components: [] });
          } else {
            // Зугтсан
            const failEmbed = new EmbedBuilder()
              .setColor('#ED4245')
              .setTitle('❌ ДЭЭРЭМ БҮТЭЛГҮЙ')
              .setDescription(`
**${user.username}** ${target.emoji} ${target.name}-г дээрэмдэх гэж оролдсон ч бүтэлгүйтлээ!

━━━━━━━━━━━━━━━━━━━━━
🔧 **Зарцуулсан багаж:** -${target.tool}
🔑 **Зарцуулсан түлхүүр:** -${target.key}
⏱️ **Хүлээх хугацаа:** 1 минут
━━━━━━━━━━━━━━━━━━━━━
              `)
              .setTimestamp();

            client.db.set(`rob_cd_${user.id}`, now);
            await i.editReply({ content: null, embeds: [failEmbed], components: [] });
          }
        }
      } else {
        await i.update({ content: '❌ Дээрэм цуцлагдлаа.', components: [] });
      }
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        confirmMsg.edit({ content: '⏱️ Хугацаа дууссан.', components: [] });
      }
    });

  } catch (error) {
    console.error('Rob command error:', error);
    message.reply('❌ Алдаа гарлаа: ' + error.message);
  }
};

exports.help = {
  name: 'rob',
  aliases: ['r', 'дээрэм'],
  usage: 'rob [зорилтын дугаар]',
  description: '👹 Бүлэглэлийн дээрэм хийх (багаж, түлхүүр шаардлагатай)',
  category: 'job'
};

// Бүх сувагт зөвшөөрөх (хоосон массив)
exports.channels = ['1479447028110196767'];

exports.cooldown = 0; // Өөрсдөө удирдана