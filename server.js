// server.js - БҮРЭН ХУВИЛБАР (ЗӨВХӨН НЭВТРЭЛТЭЭР ХЯЗГААРЛАСАН)

const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;

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
  return done(null, profile);
}));

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
}

// ========== НЭВТРЭЛТ ШАЛГАХ ==========
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

// ========== НЭВТРЭХ ЗААВАР ==========
app.get("/login", (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get("/auth/discord", passport.authenticate("discord"));

app.get("/auth/discord/callback", 
  passport.authenticate("discord", { 
    failureRedirect: "/login?error=auth_failed" 
  }),
  (req, res) => {
    res.redirect("/");
  }
);

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) console.error(err);
    res.redirect("/login");
  });
});

// ========== API: Хэрэглэгчийн мэдээлэл ==========
app.get("/api/user/me", (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
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

app.get("/profile", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get("/edit-account", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'edit-account.html'));
});

app.get("/status", (req, res) => {
  res.json({
    status: "online",
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// server.js - ХЭРЭГЛЭГЧ СЕРВЕРТ БАЙГАА ЭСЭХИЙГ ШАЛГАХ ХУВИЛБАР

// ... өмнөх коднууд ...

// ========== DISCORD СЕРВЕР ШАЛГАХ API ==========

// Хэрэглэгч Discord серверт нэгдсэн эсэхийг шалгах API
app.get("/api/user/server-status", isAuthenticated, async (req, res) => {
  if (!discordClient) {
    return res.json({ 
      isInServer: false,
      inviteLink: process.env.DISCORD_INVITE_LINK || "https://discord.gg/YOUR_INVITE",
      error: "Discord client бэлэн биш"
    });
  }
  
  const userId = req.user.id;
  const guildId = process.env.DISCORD_GUILD_ID;
  
  if (!guildId) {
    return res.json({
      isInServer: false,
      inviteLink: process.env.DISCORD_INVITE_LINK || "https://discord.gg/YOUR_INVITE",
      error: "GUILD_ID тохируулаагүй байна"
    });
  }
  
  try {
    const guild = await discordClient.guilds.fetch(guildId);
    
    if (!guild) {
      return res.json({
        isInServer: false,
        inviteLink: process.env.DISCORD_INVITE_LINK || "https://discord.gg/YOUR_INVITE",
        error: "Сервер олдсонгүй"
      });
    }
    
    let isInServer = false;
    try {
      const member = await guild.members.fetch(userId);
      isInServer = !!member;
      console.log(`👤 Хэрэглэгч ${userId} серверт ${isInServer ? 'БАЙНА' : 'БАЙХГҮЙ'}`);
    } catch (memberError) {
      isInServer = false;
    }
    
    res.json({
      isInServer: isInServer,
      inviteLink: process.env.DISCORD_INVITE_LINK || `https://discord.gg/invite/${guild.id}`,
      guildName: guild.name,
      userId: userId
    });
    
  } catch (error) {
    console.error("❌ Сервер шалгах алдаа:", error);
    res.json({
      isInServer: false,
      inviteLink: process.env.DISCORD_INVITE_LINK || "https://discord.gg/YOUR_INVITE",
      error: error.message
    });
  }
});

// Серверт нэгдсэн эсэхийг шалгах middleware
async function checkServerMembership(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  
  if (!discordClient) {
    console.log('⚠️ Discord client бэлэн биш, сервер шалгалтыг алгасаж байна');
    return next();
  }
  
  const userId = req.user.id;
  const guildId = process.env.DISCORD_GUILD_ID;
  
  if (!guildId) {
    console.log('⚠️ GUILD_ID тохируулаагүй, сервер шалгалтыг алгасаж байна');
    return next();
  }
  
  try {
    const guild = await discordClient.guilds.fetch(guildId);
    
    if (!guild) {
      return next();
    }
    
    let isInServer = false;
    try {
      const member = await guild.members.fetch(userId);
      isInServer = !!member;
    } catch (error) {
      isInServer = false;
    }
    
    if (!isInServer) {
      const returnTo = req.originalUrl;
      console.log(`🔴 Хэрэглэгч ${userId} серверт байхгүй, join-server руу чиглүүлж байна`);
      return res.redirect(`/join-server?returnTo=${encodeURIComponent(returnTo)}`);
    }
    
    console.log(`🟢 Хэрэглэгч ${userId} серверт байна`);
    next();
    
  } catch (error) {
    console.error("❌ Сервер шалгах middleware алдаа:", error);
    next();
  }
}

// ========== ВЭБ ХУУДАСНУУД ==========

// join-server хуудас
app.get("/join-server", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  res.sendFile(path.join(__dirname, 'public', 'join-server.html'));
});

// Үндсэн хуудас - серверт нэгдсэн эсэхийг шалгах
app.get("/", isAuthenticated, checkServerMembership, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/game", isAuthenticated, checkServerMembership, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

app.get("/shop", isAuthenticated, checkServerMembership, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shop.html'));
});

app.get("/leaderboard", isAuthenticated, checkServerMembership, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'leaderboard.html'));
});

