// lib/ecoCompat.js - ХУУЧИН ХУВИЛБАР
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.json');

function readDB() {
    try {
        if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}');
        return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch { return {}; }
}

function writeDB(data) {
    try { fs.writeFileSync(dbPath, JSON.stringify(data, null, 2)); } catch {}
}

const db = {
    fetch: (key) => readDB()[key],
    set: (key, val) => { const d = readDB(); d[key] = val; writeDB(d); return val; },
    add: (key, amt) => { const d = readDB(); d[key] = (d[key] || 0) + amt; writeDB(d); return d[key]; },
    subtract: (key, amt) => { const d = readDB(); d[key] = (d[key] || 0) - amt; writeDB(d); return d[key]; },
    delete: (key) => { const d = readDB(); delete d[key]; writeDB(d); },
    all: () => { const d = readDB(); return Object.keys(d).map(k => ({ ID: k, data: d[k] })); }
};

class Manager {
    fetchMoney(userId) { return db.fetch(`money_${userId}`) || 0; }
    addMoney(userId, amount) { return db.add(`money_${userId}`, amount); }
    subtractMoney(userId, amount) { return db.subtract(`money_${userId}`, amount); }

    beg(userId, amount, options = {}) {
        const begAmount = amount || Math.floor(Math.random() * 500) + 70;
        
        const lastBeg = db.fetch(`beg_${userId}`);
        const now = Date.now();
        const cooldownTime = 30000;

        if (lastBeg && now - lastBeg < cooldownTime) {
            const left = Math.ceil((cooldownTime - (now - lastBeg)) / 1000);
            return { onCooldown: true, time: { seconds: left } };
        }

        if (options.canLose && Math.random() < 0.3) {
            db.set(`beg_${userId}`, now);
            return { lost: true };
        }

        const before = db.fetch(`money_${userId}`) || 0;
        db.add(`money_${userId}`, begAmount);
        db.set(`beg_${userId}`, now);
        
        return { 
            amount: begAmount, 
            after: before + begAmount,
            onCooldown: false,
            lost: false 
        };
    }

    daily(userId, amount) {
        const dailyAmount = amount || Math.floor(Math.random() * 3000) + 1000;
        
        const lastDaily = db.fetch(`daily_${userId}`);
        const now = Date.now();
        const cooldownTime = 86400000;

        if (lastDaily && now - lastDaily < cooldownTime) {
            const left = cooldownTime - (now - lastDaily);
            return {
                onCooldown: true,
                time: {
                    hours: Math.floor(left / 3600000),
                    minutes: Math.floor((left % 3600000) / 60000),
                    seconds: Math.floor((left % 60000) / 1000)
                }
            };
        }

        const before = db.fetch(`money_${userId}`) || 0;
        db.add(`money_${userId}`, dailyAmount);
        db.set(`daily_${userId}`, now);
        
        return { 
            amount: dailyAmount, 
            after: before + dailyAmount,
            onCooldown: false 
        };
    }

    weekly(userId, amount) {
        const weeklyAmount = amount || Math.floor(Math.random() * 10000) + 5000;
        
        const lastWeekly = db.fetch(`weekly_${userId}`);
        const now = Date.now();
        const cooldownTime = 604800000;

        if (lastWeekly && now - lastWeekly < cooldownTime) {
            const left = cooldownTime - (now - lastWeekly);
            return {
                onCooldown: true,
                time: {
                    days: Math.floor(left / 86400000),
                    hours: Math.floor((left % 86400000) / 3600000),
                    minutes: Math.floor((left % 3600000) / 60000),
                    seconds: Math.floor((left % 60000) / 1000)
                }
            };
        }

        const before = db.fetch(`money_${userId}`) || 0;
        db.add(`money_${userId}`, weeklyAmount);
        db.set(`weekly_${userId}`, now);
        
        return { 
            amount: weeklyAmount, 
            after: before + weeklyAmount,
            onCooldown: false 
        };
    }
}

module.exports = { Manager, db };