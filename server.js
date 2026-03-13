// server.js - НЭВТРЭХ НЭМСЭН ХУВИЛБАР (БҮРЭН)
const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// ========== СЕССИЙН ТОХИРГОО ==========
app.use(session({
  secret: process.env.SESSION_SECRET || 'vinnie_bot_secret_key_2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 хоног
  }
}));

// ========== PASSPORT ТОХИРГОО ==========
app.use(passport.initialize());
app.use(passport.session());

// Discord стратеги
passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: process.env.DISCORD_CALLBACK_URL || 'http://localhost:3000/auth/discord/callback',
  scope: ['identify', 'email']
}, (accessToken, refreshToken, profile, done) => {
  // Хэрэглэгчийн мэдээлэл хадгалах
  return done(null, profile);
}));

// Хэрэглэгчийг сессэд хадгалах/ачаалах
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// ========== СТАТИК ФАЙЛУУД ==========
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ========== DISCORD CLIENT ХОЛБОЛТ ==========
let discordClient = null;

function setDiscordClient(client) {
  discordClient = client;
  console.log('✅ Discord client вэб серверт холбогдлоо');
}

// ========== НЭВТРЭХ ЗААВАР ==========

// Нэвтрэх хуудас
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Discord-ээр нэвтрэх
app.get("/auth/discord", passport.authenticate("discord"));

// Discord буцах холбоос
app.get("/auth/discord/callback", 
  passport.authenticate("discord", { 
    failureRedirect: "/login?error=auth_failed" 
  }),
  (req, res) => {
    // Амжилттай нэвтэрсэн бол үндсэн хуудас руу чиглүүлэх
    res.redirect("/");
  }
);

// Гарах
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) console.error(err);
    res.redirect("/login");
  });
});

// API: Хэрэглэгчийн мэдээлэл авах
app.get("/api/user/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Нэвтрээгүй байна" });
  }
  
  res.json({
    id: req.user.id,
    username: req.user.username,
    discriminator: req.user.discriminator,
    avatar: req.user.avatar,
    email: req.user.email
  });
});

// Сесс шалгах хаалт
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

// ========== ВЭБ ХУУДАСНУУД (ЗӨВХӨН НЭВТРЭСЭН ХЭРЭГЛЭГЧ) ==========
app.get("/", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/game", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

app.get("/shop", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shop.html'));
});

app.get("/leaderboard", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'leaderboard.html'));
});

app.get("/inventory", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'inventory.html'));
});

app.get("/coinchart", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'coinchart.html'));
});

