// events/ready.js
module.exports = async (client) => {
  console.log(`✅ ${client.user.tag} онлайн боллоо!`);
  
  // Бүх серверүүдийн гишүүдийг cache-д хадгалах
  for (const guild of client.guilds.cache.values()) {
    await guild.members.fetch().catch(() => {});
    console.log(`📥 ${guild.name} (${guild.memberCount} гишүүн) cache-д хадгалагдлаа`);
  }
  
  console.log(`✅ Нийт ${client.users.cache.size} хэрэглэгч cache-д байна`);
  
  const activities = [
    { name: `${client.config.prefix}help`, type: 2 }, // LISTENING
    { name: `${client.guilds.cache.size} сервер`, type: 3 }, // WATCHING
    { name: `z o developing me ❤️`, type: 4 } // CUSTOM
  ];
  
  let i = 0;
  setInterval(() => {
    client.user.setPresence({
      activities: [activities[i % activities.length]],
      status: 'online'
    });
    i++;
  }, 10000);
};