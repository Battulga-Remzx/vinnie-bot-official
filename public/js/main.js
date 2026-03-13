// public/js/main.js - БҮРЭН ХУВИЛБАР (Alert функцтэй)

// Socket.io холболт
const socket = io();

// Global хувьсагч
window.currentUser = null;
window.coinPrice = 3000;

// ========== ХЭРЭГЛЭГЧИЙН МЭДЭЭЛЭЛ АВАХ ==========

// Хэрэглэгчийн мэдээлэл авах (session-ээс)
async function fetchUserInfo() {
    try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
            const user = await response.json();
            window.currentUser = user.id;
            
            // Хэрэглэгчийн мэдээллийг UI-д харуулах
            updateUserInfo(user);
            
            // Хэрэглэгчийн өгөгдлийг авах (money, bank, coin)
            fetchUserData(user.id);
            
            // Socket-д баталгаажуулах
            socket.emit('authenticate', user.id);
            
            return user;
        } else {
            console.log('Нэвтрээгүй байна');
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Хэрэглэгчийн мэдээлэл авахад алдаа:', error);
        showNotification('❌ Сервертэй холбогдоход алдаа гарлаа', 'error');
    }
}

// Хэрэглэгчийн мэдээллийг UI-д харуулах
function updateUserInfo(user) {
    const userNameEl = document.getElementById('userName');
    const userIdEl = document.getElementById('userId');
    const userAvatarEl = document.getElementById('userAvatar');
    const authSection = document.getElementById('authSection');
    const userInfo = document.getElementById('userInfo');
    
    if (userNameEl) userNameEl.textContent = user.username;
    if (userIdEl) userIdEl.textContent = user.id;
    
    // Avatar харуулах
    if (userAvatarEl) {
        if (user.avatar) {
            userAvatarEl.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
        } else {
            userAvatarEl.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
        }
    }
    
    // Нэвтрэх хэсгийг нуух
    if (authSection) authSection.style.display = 'none';
    if (userInfo) userInfo.style.display = 'flex';
}

// Хэрэглэгчийн өгөгдөл авах (money, bank, coin)
async function fetchUserData(userId) {
    try {
        const response = await fetch(`/api/user/${userId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        updateUserData(data);
        return data;
    } catch (error) {
        console.error('Хэрэглэгчийн өгөгдөл авахад алдаа:', error);
        showNotification('❌ Хэрэглэгчийн мэдээлэл авахад алдаа гарлаа', 'error');
        return null;
    }
}

// Хэрэглэгчийн өгөгдлийг шинэчлэх
function updateUserData(data) {
    const moneyEl = document.getElementById('money');
    const bankEl = document.getElementById('bank');
    const coinEl = document.getElementById('coin');
    
    if (moneyEl) moneyEl.textContent = (data.money || 0).toLocaleString();
    if (bankEl) bankEl.textContent = (data.bank || 0).toLocaleString();
    if (coinEl) coinEl.textContent = (data.coin || 0).toLocaleString();
}

// ========== ЗООСНЫ ҮНЭ ==========

// Зоосны үнэ авах
async function fetchCoinPrice() {
    try {
        const response = await fetch('/api/coinprice');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        window.coinPrice = data.current;
        
        console.log('✅ Coin price:', window.coinPrice);
        
        // Coin price харуулах
        const coinPriceEl = document.getElementById('coinPrice');
        if (coinPriceEl) {
            coinPriceEl.textContent = window.coinPrice.toLocaleString();
        }
        
        // Зоосны үнэ хамааралтай элементүүдийг шинэчлэх
        updateCoinPriceDisplay();
        
        return data;
    } catch (error) {
        console.error('❌ Зоосны үнэ авахад алдаа:', error);
        showNotification('❌ Зоосны үнэ авахад алдаа гарлаа', 'error');
        return null;
    }
}

// Зоосны үнэ харуулах элементүүдийг шинэчлэх
function updateCoinPriceDisplay() {
    // Shop хуудасны зоосны үнэ
    document.querySelectorAll('.coin-price-display').forEach(el => {
        const amount = parseInt(el.dataset.amount) || 1;
        const totalPrice = window.coinPrice * amount;
        el.textContent = totalPrice.toLocaleString();
        
        const shopItem = el.closest('.shop-item');
        if (shopItem && shopItem.dataset.type === 'coin') {
            shopItem.dataset.price = totalPrice;
        }
    });
    
    // Зарах хэсгийн зоосны үнэ
    const coinSellPrice = document.getElementById('coinSellPrice');
    if (coinSellPrice) {
        coinSellPrice.textContent = window.coinPrice.toLocaleString();
    }
}

// ========== НЭВТРЭХ/ГАРАХ ==========

// Гарах
function logout() {
    showNotification('👋 Амжилттай гарлаа', 'info');
    window.location.href = '/logout';
}

// ========== DROPDOWN МЕНЮ ==========

// Dropdown меню тохируулах
function setupUserMenu() {
    const menuBtn = document.getElementById('userMenuBtn');
    const dropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (menuBtn && dropdown) {
        // Dropdown нээх/хаах
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        
        // Гарах товч
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
        
        // Гадна дарж хаах
        document.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });
    }
}

// ========== ALERT FUNCTION ==========

// Notification alert (баруун дээд буланд)
function showNotification(message, type = 'success', duration = 3000) {
    // Хуучин notification-уудыг арилгах
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Icon сонгох
    let icon = '';
    switch(type) {
        case 'success': icon = 'fa-check-circle'; break;
        case 'error': icon = 'fa-exclamation-circle'; break;
        case 'warning': icon = 'fa-exclamation-triangle'; break;
        case 'info': icon = 'fa-info-circle'; break;
        default: icon = 'fa-bell';
    }
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Дээр нь дарж хаах
    notification.addEventListener('click', () => {
        notification.remove();
    });
    
    // Автоматаар хаах
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, duration);
}

// Modal alert (төвд цонх нээх)
function showModalAlert(options) {
    const {
        title = 'Анхаар',
        message = '',
        type = 'info',
        confirmText = 'Тийм',
        cancelText = 'Үгүй',
        showCancel = true,
        onConfirm = null,
        onCancel = null
    } = options;
    
    // Хуучин modal-уудыг арилгах
    const oldModal = document.querySelector('.modal-overlay');
    if (oldModal) oldModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    const iconMap = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    modal.innerHTML = `
        <div class="modal-alert ${type}">
            <div class="modal-icon ${type}">${iconMap[type]}</div>
            <h3 class="modal-title">${title}</h3>
            <p class="modal-message">${message}</p>
            <div class="modal-buttons">
                ${showCancel ? `<button class="modal-btn secondary" id="modalCancelBtn">${cancelText}</button>` : ''}
                <button class="modal-btn primary" id="modalConfirmBtn">${confirmText}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Confirm товч
    document.getElementById('modalConfirmBtn').addEventListener('click', () => {
        modal.remove();
        if (onConfirm) onConfirm();
    });
    
    // Cancel товч (хэрэв байгаа бол)
    if (showCancel) {
        document.getElementById('modalCancelBtn').addEventListener('click', () => {
            modal.remove();
            if (onCancel) onCancel();
        });
    }
    
    // Гадна дарж хаах
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            if (onCancel) onCancel();
        }
    });
}

