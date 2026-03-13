// public/js/main.js - Session-тэй ажиллах хувилбар

// Socket.io холболт
const socket = io();

// Хэрэглэгчийн мэдээлэл
let currentUser = null;
let coinPrice = 3000;

// Хэрэглэгчийн мэдээллийг серверээс авах
async function fetchUserInfo() {
    try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
            const data = await response.json();
            currentUser = data.id;
            updateUserName(data.username, data.id);
            
            // Socket-д мэдээлэх
            socket.emit('authenticate', data.id);
            
            // Хэрэглэгчийн өгөгдлийг авах
            fetchUserData(data.id);
            
            // Нэвтрэх хэсгийг нуух
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('userInfo').style.display = 'flex';
        }
    } catch (error) {
        console.error('Хэрэглэгчийн мэдээлэл авахад алдаа:', error);
        showNotification('❌ Нэвтрэхэд алдаа гарлаа', 'error');
    }
}

// Хэрэглэгчийн нэрийг шинэчлэх
function updateUserName(username, userId) {
    const userNameEl = document.getElementById('userName');
    const userIdEl = document.getElementById('userId');
    
    if (userNameEl) userNameEl.textContent = username;
    if (userIdEl) userIdEl.textContent = userId;
}

// Хуудас ачааллахад
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Main JS ачааллагдлаа - Хуудас:', window.location.pathname);
    
    // Хэрэглэгчийн мэдээллийг авах
    await fetchUserInfo();
    
    // Зоосны үнэ авах
    await fetchCoinPrice();
    setInterval(fetchCoinPrice, 30000);
    
    // Гарах товч (хэрэв байгаа бол)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            showNotification('👋 Амжилттай гарлаа', 'info');
            window.location.href = '/logout';
        });
    }
});

// Socket.io event listeners
socket.on('connect', () => {
    console.log('✅ Серверт холбогдлоо');
    showNotification('✅ Серверт холбогдлоо', 'success');
});

socket.on('authenticated', (user) => {
    console.log(`👤 Нэвтэрсэн: ${user.username}`);
    currentUser = user.id;
});

socket.on('coinPriceUpdate', (data) => {
    if (data && data.current) {
        coinPrice = data.current;
        updateCoinPriceDisplay();
    }
});

socket.on('userData', (data) => {
    updateUserData(data);
});

socket.on('gameResult', (result) => {
    console.log('🎮 Тоглоомын үр дүн:', result);
    if (result.success && result.newCoins !== undefined) {
        document.getElementById('coin').textContent = result.newCoins.toLocaleString();
    }
});

socket.on('disconnect', () => {
    console.log('🔴 Серверээс салсан');
    // ⚠️ ЭНД НЭМЭХ
    showNotification('🔴 Серверээс салсан. Дахин холбогдож байна...', 'error');
});