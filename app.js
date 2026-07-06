// App State
let img = null;
let coin = { x: 80, y: 80, r: 35 }; // Coin calibration: x, y, radius (pixels)
let food = { x: 180, y: 120, w: 120, h: 80 }; // Food bounding box: x, y, width, height (pixels)

let activeHandle = null; // Currently dragged element/handle
let dragOffset = { x: 0, y: 0 };
let originalRadius = 0;
let originalBox = null;

// HTML Elements
const fileInput = document.getElementById('file-input');
const btnUploadTrigger = document.getElementById('btn-upload-trigger');
const dropZone = document.getElementById('drop-zone');
const btnStartCamera = document.getElementById('btn-start-camera');
const btnCapture = document.getElementById('btn-capture');
const cameraContainer = document.getElementById('camera-container');
const video = document.getElementById('video');

const foodSelect = document.getElementById('food-select');
const thicknessInput = document.getElementById('thickness-input');
const thicknessVal = document.getElementById('thickness-val');
const coinSelect = document.getElementById('coin-select');
const customCoinGroup = document.getElementById('custom-coin-group');
const customCoinInput = document.getElementById('custom-coin-input');
const customCoinVal = document.getElementById('custom-coin-val');

const thresholdInput = document.getElementById('threshold-input');
const thresholdVal = document.getElementById('threshold-val');
const invertMaskCheckbox = document.getElementById('invert-mask');

const interactiveCanvas = document.getElementById('interactive-canvas');
const ctxInt = interactiveCanvas.getContext('2d');
const segmentedCanvas = document.getElementById('segmented-canvas');
const ctxSeg = segmentedCanvas.getContext('2d');

const placeholder1 = document.getElementById('placeholder-1');
const placeholder2 = document.getElementById('placeholder-2');
const statusText = document.getElementById('status-text');

// Results elements
const caloriesDisplay = document.getElementById('calories-display');
const caloriesProgress = document.getElementById('calories-progress');
const carbBar = document.getElementById('carb-bar');
const proteinBar = document.getElementById('protein-bar');
const fatBar = document.getElementById('fat-bar');
const carbDisplay = document.getElementById('carb-display');
const proteinDisplay = document.getElementById('protein-display');
const fatDisplay = document.getElementById('fat-display');

const pxRatioDisplay = document.getElementById('px-ratio-display');
const dimensionsDisplay = document.getElementById('dimensions-display');
const volumeDisplay = document.getElementById('volume-display');
const weightDisplay = document.getElementById('weight-display');
const btnSaveLog = document.getElementById('btn-save-log');
const btnClearHistory = document.getElementById('btn-clear-history');
const historyBody = document.getElementById('history-body');

// Database Density & Nutrition (per gram)
// Tahu: 80 cal, 1.9g carb, 8g prot, 4.8g fat per 100g -> divide by 100
const NUTRITION_DATABASE = {
    tahu: { density: 1.0, cal: 0.8, carb: 0.019, prot: 0.08, fat: 0.048, label: "Tahu Putih" },
    tempe: { density: 0.9, cal: 1.93, carb: 0.094, prot: 0.19, fat: 0.11, label: "Tempe Goreng" },
    bakso: { density: 1.05, cal: 1.6, carb: 0.08, prot: 0.12, fat: 0.09, label: "Bakso Sapi" },
    telur: { density: 1.03, cal: 1.55, carb: 0.011, prot: 0.13, fat: 0.11, label: "Telur Rebus" },
    kentang: { density: 1.0, cal: 0.87, carb: 0.20, prot: 0.02, fat: 0.001, label: "Kentang Rebus" },
    lontong: { density: 0.95, cal: 1.44, carb: 0.318, prot: 0.024, fat: 0.003, label: "Lontong" }
};

// Start camera stream
let stream = null;

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    loadDefaultImage();
    setupEventListeners();
    loadHistory();
});

