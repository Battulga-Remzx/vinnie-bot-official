// commands/job/doctor.js
const { EmbedBuilder } = require('discord.js');

exports.execute = async (client, message, args) => {
  try {
    const user = message.author;
    
    // Ажлыг шалгах
    const job = client.db.fetch(`job_${user.id}`);
    const working = client.db.fetch(`working_${user.id}`);
    
    if (!working || job !== 'doctor') {
      return message.reply('❌ Та эмчийн ажилд ороогүй байна! `!job doctor`');
    }

    // Cooldown шалгах
    const cooldown = client.db.fetch(`doctor_cd_${user.id}`);
    const now = Date.now();
    const cooldownTime = 30000; // 30 секунд

    if (cooldown && now - cooldown < cooldownTime) {
      const left = Math.ceil((cooldownTime - (now - cooldown)) / 1000);
      return message.reply(`⏱️ Дараагийн өвчтөн эмчлэхэд **${left}** секунд үлдлээ.`);
    }

    // Өвчтөнүүд
    const patients = [
      { name: '🤒 Ханиадтай хүүхэд', reward: 250, text: 'Ханиадны эм бичиж өглөө' },
      { name: '🩸 Тархины хэмжилт', reward: 400, text: 'Тархины даралтыг хэмжиж, зөвлөгөө өглөө' },
      { name: '🦴 Хөл хугарсан иргэн', reward: 600, text: 'Хөлийг нь гипсээр цутгаж, эмчиллээ' },
      { name: '🏥 Түргэн тусламж', reward: 800, text: 'Яаралтай түргэн тусламж үзүүллээ' },
      { name: '💊 Вакцин', reward: 300, text: 'Вакцин хийж өглөө' },
      { name: '👵 Хөгшдийн үзлэг', reward: 350, text: 'Хөгшдийн эрүүл мэндийн үзлэг хийлээ' },
      { name: '🦷 Шүд эмч', reward: 450, text: 'Шүдний өвчтөнийг эмчиллээ' },
      { name: '⚕️ Хагалгаа', reward: 1200, text: 'Амжилттай хагалгаа хийж, амийг аварлаа' }
    ];

    const patient = patients[Math.floor(Math.random() * patients.length)];
    const tip = Math.floor(Math.random() * 300) + 50; // Баярлалаа гэсэн мөнгө
    const total = patient.reward + tip;

    // Багажны нэмэлт урамшуулал
    let toolBonus = 0;
    const hasTool = client.db.fetch(`tool_${user.id}_doctor`);
    if (hasTool) {
      toolBonus = Math.floor(total * 0.1); // 10% нэмэлт
    }

    const finalTotal = total + toolBonus;

    // Цалин өгөх
    client.db.add(`money_${user.id}`, finalTotal);
    client.db.set(`doctor_cd_${user.id}`, now);

    const embed = new EmbedBuilder()
      .setColor('#FF69B4')
      .setTitle('👩‍⚕️ ЭМЧЛЭЛ')
      .setDescription(`
**${user.username}** эмчилж байна...

━━━━━━━━━━━━━━━━━━━━━
🩺 **Өвчтөн:** ${patient.name}
📝 **Тайлбар:** ${patient.text}

💰 **Цалин:** ${patient.reward} 🪙
💝 **Талархал:** +${tip} 🪙
${hasTool ? `🔧 **Багажны нэмэлт:** +${toolBonus} 🪙 (10%)` : ''}
💵 **НИЙТ:** ${finalTotal} 🪙
━━━━━━━━━━━━━━━━━━━━━
      `)
      .setFooter({ text: '⏱️ Дараагийн өвчтөн: 30 секунд' })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });

  } catch (error) {
    console.error('Doctor command error:', error);
    message.reply('❌ Алдаа гарлаа: ' + error.message);
  }
};

exports.help = {
  name: 'heal',
  aliases: ['h', 'эмчлэх'],
  usage: 'heal',
  description: '👩‍⚕️ Өвчтөн эмчилж мөнгө олох',
  category: 'job'
};

// Зөвхөн эмчийн сувагт
exports.channels = ['1479438435612885024'];

exports.cooldown = 30;