// Inline alert (тодорхой элемент дотор харуулах)
function showInlineAlert(elementId, message, type = 'info', duration = 3000) {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    // Хуучин alert-уудыг арилгах
    const oldAlert = container.querySelector('.inline-alert');
    if (oldAlert) oldAlert.remove();
    
    const alert = document.createElement('div');
    alert.className = `inline-alert ${type}`;
    
    // Icon сонгох
    let icon = '';
    switch(type) {
        case 'success': icon = 'fa-check-circle'; break;
        case 'error': icon = 'fa-exclamation-circle'; break;
        case 'warning': icon = 'fa-exclamation-triangle'; break;
        case 'info': icon = 'fa-info-circle'; break;
        default: icon = 'fa-bell';
    }
    
    alert.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(alert);
    
    if (duration > 0) {
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, duration);
    }
}

// Global болгох
window.showNotification = showNotification;
window.showModalAlert = showModalAlert;
window.showInlineAlert = showInlineAlert;

// ========== ХУУДАС АЧААЛЛАХАД ==========

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Main JS ачааллагдлаа - Хуудас:', window.location.pathname);
    
    // Хэрэглэгчийн мэдээлэл авах
    await fetchUserInfo();
    
    // Зоосны үнэ авах
    await fetchCoinPrice();
    setInterval(fetchCoinPrice, 30000); // 30 секунд тутамд
    
    // Dropdown меню тохируулах
    setupUserMenu();
});

// ========== SOCKET.IO EVENT LISTENERS ==========

socket.on('coinPriceUpdate', (data) => {
    console.log('🪙 Coin price шинэчлэгдсэн:', data.current);
    if (data && data.current) {
        window.coinPrice = data.current;
        
        // Coin price харуулах
        const coinPriceEl = document.getElementById('coinPrice');
        if (coinPriceEl) {
            coinPriceEl.textContent = window.coinPrice.toLocaleString();
        }
        
        // Зоосны үнэ хамааралтай элементүүдийг шинэчлэх
        updateCoinPriceDisplay();
    }
});

socket.on('userData', (data) => {
    console.log('👤 Хэрэглэгчийн мэдээлэл шинэчлэгдсэн');
    
    // Тоглоомын хуудас дээр userData-г харуулахгүй (зоос түрүүлж шинэчлэгдэхээс сэргийлэх)
    const isGamePage = window.location.pathname === '/game';
    
    if (!isGamePage) {
        updateUserData(data);
    }
});

socket.on('gameResult', (result) => {
    console.log('🎮 Тоглоомын үр дүн:', result);
    if (result.success && result.newCoins !== undefined) {
        document.getElementById('coin').textContent = result.newCoins.toLocaleString();
    }
    if (!result.success) {
        showNotification(result.message || 'Тоглоомын үед алдаа гарлаа', 'error');
    }
});

socket.on('disconnect', () => {
    console.log('🔴 Серверээс салсан');
    showNotification('🔴 Серверээс салсан. Дахин холбогдож байна...', 'error');
});