// Create a premium looking default demo food plate
function loadDefaultImage() {
    statusText.innerText = "Memuat demo citra default...";
    
    // Create an offline canvas to draw a plate of food with a coin
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 640;
    tempCanvas.height = 480;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Background (Dark gray tabletop texture)
    tempCtx.fillStyle = '#1e293b';
    tempCtx.fillRect(0, 0, 640, 480);
    
    // Draw wood grain details (diagonal subtle lines)
    tempCtx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    tempCtx.lineWidth = 4;
    for(let i = -200; i < 800; i += 40) {
        tempCtx.beginPath();
        tempCtx.moveTo(i, 0);
        tempCtx.lineTo(i + 200, 480);
        tempCtx.stroke();
    }
    
    // Plate (White circle with outer shadows)
    tempCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    tempCtx.shadowBlur = 30;
    tempCtx.shadowOffsetX = 10;
    tempCtx.shadowOffsetY = 10;
    tempCtx.fillStyle = '#e2e8f0';
    tempCtx.beginPath();
    tempCtx.arc(360, 240, 180, 0, Math.PI * 2);
    tempCtx.fill();
    tempCtx.shadowColor = 'transparent'; // Reset shadows

    // Plate inner rim
    tempCtx.strokeStyle = '#cbd5e1';
    tempCtx.lineWidth = 3;
    tempCtx.beginPath();
    tempCtx.arc(360, 240, 150, 0, Math.PI * 2);
    tempCtx.stroke();

    // Draw reference coin (Rp 500 Coin)
    tempCtx.shadowColor = 'rgba(0,0,0,0.3)';
    tempCtx.shadowBlur = 10;
    tempCtx.shadowOffsetX = 4;
    tempCtx.shadowOffsetY = 4;
    
    // Shiny Silver circle
    let grad = tempCtx.createRadialGradient(100, 100, 5, 100, 100, 35);
    grad.addColorStop(0, '#f8fafc');
    grad.addColorStop(0.8, '#94a3b8');
    grad.addColorStop(1, '#475569');
    tempCtx.fillStyle = grad;
    tempCtx.beginPath();
    tempCtx.arc(100, 100, 35, 0, Math.PI * 2);
    tempCtx.fill();
    
    // Coin Inner ring
    tempCtx.strokeStyle = '#cbd5e1';
    tempCtx.lineWidth = 2;
    tempCtx.beginPath();
    tempCtx.arc(100, 100, 28, 0, Math.PI * 2);
    tempCtx.stroke();

    // Coin text "500"
    tempCtx.shadowColor = 'transparent';
    tempCtx.fillStyle = '#1e293b';
    tempCtx.font = 'bold 16px sans-serif';
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillText('500', 100, 96);
    tempCtx.font = '7px sans-serif';
    tempCtx.fillText('RUPIAH', 100, 110);

    // Draw Tempe Goreng (Golden brown cuboid from top view)
    tempCtx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    tempCtx.shadowBlur = 15;
    tempCtx.shadowOffsetX = 8;
    tempCtx.shadowOffsetY = 8;
    
    // Golden brown base
    let tempeGrad = tempCtx.createLinearGradient(250, 130, 420, 310);
    tempeGrad.addColorStop(0, '#f59e0b'); // Golden orange
    tempeGrad.addColorStop(0.5, '#b45309'); // Brown
    tempeGrad.addColorStop(1, '#78350f'); // Dark brown
    tempCtx.fillStyle = tempeGrad;
    
    // Draw rounded rectangle for tempe
    drawRoundedRect(tempCtx, 250, 150, 220, 160, 12);
    tempCtx.fill();
    tempCtx.shadowColor = 'transparent';

    // Tempe grains (soybeans yellow spots)
    tempCtx.fillStyle = '#fef08a';
    for(let j=0; j<25; j++) {
        let spotX = 265 + Math.random() * 190;
        let spotY = 165 + Math.random() * 130;
        let spotR = 4 + Math.random() * 6;
        tempCtx.beginPath();
        tempCtx.ellipse(spotX, spotY, spotR, spotR * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
        tempCtx.fill();
    }
    
    // Coriander spices (subtle green flakes)
    tempCtx.fillStyle = '#16a34a';
    for(let j=0; j<15; j++) {
        let spotX = 260 + Math.random() * 200;
        let spotY = 160 + Math.random() * 140;
        tempCtx.fillRect(spotX, spotY, 3, 5);
    }

    // Set as active image
    img = new Image();
    img.src = tempCanvas.toDataURL();
    img.onload = () => {
        // Set standard dimensions matching image
        interactiveCanvas.width = 640;
        interactiveCanvas.height = 480;
        segmentedCanvas.width = 640;
        segmentedCanvas.height = 480;
        
        // Hide placeholders
        placeholder1.style.display = 'none';
        placeholder2.style.display = 'none';
        
        // Initialize overlays
        coin = { x: 100, y: 100, r: 35 };
        food = { x: 250, y: 150, w: 220, h: 160 };
        
        statusText.innerText = "Citra demo berhasil dimuat.";
        updateCalculation();
    };
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function setupEventListeners() {
    // Dropzone trigger
    btnUploadTrigger.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });

    // Camera Actions
    btnStartCamera.addEventListener('click', toggleCamera);
    btnCapture.addEventListener('click', capturePhoto);

    // Sidebar Config Change Events
    foodSelect.addEventListener('change', (e) => {
        const option = e.target.selectedOptions[0];
        thicknessInput.value = option.dataset.thick;
        thicknessVal.innerText = `${option.dataset.thick} cm`;
        updateCalculation();
    });

    thicknessInput.addEventListener('input', (e) => {
        thicknessVal.innerText = `${e.target.value} cm`;
        updateCalculation();
    });

    coinSelect.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            customCoinGroup.style.display = 'flex';
        } else {
            customCoinGroup.style.display = 'none';
        }
        updateCalculation();
    });

    customCoinInput.addEventListener('input', (e) => {
        customCoinVal.innerText = `${e.target.value} cm`;
        updateCalculation();
    });

    thresholdInput.addEventListener('input', (e) => {
        thresholdVal.innerText = e.target.value;
        updateCalculation();
    });

    invertMaskCheckbox.addEventListener('change', updateCalculation);

    // Canvas Draggable Interactions
    interactiveCanvas.addEventListener('mousedown', handleMouseDown);
    interactiveCanvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    // Mobile Touch support
    interactiveCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    interactiveCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    // Save Logs & Clear History
    btnSaveLog.addEventListener('click', saveLogEntry);
    btnClearHistory.addEventListener('click', clearHistory);
}

