// render.js - 所有页面渲染函数
import { state, getGuy, addLog, updateTopBar, getCurrentEvents, canGoOut, saveToSlot, loadFromSlot, getSaveSlots, applyTheme, formatSlotInfo, autoSave } from './state.js';
import { statInfo, themes, avatarList, ALL_ENDINGS, ACHIEVEMENTS, HIDDEN_ACHIEVEMENTS } from './data.js';
import { showToast, showGlobalModal, showInventoryModal, playMusic, togglePlayPause, nextTrack, prevTrack, setPlayMode, getPlayMode, getCurrentTrackName, getMusicPaused } from './ui.js';
import { openPlaceActions, handleGuyHomeVisit } from './actions.js';
import { checkAndShowPendingDailyEvents } from './events.js';

// 获取关系文本
function getRelationText(guy) {
    if (guy.dating) return '💕 伴侣';
    if (guy.affection >= 70) return '👭 亲友';
    if (guy.affection >= 50) return '👫 朋友';
    if (guy.affection >= 20) return '🤝 熟悉';
    return '❓ 陌生';
}

// 渲染主页
export function renderHome() {
    const stats = state.player.stats;
    const maxHp = state.player.maxHealth;
    const statsHtml = Object.entries(stats).map(([k, v]) => {
        const info = statInfo[k] || {};
        const maxVal = k === 'health' ? maxHp : 100;
        return `<div style="background:#fff;border-radius:12px;padding:8px;text-align:center;border:1px solid #ffe4f1;">
            <span>${info.icon||''}</span>
            <div style="font-weight:700;color:var(--accent);">${v}<span style="font-size:0.6em;color:var(--text2);">/${maxVal}</span></div>
            <div style="font-size:0.7em;">${info.name||k}</div>
        </div>`;
    }).join('');
    const maxHpTip = maxHp < 100 ? `<span style="font-size:0.7em;color:var(--accent);">💡去训练场锻炼可提升上限</span>` : '';
    const healthBar = `<div style="margin-top:8px;">❤️ 生命：<progress value="${stats.health}" max="${maxHp}" style="width:100%;height:10px;"></progress> ${stats.health}/${maxHp} ${maxHpTip}</div>`;
    const invCount = state.player.inventory.length;
    const invText = invCount > 0
        ? `🎒 背包: <span class="inv-clickable" id="openInventoryBtn">${invCount}件礼物</span>`
        : '🎒 背包: 空空如也';
    const movedText = state.player.movedIn
        ? `🏠 已与${getGuy(state.player.movedIn)?.name||'伴侣'}同居`
        : '';
    const sickText = state.player.sick
        ? `🤒 生病中，剩余${state.player.sickDays}天，只能待在家里`
        : (state.player.time === 3 && stats.health < 100
            ? `🌙 深夜生命值不足100，只能在家休息`
            : (stats.health < 100 ? `⚠️ 生命值不满，深夜将无法出门` : ''));
    const logHtml = state.logs.slice(0, 20).map(l =>
        `<div style="border-bottom:1px dotted #ffd6e7;padding:3px 0;font-size:0.78em;"><span style="color:var(--accent);">${l.time}</span> ${l.text}</div>`
    ).join('');
    const eventBanner = getCurrentEvents().length
        ? `<div class="event-banner">🎉 ${getCurrentEvents().map(e=>e.name).join(' & ')} 进行中！</div>`
        : '';

    document.getElementById('contentArea').innerHTML = `
        ${eventBanner}
        <div class="card">
            <div style="font-weight:700;color:var(--accent);margin-bottom:8px;">✨ 我的属性</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">${statsHtml}</div>
            ${healthBar}
            ${movedText ? `<div style="color:var(--accent);margin-top:4px;">${movedText}</div>` : ''}
            ${sickText ? `<div style="color:#c0392b;margin-top:4px;">${sickText}</div>` : ''}
            <div style="margin-top:8px;font-size:0.9em;color:var(--accent);">${invText}</div>
        </div>
        <div class="card">
            <div style="font-weight:700;color:var(--accent);">📜 冒险日志</div>
            <div style="max-height:300px;overflow-y:auto;">${logHtml||'<span style="color:var(--text2)">暂无记录</span>'}</div>
        </div>`;
    if (invCount > 0) {
        document.getElementById('openInventoryBtn').addEventListener('click', showInventoryModal);
    }
}

