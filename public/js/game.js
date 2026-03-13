// public/js/game.js - Coin price шинэчлэх код нэмэх

// Тоглоомын хувьсагч
let currentGame = 'slots';
let selectedBet = 'red';
let selectedNumber = 7;
let mineCooldown = false;
let policeCooldown = false;
let doctorCooldown = false;

// Хэрэглэгчийн ажил
let currentUserJob = null;

// Roulette анимэйшн хувьсагч
let rouletteAnimationInterval = null;
let rouletteResult = null;
let rouletteAnimationCount = 0;
const ROULETTE_ANIMATION_DURATION = 4000; // 4 секунд

// Слот анимэйшн хувьсагч
let slotsAnimationInterval = null;
let slotsResult = null;
const SLOTS_ANIMATION_DURATION = 3000; // 3 секунд

// Cooldown интервалууд
let mineCooldownInterval = null;
let policeCooldownInterval = null;
let doctorCooldownInterval = null;

// ==================== ХУУДАС АЧААЛЛАХАД ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Game JS ачааллагдлаа - Хуудас:', window.location.pathname);
    
    // ✅ Coin price шинэчлэх (ЭХНИЙ АЛХАМ)
    updateCoinPrice();
    
    // Табууд
    setupTabs();
    
    // Roulette bet options
    setupRouletteOptions();
    
    // Тоглоомын товчнууд
    setupGameButtons();
    
    // Хэрэглэгч нэвтэрсэн эсэхийг шалгаад ажлыг ачаалах
    setTimeout(() => {
        if (window.currentUser) {
            checkUserJob();
            checkAllCooldowns();
        }
    }, 500);
});

// ==================== COIN PRICE ====================

// ✅ Coin price шинэчлэх функц
function updateCoinPrice() {
    const coinPriceEl = document.getElementById('coinPrice');
    
    if (!coinPriceEl) {
        console.log('❌ coinPrice element олдсонгүй');
        return;
    }
    
    // window.coinPrice байгаа эсэхийг шалгах
    if (window.coinPrice) {
        coinPriceEl.textContent = window.coinPrice.toLocaleString();
        console.log('💰 Coin price шинэчлэгдсэн:', window.coinPrice.toLocaleString());
    } else {
        console.log('⚠️ window.coinPrice байхгүй, default 3000 ашиглаж байна');
        coinPriceEl.textContent = '3000';
        
        // main.js ачааллахад түр хүлээгээд дахин оролдох
        setTimeout(() => {
            if (window.coinPrice) {
                coinPriceEl.textContent = window.coinPrice.toLocaleString();
                console.log('💰 Хоёр дахь оролдлого амжилттай');
            } else {
                // Серверээс шууд авах
                fetchCoinPriceFromServer();
            }
        }, 1000);
    }
}

// ✅ Серверээс coin price авах
async function fetchCoinPriceFromServer() {
    try {
        const response = await fetch('/api/coinprice');
        const data = await response.json();
        
        if (data && data.current) {
            window.coinPrice = data.current;
            const coinPriceEl = document.getElementById('coinPrice');
            if (coinPriceEl) {
                coinPriceEl.textContent = window.coinPrice.toLocaleString();
                console.log('✅ Серверээс coin price авав:', window.coinPrice);
            }
        }
    } catch (error) {
        console.error('❌ Серверээс coin price авахад алдаа:', error);
    }
}

// ==================== TAB SETUP ====================
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tab).classList.add('active');
            
            // Ажлын тоглоомын таб дээр дарахад ажлыг шалгах
            if (tab === 'jobs') {
                if (window.currentUser) {
                    checkUserJob();
                } else {
                    showNotification('Эхлээд нэвтэрнэ үү!', 'error');
                }
            }
        });
    });
}

// ==================== ROULETTE SETUP ====================
function setupRouletteOptions() {
    document.querySelectorAll('[data-bet]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectedBet = e.target.dataset.bet;
            
            document.querySelectorAll('[data-bet]').forEach(b => {
                b.style.transform = 'scale(1)';
                b.style.boxShadow = 'none';
            });
            
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 0 15px currentColor';
        });
    });
    
    const betNumberInput = document.getElementById('betNumber');
    if (betNumberInput) {
        betNumberInput.addEventListener('change', (e) => {
            selectedNumber = parseInt(e.target.value) || 7;
            if (selectedNumber < 0) selectedNumber = 0;
            if (selectedNumber > 36) selectedNumber = 36;
            e.target.value = selectedNumber;
        });
    }
}

