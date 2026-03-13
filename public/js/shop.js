// public/js/shop.js - Бүрэн хувилбар

document.addEventListener('DOMContentLoaded', () => {
    console.log('Shop JS ачааллагдлаа');
    
    // Хэрэв coinPrice тодорхойлогдоогүй бол default утга
    if (typeof window.coinPrice === 'undefined') {
        window.coinPrice = 3000;
    }
    
    // Хуудас ачааллахад coin үнэ шинэчлэх
    setTimeout(() => {
        if (typeof window.updateCoinPriceDisplay === 'function') {
            window.updateCoinPriceDisplay();
        }
    }, 100);
    
    // Категори товчнууд
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.category-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`category-${category}`).classList.add('active');
        });
    });
    
    // Худалдан авах товчнууд
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!window.currentUser) {
                showNotification('❌ Эхлээд нэвтэрнэ үү!', 'error');
                return;
            }
            
            const item = e.target.closest('.shop-item');
            const type = item.dataset.type;
            const key = item.dataset.key;
            const role = item.dataset.role;
            const amount = parseInt(item.dataset.amount) || 1;
            const itemName = item.dataset.name || 'зүйл';
            
            // Үнийг тодорхойлох
            let price;
            if (type === 'coin') {
                price = window.coinPrice * amount;
            } else {
                price = parseInt(item.dataset.price);
            }
            
            // Мөнгө шалгах
            const moneyEl = document.getElementById('money');
            const currentMoney = parseInt(moneyEl.textContent.replace(/,/g, ''));
            
            if (currentMoney < price) {
                showNotification(`❌ Мөнгө хүрэлцэхгүй! Хэрэгтэй: ${price.toLocaleString()} 💰`, 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/shop/buy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: window.currentUser,
                        type: type,
                        key: key,
                        role: role,
                        amount: amount,
                        price: price
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Мөнгө шинэчлэх
                    moneyEl.textContent = data.newMoney.toLocaleString();
                    
                    // Төрлөөр нь тохирох элементүүдийг шинэчлэх
                    if (type === 'coin') {
                        const coinEl = document.getElementById('coin');
                        if (coinEl) {
                            const currentCoin = parseInt(coinEl.textContent.replace(/,/g, '')) || 0;
                            coinEl.textContent = (currentCoin + amount).toLocaleString();
                        }
                    } else if (type === 'tool') {
                        showNotification(`✅ ${itemName} амжилттай худалдан авлаа!`, 'success');
                    } else if (type === 'item') {
                        if (key === 'tool' || key === 'key') {
                            // Багаж/түлхүүр худалдаж авсан бол агуулахын тоо нэмэгдэнэ
                            // Энэ нь дараагийн агуулах ачааллахад харагдана
                        }
                        showNotification(`✅ ${itemName} амжилттай худалдан авлаа!`, 'success');
                    } else if (type === 'resource') {
                        showNotification(`✅ ${amount} ${itemName} амжилттай худалдан авлаа!`, 'success');
                    } else if (type === 'special') {
                        showNotification(`✅ ${itemName} идэвхжлээ!`, 'success');
                    }
                } else {
                    showNotification(data.message || 'Худалдан авахад алдаа гарлаа', 'error');
                }
            } catch (error) {
                console.error('Худалдан авах алдаа:', error);
                showNotification('Сервертэй холбогдоход алдаа гарлаа', 'error');
            }
        });
    });
    
    // Зарах товчнууд
    setupSellButtons();
});

