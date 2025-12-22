    // Elements
const loadingScreen = document.getElementById('loadingScreen');
const fileUpload = document.getElementById('fileUpload');
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
  setTimeout(() => loadingScreen.classList.add('hide'), 150);
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
    fileName.textContent = 'Select HTML or ZIP file';
    showStatus('error', 'Invalid file format', 'Please upload only .html or .zip files.');
    return;
  }

  selectedFile = file;
  fileName.textContent = file.name;
  showStatus('info', 'File ready', 'Now just click Deploy.');
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
    showStatus('error', 'No file selected', 'Please upload a .html or .zip file.');
    return;
  }

  await deployToVercel(name, selectedFile);
});

// New deploy button
newDeployBtn.addEventListener('click', () => {
  hideResult();
  websiteName.value = '';
  fileUpload.value = '';
  fileName.textContent = 'Select HTML or ZIP file';
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
    showStatus('success', 'Copied ✅', 'Link has been copied to clipboard.');
  } catch (e) {
    showStatus('error', 'Copy failed', 'Your browser blocked clipboard access. Please copy manually.');
  }
});

// Status helpers
function showStatus(type, main, sub='') {
  statusMessage.className = `status show ${type}`;
  statusMain.textContent = main;
  statusSub.textContent = sub;
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

// Deploy to Vercel via backend API
async function deployToVercel(name, file) {
  try {
    deployBtn.disabled = true;
    deployBtnText.textContent = 'Deploying…';
    showStatus('info', 'Preparing deployment…', 'Reading file & sending to server.');
    hideResult();

    const fileData = await readFileAsBase64(file);

    showStatus('info', 'Deploying…', 'Running deployment process to Vercel.');

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
      throw new Error(data.error || `Deploy failed (HTTP ${response.status})`);
    }
    if (!data.url) {
      throw new Error('Deploy succeeded but URL not received from server.');
    }

    showStatus('success', 'Deploy successful!', 'Please open the link below.');
    showResult(data.url);

  } catch (error) {
    console.error('Deployment error:', error);
    showStatus('error', 'Deploy failed', error.message || 'An error occurred during deployment.');
  } finally {
    deployBtn.disabled = false;
    deployBtnText.textContent = 'Deploy to Vercel';
  }
}