// ==================== GAME BUTTONS ====================
function setupGameButtons() {
    // Слот машин
    const spinBtn = document.getElementById('spinBtn');
    if (spinBtn) spinBtn.addEventListener('click', playSlots);
    
    // Рулетка
    const rouletteSpinBtn = document.getElementById('rouletteSpinBtn');
    if (rouletteSpinBtn) rouletteSpinBtn.addEventListener('click', playRoulette);
    
    // Уурхайчин
    const mineBtn = document.getElementById('mineBtn');
    if (mineBtn) mineBtn.addEventListener('click', playMine);
    
    // Цагдаа
    const patrolBtn = document.getElementById('patrolBtn');
    if (patrolBtn) patrolBtn.addEventListener('click', playPolice);
    
    // Эмч
    const healBtn = document.getElementById('healBtn');
    if (healBtn) healBtn.addEventListener('click', playDoctor);
}

// ==================== АЖЛЫН ТОГЛООМ ====================

// Хэрэглэгчийн ажлыг шалгах
async function checkUserJob() {
    if (!window.currentUser) return;
    
    try {
        const response = await fetch(`/api/user/${window.currentUser}`);
        const data = await response.json();
        
        currentUserJob = data.job || null;
        console.log('Таны ажил:', currentUserJob);
        
        updateJobDisplay();
        loadJobData();
        
    } catch (error) {
        console.error('Ажил шалгахад алдаа:', error);
        showNotification('Ажлын мэдээлэл авахад алдаа гарлаа', 'error');
    }
}

// Ажлын дэлгэц шинэчлэх
function updateJobDisplay() {
    const jobCheck = document.getElementById('jobCheck');
    if (!jobCheck) return;
    
    const jobIcons = {
        'miner': '⛏️',
        'police': '👮',
        'doctor': '👩‍⚕️',
        'gang': '👹'
    };
    
    const jobNames = {
        'miner': 'Уурхайчин',
        'police': 'Цагдаа',
        'doctor': 'Эмч',
        'gang': 'Бүлэглэл'
    };
    
    const jobDescriptions = {
        'miner': 'Газраас эрдэс бодис олборлож, зарж мөнгө олох',
        'police': 'Хотын аюулгүй байдлыг хангаж, эргүүл хийж цалин авах',
        'doctor': 'Өвчтөн эмчилж, мөнгө олох',
        'gang': 'Бусдыг дээрэмдэж, мөнгө олох'
    };
    
    if (currentUserJob && jobIcons[currentUserJob]) {
        // Зөв ажлыг харуулах
        document.getElementById('currentJobDisplay').innerHTML = `
            <span class="job-icon">${jobIcons[currentUserJob]}</span>
            <span class="job-name">${jobNames[currentUserJob]}</span>
        `;
        document.getElementById('jobDescription').textContent = jobDescriptions[currentUserJob];
        
        // Зөвхөн өөрийн ажлын тоглоомыг харуулах
        showJobGame(currentUserJob);
    } else {
        // Ажилгүй бол ажилгүй хэсгийг харуулах
        showJobGame('none');
    }
}

// Ажлын тоглоом харуулах
function showJobGame(job) {
    // Бүх ажлын тоглоомыг нуух
    document.querySelectorAll('.job-game').forEach(game => {
        game.classList.remove('active');
    });
    
    if (job === 'miner') {
        document.getElementById('minerGame').classList.add('active');
        loadMinerData();
    } else if (job === 'police') {
        document.getElementById('policeGame').classList.add('active');
        loadPoliceData();
    } else if (job === 'doctor') {
        document.getElementById('doctorGame').classList.add('active');
        loadDoctorData();
    } else if (job === 'gang') {
        document.getElementById('gangGame').classList.add('active');
        loadGangData();
    } else {
        document.getElementById('noJobGame').classList.add('active');
    }
}

// Ажлын өгөгдөл ачаалах
async function loadJobData() {
    if (!window.currentUser) return;
    
    try {
        const response = await fetch(`/api/user/${window.currentUser}`);
        const data = await response.json();
        
        // Ажлаас хамаарч өгөгдөл шинэчлэх
        if (currentUserJob === 'miner') {
            document.getElementById('coalCount').textContent = data.coal || 0;
            document.getElementById('ironCount').textContent = data.iron || 0;
            document.getElementById('goldCount').textContent = data.gold || 0;
            document.getElementById('diamondCount').textContent = data.diamond || 0;
            document.getElementById('antimatterCount').textContent = data.antimatter || 0;
        }
    } catch (error) {
        console.error('Ажлын өгөгдөл ачаалахад алдаа:', error);
    }
}

