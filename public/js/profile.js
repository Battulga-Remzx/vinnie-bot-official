// public/js/profile.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('Profile JS ачааллагдлаа');
    
    // Профайл мэдээлэл ачаалах
    loadProfileData();
    
    // Refresh товч
    document.getElementById('refreshProfileBtn')?.addEventListener('click', () => {
        loadProfileData();
        showNotification('✅ Профайл шинэчлэгдсэн', 'success');
    });
    
    // Нүүр товч
    document.getElementById('backToHomeBtn')?.addEventListener('click', () => {
        window.location.href = '/';
    });
});

async function loadProfileData() {
    try {
        // Эхлээд хэрэглэгчийн ID авах
        const meResponse = await fetch('/api/user/me');
        if (!meResponse.ok) {
            showNotification('⚠️ Нэвтрээгүй байна. Нэвтрэх хуудас руу шилжиж байна...', 'warning');
            window.location.href = '/login';
            return;
        }
        
        const user = await meResponse.json();
        
        // Профайл мэдээлэл авах
        const profileResponse = await fetch(`/api/profile/${user.id}`);
        if (!profileResponse.ok) throw new Error('Profile data error');
        
        const data = await profileResponse.json();
        
        // Профайл мэдээлэл дүүргэх
        displayProfileData(data);
        
        // Sidebar-ийн мэдээллийг шинэчлэх
        updateSidebarData(data);
        
    } catch (error) {
        console.error('Профайл мэдээлэл авахад алдаа:', error);
        showNotification('❌ Профайл мэдээлэл авахад алдаа гарлаа', 'error');
    }
}

function displayProfileData(data) {
    // Үндсэн мэдээлэл
    document.getElementById('profileUsername').textContent = data.username;
    document.getElementById('profileDiscordTag').textContent = ``;
    document.getElementById('profileRank').textContent = `#${data.rank}`;
    
    // Avatar
    const avatarEl = document.getElementById('profileAvatar');
    if (data.avatar) {
        avatarEl.src = `https://cdn.discordapp.com/avatars/${data.id || window.currentUser}/${data.avatar}.png`;
    }
    
    // Санхүү
    document.getElementById('profileMoney').textContent = (data.money || 0).toLocaleString() + ' 💰';
    document.getElementById('profileBank').textContent = (data.bank || 0).toLocaleString() + ' 💰';
    document.getElementById('profileCoin').textContent = (data.coin || 0).toLocaleString() + ' 🪙';
    document.getElementById('profileJob').textContent = getJobName(data.job);
    
    // Агуулах
    document.getElementById('profileCoal').textContent = data.coal || 0;
    document.getElementById('profileIron').textContent = data.iron || 0;
    document.getElementById('profileGold').textContent = data.gold || 0;
    document.getElementById('profileDiamond').textContent = data.diamond || 0;
    document.getElementById('profileAntimatter').textContent = data.antimatter || 0;
    document.getElementById('profileTools').textContent = data.tools || 0;
    document.getElementById('profileKeys').textContent = data.keys || 0;
    
    // Ажлын багажууд
    updateToolStatus('toolMiner', data.tool_miner, '⛏️');
    updateToolStatus('toolDoctor', data.tool_doctor, '💊');
    updateToolStatus('toolPolice', data.tool_police, '👮');
    updateToolStatus('toolGang', data.tool_gang, '🔫');
}

function updateToolStatus(elementId, owned, emoji) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    if (owned) {
        el.classList.add('owned');
        el.querySelector('.tool-status').innerHTML = '✅ Эзэмшдэг';
    } else {
        el.classList.remove('owned');
        el.querySelector('.tool-status').innerHTML = '❌ Эзэмшээгүй';
    }
}

function updateSidebarData(data) {
    // Sidebar дахь мөнгө, банк, зоос шинэчлэх
    document.getElementById('money').textContent = (data.money || 0).toLocaleString();
    document.getElementById('bank').textContent = (data.bank || 0).toLocaleString();
    document.getElementById('coin').textContent = (data.coin || 0).toLocaleString();
}

function getJobName(job) {
    const jobs = {
        'police': '👮 Цагдаа',
        'doctor': '👩‍⚕️ Эмч',
        'miner': '⛏️ Уурхайчин',
        'gang': '👹 Бүлэглэл'
    };
    return jobs[job] || '💼 Ажилгүй';
}