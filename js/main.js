// main.js - 完整版（含NPC导航、活动缓存初始化）
import { state, defaultState, MAX_SLOTS, applyTheme, loadFromSlot, hasAnySave, updateTopBar, refreshEvents } from './state.js';
import { TRIBAL_EVENTS } from './data.js';
import { renderHome, renderGuyList, renderNPCList, renderPlaces, renderSettings, renderStartScreen } from './render.js';
import { showToast, startPetalInterval, preloadMusic } from './ui.js';

// 全局临时变量（用于开始界面）
window.tempStats = { health: 90, charm: 12, intuition: 10, endurance: 5, talent: 8, affinity: 15 };
window.selectedAvatar = '👧🏻';

// ========== 重新开始游戏 ==========
function restartGame() {
    if (!confirm('确定重新开始？手动存档保留，自动存档将被清空。')) return;
    localStorage.removeItem('beastLove_slot_0');
    const newState = defaultState();
    Object.assign(state, newState);
    window.tempStats = { health: 90, charm: 12, intuition: 10, endurance: 5, talent: 8, affinity: 15 };
    window.selectedAvatar = '👧🏻';
    document.getElementById('topBar').style.display = 'none';
    document.getElementById('navBar').style.display = 'none';
    renderStartScreen();
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
    loadTheme();
    startPetalInterval();
    preloadMusic();

    // ★ 初始化活动缓存（重要：修复活动不显示的问题）
    refreshEvents(TRIBAL_EVENTS);

    // 绑定导航事件
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // 检测存档
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
                updateTopBar();
                renderHome();
            } else {
                alert('存档损坏，请全新开始。');
            }
        });
        document.getElementById('newGameBtn').addEventListener('click', () => {
            if (confirm('确定重新开始？')) restartGame();
        });
    } else {
        renderStartScreen();
    }
}

// 暴露 restartGame 到全局（用于结局等场景）
window.restartGame = restartGame;

// 启动游戏
init();