// Бүх cooldown-уудыг шалгах
async function checkAllCooldowns() {
    if (!window.currentUser) return;
    
    try {
        // Уурхайчин cooldown
        const mineResponse = await fetch(`/api/cooldown/${window.currentUser}/miner`);
        const mineData = await mineResponse.json();
        if (mineData.onCooldown) {
            startMineCooldown(mineData.timeLeft);
        }
        
        // Цагдаа cooldown
        const policeResponse = await fetch(`/api/cooldown/${window.currentUser}/police`);
        const policeData = await policeResponse.json();
        if (policeData.onCooldown) {
            startPoliceCooldown(policeData.timeLeft);
        }
        
        // Эмч cooldown
        const doctorResponse = await fetch(`/api/cooldown/${window.currentUser}/doctor`);
        const doctorData = await doctorResponse.json();
        if (doctorData.onCooldown) {
            startDoctorCooldown(doctorData.timeLeft);
        }
        
    } catch (error) {
        console.error('Cooldown шалгахад алдаа:', error);
    }
}

// ==================== ROULETTE ====================

// Рулет тоглох
async function playRoulette() {
    if (!window.currentUser) {
        showNotification('❌ Эхлээд нэвтэрнэ үү!', 'error');
        return;
    }
    
    const bet = parseInt(document.getElementById('rouletteBet').value);
    const currentCoins = parseInt(document.getElementById('coin').textContent.replace(/,/g, ''));
    
    if (isNaN(bet) || bet <= 0) {
        showNotification('❌ Зөв бооцооны дүн оруулна уу!', 'error');
        return;
    }
    
    if (bet > currentCoins) {
        showNotification(`❌ Хангалттай зоос байхгүй! Одоогийн зоос: ${currentCoins} 🪙`, 'error');
        return;
    }
    
    // Товчийг идэвхгүй болгох
    const spinBtn = document.getElementById('rouletteSpinBtn');
    spinBtn.disabled = true;
    spinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Эргүүлж байна...';
    
    // Өмнөх анимэйшн цуцлах
    if (rouletteAnimationInterval) {
        clearInterval(rouletteAnimationInterval);
        rouletteAnimationInterval = null;
    }
    
    // Үр дүнг цэвэрлэх
    rouletteResult = null;
    
    // Анимэйшн эхлүүлэх
    let count = 0;
    const maxCount = 40; // 4 секунд
    
    rouletteAnimationInterval = setInterval(() => {
        const number = Math.floor(Math.random() * 37);
        const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(number);
        
        document.getElementById('rouletteNumber').textContent = number;
        document.getElementById('rouletteColor').textContent = number === 0 ? '🟢' : (isRed ? '🔴' : '⚫');
        
        count++;
        
        // Анимэйшн дуусгах
        if (count >= maxCount) {
            clearInterval(rouletteAnimationInterval);
            rouletteAnimationInterval = null;
            
            // Үр дүнг харуулах (хэрэв байгаа бол)
            if (rouletteResult) {
                showRouletteResult();
            } else {
                // Үр дүн ирээгүй бол хүлээх
                setTimeout(() => {
                    if (rouletteResult) {
                        showRouletteResult();
                    } else {
                        // Алдаа
                        spinBtn.disabled = false;
                        spinBtn.innerHTML = '<i class="fas fa-sync-alt"></i> ЭРГҮҮЛЭХ';
                        showNotification('❌ Тоглоомын үр дүн ирэхгүй байна', 'error');
                    }
                }, 1000);
            }
        }
    }, 100);
    
    // Сервер рүү хүсэлт илгээх
    socket.emit('playGame', {
        game: 'roulette',
        bet: bet,
        betType: selectedBet,
        betNumber: selectedNumber
    });
}

