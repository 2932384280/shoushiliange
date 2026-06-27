// main.js - 完整版（含NPC导航、活动缓存初始化、新手引导、重启确认弹窗、关系网构建、头像预加载）
import { state, defaultState, MAX_SLOTS, applyTheme, loadFromSlot, hasAnySave, updateTopBar, refreshEvents } from './state.js';
import { TRIBAL_EVENTS } from './data.js';
import { renderHome, renderGuyList, renderNPCList, renderPlaces, renderSettings, renderStartScreen } from './render.js';
import { showToast, showGlobalModal, startPetalInterval, preloadMusic, preloadStudioLogo } from './ui.js';
import { startTutorial, skipTutorial, needsTutorial } from './tutorial.js';
import { buildRelationshipMap } from './actions.js';

// 全局临时变量（用于开始界面）
window.tempStats = { health: 90, charm: 12, intuition: 10, endurance: 5, talent: 8, affinity: 15 };
window.selectedAvatar = '⭐';

// ========== ✅ 头像预加载 ==========
function preloadAvatars() {
    const avatarPaths = [
        'img/avatars/cangye.jpg',
        'img/avatars/lieyang.jpg',
        'img/avatars/xuanyu.jpg',
        'img/avatars/yanyue.jpg',
        'img/avatars/liuyun.jpg',
        'img/avatars/moli.jpg'
    ];
    
    avatarPaths.forEach(path => {
        const img = new Image();
        img.src = path;
        img.onload = () => console.log(`✅ 预加载头像: ${path}`);
        img.onerror = () => console.log(`⚠️ 头像加载失败: ${path}`);
    });
}

// ========== 重新开始确认弹窗 ==========
function showRestartConfirmModal() {
    const html = `<div class="global-overlay" id="restartConfirmModal">
        <div class="modal-box" style="max-width:450px;text-align:center;">
            <div style="font-size:3em;margin-bottom:10px;">🔄</div>
            <h2 style="color:var(--accent);">确认重新开始？</h2>
            <div style="line-height:2;font-size:0.95em;color:var(--text2);">
                <p>重新开始将清空当前游戏进度。</p>
                <p style="font-size:0.85em;">⚠️ 手动存档保留，自动存档将被清空。</p>
            </div>
            <div style="display:flex;gap:10px;margin-top:15px;">
                <button class="btn" id="cancelRestart" style="flex:1;background:#ccc;color:#666;">取消</button>
                <button class="btn" id="confirmRestart" style="flex:2;background:#ff4d6d;">⚠️ 确定重新开始</button>
            </div>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'restartConfirmModal');
    modal.querySelector('#confirmRestart').addEventListener('click', () => {
        modal.remove();
        doRestartGame();
    });
    modal.querySelector('#cancelRestart').addEventListener('click', () => {
        modal.remove();
    });
}

// ========== 执行重新开始 ==========
function doRestartGame() {
    localStorage.removeItem('beastLove_slot_0');
    const newState = defaultState();
    Object.assign(state, newState);
    window.tempStats = { health: 90, charm: 12, intuition: 10, endurance: 5, talent: 8, affinity: 15 };
    window.selectedAvatar = '⭐';
    document.getElementById('topBar').style.display = 'none';
    document.getElementById('navBar').style.display = 'none';
    renderStartScreen();
}

function restartGame() {
    showRestartConfirmModal();
}

// ========== 切换标签 ==========
function switchTab(tab) {
    if (tab === state.currentTab && tab !== 'guys' && tab !== 'npcs') return;
    state.currentTab = tab;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const t = document.querySelector(`.nav-item[data-tab="${tab}"]`);
    if (t) t.classList.add('active');
    render();
}

// ========== 渲染页面 ==========
function render() {
    switch (state.currentTab) {
        case 'home':
            renderHome();
            break;
        case 'guys':
            renderGuyList();
            break;
        case 'npcs':
            renderNPCList();
            break;
        case 'places':
            renderPlaces();
            break;
        case 'settings':
            renderSettings();
            break;
        default:
            renderHome();
            break;
    }
}

// ========== 加载主题 ==========
function loadTheme() {
    const saved = localStorage.getItem('beastLove_theme');
    if (saved) applyTheme(saved);
    else applyTheme('sakura');
}

// ========== 初始化 ==========
function init() {
    // ✅ 预加载头像
    preloadAvatars();
    
    loadTheme();
    startPetalInterval();
    preloadMusic();

    refreshEvents(TRIBAL_EVENTS);

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    if (hasAnySave()) {
        document.getElementById('contentArea').innerHTML = `
            <div class="start-screen" style="gap:15px;">
                <div class="start-title">兽 世 恋 歌</div>
                <div style="font-size:0.9em;color:var(--text2);">～ 检测到存档记录 ～</div>
                <button class="btn" id="loadLastBtn" style="font-size:1.1em;">📤 继续冒险（最近存档）</button>
                <button class="btn" id="newGameBtn" style="background:#ff4d6d;font-size:1.1em;">🆕 全新开始</button>
            </div>`;
        document.getElementById('loadLastBtn').addEventListener('click', () => {
            let loaded = false;
            for (let i = MAX_SLOTS - 1; i >= 0; i--) {
                if (loadFromSlot(i)) { loaded = true; break; }
            }
            if (loaded) {
                document.getElementById('topBar').style.display = 'flex';
                document.getElementById('navBar').style.display = 'flex';
                state.gameStarted = true;
                if (Object.keys(state.relationshipMap || {}).length === 0) {
                    buildRelationshipMap();
                }
                updateTopBar();
                renderHome();
                preloadStudioLogo(); // ★ 新增：预加载工作室Logo
            } else {
                alert('存档损坏，请全新开始。');
            }
        });
        document.getElementById('newGameBtn').addEventListener('click', () => {
            showRestartConfirmModal();
        });
    } else {
        renderStartScreen();
    }
}

window.restartGame = restartGame;
init();