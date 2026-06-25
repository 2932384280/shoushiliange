// ui.js - 界面工具、弹窗、Toast、花瓣动画、音乐管理器、NPC弹窗
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
let playMode = 'order'; // 默认顺序播放

const bgm = document.getElementById('bgm');

function handleTrackEnd() {
    if (!bgm) return;
    console.log('音乐播放结束，当前模式:', playMode);
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
        default:
            nextTrack();
    }
}

function loadTrack(index) {
    if (!bgm || index < 0 || index >= playlist.length) return;
    currentTrackIndex = index;
    bgm.src = playlist[index].file;
    bgm.loop = false; // 确保不循环
    bgm.load();
    console.log('加载音乐:', playlist[index].name);
}

if (bgm) {
    bgm.addEventListener('ended', handleTrackEnd);
    bgm.volume = 0.3;
    bgm.loop = false; // 初始设置
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
    bgm.play().catch(() => {});
}

export function prevTrack() {
    if (!bgm || playlist.length === 0) return;
    let prevIndex = currentTrackIndex - 1;
    if (prevIndex < 0) prevIndex = playlist.length - 1;
    loadTrack(prevIndex);
    bgm.play().catch(() => {});
}

function randomTrack() {
    if (!bgm || playlist.length === 0) return;
    if (playlist.length === 1) {
        loadTrack(0);
        bgm.play().catch(() => {});
        return;
    }
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * playlist.length);
    } while (newIndex === currentTrackIndex);
    loadTrack(newIndex);
    bgm.play().catch(() => {});
}

export function setPlayMode(mode) {
    if (['single', 'order', 'random'].includes(mode)) {
        playMode = mode;
        console.log('播放模式切换为:', mode);
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

// ========== NPC首次相遇弹窗 ==========
export function showNPCFirstMeetModal(npc) {
    const html = `<div class="global-overlay" id="npcFirstMeetModal">
        <div class="modal-box" style="text-align:center;">
            <div style="font-size:3em;">${npc.emoji}</div>
            <div style="font-size:1.2em;font-weight:700;color:var(--accent);">${npc.name}</div>
            <div style="font-size:0.9em;color:var(--text2);">${npc.identity} · ${npc.race}</div>
            <p style="margin-top:12px;">${npc.appearance}</p>
            <p style="font-style:italic;color:var(--text2);">“${npc.personality}”</p>
            <button class="btn" id="closeNpcFirstMeet" style="width:100%;margin-top:10px;">继续</button>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'npcFirstMeetModal');
    modal.querySelector('#closeNpcFirstMeet').addEventListener('click', () => modal.remove());
}

// ========== NPC救援弹窗 ==========
export function showNPCRescueModal(npc, heal) {
    const html = `<div class="global-overlay" id="npcRescueModal">
        <div class="modal-box" style="text-align:center;">
            <div style="font-size:3em;">🆘</div>
            <div style="font-size:1.2em;font-weight:700;color:var(--accent);">${npc.emoji} ${npc.name} 救了你！</div>
            <p>在你危急时刻，${npc.name}及时出现，帮你击退了危险。</p>
            <p style="color:var(--accent);font-size:1.1em;">生命恢复 +${heal} 点</p>
            <button class="btn" id="closeNpcRescue" style="width:100%;margin-top:10px;">感谢他/她</button>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'npcRescueModal');
    modal.querySelector('#closeNpcRescue').addEventListener('click', () => modal.remove());
}

// ========== NPC送礼弹窗 ==========
export function showNPCGiftModal(npc, giftText, gain) {
    const html = `<div class="global-overlay" id="npcGiftModal">
        <div class="modal-box" style="text-align:center;">
            <div style="font-size:3em;">🎁</div>
            <div style="font-size:1.2em;font-weight:700;color:var(--accent);">🎂 生日快乐！</div>
            <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin:12px 0;">
                <span style="font-size:2em;">${npc.emoji}</span>
                <span style="font-weight:700;font-size:1.1em;">${npc.name}</span>
                <span style="font-size:0.9em;color:var(--text2);">送来了礼物</span>
            </div>
            <div style="background:#fff5f8;border-radius:12px;padding:14px;border:1px solid var(--border);line-height:1.8;text-align:left;">
                ${giftText}
            </div>
            <div style="margin-top:10px;font-size:0.9em;color:var(--accent);">友好值 +${gain}</div>
            <button class="btn" id="closeNpcGift" style="width:100%;margin-top:10px;">收下礼物</button>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'npcGiftModal');
    modal.querySelector('#closeNpcGift').addEventListener('click', () => modal.remove());
}

// ========== 男主送礼弹窗 ==========
export function showGiftFromGuyModal(guy, giftText, affectionGain) {
    const html = `<div class="global-overlay" id="giftFromGuyModal">
        <div class="modal-box" style="max-width:500px;text-align:center;">
            <div style="font-size:3em;margin-bottom:10px;">🎁</div>
            <div style="font-size:1.5em;font-weight:700;color:var(--accent);">🎂 生日快乐！</div>
            <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin:12px 0;">
                <span style="font-size:2em;">${guy.emoji}</span>
                <span style="font-weight:700;font-size:1.1em;">${guy.name}</span>
                <span style="font-size:0.9em;color:var(--text2);">送来了礼物</span>
            </div>
            <div style="background:#fff5f8;border-radius:12px;padding:16px;border:1px solid var(--border);line-height:1.8;text-align:left;">
                ${giftText}
            </div>
            <div style="margin-top:12px;font-size:0.9em;color:var(--accent);">
                💕 好感度 +${affectionGain}
            </div>
            <button class="btn" id="closeGiftFromGuy" style="width:100%;margin-top:12px;">收下礼物</button>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'giftFromGuyModal');
    modal.querySelector('#closeGiftFromGuy').addEventListener('click', () => {
        modal.remove();
        showToast(`你收到了${guy.name}的生日礼物！`);
    });
}

// ========== NPC互动弹窗 ==========
export function showNPCInteractionModal(npc, text) {
    const html = `<div class="global-overlay" id="npcModal">
        <div class="modal-box">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                <span style="font-size:2em;">${npc.emoji}</span>
                <span style="font-weight:700;color:var(--accent);">${npc.name}</span>
                <span style="font-size:0.8em;color:var(--text2);">${npc.role || npc.identity}</span>
            </div>
            <div style="background:#fff5f8;border-radius:12px;padding:14px;border:1px solid var(--border);line-height:1.8;">
                ${text}
            </div>
            <div style="margin-top:10px;text-align:center;font-size:0.8em;color:var(--text2);">
                与 ${npc.name} 的亲密度 +1
            </div>
            <button class="btn" id="closeNpcModal" style="width:100%;margin-top:10px;">继续</button>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'npcModal');
    modal.querySelector('#closeNpcModal').addEventListener('click', () => modal.remove());
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