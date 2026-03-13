// utils/channelCheck.js
module.exports = (client, message, allowedChannels) => {
  // Хэрэв allowedChannels хоосон бол бүх сувагт зөвшөөрөх
  if (!allowedChannels || allowedChannels.length === 0) {
    return { allowed: true };
  }
  
  // Сувгийн ID шалгах
  if (allowedChannels.includes(message.channel.id)) {
    return { allowed: true };
  }
  
  // Сувгийн нэр шалгах (хэрэв ID биш нэр өгсөн бол)
  const channelName = message.channel.name.toLowerCase();
  for (const ch of allowedChannels) {
    // Хэрэв зөвшөөрөгдсөн суваг нь ID биш нэр байвал
    if (typeof ch === 'string' && ch.length < 20 && !isNaN(ch)) {
      if (channelName.includes(ch.toLowerCase()) || ch.toLowerCase().includes(channelName)) {
        return { allowed: true };
      }
    }
  }
  
  // Зөвшөөрөлгүй бол буцаах
  const allowedList = allowedChannels.map(ch => {
    if (ch.length > 5 && !isNaN(ch)) return `<#${ch}>`; // ID бол суваг харуулах
    return `#${ch}`; // Нэр бол нэр харуулах
  }).join(', ');
  
  return {
    allowed: false,
    message: `❌ Энэ командыг зөвхөн ${allowedList} сувагт ашиглах боломжтой.`
  };
};