function handleFileSelect() {
    const file = fileInput.files[0];
    if (!file) return;

    statusText.innerText = "Mengunggah berkas...";
    const reader = new FileReader();
    reader.onload = (e) => {
        img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            // Adaptive canvas dimension to maintain image resolution
            const maxW = 640;
            const scale = Math.min(maxW / img.width, 1.0);
            interactiveCanvas.width = img.width * scale;
            interactiveCanvas.height = img.height * scale;
            segmentedCanvas.width = interactiveCanvas.width;
            segmentedCanvas.height = interactiveCanvas.height;

            placeholder1.style.display = 'none';
            placeholder2.style.display = 'none';

            // Reset overlays appropriately
            const w = interactiveCanvas.width;
            const h = interactiveCanvas.height;
            coin = { x: w * 0.2, y: h * 0.2, r: Math.min(w, h) * 0.08 };
            food = { x: w * 0.4, y: h * 0.3, w: w * 0.4, h: h * 0.4 };

            statusText.innerText = "Citra berhasil diunggah.";
            updateCalculation();
        };
    };
    reader.readAsDataURL(file);
}

// Camera controls
async function toggleCamera() {
    if (stream) {
        // Stop Camera
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        video.srcObject = null;
        cameraContainer.style.display = 'none';
        btnStartCamera.innerHTML = '<i class="fa-solid fa-video"></i> Aktifkan Kamera Handphone/PC';
        statusText.innerText = "Kamera dinonaktifkan.";
    } else {
        // Start Camera
        try {
            statusText.innerText = "Mengakses kamera...";
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
                audio: false
            });
            video.srcObject = stream;
            cameraContainer.style.display = 'block';
            btnStartCamera.innerHTML = '<i class="fa-solid fa-video-slash"></i> Matikan Kamera';
            statusText.innerText = "Kamera aktif. Arahkan tepat dari atas objek.";
        } catch (err) {
            console.error("Camera access error: ", err);
            alert("Gagal mengakses kamera. Silakan pastikan izin kamera diberikan.");
            statusText.innerText = "Gagal mengakses kamera.";
        }
    }
}