// 渲染男主列表
export function renderGuyList() {
    const guysHtml = state.guys.filter(g => !g.hidden || !g.locked).map(g => {
        let hintText = '';
        if (g.locked) {
            hintText = g.cluePlace === g.meetPlace
                ? `💡在<b>${g.meetPlace}</b>多探索几次或许能遇到他`
                : `💡在<b>${g.cluePlace}</b>探索可发现<b>${g.meetPlace}</b>`;
        } else if (g.sulkingDays > 0) {
            hintText = `💔 因心碎而躲着你，${g.sulkingDays}天后才愿意见你。`;
        }
        return `<div class="guy-card ${g.locked?'locked':''} ${g.banished?'banished':''}" data-guy-id="${g.id}">
            <div style="font-size:2.6em;">${g.emoji}</div>
            <div style="flex:1;font-size:0.8em;">
                <div style="font-weight:700;color:${g.locked||g.banished?'var(--gray)':g.color}">
                    ${g.name} ${g.injured?'🤕':''} ${g.dating?'💕':''}
                    <span class="relation-tag">${getRelationText(g)}</span>
                </div>
                <div style="color:var(--text2);">${g.race}${g.locked?' 🔒未解锁':''}${g.banished?' 🚫已疏远':''}</div>
                ${!g.locked&&!g.banished?`
                    <div class="progress-row">❤️<progress class="heart-bar" value="${g.affection}" max="100"></progress>${g.affection}</div>
                    <div class="progress-row">🔒<progress class="obsess-bar" value="${g.obsession}" max="100"></progress>${g.obsession}</div>
                `:`<div style="font-size:0.7em;">${g.banished?'不再与你相见':hintText}</div>`}
            </div>
        </div>`;
    }).join('');
    document.getElementById('contentArea').innerHTML = `<div class="guy-cards">${guysHtml}</div>`;
    document.querySelectorAll('.guy-card:not(.locked):not(.banished)').forEach(card => {
        card.addEventListener('click', () => renderGuyDetail(card.dataset.guyId));
    });
}