app.get("/status", (req, res) => {
  res.json({
    status: "online",
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// ========== API ТӨГСГӨЛ (ХУВЬСГАЛГҮЙ) ==========

// API: Хэрэглэгчийн мэдээлэл авах
app.get("/api/user/:userId", (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const userId = req.params.userId;
  
  try {
    // Ажлыг зөв авах - 'police' байх ёстой
    const job = discordClient.db.fetch(`job_${userId}`);
    console.log(`Хэрэглэгч ${userId} - Ажил:`, job); // Лог нэмэх
    
    const userData = {
      money: discordClient.db.fetch(`money_${userId}`) || 0,
      bank: discordClient.db.fetch(`bank_${userId}`) || 0,
      coin: discordClient.db.fetch(`coin_${userId}`) || 0,
      coal: discordClient.db.fetch(`coal_${userId}`) || 0,
      iron: discordClient.db.fetch(`iron_${userId}`) || 0,
      gold: discordClient.db.fetch(`gold_${userId}`) || 0,
      diamond: discordClient.db.fetch(`diamond_${userId}`) || 0,
      antimatter: discordClient.db.fetch(`antimatter_${userId}`) || 0,
      tools: discordClient.db.fetch(`tool_${userId}`) || 0,
      keys: discordClient.db.fetch(`key_${userId}`) || 0,
      job: job, // ЭНД ЗӨВ ИРЖ БАЙГАА ЭСЭХ
      working: discordClient.db.fetch(`working_${userId}`) || false,
      tool_miner: discordClient.db.fetch(`tool_${userId}_miner`) || false,
      tool_doctor: discordClient.db.fetch(`tool_${userId}_doctor`) || false,
      tool_police: discordClient.db.fetch(`tool_${userId}_police`) || false,
      tool_gang: discordClient.db.fetch(`tool_${userId}_gang`) || false
    };
    
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Тоглоомын үр дүн
app.post("/api/game/result", (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const { userId, game, result, amount } = req.body;
  
  try {
    let response = { success: true };
    
    switch (game) {
      case 'slots':
        const currentCoins = discordClient.db.fetch(`coin_${userId}`) || 0;
        
        if (result.win) {
          discordClient.db.add(`coin_${userId}`, amount);
          response.newCoins = currentCoins + amount;
          response.message = `🎰 Слот: +${amount} 🪙`;
        } else {
          discordClient.db.subtract(`coin_${userId}`, amount);
          response.newCoins = currentCoins - amount;
          response.message = `🎰 Слот: -${amount} 🪙`;
        }
        break;
        
      case 'mine':
        const resource = result.resource;
        const resourceAmount = result.amount;
        
        discordClient.db.add(`${resource}_${userId}`, resourceAmount);
        
        const currentResource = discordClient.db.fetch(`${resource}_${userId}`) || 0;
        response.newResource = currentResource;
        response.message = `⛏️ Олборлолт: +${resourceAmount} ${resource}`;
        break;
        
      default:
        response.success = false;
        response.message = "Тодорхойгүй тоглоом";
    }
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Дэлгүүрээс худалдан авах
app.post("/api/shop/buy", (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const { userId, type, key, role, amount, price } = req.body;
  
  try {
    const userMoney = discordClient.db.fetch(`money_${userId}`) || 0;
    
    if (userMoney < price) {
      return res.json({ success: false, message: 'Мөнгө хүрэлцэхгүй байна' });
    }
    
    // Мөнгө хасах
    discordClient.db.subtract(`money_${userId}`, price);
    
    // Төрлөөр нь нэмэх
    if (type === 'coin') {
      const currentCoins = discordClient.db.fetch(`coin_${userId}`) || 0;
      discordClient.db.set(`coin_${userId}`, currentCoins + amount);
    } else if (type === 'tool') {
      discordClient.db.set(`tool_${userId}_${role}`, true);
      discordClient.db.set(`tool_${userId}_${role}_price`, price);
    } else if (type === 'item') {
      const currentItem = discordClient.db.fetch(`${key}_${userId}`) || 0;
      discordClient.db.set(`${key}_${userId}`, currentItem + amount);
    } else if (type === 'resource') {
      const currentResource = discordClient.db.fetch(`${key}_${userId}`) || 0;
      discordClient.db.set(`${key}_${userId}`, currentResource + amount);
    } else if (type === 'special') {
      if (key === 'lottery') {
        discordClient.db.set(`lottery_${userId}`, true);
      } else if (key === 'boost') {
        discordClient.db.set(`boost_${userId}`, Date.now() + 3600000);
      } else if (key === 'vip') {
        discordClient.db.set(`vip_${userId}`, Date.now() + 604800000);
      }
    }
    
    const newMoney = discordClient.db.fetch(`money_${userId}`) || 0;
    
    res.json({
      success: true,
      newMoney: newMoney
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API: Дэлгүүрт зарах
app.post("/api/shop/sell", (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const { userId, type, amount, price, totalPrice } = req.body;
  
  try {
    if (type === 'coin') {
      const currentCoins = discordClient.db.fetch(`coin_${userId}`) || 0;
      
      if (currentCoins < amount) {
        return res.json({ success: false, message: 'Хангалттай зоос байхгүй' });
      }
      
      discordClient.db.subtract(`coin_${userId}`, amount);
      discordClient.db.add(`money_${userId}`, totalPrice);
      
      const newCoins = discordClient.db.fetch(`coin_${userId}`) || 0;
      const newMoney = discordClient.db.fetch(`money_${userId}`) || 0;
      
      res.json({
        success: true,
        newMoney: newMoney,
        newAmount: newCoins
      });
    } else {
      // Эрдэс зарах
      const currentResource = discordClient.db.fetch(`${type}_${userId}`) || 0;
      
      if (currentResource < amount) {
        return res.json({ success: false, message: 'Хангалттай эрдэс байхгүй' });
      }
      
      discordClient.db.subtract(`${type}_${userId}`, amount);
      discordClient.db.add(`money_${userId}`, totalPrice);
      
      const newResource = discordClient.db.fetch(`${type}_${userId}`) || 0;
      const newMoney = discordClient.db.fetch(`money_${userId}`) || 0;
      
      res.json({
        success: true,
        newMoney: newMoney,
        newAmount: newResource
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API: Лидерборд авах
app.get("/api/leaderboard/:type", async (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const type = req.params.type;
  
  try {
    const data = discordClient.db.all()
      .filter(item => item.ID.startsWith(`${type}_`))
      .filter(item => item.data > 0)
      .sort((a, b) => b.data - a.data)
      .slice(0, 10);
    
    const leaderboard = [];
    
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const userId = item.ID.split('_')[1];
      
      let username = 'Unknown User';
      try {
        const user = await discordClient.users.fetch(userId).catch(() => null);
        if (user) username = user.username;
      } catch {}
      
      leaderboard.push({
        userId: userId,
        username: username,
        amount: item.data,
        rank: i + 1
      });
    }
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Зоосны үнэ авах
app.get("/api/coinprice", (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const currentPrice = discordClient.db.fetch('coin_lastprice') || 3000;
  const prevPrice = discordClient.db.fetch('coin_prevprice') || currentPrice;
  
  res.json({
    current: currentPrice,
    previous: prevPrice,
    change: currentPrice - prevPrice,
    changePercent: ((currentPrice - prevPrice) / prevPrice * 100).toFixed(2)
  });
});

// ========== SOCKET.IO ==========

io.use((socket, next) => {
  // Сессийг socket-руу дамжуулах
  const session = socket.request.session;
  if (session && session.passport && session.passport.user) {
    socket.user = session.passport.user;
  }
  next();
});

io.on('connection', (socket) => {
  console.log('🟢 Вэб хэрэглэгч холбогдлоо:', socket.id);
  
  if (socket.user) {
    console.log(`👤 Хэрэглэгч: ${socket.user.username} (${socket.user.id})`);
    socket.emit('authenticated', socket.user);
  }
  
  socket.on('authenticate', (userId) => {
    socket.userId = userId;
    console.log(`👤 Хэрэглэгч баталгаажлаа: ${userId}`);
    
    if (discordClient) {
      const userData = {
        money: discordClient.db.fetch(`money_${userId}`) || 0,
        bank: discordClient.db.fetch(`bank_${userId}`) || 0,
        coin: discordClient.db.fetch(`coin_${userId}`) || 0
      };
      socket.emit('userData', userData);
    }
  });
  
  socket.on('playGame', async (data) => {
    const { game, bet, betType, betNumber } = data;
    const userId = socket.user?.id || socket.userId;
    
    if (!userId || !discordClient) {
      socket.emit('gameResult', { success: false, message: 'Хэрэглэгч тодорхойгүй байна' });
      return;
    }
    
    const coins = discordClient.db.fetch(`coin_${userId}`) || 0;
    
    if (coins < bet) {
      socket.emit('gameResult', { 
        success: false, 
        message: `Хангалттай зоос байхгүй! Одоогийн зоос: ${coins} 🪙` 
      });
      return;
    }
    
    try {
      let result = {};
      
      switch (game) {
        case 'roulette':
          result = playRoulette(userId, bet, betType, betNumber, discordClient);
          break;
        case 'slots':
          result = playSlots(userId, bet, discordClient);
          break;
      }
      
      socket.emit('gameResult', result);
      
    } catch (error) {
      console.error('❌ Тоглоомын алдаа:', error);
      socket.emit('gameResult', { 
        success: false, 
        message: 'Тоглоомын үед алдаа гарлаа' 
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('🔴 Вэб хэрэглэгч саллаа:', socket.id);
  });
});

// Рулет функц
function playRoulette(userId, bet, betType, betNumber, discordClient) {
  try {
    // Бооцоо хасах
    discordClient.db.subtract(`coin_${userId}`, bet);
    
    // Рулетны тоо (0-36)
    const winningNumber = Math.floor(Math.random() * 37);
    const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(winningNumber);
    
    let win = false;
    let multiplier = 0;
    let winAmount = 0;
    
    if (betType === 'red' && isRed) {
      win = true;
      multiplier = 2;
    } else if (betType === 'black' && !isRed && winningNumber !== 0) {
      win = true;
      multiplier = 2;
    } else if (betType === 'even' && winningNumber !== 0 && winningNumber % 2 === 0) {
      win = true;
      multiplier = 2;
    } else if (betType === 'odd' && winningNumber % 2 === 1) {
      win = true;
      multiplier = 2;
    } else if (betType === 'number' && betNumber === winningNumber) {
      win = true;
      multiplier = 36;
    }
    
    if (win) {
      winAmount = bet * multiplier;
      discordClient.db.add(`coin_${userId}`, winAmount);
    } else {
      winAmount = -bet;
    }
    
    const newCoins = discordClient.db.fetch(`coin_${userId}`) || 0;
    
    let color = '⚫';
    if (winningNumber === 0) color = '🟢';
    else if (isRed) color = '🔴';
    
    return {
      success: true,
      game: 'roulette',
      number: winningNumber,
      color: color,
      win: win,
      amount: Math.abs(winAmount),
      newCoins: newCoins,
      message: win ? `🎉 ХОЖЛОО! +${winAmount} 🪙` : `😢 ХОЖИГДЛОО -${bet} 🪙`
    };
    
  } catch (error) {
    console.error('❌ Рулет алдаа:', error);
    return {
      success: false,
      message: 'Тоглоомын үед алдаа гарлаа'
    };
  }
}

// Слот функц
function playSlots(userId, bet, discordClient) {
  try {
    discordClient.db.subtract(`coin_${userId}`, bet);
    
    const symbols = ['🍋', '🍒', '🍇', '🍉', '7️⃣', '💎', '💰', '🎰'];
    const slots = [
      Math.floor(Math.random() * symbols.length),
      Math.floor(Math.random() * symbols.length),
      Math.floor(Math.random() * symbols.length)
    ];
    
    let win = false;
    let winAmount = 0;
    
    if (slots[0] === slots[1] && slots[1] === slots[2]) {
      win = true;
      winAmount = bet * 10;
    } else if (slots[0] === slots[1] || slots[1] === slots[2] || slots[0] === slots[2]) {
      win = true;
      winAmount = bet * 2;
    } else {
      winAmount = -bet;
    }
    
    if (win) {
      discordClient.db.add(`coin_${userId}`, winAmount);
    }
    
    const newCoins = discordClient.db.fetch(`coin_${userId}`) || 0;
    
    return {
      success: true,
      game: 'slots',
      slots: slots.map(i => symbols[i]),
      win: win,
      amount: Math.abs(winAmount),
      newCoins: newCoins,
      message: win ? `🎉 ХОЖЛОО! +${winAmount} 🪙` : `😢 ХОЖИГДЛОО -${bet} 🪙`
    };
    
  } catch (error) {
    console.error('Слот алдаа:', error);
    return {
      success: false,
      message: 'Тоглоомын үед алдаа гарлаа'
    };
  }
}

// server.js - API endpoint-уудын хамт нэмэх

// API: Уурхайчин тоглох
app.post("/api/mine", (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const { userId } = req.body;
  
  try {
    // Ажлыг шалгах
    const job = discordClient.db.fetch(`job_${userId}`);
    const working = discordClient.db.fetch(`working_${userId}`);
    
    if (!working || job !== 'miner') {
      return res.json({ 
        success: false, 
        message: 'Та уурхайчны ажилд ороогүй байна!' 
      });
    }
    
    // Cooldown шалгах
    const cooldown = discordClient.db.fetch(`miner_cd_${userId}`);
    const now = Date.now();
    const cooldownTime = 30000; // 30 секунд
    
    if (cooldown && now - cooldown < cooldownTime) {
      const left = Math.ceil((cooldownTime - (now - cooldown)) / 1000);
      return res.json({ 
        success: false, 
        cooldown: true,
        timeLeft: left,
        message: `⏱️ Дараагийн олборлолт хийхэд ${left} секунд үлдлээ.`
      });
    }
    
    // Олдворууд
    const items = [
      { name: 'Нүүрс', emoji: '⬛', value: 'coal', min: 1, max: 5, chance: 50 },
      { name: 'Төмөр', emoji: '⛓️', value: 'iron', min: 1, max: 3, chance: 25 },
      { name: 'Алт', emoji: '🪙', value: 'gold', min: 1, max: 2, chance: 15 },
      { name: 'Алмааз', emoji: '💎', value: 'diamond', min: 1, max: 1, chance: 8 },
      { name: 'Антиматтер', emoji: '⚛️', value: 'antimatter', min: 1, max: 1, chance: 2 }
    ];
    
    // Санамсаргүй сонголт
    const rand = Math.random() * 100;
    let cumulative = 0;
    let foundItem = items[0];
    
    for (const item of items) {
      cumulative += item.chance;
      if (rand < cumulative) {
        foundItem = item;
        break;
      }
    }
    
    const amount = Math.floor(Math.random() * (foundItem.max - foundItem.min + 1)) + foundItem.min;
    
    // Өмнөх тоо
    const current = discordClient.db.fetch(`${foundItem.value}_${userId}`) || 0;
    
    // Нэмэх
    discordClient.db.add(`${foundItem.value}_${userId}`, amount);
    
    // Cooldown тэмдэглэх (ЭНД ХАДГАЛДАГ)
    discordClient.db.set(`miner_cd_${userId}`, now);
    
    // Үнэлгээ
    const sellPrices = {
      coal: 50,
      iron: 200,
      gold: 1000,
      diamond: 5000,
      antimatter: 50000
    };
    const worth = sellPrices[foundItem.value] * amount;
    
    res.json({
      success: true,
      item: foundItem,
      amount: amount,
      current: current + amount,
      worth: worth,
      message: `⛏️ Та ${amount} ${foundItem.name} олборлолоо!`
    });
    
  } catch (error) {
    console.error('Уурхайчин алдаа:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// server.js - API endpoint-уудын хамт нэмэх

// ========== ЦАГДААГИЙН ТОГЛООМ ==========
app.post("/api/police/patrol", (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const { userId } = req.body;
  
  try {
    // Ажлыг шалгах
    const job = discordClient.db.fetch(`job_${userId}`);
    const working = discordClient.db.fetch(`working_${userId}`);
    
    if (!working || job !== 'police') {
      return res.json({ 
        success: false, 
        message: 'Та цагдаагийн ажилд ороогүй байна!' 
      });
    }
    
    // Cooldown шалгах
    const cooldown = discordClient.db.fetch(`police_cd_${userId}`);
    const now = Date.now();
    const cooldownTime = 30000; // 30 секунд
    
    if (cooldown && now - cooldown < cooldownTime) {
      const left = Math.ceil((cooldownTime - (now - cooldown)) / 1000);
      return res.json({ 
        success: false, 
        cooldown: true,
        timeLeft: left,
        message: `⏱️ Дараагийн эргүүл хийхэд ${left} секунд үлдлээ.`
      });
    }
    
    // Үйл явдлууд
    const events = [
      { name: '🚗 Хурд хэтрүүлсэн машин', reward: 300, text: 'Хурд хэтрүүлсэн машиныг зогсоож, торгууль авлаа' },
      { name: '🏃 Хулгайч', reward: 500, text: 'Дэлгүүрийн хулгайчийг баривчилж, шагнал авлаа' },
      { name: '👮 Эргүүл хийх', reward: 200, text: 'Энгийн эргүүл хийж, цалин авлаа' },
      { name: '🚔 Осол', reward: 400, text: 'Зам тээврийн осолд туслан, нэмэгдэл цалин авлаа' },
      { name: '🔫 Зэвсэгт этгээд', reward: 800, text: 'Аюултай этгээдийг баривчилж, тусгай урамшуулал авлаа' },
      { name: '🐕 Төөрсөн нохой', reward: 150, text: 'Төөрсөн нохойг олж, эзэнд нь өглөө' },
      { name: '💰 Хахууль', reward: 600, text: 'Хахууль авахаас татгалзаж, шударга ажиллагаа үзүүллээ' },
      { name: '🏆 Онцгой', reward: 1000, text: 'Онцгой гавьяа байгуулж, дэвшүүлэв' },
      { name: '👤 Согтуу жолооч', reward: 450, text: 'Согтуу жолоочийг баривчилж, зам тээврийн аюулгүй байдлыг хангав' },
      { name: '🔍 Эрэн сурвалжлах', reward: 700, text: 'Хэрэгт сэжигтнийг эрэн сурвалжилж, олж илрүүлэв' }
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    const bonus = Math.floor(Math.random() * 200) + 50; // 50-250 нэмэлт
    
    // Багажны нэмэлт (цагдаагийн тэмдэг)
    let toolBonus = 0;
    const hasTool = discordClient.db.fetch(`tool_${userId}_police`);
    if (hasTool) {
      toolBonus = Math.floor((event.reward + bonus) * 0.1); // 10% нэмэлт
    }
    
    const total = event.reward + bonus + toolBonus;
    
    // Мөнгө нэмэх
    discordClient.db.add(`money_${userId}`, total);
    
    // Cooldown тэмдэглэх
    discordClient.db.set(`police_cd_${userId}`, now);
    
    res.json({
      success: true,
      event: event.name,
      description: event.text,
      reward: event.reward,
      bonus: bonus,
      toolBonus: toolBonus,
      total: total,
      hasTool: hasTool,
      message: `👮 Та ${event.name} - ${event.text}`
    });
    
  } catch (error) {
    console.error('Цагдаагийн алдаа:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== ЭМЧИЙН ТОГЛООМ ==========
app.post("/api/doctor/heal", (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const { userId } = req.body;
  
  try {
    // Ажлыг шалгах
    const job = discordClient.db.fetch(`job_${userId}`);
    const working = discordClient.db.fetch(`working_${userId}`);
    
    if (!working || job !== 'doctor') {
      return res.json({ 
        success: false, 
        message: 'Та эмчийн ажилд ороогүй байна!' 
      });
    }
    
    // Cooldown шалгах
    const cooldown = discordClient.db.fetch(`doctor_cd_${userId}`);
    const now = Date.now();
    const cooldownTime = 25000; // 25 секунд
    
    if (cooldown && now - cooldown < cooldownTime) {
      const left = Math.ceil((cooldownTime - (now - cooldown)) / 1000);
      return res.json({ 
        success: false, 
        cooldown: true,
        timeLeft: left,
        message: `⏱️ Дараагийн эмчлэлт хийхэд ${left} секунд үлдлээ.`
      });
    }
    
    // Өвчтөнүүд
    const patients = [
      { name: '🤒 Ханиадтай хүүхэд', reward: 250, text: 'Ханиадны эм бичиж өглөө' },
      { name: '🩸 Тархины хэмжилт', reward: 400, text: 'Тархины даралтыг хэмжиж, зөвлөгөө өглөө' },
      { name: '🦴 Хөл хугарсан иргэн', reward: 600, text: 'Хөлийг нь гипсээр цутгаж, эмчиллээ' },
      { name: '🏥 Түргэн тусламж', reward: 800, text: 'Яаралтай түргэн тусламж үзүүллээ' },
      { name: '💉 Вакцин', reward: 300, text: 'Вакцин хийж өглөө' },
      { name: '👵 Хөгшдийн үзлэг', reward: 350, text: 'Хөгшдийн эрүүл мэндийн үзлэг хийлээ' },
      { name: '🦷 Шүд эмч', reward: 450, text: 'Шүдний өвчтөнийг эмчиллээ' },
      { name: '⚕️ Хагалгаа', reward: 1200, text: 'Амжилттай хагалгаа хийж, амийг аварлаа' },
      { name: '🤰 Жирэмсний хяналт', reward: 500, text: 'Жирэмсэн эхийн хяналтын үзлэг хийлээ' },
      { name: '🫀 Зүрхний шинжилгээ', reward: 900, text: 'Зүрхний нарийн шинжилгээ хийж, эмчилгээ зааварчилгаа өглөө' }
    ];
    
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const tip = Math.floor(Math.random() * 300) + 30; // 30-330 талархал
    
    // Багажны нэмэлт (эмчийн хэрэгсэл)
    let toolBonus = 0;
    const hasTool = discordClient.db.fetch(`tool_${userId}_doctor`);
    if (hasTool) {
      toolBonus = Math.floor((patient.reward + tip) * 0.1); // 10% нэмэлт
    }
    
    const total = patient.reward + tip + toolBonus;
    
    // Мөнгө нэмэх
    discordClient.db.add(`money_${userId}`, total);
    
    // Cooldown тэмдэглэх
    discordClient.db.set(`doctor_cd_${userId}`, now);
    
    res.json({
      success: true,
      patient: patient.name,
      description: patient.text,
      reward: patient.reward,
      tip: tip,
      toolBonus: toolBonus,
      total: total,
      hasTool: hasTool,
      message: `👩‍⚕️ Та ${patient.name} - ${patient.text}`
    });
    
  } catch (error) {
    console.error('Эмчийн алдаа:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== БҮЛЭГЛЭЛИЙН ТОГЛООМ ==========
app.post("/api/gang/rob", (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const { userId, targetId, robType } = req.body; // robType: 'money' эсвэл 'bank'
  
  try {
    // Ажлыг шалгах
    const job = discordClient.db.fetch(`job_${userId}`);
    const working = discordClient.db.fetch(`working_${userId}`);
    
    if (!working || job !== 'gang') {
      return res.json({ 
        success: false, 
        message: 'Та бүлэглэлийн ажилд ороогүй байна!' 
      });
    }
    
    // Cooldown шалгах
    const cooldown = discordClient.db.fetch(`rob_cd_${userId}`);
    const now = Date.now();
    const cooldownTime = 60000; // 1 минут
    
    if (cooldown && now - cooldown < cooldownTime) {
      const left = Math.ceil((cooldownTime - (now - cooldown)) / 1000);
      return res.json({ 
        success: false, 
        cooldown: true,
        timeLeft: left,
        message: `⏱️ Дараагийн дээрэм хийхэд ${left} секунд үлдлээ.`
      });
    }
    
    // Багаж шалгах
    const hasGangTool = discordClient.db.fetch(`tool_${userId}_gang`) || false;
    let toolBonus = hasGangTool ? 0.1 : 0; // 10% нэмэлт
    
    // Түлхүүр шалгах (зөвхөн банкны дээрэмд)
    let hasKey = false;
    if (robType === 'bank') {
      const keys = discordClient.db.fetch(`key_${userId}`) || 0;
      if (keys < 1) {
        return res.json({ 
          success: false, 
          message: 'Банкны дээрэм хийхэд түлхүүр шаардлагатай. Дэлгүүрээс худалдаж аваарай!',
          needKey: true
        });
      }
      hasKey = true;
    }
    
    // Зорилтот хэрэглэгчийн мэдээлэл
    const targetMoney = discordClient.db.fetch(`money_${targetId}`) || 0;
    const targetBank = discordClient.db.fetch(`bank_${targetId}`) || 0;
    
    // Дээрэмдэх боломжтой эсэх
    let maxAmount = 0;
    if (robType === 'money') {
      maxAmount = Math.min(targetMoney, 500); // Хамгийн ихдээ 500
      if (targetMoney < 50) {
        return res.json({ 
          success: false, 
          message: 'Зорилтот хэрэглэгч дээрэмдэхэд хэтэрхий ядуу байна.' 
        });
      }
    } else { // bank
      maxAmount = Math.min(targetBank, 1000); // Хамгийн ихдээ 1000
      if (targetBank < 100) {
        return res.json({ 
          success: false, 
          message: 'Зорилтот хэрэглэгчийн банкны үлдэгдэл хэт бага байна.' 
        });
      }
    }
    
    // Амжилтын магадлал
    const baseChance = robType === 'money' ? 0.6 : 0.4; // Мөнгө: 60%, Банк: 40%
    const toolBonusChance = hasGangTool ? 0.1 : 0; // Багаж +10%
    const successChance = baseChance + toolBonusChance;
    
    const isSuccess = Math.random() < successChance;
    
    // Түлхүүр хасах (хэрэв банкны дээрэм хийсэн бол)
    if (robType === 'bank') {
      discordClient.db.subtract(`key_${userId}`, 1);
    }
    
    if (isSuccess) {
      // Амжилттай дээрэм
      let stolenAmount = Math.floor(Math.random() * maxAmount) + 50; // 50 - maxAmount
      
      // Багажны нэмэлт (илүү их мөнгө)
      if (hasGangTool) {
        stolenAmount = Math.floor(stolenAmount * 1.2); // 20% илүү
      }
      
      // Мөнгө шилжүүлэх
      if (robType === 'money') {
        discordClient.db.subtract(`money_${targetId}`, stolenAmount);
        discordClient.db.add(`money_${userId}`, stolenAmount);
      } else {
        discordClient.db.subtract(`bank_${targetId}`, stolenAmount);
        discordClient.db.add(`money_${userId}`, stolenAmount); // Банкнаас гаргасан мөнгө бэлэн болно
      }
      
      // Cooldown тэмдэглэх
      discordClient.db.set(`rob_cd_${userId}`, now);
      
      res.json({
        success: true,
        robType: robType,
        stolen: stolenAmount,
        targetId: targetId,
        message: `✅ Амжилттай дээрэм! Та ${stolenAmount} 💰 ${robType === 'money' ? 'бэлэн мөнгө' : 'банкны мөнгө'} дээрэмдлээ!`
      });
      
    } else {
      // Амжилтгүй дээрэм
      const caught = Math.random() > 0.5; // 50% баригдах магадлал
      
      if (caught) {
        // Баригдсан - торгууль
        const fine = Math.floor(Math.random() * 200) + 50; // 50-250 торгууль
        const currentMoney = discordClient.db.fetch(`money_${userId}`) || 0;
        
        if (currentMoney >= fine) {
          discordClient.db.subtract(`money_${userId}`, fine);
        }
        
        // Cooldown 2 минут
        discordClient.db.set(`rob_cd_${userId}`, now + 60000); // +1 минут нэмэлт
        
        res.json({
          success: false,
          caught: true,
          fine: fine,
          message: `👮 Та баригдлаа! ${fine} 💰 торгууль төлөх болно.`
        });
        
      } else {
        // Амжилтгүй, зугтсан
        discordClient.db.set(`rob_cd_${userId}`, now);
        
        res.json({
          success: false,
          caught: false,
          message: `😢 Дээрэм амжилтгүй боллоо. Юу ч олсонгүй.`
        });
      }
    }
    
  } catch (error) {
    console.error('Бүлэглэлийн алдаа:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API: Боломжит зорилтуудын жагсаалт (дээрэмдэх хүмүүс)
app.get("/api/gang/targets/:userId", (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const currentUserId = req.params.userId;
  
  try {
    // Бүх хэрэглэгчдийн мэдээлэл цуглуулах
    const allData = discordClient.db.all();
    const targets = [];
    
    // Хэрэглэгчдийг шүүж авах
    const userMap = new Map();
    
    allData.forEach(item => {
      if (item.ID.startsWith('money_')) {
        const userId = item.ID.replace('money_', '');
        if (userId !== currentUserId && item.data > 0) {
          if (!userMap.has(userId)) {
            userMap.set(userId, { money: 0, bank: 0 });
          }
          userMap.get(userId).money = item.data;
        }
      } else if (item.ID.startsWith('bank_')) {
        const userId = item.ID.replace('bank_', '');
        if (userId !== currentUserId && item.data > 0) {
          if (!userMap.has(userId)) {
            userMap.set(userId, { money: 0, bank: 0 });
          }
          userMap.get(userId).bank = item.data;
        }
      }
    });
    
    // Массиваар хөрвүүлэх
    userMap.forEach((value, userId) => {
      targets.push({
        userId: userId,
        money: value.money,
        bank: value.bank,
        total: value.money + value.bank
      });
    });
    
    // Хамгийн баян 10 хүнийг харуулах
    targets.sort((a, b) => b.total - a.total);
    const topTargets = targets.slice(0, 10);
    
    res.json({
      targets: topTargets,
      currentUser: currentUserId
    });
    
  } catch (error) {
    console.error('Зорилтууд авахад алдаа:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Cooldown шалгах
app.get("/api/cooldown/:userId/:type", (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const { userId, type } = req.params;
  
  try {
    const cooldown = discordClient.db.fetch(`${type}_cd_${userId}`) || 0;
    const now = Date.now();
    let cooldownTime = 30000; // default 30 секунд
    
    // Төрөл бүрт өөр cooldown хугацаа
    if (type === 'rob') cooldownTime = 60000; // 1 минут
    else if (type === 'police') cooldownTime = 30000; // 30 секунд
    else if (type === 'doctor') cooldownTime = 25000; // 25 секунд
    else if (type === 'miner') cooldownTime = 30000; // 30 секунд
    
    if (cooldown && now - cooldown < cooldownTime) {
      const left = Math.ceil((cooldownTime - (now - cooldown)) / 1000);
      res.json({
        onCooldown: true,
        timeLeft: left
      });
    } else {
      res.json({
        onCooldown: false,
        timeLeft: 0
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// server.js - Web Routes хэсэгт нэмэх

// Edit Account хуудас
app.get("/edit-account", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'edit-account.html'));
});

// server.js - Web Routes хэсэгт нэмэх

// Profile хуудас
app.get("/profile", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// API: Хэрэглэгчийн профайл мэдээлэл
app.get("/api/profile/:userId", async (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const userId = req.params.userId;
  
  try {
    // Discord-с хэрэглэгчийн мэдээлэл авах
    let discordUser = null;
    try {
      discordUser = await discordClient.users.fetch(userId).catch(() => null);
    } catch (error) {
      console.error('Discord хэрэглэгч авахад алдаа:', error);
    }
    
    // Статистик мэдээлэл
    const userData = {
      // Discord мэдээлэл
      username: discordUser?.username || 'Unknown User',
      avatar: discordUser?.avatar || null,
      createdAt: discordUser?.createdAt || null,
      
      // Мөнгө, зоос
      money: discordClient.db.fetch(`money_${userId}`) || 0,
      bank: discordClient.db.fetch(`bank_${userId}`) || 0,
      coin: discordClient.db.fetch(`coin_${userId}`) || 0,
      
      // Ажил
      job: discordClient.db.fetch(`job_${userId}`) || 'Ажилгүй',
      working: discordClient.db.fetch(`working_${userId}`) || false,
      
      // Эрдэсүүд
      coal: discordClient.db.fetch(`coal_${userId}`) || 0,
      iron: discordClient.db.fetch(`iron_${userId}`) || 0,
      gold: discordClient.db.fetch(`gold_${userId}`) || 0,
      diamond: discordClient.db.fetch(`diamond_${userId}`) || 0,
      antimatter: discordClient.db.fetch(`antimatter_${userId}`) || 0,
      
      // Хэрэгслүүд
      tools: discordClient.db.fetch(`tool_${userId}`) || 0,
      keys: discordClient.db.fetch(`key_${userId}`) || 0,
      
      // Ажлын багажууд
      tool_miner: discordClient.db.fetch(`tool_${userId}_miner`) || false,
      tool_doctor: discordClient.db.fetch(`tool_${userId}_doctor`) || false,
      tool_police: discordClient.db.fetch(`tool_${userId}_police`) || false,
      tool_gang: discordClient.db.fetch(`tool_${userId}_gang`) || false,
      
      // Cooldown үеүүд
      cooldowns: {
        daily: discordClient.db.fetch(`daily_${userId}`) || 0,
        weekly: discordClient.db.fetch(`weekly_${userId}`) || 0,
        beg: discordClient.db.fetch(`beg_${userId}`) || 0
      }
    };
    
    // Зэрэглэл тооцоолох
    const allUsers = discordClient.db.all()
      .filter(item => item.ID.startsWith('money_'))
      .sort((a, b) => b.data - a.data);
    
    const rank = allUsers.findIndex(item => item.ID === `money_${userId}`) + 1;
    
    res.json({
      ...userData,
      rank: rank > 0 ? rank : allUsers.length + 1,
      totalUsers: allUsers.length
    });
    
  } catch (error) {
    console.error('Profile API алдаа:', error);
    res.status(500).json({ error: error.message });
  }
});



// ========== СЕРВЕР ЭХЛҮҮЛЭХ ==========
function startServer() {
  server.listen(PORT, () => {
    console.log(`🌐 Вэб сервер ажиллаж байна: http://localhost:${PORT}`);
    console.log(`🎮 Тоглоом: http://localhost:${PORT}/game`);
    console.log(`🛒 Дэлгүүр: http://localhost:${PORT}/shop`);
    console.log(`🏆 Лидерборд: http://localhost:${PORT}/leaderboard`);
    console.log(`🎒 Агуулах: http://localhost:${PORT}/inventory`);
    console.log(`🔐 Нэвтрэх: http://localhost:${PORT}/login`);
  });
}

module.exports = { startServer, setDiscordClient, io };