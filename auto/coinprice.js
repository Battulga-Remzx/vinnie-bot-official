const { EmbedBuilder } = require('discord.js');

class CoinPriceManager {
  constructor() {
    this.min = 1;
    this.max = 1000000000;
    this.history = [];
  }
  
  // Шинэ үнэ гаргах
  generatePrice(lastPrice) {
    // Хэлбэлзлийн хувь (0.1% - 10%)
    const volatility = Math.random() * 10 + 0.1;
    
    // Чиглэл
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    // Өөрчлөлтийн хэмжээ
    const changePercent = volatility / 100;
    const change = Math.floor(lastPrice * changePercent * direction);
    
    // Шинэ үнэ
    let newPrice = lastPrice + change;
    
    // Хязгаарт байлгах
    if (newPrice < this.min) newPrice = this.min;
    if (newPrice > this.max) newPrice = this.max;
    
    return newPrice;
  }
  
  // Түүхэнд хадгалах
  addToHistory(price) {
    this.history.push({
      price: price,
      time: Date.now()
    });
    
    // Сүүлийн 100 үнийг л хадгалах
    if (this.history.length > 100) {
      this.history.shift();
    }
  }
  
  // Дундаж үнэ
  getAveragePrice() {
    if (this.history.length === 0) return 0;
    const sum = this.history.reduce((acc, item) => acc + item.price, 0);
    return Math.floor(sum / this.history.length);
  }
}

async function updateCoinPrice(client) {
  try {
    const channelId = '1479455893308575865';
    const channel = client.channels.cache.get(channelId);
    if (!channel) return;
    
    // Coin price manager үүсгэх
    if (!client.coinManager) {
      client.coinManager = new CoinPriceManager();
    }
    
    // Өмнөх үнийг авах
    let lastPrice = client.db.fetch(`coin_lastprice`) || 3000;
    
    // Шинэ үнэ гаргах
    const currentPrice = client.coinManager.generatePrice(lastPrice);
    
    // Түүхэнд хадгалах
    client.coinManager.addToHistory(currentPrice);
    
    // Дундаж үнэ
    const avgPrice = client.coinManager.getAveragePrice();
    
    // Өөрчлөлт
    const change = currentPrice - lastPrice;
    const changePercent = ((change / lastPrice) * 100).toFixed(4);
    
    // Дээш/Доош тэмдэг
    let arrow = '';
    let color = '';
    let emoji = '';
    
    if (change > 0) {
      arrow = '📈 ДЭЭШ';
      color = '#57F287';
      emoji = '🟢';
    } else if (change < 0) {
      arrow = '📉 ДООШ';
      color = '#ED4245';
      emoji = '🔴';
    } else {
      arrow = '➡️ ТОГТВОРТОЙ';
      color = '#FEE75C';
      emoji = '🟡';
    }
    
    // Өдрийн статистик
    let dailyHigh = client.db.fetch(`coin_daily_high`) || currentPrice;
    let dailyLow = client.db.fetch(`coin_daily_low`) || currentPrice;
    
    if (currentPrice > dailyHigh) {
      client.db.set(`coin_daily_high`, currentPrice);
      dailyHigh = currentPrice;
    }
    if (currentPrice < dailyLow) {
      client.db.set(`coin_daily_low`, currentPrice);
      dailyLow = currentPrice;
    }
    
    // Хэлбэлзлийн график (энгийн)
    const barCount = Math.min(Math.floor(Math.abs(changePercent) * 2), 20);
    const bar = change > 0 ? '🟩'.repeat(barCount) : '🟥'.repeat(barCount);
    
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle('🪙 ЗООСНЫ ҮНИЙН МЭДЭЭ')
      .setDescription(`
╔══════════════════════════════╗
║    🪙 **1 COIN = ${currentPrice.toLocaleString()} 💰**    ║
╚══════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**${arrow}** ${emoji} **${Math.abs(change).toLocaleString()} 💰** (${changePercent}%)
${bar}

📊 **24 ЦАГИЙН СТАТИСТИК:**
└ 📈 **Дээд цэг:** ${dailyHigh.toLocaleString()} 💰
└ 📉 **Доод цэг:** ${dailyLow.toLocaleString()} 💰
└ 💹 **Дундаж:** ${avgPrice.toLocaleString()} 💰
└ 📊 **Хэлбэлзэл:** ±${(Math.random() * 5 + 1).toFixed(2)}%

⏱️ **Сүүлд шинэчлэгдсэн:** ${new Date().toLocaleString('mn-MN')}
      `)
      .setFooter({ text: '⚡ 5 минут тутамд шинэчлэгдэнэ', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    // Хуучин мессежийг шинэчлэх
    const messages = await channel.messages.fetch({ limit: 10 });
    const oldMsg = messages.find(m => m.embeds[0]?.title?.includes('ЗООСНЫ ҮНИЙН МЭДЭЭ'));
    
    if (oldMsg) {
      await oldMsg.edit({ embeds: [embed] });
    } else {
      await channel.send({ embeds: [embed] });
    }
    
    // Шинэ үнийг хадгалах
    client.db.set(`coin_lastprice`, currentPrice);
    client.db.set(`coin_prevprice`, lastPrice);
    
    console.log(`[COIN PRICE] 🪙 ${currentPrice.toLocaleString()} 💰 (${arrow} ${Math.abs(change).toLocaleString()})`);
    
  } catch (error) {
    console.error('Coin price update error:', error);
  }
}

module.exports = { updateCoinPrice };