function capturePhoto() {
    if (!stream) return;
    
    // Create offscreen canvas to capture
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;
    const ctx = captureCanvas.getContext('2d');
    
    // Apply mirror transformation if using front camera (we skip for environment)
    ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
    
    img = new Image();
    img.src = captureCanvas.toDataURL();
    img.onload = () => {
        const maxW = 640;
        const scale = Math.min(maxW / img.width, 1.0);
        interactiveCanvas.width = img.width * scale;
        interactiveCanvas.height = img.height * scale;
        segmentedCanvas.width = interactiveCanvas.width;
        segmentedCanvas.height = interactiveCanvas.height;

        placeholder1.style.display = 'none';
        placeholder2.style.display = 'none';

        const w = interactiveCanvas.width;
        const h = interactiveCanvas.height;
        coin = { x: w * 0.2, y: h * 0.2, r: Math.min(w, h) * 0.08 };
        food = { x: w * 0.4, y: h * 0.3, w: w * 0.4, h: h * 0.4 };

        statusText.innerText = "Foto berhasil diambil.";
        toggleCamera(); // Turn off camera after capturing to save resource
        updateCalculation();
    };
}

// DRAGGABLE ENGINE (INTERACTIVE OVERLAYS)
function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    // Support touch
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

function handleMouseDown(e) {
    if (!img) return;
    const pos = getMousePos(interactiveCanvas, e);
    
    // Check hit on Coin center
    const distToCoinCenter = Math.hypot(pos.x - coin.x, pos.y - coin.y);
    if (distToCoinCenter < 12) {
        activeHandle = 'coin-center';
        dragOffset = { x: pos.x - coin.x, y: pos.y - coin.y };
        return;
    }
    
    // Check hit on Coin boundary ring (resize)
    if (Math.abs(distToCoinCenter - coin.r) < 8) {
        activeHandle = 'coin-resize';
        originalRadius = coin.r;
        return;
    }

    // Check hit on Food resize corners
    const corners = [
        { name: 'food-tl', x: food.x, y: food.y },
        { name: 'food-tr', x: food.x + food.w, y: food.y },
        { name: 'food-bl', x: food.x, y: food.y + food.h },
        { name: 'food-br', x: food.x + food.w, y: food.y + food.h }
    ];

    for (let c of corners) {
        if (Math.hypot(pos.x - c.x, pos.y - c.y) < 10) {
            activeHandle = c.name;
            originalBox = { ...food };
            dragOffset = { x: pos.x, y: pos.y };
            return;
        }
    }

    // Check hit inside Food Bounding Box
    if (pos.x >= food.x && pos.x <= food.x + food.w && pos.y >= food.y && pos.y <= food.y + food.h) {
        activeHandle = 'food-center';
        dragOffset = { x: pos.x - food.x, y: pos.y - food.y };
    }
}

function handleMouseMove(e) {
    if (!activeHandle || !img) return;
    const pos = getMousePos(interactiveCanvas, e);

    if (activeHandle === 'coin-center') {
        coin.x = Math.max(coin.r, Math.min(interactiveCanvas.width - coin.r, pos.x - dragOffset.x));
        coin.y = Math.max(coin.r, Math.min(interactiveCanvas.height - coin.r, pos.y - dragOffset.y));
    } else if (activeHandle === 'coin-resize') {
        const dx = pos.x - coin.x;
        const dy = pos.y - coin.y;
        coin.r = Math.max(10, Math.min(200, Math.hypot(dx, dy)));
    } else if (activeHandle === 'food-center') {
        food.x = Math.max(0, Math.min(interactiveCanvas.width - food.w, pos.x - dragOffset.x));
        food.y = Math.max(0, Math.min(interactiveCanvas.height - food.h, pos.y - dragOffset.y));
    } else if (activeHandle.startsWith('food-')) {
        const dx = pos.x - dragOffset.x;
        const dy = pos.y - dragOffset.y;
        
        if (activeHandle === 'food-tl') {
            food.x = Math.max(0, Math.min(originalBox.x + originalBox.w - 20, originalBox.x + dx));
            food.y = Math.max(0, Math.min(originalBox.y + originalBox.h - 20, originalBox.y + dy));
            food.w = originalBox.x + originalBox.w - food.x;
            food.h = originalBox.y + originalBox.h - food.y;
        } else if (activeHandle === 'food-tr') {
            food.y = Math.max(0, Math.min(originalBox.y + originalBox.h - 20, originalBox.y + dy));
            food.w = Math.max(20, Math.min(interactiveCanvas.width - originalBox.x, originalBox.w + dx));
            food.h = originalBox.y + originalBox.h - food.y;
        } else if (activeHandle === 'food-bl') {
            food.x = Math.max(0, Math.min(originalBox.x + originalBox.w - 20, originalBox.x + dx));
            food.w = originalBox.x + originalBox.w - food.x;
            food.h = Math.max(20, Math.min(interactiveCanvas.height - originalBox.y, originalBox.h + dy));
        } else if (activeHandle === 'food-br') {
            food.w = Math.max(20, Math.min(interactiveCanvas.width - originalBox.x, originalBox.w + dx));
            food.h = Math.max(20, Math.min(interactiveCanvas.height - originalBox.y, originalBox.h + dy));
        }
    }

    drawInteractives();
    debounceProcess();
}