// Рулет үр дүн харуулах
function showRouletteResult() {
    if (!rouletteResult) return;
    
    // Бодит үр дүнг харуулах
    document.getElementById('rouletteNumber').textContent = rouletteResult.number;
    document.getElementById('rouletteColor').textContent = rouletteResult.color;
    
    const resultEl = document.getElementById('rouletteResult');
    resultEl.textContent = rouletteResult.message;
    resultEl.className = `result-area ${rouletteResult.win ? 'success' : 'error'}`;
    
    // Зоосны үлдэгдлийг шинэчлэх
    if (rouletteResult.newCoins !== undefined) {
        document.getElementById('coin').textContent = rouletteResult.newCoins.toLocaleString();
    }
    
    // Товчийг идэвхжүүлэх
    const spinBtn = document.getElementById('rouletteSpinBtn');
    spinBtn.disabled = false;
    spinBtn.innerHTML = '<i class="fas fa-sync-alt"></i> ЭРГҮҮЛЭХ';
    
    // 3 секундын дараа үр дүнг арилгах
    setTimeout(() => {
        document.getElementById('rouletteResult').textContent = '';
        document.getElementById('rouletteResult').className = 'result-area';
    }, 3000);
}

// ==================== SLOTS ====================

// Слот тоглох
async function playSlots() {
    if (!window.currentUser) {
        showNotification('❌ Эхлээд нэвтэрнэ үү!', 'error');
        return;
    }
    
    const bet = parseInt(document.getElementById('slotBet').value);
    const currentCoins = parseInt(document.getElementById('coin').textContent.replace(/,/g, ''));
    
    if (isNaN(bet) || bet <= 0) {
        showNotification('❌ Зөв бооцооны дүн оруулна уу!', 'error');
        return;
    }
    
    if (bet > currentCoins) {
        showNotification(`❌ Хангалттай зоос байхгүй! Одоогийн зоос: ${currentCoins} 🪙`, 'error');
        return;
    }
    
    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = true;
    spinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Эргүүлж байна...';
    
    // Өмнөх анимэйшн цуцлах
    if (slotsAnimationInterval) {
        clearInterval(slotsAnimationInterval);
        slotsAnimationInterval = null;
    }
    
    // Үр дүнг цэвэрлэх
    slotsResult = null;
    
    // Анимэйшн эхлүүлэх
    let count = 0;
    const symbols = ['🍋', '🍒', '🍇', '🍉', '7️⃣', '💎', '💰', '🎰'];
    const steps = 30; // 3 секунд
    
    slotsAnimationInterval = setInterval(() => {
        document.getElementById('slot1').textContent = symbols[Math.floor(Math.random() * symbols.length)];
        document.getElementById('slot2').textContent = symbols[Math.floor(Math.random() * symbols.length)];
        document.getElementById('slot3').textContent = symbols[Math.floor(Math.random() * symbols.length)];
        
        count++;
        
        if (count >= steps) {
            clearInterval(slotsAnimationInterval);
            slotsAnimationInterval = null;
            
            if (slotsResult) {
                showSlotsResult();
            } else {
                setTimeout(() => {
                    if (slotsResult) {
                        showSlotsResult();
                    } else {
                        spinBtn.disabled = false;
                        spinBtn.innerHTML = '<i class="fas fa-sync-alt"></i> ЭРГҮҮЛЭХ';
                        showNotification('❌ Тоглоомын үр дүн ирэхгүй байна', 'error');
                    }
                }, 1000);
            }
        }
    }, 100);
    
    socket.emit('playGame', {
        game: 'slots',
        bet: bet
    });
}

// Слот үр дүн харуулах
function showSlotsResult() {
    if (!slotsResult) return;
    
    document.getElementById('slot1').textContent = slotsResult.slots[0];
    document.getElementById('slot2').textContent = slotsResult.slots[1];
    document.getElementById('slot3').textContent = slotsResult.slots[2];
    
    const resultEl = document.getElementById('slotResult');
    resultEl.textContent = slotsResult.message;
    resultEl.className = `result-area ${slotsResult.win ? 'success' : 'error'}`;
    
    if (slotsResult.newCoins !== undefined) {
        document.getElementById('coin').textContent = slotsResult.newCoins.toLocaleString();
    }
    
    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = false;
    spinBtn.innerHTML = '<i class="fas fa-sync-alt"></i> ЭРГҮҮЛЭХ';
    
    setTimeout(() => {
        document.getElementById('slotResult').textContent = '';
        document.getElementById('slotResult').className = 'result-area';
    }, 3000);
}

// ==================== MINER ====================

