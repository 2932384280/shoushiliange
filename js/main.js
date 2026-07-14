// main.js - 使用静态 import，保留全部功能，增加全局错误捕获
import { state, defaultState, MAX_SLOTS, applyTheme, loadFromSlot, hasAnySave, updateTopBar, refreshEvents } from './state.js';
import { TRIBAL_EVENTS } from './data.js';
import { renderHome, renderGuyList, renderNPCList, renderPlaces, renderSettings, renderStartScreen, openSaveLoadModal } from './render.js';
import { showToast, showGlobalModal, startPetalInterval, preloadMusic, preloadStudioLogo } from './ui.js';
import { startTutorial, skipTutorial } from './tutorial.js';
import { buildRelationshipMap } from './actions.js';
import { initCloudSave, isCloudSaveSupported, showCloudSaveManagerUI, uploadArchiveToCloud, getCloudArchiveList } from './cloud.js';

// ========== 全局错误显示到页面 ==========
function displayError(msg, detail) {
    const content = document.getElementById('contentArea');
    if (content) {
        content.innerHTML = `
            <div style="padding:30px;text-align:center;color:#c0392b;background:rgba(255,255,255,0.95);border-radius:16px;margin:20px;">
                <h3>😢 游戏加载失败</h3>
                <p style="font-size:0.95rem;">${msg}</p>
                ${detail ? `<p style="font-size:0.8rem;color:#999;">${detail}</p>` : ''}
                <button class="btn" onclick="location.reload()" style="margin-top:12px;">🔄 重新加载</button>
            </div>
        `;
    } else {
        alert('游戏加载失败: ' + msg);
    }
    console.error(msg, detail);
}

// ========== 全局异常捕获 ==========
window.onerror = function(message, source, lineno, colno, error) {
    displayError('脚本错误: ' + message, source + ':' + lineno + ':' + colno);
    return true;
};
window.addEventListener('unhandledrejection', function(e) {
    displayError('未处理的Promise错误: ' + (e.reason?.message || e.reason), e.reason?.stack);
    e.preventDefault();
});

// ========== localStorage 可用性检测 ==========
function localStorageAvailable() {
    try {
        localStorage.setItem('_test', '1');
        localStorage.removeItem('_test');
        return true;
    } catch (e) {
        return false;
    }
}
const lsAvailable = localStorageAvailable();
if (!lsAvailable) {
    console.warn('localStorage 不可用，使用内存存储');
    window._memoryStorage = {};
    // 重写 localStorage 方法
    const origGet = localStorage.getItem;
    const origSet = localStorage.setItem;
    const origRemove = localStorage.removeItem;
    localStorage.getItem = (key) => window._memoryStorage[key] || null;
    localStorage.setItem = (key, val) => { window._memoryStorage[key] = val; };
    localStorage.removeItem = (key) => { delete window._memoryStorage[key]; };
}

// ========== 临时变量（用于开始界面） ==========
window.tempStats = window.tempStats || { health: 90, charm: 12, intuition: 10, endurance: 5, talent: 8, affinity: 15 };
window.selectedAvatar = window.selectedAvatar || '⭐';

// ========== 头像预加载 ==========
function preloadAvatars() {
    const paths = [
        'img/avatars/cangye.jpg',
        'img/avatars/lieyang.jpg',
        'img/avatars/xuanyu.jpg',
        'img/avatars/yanyue.jpg',
        'img/avatars/liuyun.jpg',
        'img/avatars/moli.jpg'
    ];
    paths.forEach(path => {
        const img = new Image();
        img.onload = () => console.log('✅ 预加载:', path);
        img.onerror = () => console.warn('⚠️ 预加载失败（占位）:', path);
        img.src = path;
    });
}