function handleMouseUp() {
    activeHandle = null;
}

// Touch event wrappers
function handleTouchStart(e) {
    if (e.touches.length === 1) {
        handleMouseDown(e);
        e.preventDefault();
    }
}
function handleTouchMove(e) {
    if (e.touches.length === 1) {
        handleMouseMove(e);
        e.preventDefault();
    }
}
function handleTouchEnd(e) {
    handleMouseUp();
}

// Debouncing processing to avoid lags
let processTimeout = null;
function debounceProcess() {
    clearTimeout(processTimeout);
    processTimeout = setTimeout(updateCalculation, 10);
}

// Draw overlays on top of the original image
function drawInteractives() {
    if (!img) return;
    
    // Clear canvas
    ctxInt.drawImage(img, 0, 0, interactiveCanvas.width, interactiveCanvas.height);
    
    // Draw Coin Guide
    ctxInt.strokeStyle = '#4facfe';
    ctxInt.lineWidth = 3;
    ctxInt.beginPath();
    ctxInt.arc(coin.x, coin.y, coin.r, 0, Math.PI * 2);
    ctxInt.stroke();
    
    // Draw Coin Center Handle
    ctxInt.fillStyle = '#4facfe';
    ctxInt.beginPath();
    ctxInt.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
    ctxInt.fill();

    // Draw Coin Border Resize Handle
    ctxInt.fillStyle = '#ffffff';
    ctxInt.strokeStyle = '#4facfe';
    ctxInt.lineWidth = 2;
    ctxInt.beginPath();
    ctxInt.arc(coin.x + coin.r, coin.y, 6, 0, Math.PI * 2);
    ctxInt.fill();
    ctxInt.stroke();
    
    // Draw Food Bounding Box Guide
    ctxInt.strokeStyle = '#10b981';
    ctxInt.lineWidth = 3;
    ctxInt.strokeRect(food.x, food.y, food.w, food.h);
    
    // Draw Food bounding box resize corner handles
    const corners = [
        { x: food.x, y: food.y },
        { x: food.x + food.w, y: food.y },
        { x: food.x, y: food.y + food.h },
        { x: food.x + food.w, y: food.y + food.h }
    ];
    
    ctxInt.fillStyle = '#ffffff';
    ctxInt.strokeStyle = '#10b981';
    ctxInt.lineWidth = 2;
    for (let c of corners) {
        ctxInt.beginPath();
        ctxInt.arc(c.x, c.y, 6, 0, Math.PI * 2);
        ctxInt.fill();
        ctxInt.stroke();
    }
}