// Уурхайчин тоглох
async function playMine() {
    if (!window.currentUser) {
        showNotification('❌ Эхлээд нэвтэрнэ үү!', 'error');
        return;
    }
    
    if (mineCooldown) {
        showNotification('⏱️ Та хүлээх хугацаанд байна!', 'error');
        return;
    }
    
    const mineBtn = document.getElementById('mineBtn');
    mineBtn.disabled = true;
    mineBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Олборлож байна...';
    
    try {
        const response = await fetch('/api/mine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: window.currentUser
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('mineResult').textContent = data.message;
            document.getElementById('mineResult').className = 'result-area success';
            
            // Эрдэсүүдийг шинэчлэх
            await loadMinerData();
            
            // 30 секунд cooldown
            startMineCooldown(30);
            
        } else if (data.cooldown) {
            showNotification(data.message, 'error');
            startMineCooldown(data.timeLeft);
            
        } else {
            showNotification(data.message || 'Олборлоход алдаа гарлаа', 'error');
            mineBtn.disabled = false;
            mineBtn.innerHTML = '<i class="fas fa-hammer"></i> ОЛБОРЛОХ';
        }
        
    } catch (error) {
        console.error('Олборлолт хийхэд алдаа:', error);
        showNotification('Сервертэй холбогдоход алдаа гарлаа', 'error');
        mineBtn.disabled = false;
        mineBtn.innerHTML = '<i class="fas fa-hammer"></i> ОЛБОРЛОХ';
    }
    
    setTimeout(() => {
        document.getElementById('mineResult').textContent = '';
        document.getElementById('mineResult').className = 'result-area';
    }, 3000);
}

// Уурхайчны өгөгдөл ачаалах
async function loadMinerData() {
    if (!window.currentUser) return;
    
    try {
        const response = await fetch(`/api/user/${window.currentUser}`);
        const data = await response.json();
        
        document.getElementById('coalCount').textContent = data.coal || 0;
        document.getElementById('ironCount').textContent = data.iron || 0;
        document.getElementById('goldCount').textContent = data.gold || 0;
        document.getElementById('diamondCount').textContent = data.diamond || 0;
        document.getElementById('antimatterCount').textContent = data.antimatter || 0;
    } catch (error) {
        console.error('Уурхайчны өгөгдөл ачаалахад алдаа:', error);
    }
}

// Уурхайчин cooldown эхлүүлэх
function startMineCooldown(seconds) {
    const mineBtn = document.getElementById('mineBtn');
    const cooldownEl = document.getElementById('mineCooldown');
    
    mineCooldown = true;
    mineBtn.disabled = true;
    
    let timeLeft = seconds;
    cooldownEl.textContent = `⏱️ ${timeLeft} секунд`;
    
    if (mineCooldownInterval) {
        clearInterval(mineCooldownInterval);
    }
    
    mineCooldownInterval = setInterval(() => {
        timeLeft--;
        cooldownEl.textContent = `⏱️ ${timeLeft} секунд`;
        
        if (timeLeft <= 0) {
            clearInterval(mineCooldownInterval);
            mineCooldownInterval = null;
            mineCooldown = false;
            cooldownEl.textContent = '';
            mineBtn.disabled = false;
            mineBtn.innerHTML = '<i class="fas fa-hammer"></i> ОЛБОРЛОХ';
        }
    }, 1000);
}

// ==================== POLICE ====================