// 渲染男主详情
export function renderGuyDetail(guyId) {
    const guy = getGuy(guyId);
    if (!guy || guy.locked || guy.banished) return;
    const guyLogs = state.logs.filter(l => l.text.includes(guy.name)).slice(0, 5);
    const logsHtml = guyLogs.length
        ? guyLogs.map(l => `<div style="font-size:0.75em;">${l.time} ${l.text}</div>`).join('')
        : '暂无';
    document.getElementById('contentArea').innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
            <button class="btn" id="backToGuys">←</button>
            <span style="font-size:1.8em;">${guy.emoji}</span>
            <span style="font-weight:700;color:${guy.color}">${guy.name}</span>
            ${guy.injured?'🤕':''}${guy.dating?'💕':''}
            <span class="relation-tag">${getRelationText(guy)}</span>
        </div>
        <div class="card"><b>📋 种族：</b>${guy.race}<br><b>性格：</b>${guy.personality}</div>
        <div class="card"><b>📖 背景：</b>${guy.background}</div>
        <div class="card"><b>💝 喜好：</b>${guy.likes}<br><b>✨ 能力：</b>${guy.ability}</div>
        <div class="card"><b>🐾 兽形：</b>${guy.petDetail}</div>
        <div class="card"><b>📍 主要出没：</b>${guy.meetPlace}</div>
        <div class="card">
            <div class="progress-row">❤️ 好感度 <progress class="heart-bar" value="${guy.affection}" max="100"></progress> ${guy.affection}</div>
            <div class="progress-row">🔒 占有欲 <progress class="obsess-bar" value="${guy.obsession}" max="100"></progress> ${guy.obsession}</div>
        </div>
        <div class="card"><b>📜 互动记录</b><br>${logsHtml}</div>`;
    document.getElementById('backToGuys').addEventListener('click', () => renderGuyList());
}

// 渲染地点列表
export function renderPlaces() {
    const outAllowed = canGoOut();
    const p = state.player;
    const events = getCurrentEvents();
    const lockedSet = new Set();
    events.forEach(ev => { if (ev.effects.lockedPlaces) ev.effects.lockedPlaces.forEach(pl => lockedSet.add(pl)); });

    const placesHtml = state.places.map(pl => {
        let extraInfo = '';
        const isEventLocked = lockedSet.has(pl.name) && !pl.locked;
        const isTempLocked = (pl.name !== '我家' && !outAllowed);
        const isLocked = pl.locked || isTempLocked || isEventLocked;
        if (isLocked) {
            if (isEventLocked && !pl.locked) extraInfo = `<span class="place-unlock-hint">⚔️狩猎中关闭</span>`;
            else if (isTempLocked && !pl.locked) extraInfo = `<span class="place-unlock-hint">${p.sick?'🤒生病无法外出':'🌙深夜需生命满100'}</span>`;
            else if (pl.type === 'guyhome' && pl.guy) {
                const hg = getGuy(pl.guy);
                if (hg && hg.hidden) extraInfo = `<span class="place-unlock-hint">❓神秘的居所，或许在生死关头会打开</span>`;
                else extraInfo = `<span class="place-unlock-hint">❤️与${hg?.name||'???'}好感30解锁</span>`;
            } else {
                const us = state.places.find(p2 => p2.unlockTarget === pl.name);
                extraInfo = us && !us.locked
                    ? `<span class="place-unlock-hint">🔍探索${us.name} ${us.needCount}次</span>`
                    : `<span style="font-size:0.7em;color:var(--text2);">🔒探索相关地点解锁</span>`;
            }
        }
        const sickHome = (pl.name === '我家' && p.sick) ? ' 🤒' : '';
        return `<div class="place-item ${isLocked?'locked':''}" data-place="${pl.name}">
            <span class="place-icon">${pl.icon}</span>
            <span class="place-name">${pl.name}${sickHome}</span>
            ${extraInfo}
        </div>`;
    }).join('');

    const eventBanner = getCurrentEvents().length
        ? `<div class="event-banner">🎉 ${getCurrentEvents().map(e=>e.name).join(' & ')} 进行中！</div>`
        : '';

    document.getElementById('contentArea').innerHTML = `${eventBanner}<div class="place-grid">${placesHtml}</div>`;
    document.querySelectorAll('.place-item').forEach(item => {
        item.addEventListener('click', () => {
            const placeName = item.dataset.place;
            const place = state.places.find(p => p.name === placeName);
            if (!place) return;
            const isEventLocked = lockedSet.has(placeName) && !place.locked;
            const isTempLocked = (placeName !== '我家' && !outAllowed);
            if (place.locked || isTempLocked || isEventLocked) {
                if (isTempLocked && !place.locked) showCantGoOutModal();
                else if (isEventLocked && !place.locked) showCantGoOutModal();
                else showLockedPlaceHint(place);
            } else {
                openPlaceActions(placeName);
            }
        });
    });
}

// 未解锁地点提示
function showLockedPlaceHint(place) {
    let msg = '';
    if (place.type === 'guyhome' && place.guy) {
        const hg = getGuy(place.guy);
        if (hg && hg.hidden) msg = '❓ 神秘的居所，或许在生死关头会打开';
        else msg = `❤️ 需要与${hg?.name||'???'}好感达到30才会邀请你。`;
    } else {
        const us = state.places.find(p2 => p2.unlockTarget === place.name);
        if (us && !us.locked) msg = `🔍 在「${us.name}」探索 ${us.needCount} 次后可发现此地。`;
        else msg = '🔒 尚未解锁，继续探索相关地点吧。';
    }
    const html = `<div class="modal-overlay" id="lockedHintModal">
        <div class="modal-box">
            <div style="font-size:2em;">🔒</div>
            <p>${msg}</p>
            <button class="btn" id="closeLockedHint" style="width:100%;margin-top:10px;">知道了</button>
        </div>
    </div>`;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    document.getElementById('closeLockedHint').addEventListener('click', () => {
        document.getElementById('lockedHintModal').remove();
    });
}

// 无法外出弹窗
export function showCantGoOutModal() {
    const p = state.player;
    const reason = p.sick
        ? '你生病了，只能待在家里休养。'
        : (p.time === 3 && p.stats.health < 100
            ? '深夜时分，生命值不满100，不能外出。'
            : '现在无法外出。');
    const html = `<div class="modal-overlay" id="cantGoModal">
        <div class="modal-box">
            <div style="font-size:2em;">🏠</div>
            <p>${reason}</p>
            <button class="btn" id="closeCantGo" style="width:100%;margin-top:10px;">知道了</button>
        </div>
    </div>`;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    document.getElementById('closeCantGo').addEventListener('click', () => {
        document.getElementById('cantGoModal').remove();
    });
}

// 显示行动结果
export function showActionResult(logText, place) {
    const pn = place.name;
    const rl = state.logs.filter(l => l.place === pn).slice(0, 3);
    const hh = rl.length
        ? rl.map(l => `<div style="text-align:left;font-size:0.75em;border-bottom:1px dotted #ffd6e7;padding:2px 0;"><span style="color:var(--accent);">${l.time}</span> ${l.text}</div>`).join('')
        : '<div style="color:var(--text2);">暂无近期记录</div>';
    const html = `<div class="modal-overlay" id="resultModal">
        <div class="modal-box">
            <div style="font-weight:700;color:var(--accent);">📍 ${pn}</div>
            <div style="margin:15px 0;font-size:1em;font-weight:600;">${logText}</div>
            <div style="text-align:left;margin-top:12px;">
                <div style="font-weight:700;color:var(--accent);margin-bottom:4px;">📜 近期记录</div>
                ${hh}
            </div>
            <button class="btn" id="closeResult" style="width:100%;margin-top:12px;">继续</button>
        </div>
    </div>`;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    document.getElementById('closeResult').addEventListener('click', () => {
        document.getElementById('resultModal').remove();
        renderPlaces();
        checkAndShowPendingDailyEvents();
    });
}

// 无礼物提示
export function showNoGiftModal() {
    const html = `<div class="modal-overlay" id="noGiftModal">
        <div class="modal-box">
            <div style="font-size:2em;">🎁</div>
            <p>你还没有准备礼物呢！</p>
            <button class="btn" id="closeNoGift" style="width:100%;margin-top:10px;">知道了</button>
        </div>
    </div>`;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    document.getElementById('closeNoGift').addEventListener('click', () => {
        document.getElementById('noGiftModal').remove();
    });
}

// 设置页面
export function renderSettings() {
    const tb = Object.entries(themes).map(([k, t]) =>
        `<div class="color-dot${state.currentTheme===k?' active':''}" data-theme="${k}" style="background:${t.primary};" title="${t.name}"></div>`
    ).join('');
    const autoModes = ['never', 'day', 'week'];
    const modeNames = { never:'从不', day:'每1天', week:'每7天' };
    const modeBtns = autoModes.map(m =>
        `<button class="btn${state.autoSaveMode===m?' active-btn':''}" id="autoModeBtn_${m}">${modeNames[m]}</button>`
    ).join('');

    document.getElementById('contentArea').innerHTML = `
        <div class="card"><b>💾 存档管理</b><br><button class="btn" id="openSaveLoad">📂 存档 / 读档（共5个存档位）</button></div>
        <div class="card"><b>🏆 收藏品</b><br><div style="display:flex;gap:8px;justify-content:center;">
            <button class="btn" id="openEndingGallery2">📖 结局图鉴</button>
            <button class="btn" id="openAchievementGallery2">🏆 成就查看</button>
        </div></div>
        <div class="card"><b>⚙️ 自动存档</b><br><div style="display:flex;gap:8px;justify-content:center;">${modeBtns}</div>
            <div style="font-size:0.75em;color:var(--text2);margin-top:8px;">自动存档位：存档1（仅可读档）</div>
        </div>
        <div class="card">
            <b>🎵 背景音乐</b><br>
            <div style="text-align:center; margin-bottom:6px; font-size:0.9em; color:var(--accent);" id="currentSongName">
                加载中...
            </div>
            <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">
                <button class="btn" id="prevTrackBtn" style="flex:1; min-width:50px;">⏮️</button>
                <button class="btn" id="toggleBgmBtn" style="flex:1; min-width:80px;">⏯️</button>
                <button class="btn" id="nextTrackBtn" style="flex:1; min-width:50px;">⏭️</button>
            </div>
            <div style="display:flex; gap:6px; justify-content:center; margin-top:6px;">
                <button class="btn" id="modeBtn" style="flex:1;">🔁 顺序</button>
            </div>
        </div>
        <div class="card"><b>🎨 UI色调</b><br><div style="display:flex;justify-content:center;flex-wrap:wrap;">${tb}</div></div>
        <div class="card"><button class="btn" id="restartBtn">🔄 重新开始</button></div>
    `;

    // 音乐控制按钮
    const bgmBtn = document.getElementById('toggleBgmBtn');
    const prevBtn = document.getElementById('prevTrackBtn');
    const nextBtn = document.getElementById('nextTrackBtn');
    const modeBtn = document.getElementById('modeBtn');
    const songNameEl = document.getElementById('currentSongName');

    function updateMusicUI() {
        if (songNameEl) songNameEl.textContent = getCurrentTrackName();
        if (bgmBtn) bgmBtn.textContent = getMusicPaused() ? '▶️ 播放' : '⏯️ 暂停';
        if (modeBtn) {
            const mode = getPlayMode();
            const modeText = mode === 'single' ? '🔂 单曲循环' : mode === 'order' ? '🔁 顺序播放' : '🎲 随机播放';
            modeBtn.textContent = modeText;
        }
    }

    if (bgmBtn) bgmBtn.addEventListener('click', () => { togglePlayPause(); updateMusicUI(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prevTrack(); updateMusicUI(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { nextTrack(); updateMusicUI(); });
    if (modeBtn) modeBtn.addEventListener('click', () => {
        const modes = ['order', 'random', 'single'];
        const current = modes.indexOf(getPlayMode());
        const nextMode = modes[(current + 1) % 3];
        setPlayMode(nextMode);
        updateMusicUI();
    });

    updateMusicUI();

    // 其他按钮事件
    document.getElementById('openSaveLoad').addEventListener('click', openSaveLoadModal);
    document.getElementById('openEndingGallery2').addEventListener('click', showEndingGallery);
    document.getElementById('openAchievementGallery2').addEventListener('click', showAchievementsModal);
    document.querySelectorAll('.color-dot').forEach(d => d.addEventListener('click', function() {
        applyTheme(this.dataset.theme);
        document.querySelectorAll('.color-dot').forEach(dd => dd.classList.remove('active'));
        this.classList.add('active');
    }));
    document.getElementById('restartBtn').addEventListener('click', () => window.restartGame());

    autoModes.forEach(m => {
        document.getElementById(`autoModeBtn_${m}`).addEventListener('click', () => {
            state.autoSaveMode = m;
            showToast(m !== 'never' ? `✅ 自动存档：${modeNames[m]}` : '自动存档已关闭');
            renderSettings();
        });
    });
}

// 存档管理弹窗（已导出）
export function openSaveLoadModal() {
    const slots = getSaveSlots();
    let html = '';
    for (let i = 0; i < 5; i++) {
        const d = slots[i];
        const isAuto = i === 0;
        html += `<div class="save-slot${isAuto?' auto-slot':''}">
            <b>存档 ${i+1}${isAuto?' (自动)':''}</b><br>
            <span style="color:var(--text2)">${d?formatSlotInfo(d):'空'}</span>
            <div style="margin-top:5px;display:flex;gap:5px;">
                ${!isAuto?`<button class="btn save-action" data-slot="${i}" style="flex:1;">💾保存</button>`:''}
                <button class="btn load-action" data-slot="${i}" style="flex:1;">📤读取</button>
            </div>
        </div>`;
    }
    const modalHtml = `<div class="modal-overlay" id="saveModal">
        <div class="modal-box">
            <div style="font-weight:700;color:var(--accent);margin-bottom:10px;">💾 存档 / 读档</div>
            ${html}
            <button class="btn" id="closeSaveModal" style="width:100%;margin-top:10px;">返回</button>
        </div>
    </div>`;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('closeSaveModal').addEventListener('click', () => document.getElementById('saveModal').remove());
    document.querySelectorAll('.save-action').forEach(btn => btn.addEventListener('click', function() {
        const slot = parseInt(this.dataset.slot);
        if (getSaveSlots()[slot] && !confirm(`存档 ${slot+1} 已有记录，确定覆盖吗？`)) return;
        saveToSlot(slot);
        showToast(`✅ 已保存到存档 ${slot+1}`);
        document.getElementById('saveModal').remove();
    }));
    document.querySelectorAll('.load-action').forEach(btn => btn.addEventListener('click', function() {
        if (loadFromSlot(parseInt(this.dataset.slot))) {
            showToast(`✅ 已读取存档 ${parseInt(this.dataset.slot)+1}`);
            document.getElementById('saveModal').remove();
            document.getElementById('topBar').style.display = 'flex';
            document.getElementById('navBar').style.display = 'flex';
            state.gameStarted = true;
            updateTopBar();
            renderHome();
        } else {
            alert('该存档位为空。');
        }
    }));
}

// 结局图鉴
function showEndingGallery() {
    const unlocked = JSON.parse(localStorage.getItem('beastLove_endings') || '[]');
    let html = '<div class="modal-overlay" id="galleryModal"><div class="modal-box"><h2>📖 结局图鉴</h2><div class="ending-grid">';
    ALL_ENDINGS.forEach(e => {
        const isUnlocked = unlocked.includes(e.id);
        html += `<div class="ending-item${isUnlocked?'':' locked'}"><div class="ending-icon">${isUnlocked ? e.icon : '❓'}</div><div>${isUnlocked ? e.name : '？？？'}</div><div style="font-size:0.7em;color:var(--text2);">${isUnlocked ? e.desc : '尚未解锁'}</div></div>`;
    });
    html += '</div><button class="btn" id="closeGallery" style="width:100%;margin-top:15px;">返回</button></div></div>';
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    document.getElementById('closeGallery').addEventListener('click', () => document.getElementById('galleryModal').remove());
}

// 成就查看
function showAchievementsModal() {
    const unlocked = JSON.parse(localStorage.getItem('beastLove_achievements') || '[]');
    let html = '<div class="modal-overlay" id="achievementModal"><div class="modal-box"><h2>🏆 成就</h2><div class="achievement-grid">';
    ACHIEVEMENTS.forEach(a => {
        const isUnlocked = unlocked.includes(a.id);
        html += `<div class="achievement-item${isUnlocked?'':' locked'}"><div class="ending-icon">${isUnlocked ? a.icon : '❓'}</div><div>${isUnlocked ? a.name : '？？？'}</div><div style="font-size:0.7em;color:var(--text2);">${isUnlocked ? a.desc : '尚未达成'}</div></div>`;
    });
    HIDDEN_ACHIEVEMENTS.forEach(a => {
        if (unlocked.includes(a.id)) html += `<div class="achievement-item"><div class="ending-icon">${a.icon}</div><div>${a.name}</div><div style="font-size:0.7em;color:var(--text2);">${a.desc}</div></div>`;
    });
    html += '</div><button class="btn" id="closeAchievement" style="width:100%;margin-top:15px;">返回</button></div></div>';
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    document.getElementById('closeAchievement').addEventListener('click', () => document.getElementById('achievementModal').remove());
}

// 开始界面
export function renderStartScreen() {
    const keys = ['health','charm','intuition','endurance','talent','affinity'];
    const icons = ['❤️','💖','🔮','🛡️','🎨','🤝'];
    const names = ['生命','魅力','直觉','体质','才艺','亲和'];
    const sh = keys.map((k, i) => `
        <div class="stat-mini-item">
            <span>${icons[i]}</span>
            <div class="stat-mini-value" id="val${k.charAt(0).toUpperCase()+k.slice(1)}">${window.tempStats ? window.tempStats[k] : ''}</div>
            <div class="stat-mini-name">${names[i]}</div>
        </div>`).join('');
    const ah = avatarList.map((av, i) => `
        <div class="avatar-option${i===0?' selected':''}" data-avatar="${av.emoji}" title="${av.desc}">${av.emoji}</div>`).join('');
    document.getElementById('contentArea').innerHTML = `
        <div class="start-screen">
            <div class="start-title">兽 世 恋 歌</div>
            <div class="start-subtitle">～ 现代少女 × 毛茸茸兽人 ～</div>
            <div class="input-group"><label>✏️ 你的名字</label><br><input type="text" id="playerNameInput" value="小春" maxlength="10"></div>
            <div style="font-weight:700;color:var(--accent);">👩🏻 选择头像</div>
            <div class="avatar-grid" id="startAvatarGrid">${ah}</div>
            <div class="stats-mini">
                <div class="stats-mini-title">✨ 初始属性（生命上限可通过锻炼提升至100，其他属性上限100）</div>
                <div class="stats-mini-grid">${sh}</div>
                <button class="random-btn" id="randomStatsBtn">🎲 随机属性</button>
            </div>
            <button class="start-btn" id="enterGameBtn">🌸 踏入兽世 🌸</button>
            <div style="display:flex;gap:10px;">
                <button class="btn" id="galleryBtn" style="background:#aaa;">📖 结局图鉴</button>
                <button class="btn" id="achievementStartBtn" style="background:#aaa;">🏆 成就</button>
            </div>
        </div>`;
    // 初始化临时属性
    window.tempStats = window.tempStats || { health:90, charm:12, intuition:10, endurance:5, talent:8, affinity:15 };
    const updateStatsDisplay = () => {
        keys.forEach((k, i) => {
            const el = document.getElementById('val'+k.charAt(0).toUpperCase()+k.slice(1));
            if (el) el.textContent = window.tempStats[k];
        });
    };
    updateStatsDisplay();
    // 头像选择
    document.querySelectorAll('#startAvatarGrid .avatar-option').forEach(opt => opt.addEventListener('click', function() {
        document.querySelectorAll('#startAvatarGrid .avatar-option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
        window.selectedAvatar = this.dataset.avatar;
    }));
    // 随机属性
    document.getElementById('randomStatsBtn').addEventListener('click', () => {
        window.tempStats.health = Math.floor(Math.random()*21)+80;
        window.tempStats.charm = Math.floor(Math.random()*8)+8;
        window.tempStats.intuition = Math.floor(Math.random()*9)+6;
        window.tempStats.endurance = Math.floor(Math.random()*8)+3;
        window.tempStats.talent = Math.floor(Math.random()*8)+5;
        window.tempStats.affinity = Math.floor(Math.random()*11)+10;
        updateStatsDisplay();
    });
    // 进入游戏
    document.getElementById('enterGameBtn').addEventListener('click', () => {
        state.player.name = document.getElementById('playerNameInput').value.trim() || '小春';
        state.player.avatar = window.selectedAvatar || '👧🏻';
        Object.keys(window.tempStats).forEach(k => state.player.stats[k] = window.tempStats[k]);
        state.player.maxHealth = window.tempStats.health;
        showIntroModal();
    });
    document.getElementById('galleryBtn').addEventListener('click', showEndingGallery);
    document.getElementById('achievementStartBtn').addEventListener('click', showAchievementsModal);
}

function showIntroModal() {
    document.getElementById('contentArea').innerHTML = `<div class="modal-overlay" id="introModal">
        <div class="modal-box">
            <div style="font-size:2.5em;">🌸</div>
            <b style="font-size:1.1em;color:var(--accent);">欢迎来到兽世</b>
            <p>✨ 你——<b>${state.player.name}</b>，一名21世纪的普通大学生。<br>在一次意外中穿越到了兽人统治的原始世界。<br><br>
            🌿 目前你可前往：<b>部落广场、训练场、铁匠铺、河边、市场</b>。<br>
            通过反复探索这些地点，你可能会发现通往新地点的线索，或是邂逅神秘的兽人男性……<br><br>
            ⚠️ 生命值低于100时，<b>深夜</b>只能待在家里。<br>生病时<b>全天</b>只能在家休养。<br>
            部分男主好感高了会自然产生占有欲，请谨慎管理每一段关系。</p>
            <button class="btn" id="closeIntro">🌸 开始冒险</button>
        </div>
    </div>`;
    document.getElementById('closeIntro').addEventListener('click', () => {
        document.getElementById('introModal').remove();
        state.gameStarted = true;
        document.getElementById('topBar').style.display = 'flex';
        document.getElementById('navBar').style.display = 'flex';

        // 自动播放背景音乐
        playMusic();

        addLog('你从21世纪穿越到了兽世部落，长老收留了你。');
        addLog('💡新手提示：点击底部【地点】标签，选择地点进行探索吧！');
        addLog('💡恢复生命：在家休息可恢复5-10点生命，温泉恢复20点，锻炼也能小幅恢复。');
        if (state.player.maxHealth < 100) addLog('💡提升生命上限：去训练场锻炼身体有概率提升生命值上限（最高100点）。');
        addLog('💡偶遇男主：在训练场、月崖、密林小径等地探索，有机会邂逅他们。');
        updateTopBar();
        renderHome();
    });
}