// IMAGE PROCESSING & CALCULATION ENGINE
function updateCalculation() {
    if (!img) return;

    // Draw interactive overlays
    drawInteractives();

    // Perform Pixel-to-CM calibration
    let coinDiameterCm = parseFloat(coinSelect.value);
    if (coinSelect.value === 'custom') {
        coinDiameterCm = parseFloat(customCoinInput.value);
    }
    
    // Pixel ratio: pixels per cm
    const coinPixelsDiameter = coin.r * 2;
    const pxPerCm = coinPixelsDiameter / coinDiameterCm;
    
    pxRatioDisplay.innerText = `${pxPerCm.toFixed(1)} px/cm`;

    // Process Segmented binary mask
    const imgData = ctxInt.getImageData(food.x, food.y, food.w, food.h);
    const data = imgData.data;
    
    // Create new blank image data for binary display
    const binaryImgData = ctxSeg.createImageData(segmentedCanvas.width, segmentedCanvas.height);
    const binaryData = binaryImgData.data;
    
    const threshold = parseInt(thresholdInput.value);
    const invert = invertMaskCheckbox.checked;

    let foregroundPixelCount = 0;

    // Iterate through bounding box pixels to do Grayscale and Thresholding (Binarization)
    for (let y = 0; y < food.h; y++) {
        for (let x = 0; x < food.w; x++) {
            const idx = (y * food.w + x) * 4;
            const r = data[idx];
            const g = data[idx+1];
            const b = data[idx+2];
            
            // Grayscale conversion (Luminance method)
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Determine if foreground or background
            let isForeground = false;
            if (!invert) {
                isForeground = (gray > threshold);
            } else {
                isForeground = (gray <= threshold);
            }
            
            // Calculate absolute position on the output canvas
            const canvasX = Math.round(food.x + x);
            const canvasY = Math.round(food.y + y);
            
            if (canvasX >= 0 && canvasX < segmentedCanvas.width && canvasY >= 0 && canvasY < segmentedCanvas.height) {
                const outIdx = (canvasY * segmentedCanvas.width + canvasX) * 4;
                
                if (isForeground) {
                    foregroundPixelCount++;
                    // Green binary overlay for segmentation visualizer
                    binaryData[outIdx] = 16;     // R
                    binaryData[outIdx+1] = 185;  // G
                    binaryData[outIdx+2] = 129;  // B
                    binaryData[outIdx+3] = 220;  // Alpha (Semi transparent overlay)
                } else {
                    // Dark background mask
                    binaryData[outIdx] = 15;
                    binaryData[outIdx+1] = 23;
                    binaryData[outIdx+2] = 42;
                    binaryData[outIdx+3] = 180;
                }
            }
        }
    }

    // Draw the binary mask on the segmented-canvas (with source image beneath it)
    ctxSeg.drawImage(img, 0, 0, segmentedCanvas.width, segmentedCanvas.height);
    
    // Draw the binary overlay
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = segmentedCanvas.width;
    tempCanvas.height = segmentedCanvas.height;
    tempCanvas.getContext('2d').putImageData(binaryImgData, 0, 0);
    
    ctxSeg.drawImage(tempCanvas, 0, 0);
    
    // Draw green crop border in Segmented canvas
    ctxSeg.strokeStyle = '#10b981';
    ctxSeg.lineWidth = 2;
    ctxSeg.strokeRect(food.x, food.y, food.w, food.h);

    // DEDUCT PHYSICAL MEASUREMENTS
    const foodWidthCm = food.w / pxPerCm;
    const foodHeightCm = food.h / pxPerCm;
    const thicknessCm = parseFloat(thicknessInput.value);
    
    dimensionsDisplay.innerText = `${foodWidthCm.toFixed(1)} x ${foodHeightCm.toFixed(1)} cm`;

    // Calculate Bounded Segmented Area in cm²
    const pixelArea = (pxPerCm * pxPerCm);
    const foodAreaCm2 = foregroundPixelCount / pixelArea;

    // Calculate Volume based on selected Food geometry shape
    const foodKey = foodSelect.value;
    const foodProps = NUTRITION_DATABASE[foodKey];
    const foodShape = foodSelect.selectedOptions[0].dataset.shape;

    let volumeCm3 = 0;
    if (foodShape === 'cuboid') {
        // Cuboid volume = actual segmented area * height/thickness
        volumeCm3 = foodAreaCm2 * thicknessCm;
    } else if (foodShape === 'cylinder') {
        // Cylinder volume (assuming width is diameter, length is box width/height)
        const radiusCm = Math.min(foodWidthCm, foodHeightCm) / 2;
        const lengthCm = Math.max(foodWidthCm, foodHeightCm);
        volumeCm3 = Math.PI * (radiusCm * radiusCm) * lengthCm;
    } else if (foodShape === 'spheroid') {
        // Spheroid volume (Ellipsoid) = 4/3 * pi * r1 * r2 * r3 (where r3 is thickness/2)
        const r1 = foodWidthCm / 2;
        const r2 = foodHeightCm / 2;
        const r3 = thicknessCm / 2;
        volumeCm3 = (4/3) * Math.PI * r1 * r2 * r3;
    }

    // Weight estimation = Volume * Density
    const weightGrams = volumeCm3 * foodProps.density;
    
    // Calorie & Nutrients
    const totalCalories = weightGrams * foodProps.cal;
    const totalCarb = weightGrams * foodProps.carb;
    const totalProt = weightGrams * foodProps.prot;
    const totalFat = weightGrams * foodProps.fat;

    // Update displays
    volumeDisplay.innerText = `${volumeCm3.toFixed(1)} cm³`;
    weightDisplay.innerText = `${weightGrams.toFixed(1)} gram`;
    caloriesDisplay.innerText = Math.round(totalCalories);

    // Update Circular Gauge (Max calories expected in normal single item = 600 Kcal)
    const maxCal = 600;
    const percent = Math.min(100, (totalCalories / maxCal) * 100);
    caloriesProgress.style.background = `radial-gradient(closest-side, #111827 80%, transparent 0 99.9%, #111827 0),
        conic-gradient(var(--accent) ${percent}%, rgba(255, 255, 255, 0.08) 0%)`;

    // Max nutrition limits for standard visualization
    const maxMacro = 50; // 50g
    carbBar.style.width = `${Math.min(100, (totalCarb / maxMacro) * 100)}%`;
    proteinBar.style.width = `${Math.min(100, (totalProt / maxMacro) * 100)}%`;
    fatBar.style.width = `${Math.min(100, (totalFat / maxMacro) * 100)}%`;

    carbDisplay.innerText = `${totalCarb.toFixed(1)}g`;
    proteinDisplay.innerText = `${totalProt.toFixed(1)}g`;
    fatDisplay.innerText = `${totalFat.toFixed(1)}g`;

    btnSaveLog.disabled = false;
}

