// public/js/server-check.js
// Хэрэглэгч Discord серверт нэгдсэн эсэхийг шалгах

async function checkServerAndAuth() {
    try {
        // 1. Нэвтрэлт шалгах
        const authResponse = await fetch('/api/user/me', {
            credentials: 'include'
        });
        
        if (authResponse.status === 401) {
            console.log('❌ Нэвтрээгүй байна');
            window.location.href = '/login';
            return false;
        }
        
        if (!authResponse.ok) {
            throw new Error('Хэрэглэгчийн мэдээлэл авахад алдаа');
        }
        
        const user = await authResponse.json();
        console.log('✅ Нэвтэрсэн хэрэглэгч:', user.username);
        
        // Global хувьсагчид хадгалах
        window.currentUser = user.id;
        window.userInfo = user;
        
        // Хэрэглэгчийн мэдээллийг UI-д харуулах
        updateUserInfoInUI(user);
        
        // 2. Серверт нэгдсэн эсэхийг шалгах
        const serverResponse = await fetch('/api/user/server-status', {
            credentials: 'include'
        });
        const serverData = await serverResponse.json();
        
        console.log('🟢 Сервер шалгалт:', serverData);
        
        if (serverData.isInServer === true) {
            // Серверт байна - хэвийн харуулах
            console.log('✅ Хэрэглэгч серверт байна');
            showUserContent();
            return true;
        } else {
            // Серверт байхгүй - join-server хуудас руу чиглүүлэх
            console.log('❌ Хэрэглэгч серверт байхгүй');
            const currentPath = window.location.pathname;
            window.location.href = `/join-server?returnTo=${encodeURIComponent(currentPath)}`;
            return false;
        }
        
    } catch (error) {
        console.error('❌ Шалгалтын алдаа:', error);
        window.location.href = '/login';
        return false;
    }
}

// UI-д хэрэглэгчийн мэдээллийг харуулах
function updateUserInfoInUI(user) {
    // Хэрэглэгчийн нэр
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = user.username;
    
    // Хэрэглэгчийн ID
    const userIdEl = document.getElementById('userId');
    if (userIdEl) userIdEl.textContent = user.id;
    
    // Avatar
    const userAvatarEl = document.getElementById('userAvatar');
    if (userAvatarEl) {
        if (user.avatar) {
            userAvatarEl.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
        } else {
            userAvatarEl.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
        }
    }
}

// Хэрэглэгчийн контентыг харуулах (нэвтрэх хэсгийг нуух)
function showUserContent() {
    const authSection = document.getElementById('authSection');
    const userInfo = document.getElementById('userInfo');
    
    if (authSection) authSection.style.display = 'none';
    if (userInfo) userInfo.style.display = 'flex';
}

// Хуудас ачаалахад автоматаар шалгах
document.addEventListener('DOMContentLoaded', () => {
    // Хэрэв аль хэдийн join-server хуудас дээр байвал шалгахгүй
    if (window.location.pathname === '/join-server') {
        return;
    }
    checkServerAndAuth();
});