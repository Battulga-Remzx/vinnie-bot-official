// index.js - ХУУЧИН АЖИЛЛАДАГ ХУВИЛБАР
console.clear();
require('dotenv').config();
const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMembers,
    Discord.GatewayIntentBits.GuildBans,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.DirectMessages,
    Discord.GatewayIntentBits.MessageContent,
  ],
});

const Eco = require("./lib/ecoCompat");
client.eco = new Eco.Manager();
client.db = Eco.db; // Хуучин db ашиглах
client.config = require("./botConfig");
client.emoji = require("./emoji");
client.image = require("./files/images");
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
client.cooldowns = new Discord.Collection();

// Худалдах үнэ
client.sellprice = {
  coal: 50,
  iron: 200,
  gold: 1000,
  diamond: 5000,
  antimatter: 50000
};

// Commands динамик ачаалалт
const loadCommands = (dir) => {
  if (!fs.existsSync(dir)) return;
  
  const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    try {
      const command = require(path.join(dir, file));
      if (command.help?.name) {
        client.commands.set(command.help.name.toLowerCase(), command);
        if (command.help.aliases) {
          command.help.aliases.forEach(alias => {
            client.aliases.set(alias.toLowerCase(), command.help.name.toLowerCase());
          });
        }
        console.log(`✅ Команд ачааллаа: ${command.help.name}`);
      }
    } catch (error) {
      console.error(`❌ Команд ачаалахад алдаа: ${file}`, error);
    }
  }
  
  // Дэд хавтаснуудыг ачаалах
  const subDirs = fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory());
  for (const subDir of subDirs) {
    loadCommands(path.join(dir, subDir));
  }
};

loadCommands(path.join(__dirname, 'commands'));

// Events ачаалах
const loadEvents = (dir) => {
  if (!fs.existsSync(dir)) return;
  
  const eventFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));
  
  for (const file of eventFiles) {
    try {
      const event = require(path.join(dir, file));
      const eventName = file.split('.')[0];
      client.on(eventName, (...args) => event(client, ...args));
      console.log(`✅ Event ачааллаа: ${eventName}`);
    } catch (error) {
      console.error(`❌ Event ачаалахад алдаа: ${file}`, error);
    }
  }
};

loadEvents(path.join(__dirname, 'events'));

// Автомат мэдээллийн функцууд
const { updateCoinPrice } = require('./auto/coinprice');
const { updateLeaderboard } = require('./auto/leaderboard');

client.once('ready', () => {
  console.log(`${client.user.tag} онлайн боллоо!`);
  
  // Анхны coin үнэ тогтоох
  if (!client.db.fetch('coin_lastprice')) {
    client.db.set('coin_lastprice', 3000);
  }
  
  // Автомат мэдээллийн шинэчлэлт
  updateCoinPrice(client);
  setInterval(() => {
    updateCoinPrice(client);
  }, 5 * 60 * 1000);
  
  updateLeaderboard(client);
  setInterval(() => {
    updateLeaderboard(client);
  }, 60 * 60 * 1000);
  
  console.log('✅ Автомат мэдээллийн шинэчлэлт эхэллээ');
  
  // Вэб сервер эхлүүлэх
  try {
    const { startServer, setDiscordClient } = require("./server");
    setDiscordClient(client);
    startServer();
  } catch (error) {
    console.error('Сервер эхлүүлэхэд алдаа:', error);
  }
});

client.on('error', console.error);
client.on('warn', console.warn);

client.login(client.config.token).catch(err => {
  console.error('❌ Бот нэвтрэхэд алдаа гарлаа:', err);
});