// Цагдаа тоглох
async function playPolice() {
    if (!window.currentUser) {
        showNotification('❌ Эхлээд нэвтэрнэ үү!', 'error');
        return;
    }
    
    if (policeCooldown) {
        showNotification('⏱️ Та хүлээх хугацаанд байна!', 'error');
        return;
    }
    
    const patrolBtn = document.getElementById('patrolBtn');
    patrolBtn.disabled = true;
    patrolBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Эргүүл хийж байна...';
    
    try {
        const response = await fetch('/api/police/patrol', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: window.currentUser
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('policeResult').textContent = data.message;
            document.getElementById('policeResult').className = 'result-area success';
            
            // Мөнгө шинэчлэх
            await updateUserMoney();
            
            // 30 секунд cooldown
            startPoliceCooldown(30);
            
            // Статистик шинэчлэх
            const patrolCount = document.getElementById('patrolCount');
            if (patrolCount) {
                patrolCount.textContent = parseInt(patrolCount.textContent) + 1;
            }
            const totalEarned = document.getElementById('totalEarned');
            if (totalEarned) {
                totalEarned.textContent = (parseInt(totalEarned.textContent) + data.total).toLocaleString();
            }
            
        } else if (data.cooldown) {
            showNotification(data.message, 'error');
            startPoliceCooldown(data.timeLeft);
            
        } else {
            showNotification(data.message || 'Эргүүл хийхэд алдаа гарлаа', 'error');
            patrolBtn.disabled = false;
            patrolBtn.innerHTML = '<i class="fas fa-shield-alt"></i> ЭРГҮҮЛ ХИЙХ';
        }
        
    } catch (error) {
        console.error('Цагдаа тоглоход алдаа:', error);
        showNotification('Сервертэй холбогдоход алдаа гарлаа', 'error');
        patrolBtn.disabled = false;
        patrolBtn.innerHTML = '<i class="fas fa-shield-alt"></i> ЭРГҮҮЛ ХИЙХ';
    }
    
    setTimeout(() => {
        document.getElementById('policeResult').textContent = '';
        document.getElementById('policeResult').className = 'result-area';
    }, 3000);
}

// Цагдаагийн өгөгдөл ачаалах
async function loadPoliceData() {
    if (!window.currentUser) return;
    
    try {
        const response = await fetch(`/api/user/${window.currentUser}`);
        const data = await response.json();
        
        // Цагдаагийн статистик тооцоолох (энгийн хувьд)
        document.getElementById('patrolCount').textContent = '0';
        document.getElementById('totalEarned').textContent = '0';
    } catch (error) {
        console.error('Цагдаагийн өгөгдөл ачаалахад алдаа:', error);
    }
}

// Цагдаа cooldown эхлүүлэх
function startPoliceCooldown(seconds) {
    const patrolBtn = document.getElementById('patrolBtn');
    const cooldownEl = document.getElementById('policeCooldown');
    
    policeCooldown = true;
    patrolBtn.disabled = true;
    
    let timeLeft = seconds;
    cooldownEl.textContent = `⏱️ ${timeLeft} секунд`;
    
    if (policeCooldownInterval) {
        clearInterval(policeCooldownInterval);
    }
    
    policeCooldownInterval = setInterval(() => {
        timeLeft--;
        cooldownEl.textContent = `⏱️ ${timeLeft} секунд`;
        
        if (timeLeft <= 0) {
            clearInterval(policeCooldownInterval);
            policeCooldownInterval = null;
            policeCooldown = false;
            cooldownEl.textContent = '';
            patrolBtn.disabled = false;
            patrolBtn.innerHTML = '<i class="fas fa-shield-alt"></i> ЭРГҮҮЛ ХИЙХ';
        }
    }, 1000);
}

// ==================== DOCTOR ====================

// Эмч тоглох
async function playDoctor() {
    if (!window.currentUser) {
        showNotification('❌ Эхлээд нэвтэрнэ үү!', 'error');
        return;
    }
    
    if (doctorCooldown) {
        showNotification('⏱️ Та хүлээх хугацаанд байна!', 'error');
        return;
    }
    
    const healBtn = document.getElementById('healBtn');
    healBtn.disabled = true;
    healBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Эмчилж байна...';
    
    try {
        const response = await fetch('/api/doctor/heal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: window.currentUser
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('doctorResult').textContent = data.message;
            document.getElementById('doctorResult').className = 'result-area success';
            
            // Мөнгө шинэчлэх
            await updateUserMoney();
            
            // 25 секунд cooldown
            startDoctorCooldown(25);
            
            // Статистик шинэчлэх
            const patientCount = document.getElementById('patientCount');
            if (patientCount) {
                patientCount.textContent = parseInt(patientCount.textContent) + 1;
            }
            const totalTips = document.getElementById('totalTips');
            if (totalTips) {
                totalTips.textContent = (parseInt(totalTips.textContent) + data.total).toLocaleString();
            }
            
        } else if (data.cooldown) {
            showNotification(data.message, 'error');
            startDoctorCooldown(data.timeLeft);
            
        } else {
            showNotification(data.message || 'Эмчилгээ хийхэд алдаа гарлаа', 'error');
            healBtn.disabled = false;
            healBtn.innerHTML = '<i class="fas fa-heartbeat"></i> ЭМЧИЛЭХ';
        }
        
    } catch (error) {
        console.error('Эмч тоглоход алдаа:', error);
        showNotification('Сервертэй холбогдоход алдаа гарлаа', 'error');
        healBtn.disabled = false;
        healBtn.innerHTML = '<i class="fas fa-heartbeat"></i> ЭМЧИЛЭХ';
    }
    
    setTimeout(() => {
        document.getElementById('doctorResult').textContent = '';
        document.getElementById('doctorResult').className = 'result-area';
    }, 3000);
}