// LOCAL STORAGE LOG ENGINE
function saveLogEntry() {
    if (!img) return;
    
    const foodKey = foodSelect.value;
    const foodLabel = NUTRITION_DATABASE[foodKey].label;
    const foodShape = foodSelect.selectedOptions[0].dataset.shape;
    const shapeLabel = foodShape.charAt(0).toUpperCase() + foodShape.slice(1);
    
    const dimensionsText = dimensionsDisplay.innerText;
    const volumeText = volumeDisplay.innerText;
    const weightText = weightDisplay.innerText;
    const caloriesText = caloriesDisplay.innerText;
    const macrosText = `${carbDisplay.innerText} / ${proteinDisplay.innerText} / ${fatDisplay.innerText}`;
    
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    const logItem = {
        timestamp,
        foodLabel,
        shapeLabel,
        dimensionsText,
        volumeText,
        weightText,
        caloriesText,
        macrosText
    };

    let history = JSON.parse(localStorage.getItem('nutriscan_history')) || [];
    history.push(logItem);
    localStorage.setItem('nutriscan_history', JSON.stringify(history));

    renderHistory();
    alert(`Hasil estimasi untuk ${foodLabel} (${caloriesText} Kcal) berhasil disimpan!`);
}

function loadHistory() {
    renderHistory();
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem('nutriscan_history')) || [];
    if (history.length === 0) {
        historyBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">Belum ada riwayat tercatat hari ini. Silakan lakukan pemindaian di atas.</td>
            </tr>
        `;
        return;
    }

    // Newest first
    historyBody.innerHTML = history.reverse().map(item => `
        <tr>
            <td>${item.timestamp}</td>
            <td><strong>${item.foodLabel}</strong></td>
            <td><span class="badge">${item.shapeLabel}</span></td>
            <td>${item.dimensionsText}</td>
            <td>${item.volumeText}</td>
            <td>${item.weightText}</td>
            <td style="color: var(--accent); font-weight: bold;">${item.caloriesText} Kcal</td>
            <td>${item.macrosText}</td>
        </tr>
    `).join('');
}

function clearHistory() {
    if (confirm("Apakah Anda yakin ingin menghapus seluruh riwayat estimasi?")) {
        localStorage.removeItem('nutriscan_history');
        renderHistory();
    }
}
