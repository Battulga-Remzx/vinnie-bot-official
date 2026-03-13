// commands/job/police.js
const { EmbedBuilder } = require('discord.js');

exports.execute = async (client, message, args) => {
  try {
    const user = message.author;
    
    // Ажлыг шалгах
    const job = client.db.fetch(`job_${user.id}`);
    const working = client.db.fetch(`working_${user.id}`);
    
    if (!working || job !== 'police') {
      return message.reply('❌ Та цагдаагийн ажилд ороогүй байна! `!job police`');
    }

    // Энд суваг шалгах шаардлагагүй, учир нь messageCreate.js аль хэдийн шалгасан
    // Зөвхөн ажлын логикоо бичнэ

    // Cooldown шалгах
    const cooldown = client.db.fetch(`police_cd_${user.id}`);
    const now = Date.now();
    const cooldownTime = 30000; // 30 секунд

    if (cooldown && now - cooldown < cooldownTime) {
      const left = Math.ceil((cooldownTime - (now - cooldown)) / 1000);
      return message.reply(`⏱️ Дараагийн эргүүл хийхэд **${left}** секунд үлдлээ.`);
    }

    // Санамсаргүй үйл явдлууд
    const events = [
      { name: '🚗 Хурд хэтрүүлсэн машин', reward: 300, text: 'Хурд хэтрүүлсэн машиныг зогсоож, торгууль авлаа' },
      { name: '🏃 Хулгайч', reward: 500, text: 'Дэлгүүрийн хулгайчийг баривчилж, шагнал авлаа' },
      { name: '👮 Эргүүл хийх', reward: 200, text: 'Энгийн эргүүл хийж, цалин авлаа' },
      { name: '🚔 Осол', reward: 400, text: 'Зам тээврийн осолд туслан, нэмэгдэл цалин авлаа' },
      { name: '🔫 Зэвсэгт этгээд', reward: 800, text: 'Аюултай этгээдийг баривчилж, тусгай урамшуулал авлаа' },
      { name: '🐕 Нохой', reward: 100, text: 'Төөрсөн нохойг олж, эзэнд нь өглөө' },
      { name: '💰 Хахууль', reward: 600, text: 'Хахууль авахаас татгалзаж, шударга ажиллагаа үзүүллээ' },
      { name: '🏆 Онцгой', reward: 1000, text: 'Онцгой гавьяа байгуулж, дэвшүүлэв' }
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    const bonus = Math.floor(Math.random() * 200) + 100; // Нэмэлт урамшуулал
    const total = event.reward + bonus;

    // Цалин өгөх
    client.db.add(`money_${user.id}`, total);
    client.db.set(`police_cd_${user.id}`, now);

    const embed = new EmbedBuilder()
      .setColor('#4169E1')
      .setTitle('👮 ЦАГДААГИЙН ЭРГҮҮЛ')
      .setDescription(`
**${user.username}** эргүүл хийж байна...

━━━━━━━━━━━━━━━━━━━━━
🚨 **Үйл явдал:** ${event.name}
📝 **Тайлбар:** ${event.text}

💰 **Цалин:** ${event.reward} 🪙
🎁 **Нэмэлт:** +${bonus} 🪙
💵 **НИЙТ:** ${total} 🪙
━━━━━━━━━━━━━━━━━━━━━
      `)
      .setFooter({ text: '⏱️ Дараагийн эргүүл: 30 секунд' })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });

  } catch (error) {
    console.error('Police command error:', error);
    message.reply('❌ Алдаа гарлаа: ' + error.message);
  }
};

exports.help = {
  name: 'patrol',
  aliases: ['p', 'эргүүл'],
  usage: 'patrol',
  description: '👮 Цагдаагийн эргүүл хийж мөнгө олох',
  category: 'job'
};

// Зөвхөн цагдаагийн сувагт - ЭНД ЗӨВХӨН ID-г оруулна
exports.channels = ['1479438402897317900'];

exports.cooldown = 30;