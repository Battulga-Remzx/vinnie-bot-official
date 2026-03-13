// Лидербордын JavaScript
let currentLeaderboardType = 'money';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Leaderboard JS ачааллагдлаа');
    
    // Табууд
    const tabs = document.querySelectorAll('.lb-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const type = tab.dataset.type;
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            currentLeaderboardType = type;
            loadLeaderboard(type);
        });
    });
    
    // Эхний лидербордыг ачаалах
    loadLeaderboard('money');
});

// Лидерборд ачаалах
async function loadLeaderboard(type) {
    try {
        const response = await fetch(`/api/leaderboard/${type}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        displayLeaderboard(data, type);
        displayUserRank(data, type);
    } catch (error) {
        console.error('Лидерборд ачаалахад алдаа:', error);
        document.getElementById('leaderboardBody').innerHTML = '<tr><td colspan="3" class="loading">Ачаалахад алдаа гарлаа</td></tr>';
        showNotification('❌ Лидерборд ачаалахад алдаа гарлаа', 'error');
    }
}

// Лидерборд харуулах
function displayLeaderboard(data, type) {
    const tbody = document.getElementById('leaderboardBody');
    if (!tbody) return;
    
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="loading">Мэдээлэл байхгүй</td></tr>';
        return;
    }
    
    const medals = ['🥇', '🥈', '🥉'];
    const typeSymbol = {
        money: '💰',
        bank: '🏦',
        coin: '🪙',
        diamond: '💎'
    }[type] || '⭐';
    
    let html = '';
    
    data.forEach((item, index) => {
        const rank = index + 1;
        const medal = index < 3 ? medals[index] : `${rank}.`;
        const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
        
        html += `
            <tr class="${rankClass}">
                <td><span class="rank-medal">${medal}</span></td>
                <td>${item.username || 'Unknown User'}</td>
                <td>${item.amount.toLocaleString()} ${typeSymbol}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Хэрэглэгчийн байрлал харуулах
function displayUserRank(data, type) {
    const userRankDiv = document.getElementById('userRank');
    if (!userRankDiv || !currentUser) return;
    
    const userIndex = data.findIndex(item => item.userId === currentUser);
    const typeSymbol = {
        money: '💰',
        bank: '🏦',
        coin: '🪙',
        diamond: '💎'
    }[type] || '⭐';
    
    if (userIndex !== -1) {
        const userData = data[userIndex];
        userRankDiv.innerHTML = `
            <h3>📍 Таны байрлал</h3>
            <p>
                <span class="rank-number">#${userIndex + 1}</span> 
                - ${userData.amount.toLocaleString()} ${typeSymbol}
            </p>
        `;
    } else {
        userRankDiv.innerHTML = `
            <h3>📍 Таны байрлал</h3>
            <p>Топ 10-д ороогүй байна</p>
        `;
    }
}