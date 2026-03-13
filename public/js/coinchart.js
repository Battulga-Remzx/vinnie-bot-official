// public/js/coinchart.js

let coinChart = null;
let priceHistory = [];
let currentTimeRange = 24; // default 24 цаг

document.addEventListener('DOMContentLoaded', () => {
    console.log('CoinChart JS ачааллагдлаа');
    
    // Анхны өгөгдөл ачаалах
    loadCoinHistory();
    
    // Цагийн хязгаар солих товчнууд
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentTimeRange = parseInt(btn.dataset.hours);
            updateChart();
        });
    });
    
    // Socket.io event - шинэ үнэ ирэхэд график шинэчлэх
    socket.on('coinPriceUpdate', (data) => {
        if (data && data.current) {
            // Шинэ үнийг түүхэнд нэмэх
            addPricePoint(data.current, data.change);
            
            // График шинэчлэх
            updateChart();
            
            // Статистик шинэчлэх
            updateStats();
        }
    });
});

// Coin түүх ачаалах
async function loadCoinHistory() {
    try {
        // Эхлээд одоогийн үнэ авах
        const response = await fetch('/api/coinprice');
        const data = await response.json();
        
        // Түүхэн өгөгдөл үүсгэх (сүүлийн 30 хоног)
        generateHistoryData(data.current);
        
        // График зурах
        createChart();
        
        // Статистик шинэчлэх
        updateStats();
        
        // Үнийн түүх хүснэгт шинэчлэх
        updatePriceHistoryTable();
        
    } catch (error) {
        console.error('Coin түүх ачаалахад алдаа:', error);
        showNotification('❌ Өгөгдөл ачаалахад алдаа гарлаа', 'error');
    }
}

// Түүхэн өгөгдөл үүсгэх (демо өгөгдөл)
function generateHistoryData(currentPrice) {
    priceHistory = [];
    const now = Date.now();
    
    // Сүүлийн 30 хоногийн өгөгдөл (30 * 24 = 720 цэг)
    for (let i = 720; i >= 0; i--) {
        const time = now - (i * 60 * 60 * 1000); // i цагийн өмнө
        
        // Санамсаргүй хэлбэлзэлтэй үнэ үүсгэх
        let price;
        if (i === 0) {
            price = currentPrice;
        } else {
            // Өмнөх үнээс хамаарсан санамсаргүй үнэ
            const basePrice = i < priceHistory.length ? priceHistory[priceHistory.length - 1]?.price || currentPrice : currentPrice;
            const change = (Math.random() - 0.5) * 200; // -100 - +100 хэлбэлзэл
            price = Math.max(100, Math.min(1000000, basePrice + change));
        }
        
        // Өөрчлөлтийг тооцоолох
        let change = 0;
        if (i > 0 && priceHistory.length > 0) {
            change = price - priceHistory[priceHistory.length - 1].price;
        }
        
        priceHistory.push({
            time: time,
            price: Math.round(price),
            change: change
        });
    }
    
    console.log(`${priceHistory.length} үнийн цэг үүсгэлээ`);
}

// Шинэ үнийн цэг нэмэх
function addPricePoint(newPrice, change) {
    const now = Date.now();
    
    // Хамгийн сүүлийн цэгийн цаг
    const lastPoint = priceHistory[priceHistory.length - 1];
    
    // Хэрэв сүүлчийн цэгээс 1 цаг өнгөрсөн бол шинэ цэг нэмэх
    if (!lastPoint || now - lastPoint.time > 60 * 60 * 1000) {
        priceHistory.push({
            time: now,
            price: newPrice,
            change: change || 0
        });
        
        // Хэт олон цэг байвал хуучин цэгүүдийг хасах
        if (priceHistory.length > 1000) {
            priceHistory = priceHistory.slice(-1000);
        }
    } else {
        // Хамгийн сүүлийн цэгийг шинэчлэх
        lastPoint.price = newPrice;
        lastPoint.change = change || 0;
    }
    
    // График шинэчлэх
    updateChart();
    
    // Үнийн түүх хүснэгт шинэчлэх
    updatePriceHistoryTable();
}

