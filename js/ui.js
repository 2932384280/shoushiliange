// ui.js - 界面工具、弹窗、Toast、花瓣动画、音乐管理器
import { state } from './state.js';

// ========== 音乐管理器 ==========
const playlist = [
    { name: '密林深处的秘密', file: 'audio/bgm1.mp3' },
    { name: '遇阳', file: 'audio/bgm2.mp3' },
    { name: 'Your choice.', file: 'audio/bgm3.mp3' },
    { name: '云羽', file: 'audio/bgm4.mp3' },
    { name: '苍月之下', file: 'audio/bgm5.mp3' },
    { name: '跌入熊温暖的怀抱', file: 'audio/bgm6.mp3' }
];

let currentTrackIndex = 0;
let playMode = 'order'; // 'single' | 'order' | 'random'

const bgm = document.getElementById('bgm');

function handleTrackEnd() {
    if (!bgm) return;
    switch (playMode) {
        case 'single':
            bgm.currentTime = 0;
            bgm.play();
            break;
        case 'order':
            nextTrack();
            break;
        case 'random':
            randomTrack();
            break;
    }
}

function loadTrack(index) {
    if (!bgm || index < 0 || index >= playlist.length) return;
    currentTrackIndex = index;
    bgm.src = playlist[index].file;
    bgm.load();
}

if (bgm) {
    bgm.addEventListener('ended', handleTrackEnd);
    bgm.volume = 0.3;
}

export function playMusic() {
    if (bgm) {
        if (!bgm.src || bgm.src === '') {
            loadTrack(0);
        }
        bgm.play().catch(() => {});
    }
}

export function pauseMusic() {
    if (bgm) bgm.pause();
}

export function togglePlayPause() {
    if (!bgm) return;
    if (bgm.paused) {
        bgm.play();
    } else {
        bgm.pause();
    }
}

export function nextTrack() {
    if (!bgm || playlist.length === 0) return;
    let nextIndex = currentTrackIndex + 1;
    if (nextIndex >= playlist.length) nextIndex = 0;
    loadTrack(nextIndex);
    bgm.play();
}

export function prevTrack() {
    if (!bgm || playlist.length === 0) return;
    let prevIndex = currentTrackIndex - 1;
    if (prevIndex < 0) prevIndex = playlist.length - 1;
    loadTrack(prevIndex);
    bgm.play();
}

function randomTrack() {
    if (!bgm || playlist.length === 0) return;
    if (playlist.length === 1) {
        loadTrack(0);
        bgm.play();
        return;
    }
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * playlist.length);
    } while (newIndex === currentTrackIndex);
    loadTrack(newIndex);
    bgm.play();
}

export function setPlayMode(mode) {
    if (['single', 'order', 'random'].includes(mode)) {
        playMode = mode;
    }
}

export function getPlayMode() {
    return playMode;
}

export function getCurrentTrackName() {
    if (playlist.length === 0) return '无音乐';
    return playlist[currentTrackIndex].name;
}

export function getMusicPaused() {
    return bgm ? bgm.paused : true;
}

export function preloadMusic() {
    if (bgm && (!bgm.src || bgm.src === '')) {
        loadTrack(0);
    }
}

export { bgm };

// ========== Toast 轻提示 ==========
export function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 2500);
}

// ========== 全局弹窗 ==========
export function showGlobalModal(html, id) {
    const old = document.getElementById(id);
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', html);
    return document.getElementById(id);
}

// ========== 背包查看 ==========
export function showInventoryModal() {
    const old = document.getElementById('inventoryModal');
    if (old) old.remove();
    const items = state.player.inventory;
    let listHtml = items.length === 0
        ? '<p style="text-align:center;color:var(--text2);">背包里空空如也，去市场或在家制作礼物吧。</p>'
        : (() => {
            const counts = {};
            items.forEach(i => { counts[i] = (counts[i] || 0) + 1; });
            return '<ul style="list-style:none;padding:0;">' +
                Object.entries(counts).map(([item, count]) =>
                    `<li style="padding:8px 0;border-bottom:1px dotted #ffd6e7;display:flex;justify-content:space-between;"><span>${item}</span><span style="color:var(--accent);">x${count}</span></li>`
                ).join('') +
                '</ul>';
        })();
    const html = `<div class="modal-overlay" id="inventoryModal">
        <div class="modal-box">
            <div style="font-weight:700;color:var(--accent);margin-bottom:10px;">🎒 我的背包</div>
            ${listHtml}
            <button class="btn" id="closeInventory" style="width:100%;margin-top:10px;">关闭</button>
        </div>
    </div>`;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    document.getElementById('closeInventory').addEventListener('click', () => {
        document.getElementById('inventoryModal').remove();
    });
}

// ========== 花瓣动画管理 ==========
let petalIntervalId = null;

function createDynamicPetal() {
    if (document.querySelectorAll('.dynamic-petal').length >= 5) return;
    const petal = document.createElement('div');
    petal.className = 'petal dynamic-petal';
    petal.textContent = ['🌸','💮','🌺'][Math.floor(Math.random() * 3)];
    petal.style.left = Math.random() * 100 + '%';
    petal.style.animationDuration = (8 + Math.random() * 12) + 's';
    document.body.appendChild(petal);
    setTimeout(() => { if (petal.parentNode) petal.remove(); }, 15000);
}

export function startPetalInterval() {
    if (petalIntervalId) clearInterval(petalIntervalId);
    petalIntervalId = setInterval(createDynamicPetal, 2500);
}

export function stopPetalInterval() {
    if (petalIntervalId) {
        clearInterval(petalIntervalId);
        petalIntervalId = null;
    }
    document.querySelectorAll('.dynamic-petal').forEach(p => p.remove());
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopPetalInterval();
    else startPetalInterval();
});