// Эмчийн өгөгдөл ачаалах
async function loadDoctorData() {
    if (!window.currentUser) return;
    
    try {
        const response = await fetch(`/api/user/${window.currentUser}`);
        const data = await response.json();
        
        // Эмчийн статистик тооцоолох
        document.getElementById('patientCount').textContent = '0';
        document.getElementById('totalTips').textContent = '0';
    } catch (error) {
        console.error('Эмчийн өгөгдөл ачаалахад алдаа:', error);
    }
}

// Эмч cooldown эхлүүлэх
function startDoctorCooldown(seconds) {
    const healBtn = document.getElementById('healBtn');
    const cooldownEl = document.getElementById('doctorCooldown');
    
    doctorCooldown = true;
    healBtn.disabled = true;
    
    let timeLeft = seconds;
    cooldownEl.textContent = `⏱️ ${timeLeft} секунд`;
    
    if (doctorCooldownInterval) {
        clearInterval(doctorCooldownInterval);
    }
    
    doctorCooldownInterval = setInterval(() => {
        timeLeft--;
        cooldownEl.textContent = `⏱️ ${timeLeft} секунд`;
        
        if (timeLeft <= 0) {
            clearInterval(doctorCooldownInterval);
            doctorCooldownInterval = null;
            doctorCooldown = false;
            cooldownEl.textContent = '';
            healBtn.disabled = false;
            healBtn.innerHTML = '<i class="fas fa-heartbeat"></i> ЭМЧИЛЭХ';
        }
    }, 1000);
}

// ==================== GANG ====================

// Бүлэглэлийн өгөгдөл ачаалах
async function loadGangData() {
    if (!window.currentUser) return;
    
    try {
        const response = await fetch(`/api/user/${window.currentUser}`);
        const data = await response.json();
        
        document.getElementById('gangTools').textContent = data.tools || 0;
        document.getElementById('gangKeys').textContent = data.keys || 0;
    } catch (error) {
        console.error('Бүлэглэлийн өгөгдөл ачаалахад алдаа:', error);
    }
}

// ==================== НИЙТЛЭГ ====================

// Хэрэглэгчийн мөнгийг шинэчлэх
async function updateUserMoney() {
    if (!window.currentUser) return;
    
    try {
        const response = await fetch(`/api/user/${window.currentUser}`);
        const data = await response.json();
        
        document.getElementById('money').textContent = (data.money || 0).toLocaleString();
        document.getElementById('bank').textContent = (data.bank || 0).toLocaleString();
        document.getElementById('coin').textContent = (data.coin || 0).toLocaleString();
    } catch (error) {
        console.error('Мөнгө шинэчлэхэд алдаа:', error);
    }
}

// ==================== SOCKET HANDLERS ====================

// Тоглоомын үр дүн хүлээн авах
socket.on('gameResult', (result) => {
    console.log('🎮 Тоглоомын үр дүн ирлээ:', result);
    
    if (result.game === 'roulette') {
        rouletteResult = result;
        if (!rouletteAnimationInterval) {
            showRouletteResult();
        }
    } else if (result.game === 'slots') {
        slotsResult = result;
        if (!slotsAnimationInterval) {
            showSlotsResult();
        }
    }
});

// Хэрэглэгчийн мэдээлэл шинэчлэх
socket.on('userData', (data) => {
    console.log('👤 Хэрэглэчийн мэдээлэл шинэчлэгдсэн:', data);
    
    document.getElementById('money').textContent = (data.money || 0).toLocaleString();
    document.getElementById('bank').textContent = (data.bank || 0).toLocaleString();
    document.getElementById('coin').textContent = (data.coin || 0).toLocaleString();
});

// Хэрэглэгч баталгаажсан
socket.on('authenticated', (user) => {
    if (user && user.id) {
        window.currentUser = user.id;
        checkUserJob();
        checkAllCooldowns();
    }
});

// ✅ Socket coin price update

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
        updateCoinPrice();
    }
});