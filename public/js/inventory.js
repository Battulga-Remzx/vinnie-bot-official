// public/js/inventory.js - Бүрэн хувилбар

document.addEventListener('DOMContentLoaded', () => {
    console.log('Inventory JS ачааллагдлаа');
    
    // Хэрэв хэрэглэгч нэвтэрсэн бол агуулах ачаалах
    if (window.currentUser) {
        loadInventory();
    } else {
        // Хэрэглэгч нэвтрээгүй бол хүлээгээд дахин шалгах
        const checkUser = setInterval(() => {
            if (window.currentUser) {
                clearInterval(checkUser);
                loadInventory();
            }
        }, 500);
    }
    
    // Категори товчнууд
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            filterInventory(category);
        });
    });
    
    // Түргэн зарах товчнууд
    setupQuickSellButtons();
});

// Агуулах ачаалах
async function loadInventory() {
    try {
        const response = await fetch(`/api/user/${window.currentUser}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        console.log('Агуулахын мэдээлэл:', data);
        
        displayInventory(data);
        updateTotalStats(data);
    } catch (error) {
        console.error('Агуулах ачаалахад алдаа:', error);
        document.getElementById('inventoryGrid').innerHTML = '<div class="empty-inventory"><i class="fas fa-exclamation-triangle"></i>Агуулах ачаалахад алдаа гарлаа</div>';
        showNotification('❌ Агуулах ачаалахад алдаа гарлаа', 'error');
    }
}

// Агуулах харуулах
function displayInventory(data) {
    const grid = document.getElementById('inventoryGrid');
    if (!grid) return;
    
    // Боломжтой бүх зүйлс
    const items = [
        // Эрдэсүүд
        { name: 'Нүүрс', emoji: '⬛', key: 'coal', value: 50, category: 'resources' },
        { name: 'Төмөр', emoji: '⛓️', key: 'iron', value: 200, category: 'resources' },
        { name: 'Алт', emoji: '🪙', key: 'gold', value: 1000, category: 'resources' },
        { name: 'Алмааз', emoji: '💎', key: 'diamond', value: 5000, category: 'resources' },
        { name: 'Антиматтер', emoji: '⚛️', key: 'antimatter', value: 50000, category: 'resources' },
        
        // Хэрэгслүүд
        { name: 'Багаж', emoji: '🔧', key: 'tools', value: 0, category: 'tools' },
        { name: 'Түлхүүр', emoji: '🔑', key: 'keys', value: 0, category: 'tools' },
        
        // Ажлын багажууд (тусгай шалгалт)
        { name: 'Уурхайн хүрз', emoji: '⛏️', key: 'tool_miner', value: 0, category: 'tools', special: true },
        { name: 'Эмчийн хэрэгсэл', emoji: '💊', key: 'tool_doctor', value: 0, category: 'tools', special: true },
        { name: 'Цагдаагийн тэмдэг', emoji: '👮', key: 'tool_police', value: 0, category: 'tools', special: true },
        { name: 'Бүлэглэлийн зэвсэг', emoji: '🔫', key: 'tool_gang', value: 0, category: 'tools', special: true },
        
        // Тусгай зүйлс
        { name: 'Аз жаргалын билет', emoji: '🎫', key: 'lottery', value: 0, category: 'special', special: true },
        { name: 'Давхар ашиг', emoji: '✨', key: 'boost', value: 0, category: 'special', special: true },
        { name: 'VIP карт', emoji: '💳', key: 'vip', value: 0, category: 'special', special: true }
    ];
    
    let html = '';
    let hasItems = false;
    
    items.forEach(item => {
        let amount = 0;
        
        if (item.special) {
            // Тусгай зүйлс (boolean утгатай)
            if (item.key.startsWith('tool_')) {
                // Ажлын багажууд
                const toolValue = data[item.key] || false;
                amount = toolValue ? 1 : 0;
            } else if (item.key === 'lottery' || item.key === 'boost' || item.key === 'vip') {
                // Тусгай зүйлс
                const specialValue = data[item.key] || false;
                amount = specialValue ? 1 : 0;
            }
        } else {
            // Энгийн зүйлс (тоон утгатай)
            amount = data[item.key] || 0;
        }
        
        if (amount > 0) {
            hasItems = true;
            const totalValue = item.value * amount;
            
            html += `
                <div class="inventory-item" data-category="${item.category}">
                    <div class="item-icon">${item.emoji}</div>
                    <div class="item-details">
                        <div class="item-name">${item.name}</div>
                        <div class="item-amount">${amount.toLocaleString()} ширхэг</div>
                        ${item.value > 0 ? `<div class="item-value">💰 ${totalValue.toLocaleString()}</div>` : ''}
                    </div>
                </div>
            `;
        }
    });
    
    // Ажлын багажуудыг тусдаа шалгах (tool_${userId}_${role} форматаар)
    const toolRoles = ['miner', 'doctor', 'police', 'gang'];
    toolRoles.forEach(role => {
        const toolKey = `tool_${window.currentUser}_${role}`;
        // Энэ нь серверээс ирэхгүй тул бид шууд шалгах боломжгүй
        // Тиймээс энэ хэсгийг түр орхиж болно
    });
    
    if (!hasItems) {
        html = '<div class="empty-inventory"><i class="fas fa-box-open"></i>Агуулах хоосон байна</div>';
    }
    
    grid.innerHTML = html;
}

// Нийт статистик шинэчлэх
function updateTotalStats(data) {
    const items = [
        { key: 'coal', value: 50 },
        { key: 'iron', value: 200 },
        { key: 'gold', value: 1000 },
        { key: 'diamond', value: 5000 },
        { key: 'antimatter', value: 50000 }
    ];
    
    let totalItems = 0;
    let totalValue = 0;
    
    items.forEach(item => {
        const amount = data[item.key] || 0;
        totalItems += amount;
        totalValue += amount * item.value;
    });
    
    // Багаж, түлхүүр нэмэх
    totalItems += (data.tools || 0) + (data.keys || 0);
    
    const totalItemsEl = document.getElementById('totalItems');
    const totalValueEl = document.getElementById('totalValue');
    
    if (totalItemsEl) totalItemsEl.textContent = totalItems.toLocaleString();
    if (totalValueEl) totalValueEl.textContent = totalValue.toLocaleString() + ' 💰';
}

// Агуулах шүүх
function filterInventory(category) {
    const items = document.querySelectorAll('.inventory-item');
    
    items.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Түргэн зарах товчнууд
function setupQuickSellButtons() {
    const quickSellBtns = document.querySelectorAll('.quick-sell-btn');
    
    quickSellBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!window.currentUser) {
                showNotification('❌ Эхлээд нэвтэрнэ үү!', 'error');
                return;
            }
            
            const resource = btn.dataset.resource;
            const prices = {
                coal: 50,
                iron: 200,
                gold: 1000,
                diamond: 5000,
                antimatter: 50000
            };
            
            // Эхлээд тухайн эрдэсийн тоо авах
            try {
                const response = await fetch(`/api/user/${window.currentUser}`);
                const userData = await response.json();
                
                const amount = userData[resource] || 0;
                
                if (amount === 0) {
                    showNotification('⚠️ Зарах зүйл байхгүй байна', 'warning');
                    return;
                }
                
                const totalPrice = amount * prices[resource];
                
                // Бүгдийг нь зараx
                const sellResponse = await fetch('/api/shop/sell', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: window.currentUser,
                        type: resource,
                        amount: amount,
                        price: prices[resource],
                        totalPrice: totalPrice
                    })
                });
                
                const data = await sellResponse.json();
                
                if (data.success) {
                    // Мөнгө шинэчлэх
                    document.getElementById('money').textContent = data.newMoney.toLocaleString();
                    
                    // Агуулахыг дахин ачаалах
                    await loadInventory();
                    
                    const resourceNames = {
                        coal: 'Нүүрс',
                        iron: 'Төмөр',
                        gold: 'Алт',
                        diamond: 'Алмааз',
                        antimatter: 'Антиматтер'
                    };
                    
                    showNotification(`✅ ${amount} ${resourceNames[resource]} зарагдлаа! +${totalPrice.toLocaleString()} 💰`, 'success');
                } else {
                    showNotification(data.message || 'Зарахад алдаа гарлаа', 'error');
                }
            } catch (error) {
                console.error('Зарах алдаа:', error);
                showNotification('Сервертэй холбогдоход алдаа гарлаа', 'error');
            }
        });
    });
}

// Агуулахыг үе үе шинэчлэх (хэрэглэгч нэвтэрсэн бол)
setInterval(() => {
    if (window.currentUser && window.location.pathname === '/inventory') {
        loadInventory();
    }
}, 10000); // 10 секунд тутамд