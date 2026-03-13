const Discord = require("discord.js");

exports.execute = (client, message, args) => {
  const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = Discord;
  const user = message.author;
  
  // Боломжтой ажлууд
  // commands/job/jobs.js доторх ажлын жагсаалт
const jobs = [
  { 
    name: '👮 Цагдаа', 
    value: 'police', 
    salary: '200-800💰', 
    emoji: '👮',
    description: 'Хотын аюулгүй байдлыг хангаж, эргүүл хийж цалин авна',
    channel: '1010653830645547098',
    command: 'patrol'
  },
  { 
    name: '👩‍⚕️ Эмч', 
    value: 'doctor', 
    salary: '300-1200💰', 
    emoji: '👩‍⚕️',
    description: 'Хүмүүсийг эмчилж, өвчтөн эмчилж цалин авна',
    channel: '1010654381563183104',
    command: 'heal'
  },
  { 
    name: '⛏️ Уурхайчин', 
    value: 'miner', 
    salary: 'нүүрс/төмөр/алт/алмааз/антиматтер', 
    emoji: '⛏️',
    description: 'Газраас эрдэс бодис олборлож, зарж мөнгө хийнэ',
    channel: '1010654972007952414',
    command: 'mine'
  },
  { 
    name: '👹 Бүлэглэл', 
    value: 'gang', 
    salary: '500-50000💰 (дээрэм)', 
    emoji: '👹',
    description: 'Бусдыг дээрэмдэж, мөнгө олох (эрсдэлтэй)',
    channel: 'бүх суваг',
    command: 'rob'
  }
];
  
  // Одоогийн ажил
  const currentJob = client.db.fetch(`job_${user.id}`);
  const isWorking = client.db.fetch(`working_${user.id}`);
  
  // Ажлын нэрийг монголоор харуулах
  const getJobName = (jobValue) => {
    const job = jobs.find(j => j.value === jobValue);
    return job ? job.name : 'Тодорхойгүй';
  };
  
  // ========== ҮНДСЭН ЦЭС ==========
  if (!args[0]) {
    const embed = new EmbedBuilder()
      .setColor(client.config.color.primary)
      .setTitle('💼 АЖЛЫН ТОВЧОО')
      .setDescription(`
👋 Сайн уу, **${user.username}**!

Доорх ажлуудаас сонгож, өдөр бүр ажиллаж мөнгө олох боломжтой.

╔════════════════════════╗
║   🎯 **АЖИЛ СОНГОХ АРГА**   ║
╚════════════════════════╝

✍️ **Ажил сонгох:** \`${client.prefix}job <ажил>\`
📋 Жишээ: \`${client.prefix}job miner\`

🚪 **Ажлаас гарах:** \`${client.prefix}job leave\`

━━━━━━━━━━━━━━━━━━━━━━━
      `)
      .addFields(
        { 
          name: '📊 ТАНЫ МЭДЭЭЛЭЛ', 
          value: isWorking 
            ? `✅ **Одоогийн ажил:** ${getJobName(currentJob)}\n📅 **Ажилласан:** Тийм` 
            : '❌ **Одоогийн ажил:** Ажилгүй\n📅 **Ажилласан:** Үгүй',
          inline: false
        }
      )
      .setTimestamp();

    // Ажлуудыг нэмэх
    jobs.forEach(job => {
      embed.addFields({
        name: `${job.emoji} ${job.name}`,
        value: `└ 💰 **Цалин:** ${job.salary}\n└ 📝 **Тайлбар:** ${job.description}\n└ 🎮 **Тоглох:** \`${client.prefix}job ${job.value}\``,
        inline: false
      });
    });

    embed.setFooter({ 
      text: `${client.prefix}work - ажиллах | ${client.prefix}job leave - гарах`, 
      iconURL: client.user.displayAvatarURL() 
    });

    // Товчнууд нэмэх (ажлууд руу шууд очих)
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('job_police')
          .setLabel('👮 Цагдаа')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(isWorking),
        new ButtonBuilder()
          .setCustomId('job_doctor')
          .setLabel('👩‍⚕️ Эмч')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(isWorking),
        new ButtonBuilder()
          .setCustomId('job_miner')
          .setLabel('⛏️ Уурхайчин')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(isWorking),
        new ButtonBuilder()
          .setCustomId('job_gang')
          .setLabel('👹 Бүлэглэл')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(isWorking)
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('job_leave')
          .setLabel('🚪 Ажлаас гарах')
          .setStyle(ButtonStyle.Danger)
          .setDisabled(!isWorking),
        new ButtonBuilder()
          .setCustomId('job_info')
          .setLabel('ℹ️ Тусламж')
          .setStyle(ButtonStyle.Secondary)
      );

    return message.channel.send({ embeds: [embed], components: [row, row2] }).then(msg => {
      const filter = i => i.user.id === user.id;
      const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async (i) => {
        if (i.customId.startsWith('job_')) {
          const jobType = i.customId.replace('job_', '');
          
          if (jobType === 'leave') {
            // Ажлаас гарах
            if (!isWorking) {
              return i.reply({ content: '❌ Та одоогоор ажилгүй байна.', ephemeral: true });
            }
            
            const roleName = {
              police: 'POLICE',
              doctor: 'DOCTOR',
              miner: 'MINER',
              gang: 'GANG'
            }[currentJob];
            
            const role = message.guild.roles.cache.find(r => r.name === roleName);
            if (role) message.member.roles.remove(role);
            
            client.db.set(`working_${user.id}`, false);
            client.db.delete(`job_${user.id}`);
            
            await i.update({ 
              content: `✅ Та **${getJobName(currentJob)}** ажлаас амжилттай гарлаа!`,
              components: [] 
            });
            
            // Дахин ачаалах
            setTimeout(() => {
              msg.delete();
              exports.execute(client, message, []);
            }, 3000);
            
          } else if (jobType === 'info') {
            // Тусламж
            const helpEmbed = new EmbedBuilder()
              .setColor('#5865F2')
              .setTitle('ℹ️ АЖЛЫН ТУСЛАМЖ')
              .setDescription(`
**Ажил хэрхэн сонгох вэ?**
1. \`${client.prefix}job\` - Ажлын жагсаалт харах
2. Хүссэн ажлаа сонгох: \`${client.prefix}job цагдаа\`
3. Баталгаажуулах товч дээр дарах

**Ажил хэрхэн хийх вэ?**
- Ажил сонгосны дараа \`${client.prefix}work\` команд бичнэ
- Ажил бүр өөрийн гэсэн тусгай сувагтай
- Цагдаа, эмч, уурхайчин тусгай сувагт ажиллана
- Бүлэглэл хаана ч ажиллаж болно

**Ажлаас хэрхэн гарах вэ?**
- \`${client.prefix}job leave\` команд бичнэ
- Долоо хоногт нэг л удаа ажлаа солих боломжтой
              `)
              .setTimestamp();
            
            await i.reply({ embeds: [helpEmbed], ephemeral: true });
            
          } else {
            // Ажил сонгох
            const selectedJob = jobs.find(j => j.value === jobType);
            
            if (isWorking) {
              return i.reply({ 
                content: `❌ Та одоо **${getJobName(currentJob)}** ажилтай байна. Эхлээд \`${client.prefix}job leave\` гэж бичээд гарна уу.`, 
                ephemeral: true 
              });
            }
            
            const confirmRow = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId(`confirm_${jobType}`)
                  .setLabel('✅ Тийм, орох')
                  .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                  .setCustomId('cancel')
                  .setLabel('❌ Үгүй, буцах')
                  .setStyle(ButtonStyle.Danger)
              );
            
            await i.update({ 
              content: `${selectedJob.emoji} **${selectedJob.name}** ажилд орох уу?\n└ 💰 Цалин: ${selectedJob.salary}\n└ 📝 Тайлбар: ${selectedJob.description}`,
              components: [confirmRow]
            });
            
            const confirmFilter = j => j.user.id === user.id;
            const confirmCollector = msg.createMessageComponentCollector({ confirmFilter, time: 15000, max: 1 });
            
            confirmCollector.on('collect', async (j) => {
              if (j.customId === `confirm_${jobType}`) {
                // Роль нэмэх
                const roleName = {
                  police: 'POLICE',
                  doctor: 'DOCTOR',
                  miner: 'MINER',
                  gang: 'GANG'
                }[selectedJob.value];
                
                const role = message.guild.roles.cache.find(r => r.name === roleName);
                if (role) message.member.roles.add(role);
                
                client.db.set(`working_${user.id}`, true);
                client.db.set(`job_${user.id}`, selectedJob.value);
                
                await j.update({ 
                  content: `✅ Та **${selectedJob.name}** ажилд амжилттай орлоо!\n└ 🔔 Одоо \`${client.prefix}work\` команд бичин ажиллаарай.`,
                  components: [] 
                });
                
                // Дахин ачаалах
                setTimeout(() => {
                  msg.delete();
                  exports.execute(client, message, []);
                }, 3000);
                
              } else {
                await j.update({ content: '❌ Ажил сонгох цуцлагдлаа.', components: [] });
                
                setTimeout(() => {
                  msg.delete();
                  exports.execute(client, message, []);
                }, 3000);
              }
            });
            
            confirmCollector.on('end', (collected) => {
              if (collected.size === 0) {
                msg.edit({ content: '⏱️ Хугацаа дууссан.', components: [] });
              }
            });
          }
        }
      });
    });
  }
  
  // ========== АЖИЛ СОНГОХ (командаар) ==========
  if (args[0] === 'leave') {
    // Ажлаас гарах
    if (!isWorking) {
      return message.reply('❌ Та одоогоор ажилгүй байна.');
    }
    
    const roleName = {
      police: 'POLICE',
      doctor: 'DOCTOR',
      miner: 'MINER',
      gang: 'GANG'
    }[currentJob];
    
    const role = message.guild.roles.cache.find(r => r.name === roleName);
    if (role) message.member.roles.remove(role);
    
    client.db.set(`working_${user.id}`, false);
    client.db.delete(`job_${user.id}`);
    
    return message.reply(`✅ Та **${getJobName(currentJob)}** ажлаас амжилттай гарлаа!`);
  }
  
  // Ажил сонгох
  const selectedJob = jobs.find(j => j.value === args[0].toLowerCase() || 
                                     j.name.includes(args[0]));
  
  if (!selectedJob) {
    return message.reply(`❌ **${args[0]}** гэсэн ажил байхгүй! Боломжит ажлууд: ${jobs.map(j => `\`${j.value}\``).join(', ')}`);
  }
  
  if (isWorking) {
    return message.reply(`❌ Та одоо **${getJobName(currentJob)}** ажилтай байна. Эхлээд \`${client.prefix}job leave\` гэж бичээд гарна уу.`);
  }
  
  // Баталгаажуулах товч
  const confirmRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_job')
        .setLabel('✅ Тийм')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('cancel_job')
        .setLabel('❌ Үгүй')
        .setStyle(ButtonStyle.Danger)
    );
  
  message.channel.send({
    content: `${selectedJob.emoji} **${selectedJob.name}** ажилд орох уу?\n└ 💰 Цалин: ${selectedJob.salary}\n└ 📝 Тайлбар: ${selectedJob.description}`,
    components: [confirmRow]
  }).then(msg => {
    const filter = i => i.user.id === user.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 15000 });
    
    collector.on('collect', async (i) => {
      if (i.customId === 'confirm_job') {
        // Роль нэмэх
        const roleName = {
          police: 'POLICE',
          doctor: 'DOCTOR',
          miner: 'MINER',
          gang: 'GANG'
        }[selectedJob.value];
        
        const role = message.guild.roles.cache.find(r => r.name === roleName);
        if (role) message.member.roles.add(role);
        
        client.db.set(`working_${user.id}`, true);
        client.db.set(`job_${user.id}`, selectedJob.value);
        
        await i.update({ 
          content: `✅ Та **${selectedJob.name}** ажилд орлоо!\n└ 🔔 Одоо \`${client.prefix}work\` команд бичээд ажиллаарай.`, 
          components: [] 
        });
      } else {
        await i.update({ content: '❌ Ажил сонгох цуцлагдлаа.', components: [] });
      }
    });
    
    collector.on('end', (collected) => {
      if (collected.size === 0) {
        msg.edit({ content: '⏱️ Хугацаа дууссан.', components: [] });
      }
    });
  });
};

exports.help = {
  name: "job",
  aliases: ["jobs", "work", "ажил"],
  usage: "job [ажил/leave]",
  description: "Ажил сонгох, гарах - өдөр бүр ажиллаж мөнгө олох"
};

exports.cooldown = 5;