app.get("/inventory", isAuthenticated, checkServerMembership, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'inventory.html'));
});

app.get("/coinchart", isAuthenticated, checkServerMembership, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'coinchart.html'));
});

app.get("/profile", isAuthenticated, checkServerMembership, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get("/edit-account", isAuthenticated, checkServerMembership, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'edit-account.html'));
});

// ... бусад API-ууд ...

// ========== API: Хэрэглэгчийн тоглоомын мэдээлэл ==========
app.get("/api/user/:userId", (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const userId = req.params.userId;
  
  try {
    const job = discordClient.db.fetch(`job_${userId}`);
    
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
      job: job,
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

// ========== API: Зоосны үнэ ==========
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

// ========== API: Тоглоомын үр дүн ==========
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

// ========== API: Дэлгүүрээс худалдан авах ==========
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
    
    discordClient.db.subtract(`money_${userId}`, price);
    
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

// ========== API: Дэлгүүрт зарах ==========
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

// ========== API: Лидерборд ==========
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

// ========== API: Уурхайчин тоглох ==========
app.post("/api/mine", (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const { userId } = req.body;
  
  try {
    const job = discordClient.db.fetch(`job_${userId}`);
    const working = discordClient.db.fetch(`working_${userId}`);
    
    if (!working || job !== 'miner') {
      return res.json({ 
        success: false, 
        message: 'Та уурхайчны ажилд ороогүй байна!' 
      });
    }
    
    const cooldown = discordClient.db.fetch(`miner_cd_${userId}`);
    const now = Date.now();
    const cooldownTime = 30000;
    
    if (cooldown && now - cooldown < cooldownTime) {
      const left = Math.ceil((cooldownTime - (now - cooldown)) / 1000);
      return res.json({ 
        success: false, 
        cooldown: true,
        timeLeft: left,
        message: `⏱️ Дараагийн олборлолт хийхэд ${left} секунд үлдлээ.`
      });
    }
    
    const items = [
      { name: 'Нүүрс', emoji: '⬛', value: 'coal', min: 1, max: 5, chance: 50 },
      { name: 'Төмөр', emoji: '⛓️', value: 'iron', min: 1, max: 3, chance: 25 },
      { name: 'Алт', emoji: '🪙', value: 'gold', min: 1, max: 2, chance: 15 },
      { name: 'Алмааз', emoji: '💎', value: 'diamond', min: 1, max: 1, chance: 8 },
      { name: 'Антиматтер', emoji: '⚛️', value: 'antimatter', min: 1, max: 1, chance: 2 }
    ];
    
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
    const current = discordClient.db.fetch(`${foundItem.value}_${userId}`) || 0;
    
    discordClient.db.add(`${foundItem.value}_${userId}`, amount);
    discordClient.db.set(`miner_cd_${userId}`, now);
    
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

// ========== API: Цагдаагийн тоглоом ==========
app.post("/api/police/patrol", (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const { userId } = req.body;
  
  try {
    const job = discordClient.db.fetch(`job_${userId}`);
    const working = discordClient.db.fetch(`working_${userId}`);
    
    if (!working || job !== 'police') {
      return res.json({ 
        success: false, 
        message: 'Та цагдаагийн ажилд ороогүй байна!' 
      });
    }
    
    const cooldown = discordClient.db.fetch(`police_cd_${userId}`);
    const now = Date.now();
    const cooldownTime = 30000;
    
    if (cooldown && now - cooldown < cooldownTime) {
      const left = Math.ceil((cooldownTime - (now - cooldown)) / 1000);
      return res.json({ 
        success: false, 
        cooldown: true,
        timeLeft: left,
        message: `⏱️ Дараагийн эргүүл хийхэд ${left} секунд үлдлээ.`
      });
    }
    
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
    const bonus = Math.floor(Math.random() * 200) + 50;
    
    let toolBonus = 0;
    const hasTool = discordClient.db.fetch(`tool_${userId}_police`);
    if (hasTool) {
      toolBonus = Math.floor((event.reward + bonus) * 0.1);
    }
    
    const total = event.reward + bonus + toolBonus;
    
    discordClient.db.add(`money_${userId}`, total);
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

// ========== API: Эмчийн тоглоом ==========
app.post("/api/doctor/heal", (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const { userId } = req.body;
  
  try {
    const job = discordClient.db.fetch(`job_${userId}`);
    const working = discordClient.db.fetch(`working_${userId}`);
    
    if (!working || job !== 'doctor') {
      return res.json({ 
        success: false, 
        message: 'Та эмчийн ажилд ороогүй байна!' 
      });
    }
    
    const cooldown = discordClient.db.fetch(`doctor_cd_${userId}`);
    const now = Date.now();
    const cooldownTime = 25000;
    
    if (cooldown && now - cooldown < cooldownTime) {
      const left = Math.ceil((cooldownTime - (now - cooldown)) / 1000);
      return res.json({ 
        success: false, 
        cooldown: true,
        timeLeft: left,
        message: `⏱️ Дараагийн эмчлэлт хийхэд ${left} секунд үлдлээ.`
      });
    }
    
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
    const tip = Math.floor(Math.random() * 300) + 30;
    
    let toolBonus = 0;
    const hasTool = discordClient.db.fetch(`tool_${userId}_doctor`);
    if (hasTool) {
      toolBonus = Math.floor((patient.reward + tip) * 0.1);
    }
    
    const total = patient.reward + tip + toolBonus;
    
    discordClient.db.add(`money_${userId}`, total);
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

// ========== API: Бүлэглэлийн тоглоом ==========
app.post("/api/gang/rob", (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const { userId, targetId, robType } = req.body;
  
  try {
    const job = discordClient.db.fetch(`job_${userId}`);
    const working = discordClient.db.fetch(`working_${userId}`);
    
    if (!working || job !== 'gang') {
      return res.json({ 
        success: false, 
        message: 'Та бүлэглэлийн ажилд ороогүй байна!' 
      });
    }
    
    const cooldown = discordClient.db.fetch(`rob_cd_${userId}`);
    const now = Date.now();
    const cooldownTime = 60000;
    
    if (cooldown && now - cooldown < cooldownTime) {
      const left = Math.ceil((cooldownTime - (now - cooldown)) / 1000);
      return res.json({ 
        success: false, 
        cooldown: true,
        timeLeft: left,
        message: `⏱️ Дараагийн дээрэм хийхэд ${left} секунд үлдлээ.`
      });
    }
    
    const hasGangTool = discordClient.db.fetch(`tool_${userId}_gang`) || false;
    
    if (robType === 'bank') {
      const keys = discordClient.db.fetch(`key_${userId}`) || 0;
      if (keys < 1) {
        return res.json({ 
          success: false, 
          message: 'Банкны дээрэм хийхэд түлхүүр шаардлагатай. Дэлгүүрээс худалдаж аваарай!',
          needKey: true
        });
      }
    }
    
    const targetMoney = discordClient.db.fetch(`money_${targetId}`) || 0;
    const targetBank = discordClient.db.fetch(`bank_${targetId}`) || 0;
    
    let maxAmount = 0;
    if (robType === 'money') {
      maxAmount = Math.min(targetMoney, 500);
      if (targetMoney < 50) {
        return res.json({ 
          success: false, 
          message: 'Зорилтот хэрэглэгч дээрэмдэхэд хэтэрхий ядуу байна.' 
        });
      }
    } else {
      maxAmount = Math.min(targetBank, 1000);
      if (targetBank < 100) {
        return res.json({ 
          success: false, 
          message: 'Зорилтот хэрэглэгчийн банкны үлдэгдэл хэт бага байна.' 
        });
      }
    }
    
    const baseChance = robType === 'money' ? 0.6 : 0.4;
    const toolBonusChance = hasGangTool ? 0.1 : 0;
    const successChance = baseChance + toolBonusChance;
    
    const isSuccess = Math.random() < successChance;
    
    if (robType === 'bank') {
      discordClient.db.subtract(`key_${userId}`, 1);
    }
    
    if (isSuccess) {
      let stolenAmount = Math.floor(Math.random() * maxAmount) + 50;
      
      if (hasGangTool) {
        stolenAmount = Math.floor(stolenAmount * 1.2);
      }
      
      if (robType === 'money') {
        discordClient.db.subtract(`money_${targetId}`, stolenAmount);
        discordClient.db.add(`money_${userId}`, stolenAmount);
      } else {
        discordClient.db.subtract(`bank_${targetId}`, stolenAmount);
        discordClient.db.add(`money_${userId}`, stolenAmount);
      }
      
      discordClient.db.set(`rob_cd_${userId}`, now);
      
      res.json({
        success: true,
        robType: robType,
        stolen: stolenAmount,
        targetId: targetId,
        message: `✅ Амжилттай дээрэм! Та ${stolenAmount} 💰 ${robType === 'money' ? 'бэлэн мөнгө' : 'банкны мөнгө'} дээрэмдлээ!`
      });
      
    } else {
      const caught = Math.random() > 0.5;
      
      if (caught) {
        const fine = Math.floor(Math.random() * 200) + 50;
        const currentMoney = discordClient.db.fetch(`money_${userId}`) || 0;
        
        if (currentMoney >= fine) {
          discordClient.db.subtract(`money_${userId}`, fine);
        }
        
        discordClient.db.set(`rob_cd_${userId}`, now + 60000);
        
        res.json({
          success: false,
          caught: true,
          fine: fine,
          message: `👮 Та баригдлаа! ${fine} 💰 торгууль төлөх болно.`
        });
        
      } else {
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

// ========== API: Бүлэглэлийн зорилтууд ==========
app.get("/api/gang/targets/:userId", (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const currentUserId = req.params.userId;
  
  try {
    const allData = discordClient.db.all();
    const targets = [];
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
    
    userMap.forEach((value, userId) => {
      targets.push({
        userId: userId,
        money: value.money,
        bank: value.bank,
        total: value.money + value.bank
      });
    });
    
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

// ========== API: Cooldown шалгах ==========
app.get("/api/cooldown/:userId/:type", (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const { userId, type } = req.params;
  
  try {
    const cooldown = discordClient.db.fetch(`${type}_cd_${userId}`) || 0;
    const now = Date.now();
    let cooldownTime = 30000;
    
    if (type === 'rob') cooldownTime = 60000;
    else if (type === 'police') cooldownTime = 30000;
    else if (type === 'doctor') cooldownTime = 25000;
    else if (type === 'miner') cooldownTime = 30000;
    
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

// ========== API: Хэрэглэгчийн профайл ==========
app.get("/api/profile/:userId", async (req, res) => {
  if (!discordClient) {
    return res.status(503).json({ error: "Discord client бэлэн биш" });
  }
  
  const userId = req.params.userId;
  
  try {
    let discordUser = null;
    try {
      discordUser = await discordClient.users.fetch(userId).catch(() => null);
    } catch (error) {
      console.error('Discord хэрэглэгч авахад алдаа:', error);
    }
    
    const userData = {
      username: discordUser?.username || 'Unknown User',
      avatar: discordUser?.avatar || null,
      createdAt: discordUser?.createdAt || null,
      money: discordClient.db.fetch(`money_${userId}`) || 0,
      bank: discordClient.db.fetch(`bank_${userId}`) || 0,
      coin: discordClient.db.fetch(`coin_${userId}`) || 0,
      job: discordClient.db.fetch(`job_${userId}`) || 'Ажилгүй',
      working: discordClient.db.fetch(`working_${userId}`) || false,
      coal: discordClient.db.fetch(`coal_${userId}`) || 0,
      iron: discordClient.db.fetch(`iron_${userId}`) || 0,
      gold: discordClient.db.fetch(`gold_${userId}`) || 0,
      diamond: discordClient.db.fetch(`diamond_${userId}`) || 0,
      antimatter: discordClient.db.fetch(`antimatter_${userId}`) || 0,
      tools: discordClient.db.fetch(`tool_${userId}`) || 0,
      keys: discordClient.db.fetch(`key_${userId}`) || 0,
      tool_miner: discordClient.db.fetch(`tool_${userId}_miner`) || false,
      tool_doctor: discordClient.db.fetch(`tool_${userId}_doctor`) || false,
      tool_police: discordClient.db.fetch(`tool_${userId}_police`) || false,
      tool_gang: discordClient.db.fetch(`tool_${userId}_gang`) || false,
      cooldowns: {
        daily: discordClient.db.fetch(`daily_${userId}`) || 0,
        weekly: discordClient.db.fetch(`weekly_${userId}`) || 0,
        beg: discordClient.db.fetch(`beg_${userId}`) || 0
      }
    };
    
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

// ========== SOCKET.IO ==========
io.use((socket, next) => {
  const session = socket.request.session;
  if (session && session.passport && session.passport.user) {
    socket.user = session.passport.user;
  }
  next();
});

io.on('connection', (socket) => {
  if (socket.user) {
    socket.emit('authenticated', socket.user);
  }
  
  socket.on('authenticate', (userId) => {
    socket.userId = userId;
    
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
});

// Рулет функц
function playRoulette(userId, bet, betType, betNumber, discordClient) {
  try {
    discordClient.db.subtract(`coin_${userId}`, bet);
    
    const casinoTax = Math.floor(bet * 0.05);
    discordClient.db.add(`casino_balance`, casinoTax);
    
    const winningNumber = Math.floor(Math.random() * 37);
    const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(winningNumber);
    
    let win = false;
    let multiplier = 0;
    let winAmount = 0;
    
    const betSize = bet;
    let difficultyMultiplier = 1;
    
    if (betSize > 500) {
      difficultyMultiplier = 0.7;
    } else if (betSize > 200) {
      difficultyMultiplier = 0.85;
    } else if (betSize > 100) {
      difficultyMultiplier = 0.95;
    }
    
    if (betType === 'red' && isRed) {
      const redChance = 0.45 * difficultyMultiplier;
      if (Math.random() < redChance) {
        win = true;
        multiplier = 1.8;
      }
    } else if (betType === 'black' && !isRed && winningNumber !== 0) {
      const blackChance = 0.45 * difficultyMultiplier;
      if (Math.random() < blackChance) {
        win = true;
        multiplier = 1.8;
      }
    } else if (betType === 'even' && winningNumber !== 0 && winningNumber % 2 === 0) {
      const evenChance = 0.45 * difficultyMultiplier;
      if (Math.random() < evenChance) {
        win = true;
        multiplier = 1.8;
      }
    } else if (betType === 'odd' && winningNumber % 2 === 1) {
      const oddChance = 0.45 * difficultyMultiplier;
      if (Math.random() < oddChance) {
        win = true;
        multiplier = 1.8;
      }
    } else if (betType === 'number' && betNumber === winningNumber) {
      const numberChance = (1/37) * difficultyMultiplier * 0.8;
      if (Math.random() < numberChance) {
        win = true;
        multiplier = 30;
      }
    }
    
    if (win) {
      let rawWinAmount = Math.floor(bet * multiplier);
      const winTax = Math.floor(rawWinAmount * 0.03);
      winAmount = rawWinAmount - winTax;
      discordClient.db.add(`coin_${userId}`, winAmount);
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
      message: win ? `🎉 ХОЖЛОО! +${winAmount} 🪙 (${multiplier}x)` : `😢 ХОЖИГДЛОО -${bet} 🪙`
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