// График үүсгэх
function createChart() {
    const ctx = document.getElementById('coinChart').getContext('2d');
    
    // Өнгө тодорхойлох
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(78, 204, 163, 0.3)');
    gradient.addColorStop(1, 'rgba(78, 204, 163, 0)');
    
    coinChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Coin үнэ (💰)',
                data: [],
                borderColor: '#4ecca3',
                backgroundColor: gradient,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: '#ffd369',
                pointHoverBorderColor: '#fff',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `💰 ${context.raw.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#aaa',
                        maxTicksLimit: 8
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#aaa',
                        callback: function(value) {
                            return value.toLocaleString() + '💰';
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
    
    updateChart();
}

// График шинэчлэх
function updateChart() {
    if (!coinChart) return;
    
    // Цагийн хязгаарт тохирох өгөгдлийг авах
    const now = Date.now();
    const startTime = now - (currentTimeRange * 60 * 60 * 1000);
    
    const filteredData = priceHistory.filter(p => p.time >= startTime);
    
    // Хэрэв өгөгдөл хэт олон бол цөөлөх
    let displayData = filteredData;
    if (filteredData.length > 100) {
        const step = Math.floor(filteredData.length / 100);
        displayData = filteredData.filter((_, i) => i % step === 0);
    }
    
    // Цагийн формат
    const labels = displayData.map(p => {
        const date = new Date(p.time);
        if (currentTimeRange <= 24) {
            return date.getHours() + ':00';
        } else {
            return date.getMonth() + 1 + '/' + date.getDate();
        }
    });
    
    const prices = displayData.map(p => p.price);
    
    coinChart.data.labels = labels;
    coinChart.data.datasets[0].data = prices;
    coinChart.update();
    
    // Одоогийн үнэ харуулах
    if (displayData.length > 0) {
        const currentPrice = displayData[displayData.length - 1].price;
        document.getElementById('currentPrice').textContent = currentPrice.toLocaleString();
        
        // Өөрчлөлт харуулах
        if (displayData.length > 1) {
            const firstPrice = displayData[0].price;
            const change = currentPrice - firstPrice;
            const changePercent = ((change / firstPrice) * 100).toFixed(2);
            
            const priceChangeEl = document.getElementById('priceChange');
            if (change >= 0) {
                priceChangeEl.className = 'price-change up';
                priceChangeEl.innerHTML = `📈 +${change.toLocaleString()} (+${changePercent}%)`;
            } else {
                priceChangeEl.className = 'price-change down';
                priceChangeEl.innerHTML = `📉 ${change.toLocaleString()} (${changePercent}%)`;
            }
        }
    }
}

// Статистик шинэчлэх
function updateStats() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const last24hData = priceHistory.filter(p => p.time >= last24h);
    
    if (last24hData.length === 0) return;
    
    const prices = last24hData.map(p => p.price);
    const high24h = Math.max(...prices);
    const low24h = Math.min(...prices);
    const average = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    
    // Хэлбэлзэл тооцоолох
    const variance = prices.reduce((acc, price) => acc + Math.pow(price - average, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance) / average * 100;
    
    document.getElementById('high24h').textContent = high24h.toLocaleString() + ' 💰';
    document.getElementById('low24h').textContent = low24h.toLocaleString() + ' 💰';
    document.getElementById('averagePrice').textContent = average.toLocaleString() + ' 💰';
    document.getElementById('volatility').textContent = volatility.toFixed(2) + '%';
}

// Үнийн түүх хүснэгт шинэчлэх
function updatePriceHistoryTable() {
    const tbody = document.getElementById('priceHistoryBody');
    if (!tbody) return;
    
    // Сүүлийн 10 үнийг харуулах
    const last10 = priceHistory.slice(-10).reverse();
    
    let html = '';
    last10.forEach((item, index) => {
        const date = new Date(item.time);
        const timeStr = date.toLocaleString('mn-MN', {
            hour: '2-digit',
            minute: '2-digit',
            month: 'numeric',
            day: 'numeric'
        });
        
        let changeHtml = '';
        if (index < last10.length - 1) {
            const change = item.price - last10[index + 1].price;
            if (change > 0) {
                changeHtml = `<span class="price-up">↑ +${change.toLocaleString()}</span>`;
            } else if (change < 0) {
                changeHtml = `<span class="price-down">↓ ${change.toLocaleString()}</span>`;
            } else {
                changeHtml = '→ 0';
            }
        }
        
        html += `
            <tr>
                <td>${timeStr}</td>
                <td>${item.price.toLocaleString()} 💰</td>
                <td>${changeHtml}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Үе үе шинэчлэх (1 минут тутамд)
setInterval(() => {
    if (window.location.pathname === '/coinchart') {
        // Санамсаргүй шинэ үнэ нэмэх (демо зорилгоор)
        if (priceHistory.length > 0) {
            const lastPrice = priceHistory[priceHistory.length - 1].price;
            const change = (Math.random() - 0.5) * 100;
            const newPrice = Math.max(100, lastPrice + change);
            
            addPricePoint(newPrice, change);
        }
    }
}, 60000); // 1 минут тутамд