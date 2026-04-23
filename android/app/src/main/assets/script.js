lucide.createIcons();

const uploadView = document.getElementById('upload-view');
const editorView = document.getElementById('editor-view');
const fileInput = document.getElementById('file-input');
const selectFileBtn = document.getElementById('select-file-btn');
const dropZone = document.getElementById('drop-zone');
const clearBtn = document.getElementById('clear-project-btn');
const fileNameEl = document.getElementById('file-name');
const fileSizeEl = document.getElementById('file-size');
const playBtn = document.getElementById('play-btn');
const timeDisplay = document.getElementById('time-display');
const progressLine = document.getElementById('progress-line');

let audio = new Audio();
let isPlaying = false;

// Sliders
const sliders = {
    threshold: { el: document.getElementById('threshold'), val: document.getElementById('threshold-val'), format: v => parseFloat(v).toFixed(2) },
    duration: { el: document.getElementById('duration'), val: document.getElementById('duration-val'), format: v => parseFloat(v).toFixed(3) },
    reduction: { el: document.getElementById('reduction'), val: document.getElementById('reduction-val'), format: v => Math.round(v) },
    maximum: { el: document.getElementById('maximum'), val: document.getElementById('maximum-val'), format: v => parseFloat(v).toFixed(3) }
};

Object.keys(sliders).forEach(key => {
    sliders[key].el.addEventListener('input', (e) => {
        sliders[key].val.textContent = sliders[key].format(e.target.value);
    });
});

window.adjustSlider = (key, amount) => {
    const slider = sliders[key].el;
    let newVal = parseFloat(slider.value) + amount;
    if(newVal > parseFloat(slider.max)) newVal = slider.max;
    if(newVal < parseFloat(slider.min)) newVal = slider.min;
    slider.value = newVal;
    sliders[key].val.textContent = sliders[key].format(newVal);
};

// Presets
document.getElementById('preset-select').addEventListener('change', (e) => {
    const val = e.target.value;
    if(val === 'default') setSliders(-40, 1.0, 100, 1.0);
    if(val === 'eliminate') setSliders(-40, 0.1, 100, 0.1);
    if(val === 'reduce50') setSliders(-40, 1.0, 50, 2.0);
    if(val === 'halfsec') setSliders(-40, 0.5, 100, 0.5);
    if(val === 'shorten5') setSliders(-40, 5.0, 100, 5.0);
});

function setSliders(t, d, r, m) {
    sliders.threshold.el.value = t; sliders.threshold.val.textContent = t.toFixed(2);
    sliders.duration.el.value = d; sliders.duration.val.textContent = d.toFixed(3);
    sliders.reduction.el.value = r; sliders.reduction.val.textContent = r;
    sliders.maximum.el.value = m; sliders.maximum.val.textContent = m.toFixed(3);
}

// File Upload
selectFileBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFile);

function handleFile(e) {
    const file = e.target.files[0];
    if(!file) return;
    
    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = 'Ready to process';
    
    const url = URL.createObjectURL(file);
    audio.src = url;
    
    uploadView.classList.remove('active');
    editorView.classList.add('active');
    generateMockWaveform();
}

clearBtn.addEventListener('click', () => {
    audio.pause();
    audio.src = '';
    isPlaying = false;
    updatePlayIcon();
    fileInput.value = '';
    editorView.classList.remove('active');
    uploadView.classList.add('active');
});

// Audio Playback
playBtn.addEventListener('click', () => {
    if(!audio.src) return;
    if(isPlaying) audio.pause();
    else audio.play();
});

audio.addEventListener('play', () => { isPlaying = true; updatePlayIcon(); });
audio.addEventListener('pause', () => { isPlaying = false; updatePlayIcon(); });
audio.addEventListener('timeupdate', () => {
    const current = audio.currentTime || 0;
    const total = audio.duration || 0;
    timeDisplay.textContent = `${formatTime(current)} / ${formatTime(total)}`;
    if(total > 0) {
        progressLine.style.left = `${(current / total) * 100}%`;
    }
});
audio.addEventListener('loadedmetadata', () => {
    timeDisplay.textContent = `0:00.00 / ${formatTime(audio.duration)}`;
});

function updatePlayIcon() {
    playBtn.innerHTML = isPlaying 
        ? '<i data-lucide="pause" fill="currentColor"></i>' 
        : '<i data-lucide="play" fill="currentColor"></i>';
    if(isPlaying) playBtn.classList.add('playing');
    else playBtn.classList.remove('playing');
    lucide.createIcons();
}

function formatTime(seconds) {
    if(isNaN(seconds)) return "0:00.00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

function generateMockWaveform() {
    const container = document.querySelector('.waveform-bars');
    container.innerHTML = '';
    for(let i=0; i<50; i++) {
        const bar = document.createElement('div');
        bar.className = 'bar';
        const height = Math.random() * 80 + 20;
        bar.style.height = `${height}%`;
        container.appendChild(bar);
    }
}

// Apply Button Mock
document.getElementById('apply-btn').addEventListener('click', () => {
    const btn = document.getElementById('apply-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader" class="spin"></i> Processing...';
    lucide.createIcons();
    
    setTimeout(() => {
        btn.innerHTML = '<i data-lucide="check"></i> Done!';
        lucide.createIcons();
        setTimeout(() => {
            btn.innerHTML = originalText;
            lucide.createIcons();
        }, 2000);
    }, 1500);
});