// Зарах товчнуудыг тохируулах
function setupSellButtons() {
    // Зоос зарах
    document.getElementById('sellCoinBtn')?.addEventListener('click', async () => {
        await sellCoin();
    });
    
    // Нүүрс зарах
    document.getElementById('sellCoalBtn')?.addEventListener('click', async () => {
        await sellResource('coal', 50);
    });
    
    // Төмөр зарах
    document.getElementById('sellIronBtn')?.addEventListener('click', async () => {
        await sellResource('iron', 200);
    });
    
    // Алт зарах
    document.getElementById('sellGoldBtn')?.addEventListener('click', async () => {
        await sellResource('gold', 1000);
    });
    
    // Алмааз зарах
    document.getElementById('sellDiamondBtn')?.addEventListener('click', async () => {
        await sellResource('diamond', 5000);
    });
    
    // Антиматтер зарах
    document.getElementById('sellAntimatterBtn')?.addEventListener('click', async () => {
        await sellResource('antimatter', 50000);
    });
    
    // Enter товч дээр зарах
    const sellInputs = ['coin', 'coal', 'iron', 'gold', 'diamond', 'antimatter'];
    sellInputs.forEach(type => {
        const input = document.getElementById(`sell${type.charAt(0).toUpperCase() + type.slice(1)}Amount`);
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    if (type === 'coin') {
                        sellCoin();
                    } else {
                        const prices = {
                            coal: 50,
                            iron: 200,
                            gold: 1000,
                            diamond: 5000,
                            antimatter: 50000
                        };
                        sellResource(type, prices[type]);
                    }
                }
            });
        }
    });
}

// Зоос зарах функц
async function sellCoin() {
    if (!window.currentUser) {
        showNotification('❌ Эхлээд нэвтэрнэ үү!', 'error');
        return;
    }
    
    const input = document.getElementById('sellCoinAmount');
    const amount = parseInt(input.value);
    
    if (!amount || amount <= 0) {
        showNotification('❌ Зөв тоо оруулна уу!', 'error');
        return;
    }
    
    const price = window.coinPrice;
    const totalPrice = amount * price;
    
    // Зоосны тоо шалгах
    const coinEl = document.getElementById('coin');
    const currentCoin = parseInt(coinEl.textContent.replace(/,/g, '')) || 0;
    
    if (currentCoin < amount) {
        showNotification(`❌ Танд ${amount} зоос байхгүй!`, 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/shop/sell', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: window.currentUser,
                type: 'coin',
                amount: amount,
                price: price,
                totalPrice: totalPrice
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Мөнгө шинэчлэх
            document.getElementById('money').textContent = data.newMoney.toLocaleString();
            
            // Зоосны тоо шинэчлэх
            coinEl.textContent = (data.newAmount || 0).toLocaleString();
            
            input.value = '';
            showNotification(`✅ ${amount} зоос зарагдлаа! +${totalPrice.toLocaleString()} 💰`, 'success');
        } else {
            showNotification(data.message || 'Зарахад алдаа гарлаа', 'error');
        }
    } catch (error) {
        console.error('Зарах алдаа:', error);
        showNotification('Сервертэй холбогдоход алдаа гарлаа', 'error');
    }
}

// Эрдэс зарах функц
async function sellResource(type, pricePerUnit) {
    if (!window.currentUser) {
        showNotification('❌ Эхлээд нэвтэрнэ үү!', 'error');
        return;
    }
    
    const input = document.getElementById(`sell${type.charAt(0).toUpperCase() + type.slice(1)}Amount`);
    const amount = parseInt(input.value);
    
    if (!amount || amount <= 0) {
        showNotification('❌ Зөв тоо оруулна уу!', 'error');
        return;
    }
    
    const totalPrice = amount * pricePerUnit;
    
    try {
        const response = await fetch('/api/shop/sell', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: window.currentUser,
                type: type,
                amount: amount,
                price: pricePerUnit,
                totalPrice: totalPrice
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Мөнгө шинэчлэх
            document.getElementById('money').textContent = data.newMoney.toLocaleString();
            
            input.value = '';
            
            // Эрдэсийн нэрийг монголоор харуулах
            const resourceNames = {
                coal: 'Нүүрс',
                iron: 'Төмөр',
                gold: 'Алт',
                diamond: 'Алмааз',
                antimatter: 'Антиматтер'
            };
            
            showNotification(`✅ ${amount} ${resourceNames[type]} зарагдлаа! +${totalPrice.toLocaleString()} 💰`, 'success');
            
            // Хэрэв inventory хуудас руу шилжих боломжтой бол мэдэгдэх
            if (window.location.pathname === '/inventory') {
                setTimeout(() => {
                    location.reload();
                }, 1500);
            }
        } else {
            showNotification(data.message || 'Зарахад алдаа гарлаа', 'error');
        }
    } catch (error) {
        console.error('Зарах алдаа:', error);
        showNotification('Сервертэй холбогдоход алдаа гарлаа', 'error');
    }
}