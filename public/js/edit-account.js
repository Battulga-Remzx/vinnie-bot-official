// public/js/edit-account.js

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Edit Account JS ачааллагдлаа');
    
    // Хэрэглэчийн мэдээллийг авах
    await loadProfileData();
    
    // Refresh товч
    document.getElementById('refreshDataBtn')?.addEventListener('click', async () => {
        await loadProfileData();
        showNotification('✅ Мэдээлэл шинэчлэгдсэн', 'success');
    });
    
    // Logout товч
    document.getElementById('logoutBtn2')?.addEventListener('click', () => {
        showNotification('👋 Амжилттай гарлаа', 'info');
        window.location.href = '/logout';
    });
});

async function loadProfileData() {
    try {
        const response = await fetch('/api/user/me');
        if (!response.ok) throw new Error('Network error');
        
        const user = await response.json();
        
        // Профайл мэдээлэл харуулах
        document.getElementById('profileUsername').textContent = user.username;
        document.getElementById('profileEmail').textContent = user.email || 'discord@user.com';
        document.getElementById('profileId').textContent = user.id;
        document.getElementById('profileTag').textContent = `${user.username}`;
        
        // Avatar
        const avatarEl = document.getElementById('profileAvatar');
        if (user.avatar) {
            avatarEl.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
        }
        
        // Мөнгөний мэдээлэл авах
        const dataResponse = await fetch(`/api/user/${user.id}`);
        if (dataResponse.ok) {
            const data = await dataResponse.json();
            document.getElementById('money').textContent = (data.money || 0).toLocaleString();
            document.getElementById('bank').textContent = (data.bank || 0).toLocaleString();
            document.getElementById('coin').textContent = (data.coin || 0).toLocaleString();
        }
        
    } catch (error) {
        console.error('Профайл мэдээлэл авахад алдаа:', error);
        showNotification('❌ Мэдээлэл авахад алдаа гарлаа', 'error');
    }
}