// ========== 重新开始函数 ==========
function restartGame() {
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

// ========== 切换标签 ==========
function switchTab(tab) {
    if (tab === state.currentTab && tab !== 'guys' && tab !== 'npcs') return;
    state.currentTab = tab;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const t = document.querySelector(`.nav-item[data-tab="${tab}"]`);
    if (t) t.classList.add('active');
    render();
}

function render() {
    try {
        switch (state.currentTab) {
            case 'home': renderHome(); break;
            case 'guys': renderGuyList(); break;
            case 'npcs': renderNPCList(); break;
            case 'places': renderPlaces(); break;
            case 'settings': renderSettings(); break;
            default: renderHome();
        }
    } catch (e) {
        displayError('渲染页面失败', e.message);
    }
}

function loadTheme() {
    const saved = localStorage.getItem('beastLove_theme');
    if (saved) applyTheme(saved);
    else applyTheme('sakura');
}

// ========== 广告集成 ==========
const AD_UNIT_ID = '1054324';
window.showAdForRename = function(roleType, roleId, onSuccess) {
    try {
        if (typeof tap === 'undefined' || !tap.createRewardedVideoAd) {
            console.warn('⚠️ 广告SDK未加载，模拟模式');
            showToast('🎬 模拟广告播放完成');
            setTimeout(onSuccess, 500);
            return;
        }
        const ad = tap.createRewardedVideoAd({ adUnitId: AD_UNIT_ID });
        let retryCount = 0;
        const maxRetries = 2;
        ad.onLoad(() => console.log('✅ 广告加载成功'));
        ad.onError((err) => { console.error('❌ 广告加载失败', err); showToast('广告暂时无法加载'); });
        ad.onClose((res) => {
            if (res && res.isEnded) {
                console.log('✅ 用户完整观看');
                showToast('🎉 获得改名权限！');
                onSuccess();
            } else {
                showToast('需要完整观看视频才能解锁');
            }
        });
        function showAd() {
            ad.show().catch((err) => {
                console.warn('⚠️ 广告展示失败', err);
                if (retryCount < maxRetries) {
                    retryCount++;
                    ad.load().then(() => ad.show()).catch(() => showToast('广告加载失败'));
                } else {
                    showToast('广告加载失败');
                }
            });
        }
        showAd();
    } catch (e) {
        console.error('广告异常', e);
        showToast('广告功能不可用');
    }
};

// ========== TapTap 登录 ==========
window.loginWithTapTap = async function() {
    try {
        if (typeof TDSUser !== 'undefined' && TDSUser.loginWithTapTap) {
            const user = await TDSUser.loginWithTapTap();
            console.log('✅ 登录成功', user);
            state.player.tapUser = user;
            state.player.cloudEnabled = true;
            showToast(`✅ 登录成功，欢迎 ${user.nickName || '玩家'}！`);
            try { initCloudSave(); } catch (e) {}
            setTimeout(() => { try { initCloudSave(); } catch (e) {} }, 2000);
            updateUIForLogin();
            return user;
        } else if (typeof tap !== 'undefined' && tap.login) {
            return new Promise((resolve) => {
                tap.login({
                    success: (res) => {
                        console.log('✅ 登录code', res.code);
                        const user = { id: 'tap_user', nickName: 'TapPlayer', avatarUrl: '' };
                        state.player.tapUser = user;
                        state.player.cloudEnabled = true;
                        try { initCloudSave(); } catch (e) {}
                        setTimeout(() => { try { initCloudSave(); } catch (e) {} }, 2000);
                        showToast('✅ 登录成功！');
                        updateUIForLogin();
                        resolve(user);
                    },
                    fail: (err) => {
                        console.error('❌ 登录失败', err);
                        showToast('❌ 登录失败');
                        resolve(null);
                    }
                });
            });
        } else {
            showToast('⚠️ 当前环境不支持TapTap登录，可离线游戏');
            return null;
        }
    } catch (err) {
        console.error('❌ 登录异常', err);
        showToast('❌ 登录异常');
        return null;
    }
};

function updateUIForLogin() {
    if (state.player.tapUser && state.gameStarted) {
        updateTopBar();
        if (state.currentTab === 'settings') renderSettings();
        if (state.currentTab === 'home') renderHome();
    }
}

// ========== 存档选择界面 ==========
function renderSaveSelection() {
    const content = document.getElementById('contentArea');
    content.innerHTML = `
        <div class="start-screen" style="gap:15px;">
            <div class="start-title">兽 世 恋 歌</div>
            <div style="font-size:0.9em;color:var(--text2);">～ 检测到存档记录 ～</div>
            <button class="btn" id="loadLastBtn" style="font-size:1.1em;">📤 继续冒险（最近存档）</button>
            <button class="btn" id="loadManualBtn" style="font-size:1.1em;background:#8e44ad;">📂 手动读档</button>
            <button class="btn" id="cloudManageBtn" style="font-size:1.1em;background:#2ecc71;">☁️ 云存档管理</button>
            <button class="btn" id="loginBtn" style="font-size:1.1em;background:#3498db;">🔑 TapTap 登录</button>
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
            preloadStudioLogo();
        } else {
            alert('存档损坏，请全新开始。');
        }
    });
    document.getElementById('loadManualBtn').addEventListener('click', () => {
        if (state.gameStarted) {
            state.currentTab = 'settings';
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            const t = document.querySelector('.nav-item[data-tab="settings"]');
            if (t) t.classList.add('active');
            renderSettings();
            setTimeout(() => {
                const btn = document.getElementById('openSaveLoad');
                if (btn) btn.click();
            }, 300);
        } else {
            openSaveLoadModal();
        }
    });
    document.getElementById('cloudManageBtn').addEventListener('click', () => {
        if (!state.player.tapUser) {
            showToast('⚠️ 请先登录 TapTap 账号');
            return;
        }
        if (!isCloudSaveSupported()) {
            showToast('⚠️ 云存档不可用，请检查网络');
            return;
        }
        showCloudSaveManagerUI();
    });
    document.getElementById('loginBtn').addEventListener('click', async () => {
        await window.loginWithTapTap();
    });
    document.getElementById('newGameBtn').addEventListener('click', () => {
        restartGame();
    });
}

// ========== 初始化（核心） ==========
function init() {
    try {
        console.log('🚀 游戏初始化开始...');
        preloadAvatars();
        loadTheme();
        startPetalInterval();
        preloadMusic();
        refreshEvents(TRIBAL_EVENTS);

        // 绑定导航点击
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', function() {
                switchTab(this.dataset.tab);
            });
        });

        // 云存档初始化（静默）
        try {
            initCloudSave();
        } catch (e) {
            console.warn('⚠️ 云存档初始化失败，游戏继续', e);
        }

        if (hasAnySave()) {
            renderSaveSelection();
        } else {
            renderStartScreen();
        }
        console.log('✅ 游戏初始化完成');
    } catch (err) {
        displayError('初始化失败', err.message + '\n' + err.stack);
    }
}

// 导出给其他模块使用
window.state = state;
window.restartGame = restartGame;
window.switchTab = switchTab;
window.render = render;
window.initCloudSave = initCloudSave;
window.isCloudSaveSupported = isCloudSaveSupported;
window.showCloudSaveManagerUI = showCloudSaveManagerUI;
window.uploadArchiveToCloud = uploadArchiveToCloud;
window.getCloudArchiveList = getCloudArchiveList;
window.showToast = showToast;
window.openSaveLoadModal = openSaveLoadModal;

// ========== 启动 ==========
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    setTimeout(init, 100);
}