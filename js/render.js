// render.js - 完整版（增加全局异常捕获与容错）
// ★ 修复：移除对 main.js 的导入，改用 window 对象（打破循环依赖）
import { state, getGuy, getNPC, getNPCs, addLog, updateTopBar, getTodayEvents, canGoOut, saveToSlot, loadFromSlot, getSaveSlots, applyTheme, formatSlotInfo, getDateInfo, getSeason, getSeasonEmoji, isHuntingSeason, isGuyBirthday, isPlayerBirthday, getAge, MAX_NPC, addNPC, addWorldManual, reorderPlaces, DAILY_FOOD_COST, getActiveQuest, isQuestAccepted, isQuestCompleted, getQuestStatus, getQuestStep, acceptQuest } from './state.js';
import { statInfo, themes, avatarList, ALL_ENDINGS, ACHIEVEMENTS, HIDDEN_ACHIEVEMENTS, GUY_RELATIONSHIPS, RELATION_TYPES, COLLECTIBLES } from './data.js';
import { showToast, showGlobalModal, showInventoryModal, showNPCFirstMeetModal, showNPCRescueModal, showNPCGiftModal, playMusic, togglePlayPause, nextTrack, prevTrack, setPlayMode, getPlayMode, getCurrentTrackName, getMusicPaused, preloadStudioLogo } from './ui.js';
import { openPlaceActions, handleGuyHomeVisit, resolveExplore, advanceTime, getMeetProbability, addAffectionAndObsession, buildRelationshipMap, showFirstMeetModal } from './actions.js';
import { GUY_QUESTS } from './actions.js';
import { checkAndShowPendingDailyEvents } from './events.js';
import { startTutorial, skipTutorial } from './tutorial.js';
import { initCloudSave, isCloudSaveSupported, showCloudSaveManagerUI, uploadArchiveToCloud, getCloudArchiveList } from './cloud.js';

// ========== 辅助：图片压缩 ==========
function compressImage(dataUrl, maxWidth, maxHeight, callback, errorCallback) {
    const img = new Image();
    img.onload = function() {
        try {
            let w = img.width, h = img.height;
            if (w > maxWidth) { h = h * (maxWidth / w); w = maxWidth; }
            if (h > maxHeight) { w = w * (maxHeight / h); h = maxHeight; }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.7);
            callback(compressed);
        } catch (e) {
            console.warn('压缩失败，使用原图', e);
            if (errorCallback) errorCallback(e);
            else callback(dataUrl);
        }
    };
    img.onerror = function(err) {
        console.warn('图片加载失败，使用原图', err);
        if (errorCallback) errorCallback(err);
        else callback(dataUrl);
    };
    img.src = dataUrl;
}

function highlightNames(text) {
    if (!text) return text;
    let result = text;
    try {
        state.guys.forEach(g => {
            const regex = new RegExp(g.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            result = result.replace(regex, `<span style="color:#fff;background:#e84393;font-weight:700;text-decoration:underline;padding:1px 6px;border-radius:4px;">${g.name}</span>`);
        });
        state.npcs.forEach(n => {
            const regex = new RegExp(n.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            result = result.replace(regex, `<span style="color:#fff;background:#2980b9;font-weight:700;text-decoration:underline;padding:1px 6px;border-radius:4px;">${n.name}</span>`);
        });
    } catch (e) {
        console.warn('高亮处理失败', e);
    }
    return result;
}

function getDisplayName(role) {
    if (!role) return '???';
    return role.customName && role.customName.trim() !== '' ? role.customName : role.name;
}

// ========== 改名相关 ==========
function renameRole(roleId, roleType) {
    try {
        let role = null;
        if (roleType === 'guy') {
            role = getGuy(roleId);
        } else if (roleType === 'npc') {
            role = getNPC(roleId);
        }
        if (!role) {
            showToast('角色不存在');
            return;
        }
        if (role.renameUnlocked) {
            showRenameInputModal(role, roleType);
        } else {
            showAdConfirmModal(role, roleType);
        }
    } catch (e) {
        console.error('改名失败:', e);
        showToast('操作失败，请重试');
    }
}

function showAdConfirmModal(role, roleType) {
    const html = `
        <div class="global-overlay" id="adConfirmModal">
            <div class="modal-box" style="max-width:420px;text-align:center;">
                <div style="font-size:3em;">🎬</div>
                <div style="font-weight:700;font-size:1.2em;margin:10px 0;">解锁改名权限</div>
                <p>观看一段广告即可解锁 <b>${getDisplayName(role)}</b> 的改名权限，之后可随意修改名字。</p>
                <p style="font-size:0.85em;color:var(--text2);">每个角色独立解锁，新游戏需重新解锁。</p>
                <div style="display:flex;gap:10px;margin-top:20px;justify-content:center;">
                    <button class="btn" id="adCancelBtn" style="flex:1;background:#ccc;color:#666;">取消</button>
                    <button class="btn" id="adWatchBtn" style="flex:2;background:linear-gradient(135deg,#ff6b6b,#ee5a24);">🎬 观看广告</button>
                </div>
            </div>
        </div>
    `;
    const modal = showGlobalModal(html, 'adConfirmModal');
    if (!modal) return;
    modal.querySelector('#adCancelBtn').addEventListener('click', () => { modal.remove(); });
    modal.querySelector('#adWatchBtn').addEventListener('click', () => {
        modal.remove();
        if (window.showAdForRename) {
            window.showAdForRename(roleType, role.id, () => {
                role.renameUnlocked = true;
                addLog(`🔓 你解锁了 ${getDisplayName(role)} 的改名权限！`, null, 'system');
                showToast('✅ 改名权限已解锁！');
                showRenameInputModal(role, roleType);
                renderCurrentView();
            });
        } else {
            showToast('⚠️ 广告功能不可用，请检查网络');
        }
    });
}

function showRenameInputModal(role, roleType) {
    const currentName = getDisplayName(role);
    const html = `
        <div class="global-overlay" id="renameInputModal">
            <div class="modal-box" style="max-width:420px;">
                <div style="font-weight:700;color:var(--accent);font-size:1.1em;margin-bottom:10px;">✏️ 为 ${currentName} 改名</div>
                <input type="text" id="renameInput" value="${currentName}" placeholder="输入新名字..." maxlength="20" style="width:100%;padding:10px;border-radius:12px;border:2px solid var(--border);font-size:1rem;background:#fff;color:var(--text);">
                <div style="display:flex;gap:10px;margin-top:15px;justify-content:center;">
                    <button class="btn" id="renameCancelBtn" style="flex:1;background:#ccc;color:#666;">取消</button>
                    <button class="btn" id="renameConfirmBtn" style="flex:2;background:var(--accent);">确认改名</button>
                </div>
            </div>
        </div>
    `;
    const modal = showGlobalModal(html, 'renameInputModal');
    if (!modal) return;
    const input = modal.querySelector('#renameInput');
    input.focus();
    input.select();
    modal.querySelector('#renameCancelBtn').addEventListener('click', () => { modal.remove(); });
    modal.querySelector('#renameConfirmBtn').addEventListener('click', () => {
        const newName = input.value.trim();
        if (newName === '') {
            showToast('名字不能为空');
            return;
        }
        role.customName = newName;
        addLog(`✏️ 已将 ${role.name} 的名字改为"${newName}"`, null, 'system');
        modal.remove();
        showToast(`✅ 已改名为"${newName}"`);
        renderCurrentView();
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            modal.querySelector('#renameConfirmBtn').click();
        }
    });
}

function renderCurrentView() {
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
        console.error('渲染当前视图失败:', e);
        document.getElementById('contentArea').innerHTML = `<div style="padding:20px;color:red;">页面加载失败：${e.message}</div>`;
    }
}

export function render() {
    renderCurrentView();
}

// ===== 头像选择器 =====
export function showAvatarSelectorModal(callback) {
    const html = `<div class="global-overlay" id="avatarSelectorModal">
        <div class="modal-box">
            <div style="font-weight:700;color:var(--accent);margin-bottom:10px;">👤 选择头像</div>
            <div class="avatar-grid" style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;">
                ${avatarList.map(av => `<div class="avatar-option" data-avatar="${av.emoji}" title="${av.desc}" style="font-size:2rem;cursor:pointer;border-radius:50%;width:56px;height:56px;display:flex;align-items:center;justify-content:center;background:#fff0f5;border:3px solid transparent;transition:0.2s;">${av.emoji}</div>`).join('')}
            </div>
            <button class="btn" id="closeAvatarSelector" style="width:100%;margin-top:10px;">取消</button>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'avatarSelectorModal');
    if (!modal) return;
    modal.querySelectorAll('.avatar-option').forEach(el => {
        el.addEventListener('click', function() {
            const avatar = this.dataset.avatar;
            modal.remove();
            if (callback) callback(avatar);
        });
    });
    modal.querySelector('#closeAvatarSelector').addEventListener('click', () => modal.remove());
}

function getRelationText(guy) {
    if (guy.dating) return '💕 伴侣';
    if (guy.affection >= 70) return '👭 亲友';
    if (guy.affection >= 50) return '👫 朋友';
    if (guy.affection >= 20) return '🤝 熟悉';
    return '❓ 陌生';
}

export function isNPCBirthday(npc, day) {
    const { month, dayInMonth } = getDateInfo(day);
    return month === npc.birthMonth && dayInMonth === npc.birthDay;
}

function showWorldManualModal() {
    try {
        const manual = state.worldManual;
        if (manual.length === 0) {
            showToast('📖 世界手册暂无内容');
            return;
        }
        const html = `<div class="global-overlay" id="worldManualModal">
            <div class="modal-box" style="max-width:600px;">
                <div style="font-weight:700;color:var(--accent);font-size:1.2em;margin-bottom:10px;">📖 世界手册</div>
                <div style="max-height:60vh;overflow-y:auto;text-align:left;font-size:0.9em;line-height:1.8;">
                    ${manual.map(text => `<div style="border-bottom:1px dotted #ffd6e7;padding:6px 0;">${text}</div>`).join('')}
                </div>
                <button class="btn" id="closeManual" style="width:100%;margin-top:10px;">关闭</button>
            </div>
        </div>`;
        const modal = showGlobalModal(html, 'worldManualModal');
        if (modal) modal.querySelector('#closeManual').addEventListener('click', () => modal.remove());
    } catch (e) {
        console.error('打开世界手册失败:', e);
        showToast('无法打开手册');
    }
}

// ===== 主页渲染 =====
export function renderHome() {
    try {
        const stats = state.player.stats;
        const maxHp = state.player.maxHealth || 90;
        const dateInfo = getDateInfo(state.player.day);
        const season = getSeason(dateInfo.month);
        const seasonEmoji = getSeasonEmoji(dateInfo.month);
        const isHunting = isHuntingSeason(state.player.day);

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
        const isMovedIn = state.player.movedIn !== null;
        const foodCostDisplay = isMovedIn ? '（无需支付）' : `（每日需${DAILY_FOOD_COST}金币）`;
        let goldDisplay = `<div style="margin-top:6px;font-weight:700;color:var(--accent);">
            💰 金币：${state.player.gold} 
            <span style="font-size:0.7em;color:var(--text2);">${foodCostDisplay}</span>
        </div>`;
        const healthBar = `<div style="margin-top:8px;">❤️ 生命：<progress value="${stats.health}" max="${maxHp}" style="width:100%;height:10px;"></progress> ${stats.health}/${maxHp} ${maxHpTip}</div>`;
        const invCount = state.player.inventory.length;
        const invText = invCount > 0 ? `🎒 背包: <span class="inv-clickable" id="openInventoryBtn">${invCount}件礼物</span>` : '🎒 背包: 空空如也';
        const movedText = state.player.movedIn ? `🏠 已与${getGuy(state.player.movedIn)?.name||'伴侣'}同居` : '';
        const sickText = state.player.sick ? `🤒 生病中，剩余${state.player.sickDays}天，只能待在家里` : (state.player.time === 3 && stats.health < 100 ? `🌙 深夜生命值不足100，只能在家休息` : (stats.health < 100 ? `⚠️ 生命值不满，深夜将无法出门` : ''));
        const huntingText = isHunting ? '🏹 狩猎季：兽人早出晚归，相遇概率降低' : '';
        const seasonText = `${seasonEmoji} ${season}`;

        let birthdayText = '';
        if (isPlayerBirthday(state.player.day)) {
            birthdayText = `<div style="background:linear-gradient(135deg,#ffd6e7,#ffb6d1);border-radius:12px;padding:10px;text-align:center;font-weight:700;color:#c0392b;">🎂 今天是你生日！兽人们可能会送来惊喜！</div>`;
        }
        for (let guy of state.guys) {
            if (isGuyBirthday(guy, state.player.day)) {
                birthdayText = `<div style="background:linear-gradient(135deg,#ffd6e7,#ffb6d1);border-radius:12px;padding:10px;text-align:center;font-weight:700;color:#c0392b;">🎂 今天是 ${guy.emoji} ${guy.name} 的生日！送礼好感度+30%！</div>`;
                break;
            }
        }

        const filterLabels = {
            all: '全部',
            player: '👤 我的',
            guy: '❤️ 男主',
            npc: '👥 NPC',
            system: '📋 系统'
        };
        const currentFilter = state.player.logFilter || 'all';
        const filterBtnsHtml = Object.entries(filterLabels).map(([key, label]) =>
            `<button class="log-filter-btn ${currentFilter === key ? 'active' : ''}" data-filter="${key}">${label}</button>`
        ).join('');

        const logTypes = state.player.logTypes || { player: true, guy: true, npc: true, system: true };
        let filteredLogs = state.logs.slice(0, 30);
        filteredLogs = filteredLogs.filter(l => {
            const type = l.type || 'system';
            return logTypes[type] !== false;
        });
        if (currentFilter !== 'all') {
            filteredLogs = filteredLogs.filter(l => {
                const type = l.type || 'system';
                return type === currentFilter;
            });
        }
        const logHtml = filteredLogs.map(l => {
            const highlightedText = highlightNames(l.text);
            const typeLabels = { player: '👤', guy: '❤️', npc: '👥', system: '📋' };
            const label = typeLabels[l.type] || '📋';
            return `<div class="log-entry">
                <span style="color:var(--accent);">${l.time}</span> ${label} ${highlightedText}
            </div>`;
        }).join('');

        const events = getTodayEvents(state.player.day);
        const eventBanner = events.length
            ? `<div class="event-banner">🎉 ${events.map(e => `${e.name} 📍${e.locations.join('、')}`).join(' & ')} 进行中！</div>`
            : '';

        document.getElementById('contentArea').innerHTML = `
            ${eventBanner}
            ${birthdayText}
            <div class="card" style="text-align:center;background:rgba(255,240,245,0.8);">
                <div style="font-size:0.9em;color:var(--text2);">${seasonText}</div>
                ${huntingText ? `<div style="font-size:0.8em;color:#c0392b;">${huntingText}</div>` : ''}
            </div>
            <div class="card">
                <div style="font-weight:700;color:var(--accent);margin-bottom:8px;">✨ 我的属性</div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">${statsHtml}</div>
                ${goldDisplay}
                ${healthBar}
                ${movedText ? `<div style="color:var(--accent);margin-top:4px;">${movedText}</div>` : ''}
                ${sickText ? `<div style="color:#c0392b;margin-top:4px;">${sickText}</div>` : ''}
                <div style="margin-top:8px;font-size:0.9em;color:var(--accent);">${invText}</div>
            </div>
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <div style="font-weight:700;color:var(--accent);">📜 冒险日志</div>
                    <button class="btn" id="openWorldManual" style="font-size:0.7em;padding:4px 12px;background:var(--accent2);">📖 世界手册</button>
                </div>
                <div class="log-filters" style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px;">
                    ${filterBtnsHtml}
                </div>
                <div style="max-height:300px;overflow-y:auto;">${logHtml || '<span style="color:var(--text2)">暂无记录</span>'}</div>
            </div>`;

        if (invCount > 0) {
            const btn = document.getElementById('openInventoryBtn');
            if (btn) btn.addEventListener('click', showInventoryModal);
        }
        const manualBtn = document.getElementById('openWorldManual');
        if (manualBtn) manualBtn.addEventListener('click', showWorldManualModal);
        document.querySelectorAll('.log-filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const filter = this.dataset.filter;
                state.player.logFilter = filter;
                renderHome();
            });
        });
    } catch (e) {
        console.error('❌ renderHome 执行失败:', e);
        document.getElementById('contentArea').innerHTML = `<div style="padding:20px;color:red;text-align:center;"><h3>主页加载失败</h3><p>${e.message}</p></div>`;
    }
}

// ===== 男主列表 =====
export function renderGuyList() {
    try {
        const guysHtml = state.guys.filter(g => !g.hidden || !g.locked).map(g => {
            let hintText = '';
            if (g.locked) {
                hintText = g.cluePlace === g.meetPlace ? `💡在<b>${g.meetPlace}</b>多探索几次或许能遇到他` : `💡在<b>${g.cluePlace}</b>探索可发现<b>${g.meetPlace}</b>`;
            } else if (g.sulkingDays > 0) {
                hintText = `💔 因心碎而躲着你，${g.sulkingDays}天后才愿意见你。`;
            }
            const avatarContent = g.avatar ? `<img src="${g.avatar}" style="width:70px;height:70px;border-radius:50%;object-fit:cover;background:#fff;border:2px solid var(--accent);" onerror="this.style.display='none';this.nextElementSibling.style.display='inline';">` : `<span class="guy-avatar" style="font-size:3.6em;line-height:1;">${g.emoji}</span>`;
            const isBirthday = isGuyBirthday(g, state.player.day);
            const displayName = getDisplayName(g);
            const isHeLocked = state.player.heEndings.includes(g.id);
            const unlocked = !g.locked && !g.banished;
            return `<div class="guy-card ${g.locked?'locked':''} ${g.banished?'banished':''}" data-guy-id="${g.id}">
                ${avatarContent}
                <div class="guy-info">
                    <div class="name-line">
                        <span>${displayName}</span>
                        ${!g.locked && !g.banished ? `<span class="rename-icon" data-role="guy" data-id="${g.id}" style="cursor:pointer;font-size:0.8rem;color:var(--accent);" title="改名">✏️</span>` : ''}
                        ${isBirthday ? '<span style="color:#c0392b;font-weight:700;"> 🎂生日</span>' : ''}
                        ${isHeLocked ? '<span style="color:#9b59b6;font-weight:700;"> 💞已魂契</span>' : ''}
                        <span class="relation-tag">${getRelationText(g)}</span>
                    </div>
                    <div class="sub-info">${g.race}${g.locked?' 🔒未解锁':''}${g.banished?' 🚫已疏远':''}</div>
                    ${unlocked ? `
                        <div class="progress-row">❤️<progress class="heart-bar" value="${g.affection}" max="100"></progress>${g.affection}</div>
                        <div class="progress-row">🔒<progress class="obsess-bar" value="${g.obsession}" max="100"></progress>${g.obsession}</div>
                    ` : `<div style="font-size:0.7em;color:var(--text2);">${hintText}</div>`}
                </div>
            </div>`;
        }).join('');
        document.getElementById('contentArea').innerHTML = `<div class="guy-cards">${guysHtml}</div>`;
        document.querySelectorAll('.guy-card:not(.locked):not(.banished)').forEach(card => {
            card.addEventListener('click', () => renderGuyDetail(card.dataset.guyId));
        });
        document.querySelectorAll('.rename-icon[data-role="guy"]').forEach(el => {
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.dataset.id;
                renameRole(id, 'guy');
            });
        });
    } catch (e) {
        console.error('❌ renderGuyList 执行失败:', e);
        document.getElementById('contentArea').innerHTML = `<div style="padding:20px;color:red;text-align:center;"><h3>男主列表加载失败</h3><p>${e.message}</p></div>`;
    }
}

// ===== 男主详情 =====
export function renderGuyDetail(guyId) {
    try {
        const guy = getGuy(guyId);
        if (!guy || guy.locked || guy.banished) return;
        const displayName = getDisplayName(guy);
        const guyLogs = state.logs.filter(l => l.text.includes(guy.name)).slice(0, 5);
        const logsHtml = guyLogs.length ? guyLogs.map(l => {
            const highlightedText = highlightNames(l.text);
            return `<div class="log-entry">${l.time} ${highlightedText}</div>`;
        }).join('') : '暂无';
        
        const avatarHtml = guy.avatar ? `<img src="${guy.avatar}" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);background:#fff;" onerror="this.style.display='none';this.nextElementSibling.style.display='inline';">` : `<span style="font-size:4em;line-height:1;">${guy.emoji}</span>`;
        const meetProb = getMeetProbability(guy);
        const meetProbText = isHuntingSeason(state.player.day) ? `狩猎季相遇概率：${Math.round(meetProb * 100)}%` : '';
        const isBirthday = isGuyBirthday(guy, state.player.day);
        const age = getAge(guy);
        const isHeLocked = state.player.heEndings.includes(guy.id);

        const birthdayInfo = guy.affection >= 30 ? 
            `<div class="card"><b>🎂 生日：</b>${guy.birthMonth}月${guy.birthDay}日（${getSeason(guy.birthMonth)}） · ${age}岁${isBirthday ? ' 🎉 今天生日！' : ''}</div>` :
            `<div class="card" style="color:var(--text2);"><b>🎂 生日：</b>💡 好感度达到30后可得知</div>`;

        let networkHtml = '';
        const metNpcs = state.npcs.filter(n => {
            const mapped = state.relationshipMap ? state.relationshipMap[n.id] : null;
            if (mapped === guy.id) return true;
            if (n.relationTag === guy.id + '_network') return true;
            if (n.relationGuy === guy.id) return true;
            return false;
        });
        const pending = state.pendingRelationships[guy.id] || [];
        if (metNpcs.length > 0 || pending.length > 0) {
            networkHtml = `<div class="card">
                <div style="font-weight:700;color:var(--accent);margin-bottom:8px;">🔗 关系网</div>`;
            if (metNpcs.length > 0) {
                networkHtml += `<div style="font-size:0.85em;color:var(--text2);margin-bottom:4px;">✅ 已遇到：</div>`;
                metNpcs.forEach(n => {
                    const relTypeInfo = RELATION_TYPES.find(r => r.type === n.relationType);
                    const relEmoji = relTypeInfo ? relTypeInfo.emoji : '💬';
                    networkHtml += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px dotted #ffd6e7;cursor:pointer;" data-npc-id="${n.id}" class="network-npc-item">
                        <span style="font-size:1.4em;">${n.emoji}</span>
                        <span style="font-weight:600;">${n.name}</span>
                        <span style="font-size:0.75em;background:var(--accent2);color:#fff;border-radius:10px;padding:0 8px;">${relEmoji} ${n.relationType || '相识'}</span>
                        <span style="font-size:0.7em;color:var(--text2);margin-left:auto;">❤️${n.favorability}</span>
                    </div>
                    ${n.relationDesc ? `<div style="font-size:0.7em;color:var(--text2);padding-left:40px;padding-bottom:4px;font-style:italic;">${n.relationDesc}</div>` : ''}`;
                });
            }
            if (pending.length > 0) {
                networkHtml += `<div style="font-size:0.85em;color:var(--text2);margin-top:6px;margin-bottom:4px;">❓ 尚未遇到：</div>`;
                pending.forEach(npcData => {
                    const relTypeInfo = RELATION_TYPES.find(r => r.type === npcData.relationType);
                    const relEmoji = relTypeInfo ? relTypeInfo.emoji : '💬';
                    networkHtml += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px dotted #ffd6e7;opacity:0.6;">
                        <span style="font-size:1.4em;">❓</span>
                        <span style="font-weight:600;color:var(--text2);">???</span>
                        <span style="font-size:0.75em;background:#ccc;color:#666;border-radius:10px;padding:0 8px;">${relEmoji} ${npcData.relationType || '相识'}</span>
                        <span style="font-size:0.7em;color:var(--text2);margin-left:auto;">❌ 未遇到</span>
                    </div>
                    ${npcData.relationDesc ? `<div style="font-size:0.7em;color:var(--text2);padding-left:40px;padding-bottom:4px;font-style:italic;opacity:0.6;">${npcData.relationDesc}</div>` : ''}`;
                });
                networkHtml += `<div style="font-size:0.7em;color:var(--text2);margin-top:4px;">💡 在 ${guy.mainPlaces ? guy.mainPlaces.join('、') : '相关地点'} 探索可能遇到</div>`;
            }
            networkHtml += `</div>`;
        }

        // 任务面板
        let questHtml = '';
        const guyQuests = GUY_QUESTS[guy.id];
        if (guyQuests) {
            questHtml = `<div class="card"><div style="font-weight:700;color:var(--accent);margin-bottom:8px;">📋 支线任务</div>`;
            guyQuests.forEach(q => {
                const qs = getQuestStatus(q.id);
                const isAccepted = qs.accepted;
                const isCompleted = qs.completed;
                const stepIndex = qs.stepIndex;
                const steps = q.steps;
                let statusText = isCompleted ? '✅ 已完成' : (isAccepted ? `⏳ 进行中 (${stepIndex+1}/${steps.length})` : '🔒 未接取');
                let actionHtml = '';
                if (!isAccepted && !isCompleted) {
                    let condText = '';
                    if (q.unlockCondition) {
                        const cond = q.unlockCondition;
                        const parts = [];
                        if (cond.affection) parts.push(`好感≥${cond.affection}`);
                        if (cond.day) parts.push(`天数≥${cond.day}`);
                        if (cond.questCompleted) {
                            const prevQuest = GUY_QUESTS[guy.id]?.find(qq => qq.id === cond.questCompleted);
                            parts.push(`完成「${prevQuest?.name || cond.questCompleted}」`);
                        }
                        condText = parts.join('，');
                    }
                    actionHtml = `<button class="btn quest-accept-btn" data-quest-id="${q.id}" data-guy-id="${guy.id}" style="font-size:0.7rem;padding:4px 12px;margin-top:4px;">📥 接取任务</button>
                                  <div style="font-size:0.65rem;color:var(--text2);">条件：${condText || '自动解锁'}</div>
                                  <div style="font-size:0.65rem;color:var(--accent);">📍 地点：${q.location || '未知'}</div>`;
                } else if (isAccepted && !isCompleted) {
                    const currentStep = steps[stepIndex];
                    actionHtml = `<div style="font-size:0.75rem;color:var(--accent);">📍 地点：${q.location || '未知'}</div>
                                  <div style="font-size:0.75rem;">${currentStep ? currentStep.text : '已完成所有步骤'}</div>`;
                } else {
                    actionHtml = `<div style="font-size:0.75rem;color:var(--text2);">任务已完成</div>`;
                }
                questHtml += `<div style="border-bottom:1px dotted #ffd6e7;padding:6px 0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-weight:600;">${q.name}</span>
                        <span style="font-size:0.7rem;color:var(--text2);">${statusText}</span>
                    </div>
                    <div style="font-size:0.8rem;color:var(--text2);">${q.desc}</div>
                    ${actionHtml}
                </div>`;
            });
            questHtml += `</div>`;
        }

        document.getElementById('contentArea').innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap;">
                <button class="btn" id="backToGuys">←</button>
                <div style="display:flex;align-items:center;gap:6px;">
                    ${avatarHtml}
                    <span style="font-size:1.5em;opacity:0.7;">${guy.emoji}</span>
                    ${isBirthday ? '<span style="font-size:1.5em;">🎂</span>' : ''}
                    ${isHeLocked ? '<span style="font-size:1.5em;color:#9b59b6;">💞</span>' : ''}
                </div>
                <span style="font-weight:700;color:${guy.color};font-size:1.2em;">${displayName}</span>
                <span class="rename-icon" data-role="guy" data-id="${guy.id}" style="cursor:pointer;font-size:1rem;color:var(--accent);" title="改名">✏️</span>
                ${guy.injured?'🤕':''}${guy.dating?'💕':''}
                <span class="relation-tag">${getRelationText(guy)}</span>
                ${isBirthday ? '<span style="color:#c0392b;font-weight:700;"> 🎂今天生日！</span>' : ''}
                ${isHeLocked ? '<span style="color:#9b59b6;font-weight:700;"> 💞已魂契（好感度锁定）</span>' : ''}
            </div>
            ${meetProbText ? `<div style="font-size:0.8em;color:var(--text2);margin-bottom:6px;">${meetProbText}</div>` : ''}
            <div class="card"><b>📋 种族：</b>${guy.race}<br><b>性格：</b>${guy.personality}</div>
            <div class="card"><b>📖 背景：</b>${guy.background}</div>
            <div class="card"><b>💝 喜好：</b>${guy.likes}<br><b>✨ 能力：</b>${guy.ability}</div>
            <div class="card"><b>🐾 兽形：</b>${guy.petDetail}</div>
            <div class="card"><b>📍 主要出没：</b>${guy.mainPlaces ? guy.mainPlaces.join('、') : guy.meetPlace}</div>
            ${birthdayInfo}
            <div class="card">
                <div class="progress-row">❤️ 好感度 <progress class="heart-bar" value="${guy.affection}" max="100"></progress> ${guy.affection}${isHeLocked ? ' 🔒' : ''}</div>
                <div class="progress-row">🔒 占有欲 <progress class="obsess-bar" value="${guy.obsession}" max="100"></progress> ${guy.obsession}${isHeLocked ? ' 🔒' : ''}</div>
            </div>
            ${networkHtml}
            ${questHtml}
            <div class="card"><b>📜 互动记录</b><br>${logsHtml}</div>
        `;

        document.getElementById('backToGuys').addEventListener('click', () => renderGuyList());
        const renameEl = document.querySelector('.rename-icon[data-role="guy"]');
        if (renameEl) {
            renameEl.addEventListener('click', function() {
                const id = this.dataset.id;
                renameRole(id, 'guy');
            });
        }
        document.querySelectorAll('.network-npc-item').forEach(el => {
            el.addEventListener('click', function() {
                const npcId = this.dataset.npcId;
                if (npcId) renderNPCDetail(npcId);
            });
        });
        document.querySelectorAll('.quest-accept-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const questId = this.dataset.questId;
                const guyId = this.dataset.guyId;
                if (acceptQuest(questId, guyId)) {
                    showToast('✅ 任务已接取！');
                    renderGuyDetail(guyId);
                } else {
                    showToast('❌ 任务无法接取');
                }
            });
        });
    } catch (e) {
        console.error('❌ renderGuyDetail 执行失败:', e);
        document.getElementById('contentArea').innerHTML = `<div style="padding:20px;color:red;text-align:center;"><h3>男主详情加载失败</h3><p>${e.message}</p></div>`;
    }
}

// ===== NPC列表 =====
export function renderNPCList() {
    try {
        const npcs = getNPCs();
        if (npcs.length === 0) {
            document.getElementById('contentArea').innerHTML = `
                <div class="card" style="text-align:center;padding:30px 0;">
                    <div style="font-size:3em;">👥</div>
                    <p style="color:var(--text2);">你还没有遇到任何角色。<br>在探索地点时，你可能会邂逅不同的兽人和人类。</p>
                </div>
            `;
            return;
        }
        const html = npcs.map(npc => {
            const isToday = isNPCBirthday(npc, state.player.day);
            const displayName = getDisplayName(npc);
            let relationDisplay = '';
            if (npc.relationType) {
                const relTypeInfo = RELATION_TYPES.find(r => r.type === npc.relationType);
                const relEmoji = relTypeInfo ? relTypeInfo.emoji : '💬';
                relationDisplay = `<span style="font-size:0.7em;background:var(--accent2);color:#fff;border-radius:10px;padding:0 8px;margin-left:4px;">${relEmoji} ${npc.relationType}</span>`;
            }
            return `<div class="guy-card" data-npc-id="${npc.id}" style="cursor:pointer;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:2.5em;">${npc.emoji}</span>
                    ${isToday ? '<span style="font-size:1.2em;">🎂</span>' : ''}
                </div>
                <div style="flex:1;font-size:0.85em;">
                    <div style="font-weight:700;color:var(--accent);font-size:1.2em;display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
                        <span>${displayName}</span>
                        <span class="rename-icon" data-role="npc" data-id="${npc.id}" style="cursor:pointer;font-size:0.8rem;color:var(--accent);" title="改名">✏️</span>
                        ${relationDisplay}
                        ${isToday ? '🎂生日' : ''}
                    </div>
                    <div style="color:var(--text2);">${npc.gender} · ${npc.race} · ${npc.identity}</div>
                    <div class="progress-row">❤️ 友好值 <progress class="heart-bar" value="${npc.favorability}" max="100"></progress> ${npc.favorability}</div>
                </div>
            </div>`;
        }).join('');

        document.getElementById('contentArea').innerHTML = `
            <div style="font-weight:700;color:var(--accent);margin-bottom:8px;">👥 已遇角色 (${npcs.length}/${MAX_NPC})</div>
            <div class="guy-cards">${html}</div>
        `;

        document.querySelectorAll('[data-npc-id]').forEach(el => {
            el.addEventListener('click', function() {
                const id = this.dataset.npcId;
                renderNPCDetail(id);
            });
        });
        document.querySelectorAll('.rename-icon[data-role="npc"]').forEach(el => {
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.dataset.id;
                renameRole(id, 'npc');
            });
        });
    } catch (e) {
        console.error('❌ renderNPCList 执行失败:', e);
        document.getElementById('contentArea').innerHTML = `<div style="padding:20px;color:red;text-align:center;"><h3>角色列表加载失败</h3><p>${e.message}</p></div>`;
    }
}

// ===== NPC详情 =====
export function renderNPCDetail(npcId) {
    try {
        const npc = getNPC(npcId);
        if (!npc) return;
        const displayName = getDisplayName(npc);
        const age = getAge(npc);
        const isToday = isNPCBirthday(npc, state.player.day);
        
        let relationInfo = '';
        let targetGuy = null;
        const mappedGuyId = state.relationshipMap ? state.relationshipMap[npc.id] : null;
        if (mappedGuyId) targetGuy = getGuy(mappedGuyId);
        if (!targetGuy && npc.relationGuy) targetGuy = getGuy(npc.relationGuy);
        if (!targetGuy && npc.relationTag && npc.relationTag.endsWith('_network')) {
            const guyId = npc.relationTag.replace('_network', '');
            targetGuy = getGuy(guyId);
        }
        if (targetGuy) {
            const relType = npc.relationType || '相识';
            const relTypeInfo = RELATION_TYPES.find(r => r.type === relType);
            const relEmoji = relTypeInfo ? relTypeInfo.emoji : '💬';
            const isHeLocked = state.player.heEndings.includes(targetGuy.id);
            relationInfo = `
                <div class="card">
                    <div style="font-weight:700;color:var(--accent);margin-bottom:4px;">🔗 关系网</div>
                    <div style="display:flex;align-items:center;gap:10px;cursor:pointer;" data-guy-id="${targetGuy.id}" class="network-guy-item">
                        <span style="font-size:2em;">${targetGuy.emoji}</span>
                        <div>
                            <div style="font-weight:600;">${targetGuy.name}${isHeLocked ? ' 💞已魂契' : ''}</div>
                            <div style="font-size:0.85em;color:var(--text2);">${relEmoji} ${relType}</div>
                            <div style="font-size:0.8em;color:var(--accent);">❤️ 好感度 ${targetGuy.affection}</div>
                        </div>
                    </div>
                    ${npc.relationDesc ? `<div style="font-size:0.75em;color:var(--text2);margin-top:4px;font-style:italic;">${npc.relationDesc}</div>` : ''}
                    <div style="font-size:0.7em;color:var(--text2);margin-top:4px;">💡 拜访 ${npc.name} 时，有概率遇到 ${targetGuy.name}</div>
                </div>
            `;
        } else if (npc.relationType) {
            const relTypeInfo = RELATION_TYPES.find(r => r.type === npc.relationType);
            const relEmoji = relTypeInfo ? relTypeInfo.emoji : '💬';
            relationInfo = `<div class="card"><b>🔗 关系：</b>${relEmoji} ${npc.relationType}</div>`;
        }

        let npcRelHtml = '';
        if (npc.relations && npc.relations.length > 0) {
            const validRelations = npc.relations.filter(rel => getNPC(rel.targetId));
            if (validRelations.length > 0) {
                npcRelHtml = `<div class="card">
                    <div style="font-weight:700;color:var(--accent);margin-bottom:4px;">🔗 与其他角色的关系</div>`;
                validRelations.forEach(rel => {
                    const target = getNPC(rel.targetId);
                    if (target) {
                        const relTypeInfo = RELATION_TYPES.find(r => r.type === rel.type);
                        const emoji = relTypeInfo ? relTypeInfo.emoji : '💬';
                        npcRelHtml += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px dotted #ffd6e7;cursor:pointer;" data-npc-id="${target.id}" class="network-npc-item">
                            <span style="font-size:1.4em;">${target.emoji}</span>
                            <span style="font-weight:600;">${target.name}</span>
                            <span style="font-size:0.75em;background:var(--accent2);color:#fff;border-radius:10px;padding:0 8px;">${emoji} ${rel.type}</span>
                        </div>`;
                    }
                });
                npcRelHtml += `</div>`;
            }
        }

        document.getElementById('contentArea').innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap;">
                <button class="btn" id="backToNpcs">←</button>
                <span style="font-size:3em;">${npc.emoji}</span>
                <span style="font-weight:700;font-size:1.5em;color:var(--accent);">${displayName}</span>
                <span class="rename-icon" data-role="npc" data-id="${npc.id}" style="cursor:pointer;font-size:1rem;color:var(--accent);" title="改名">✏️</span>
                ${isToday ? '<span style="color:#c0392b;font-weight:700;"> 🎂今天生日！</span>' : ''}
            </div>
            <div class="card"><b>📋 性别：</b>${npc.gender}<br><b>种族：</b>${npc.race}</div>
            <div class="card"><b>🎂 生日：</b>${npc.birthMonth}月${npc.birthDay}日 · ${age}岁</div>
            <div class="card"><b>🎭 性格：</b>${npc.personality}</div>
            <div class="card"><b>👤 外貌：</b>${npc.appearance}</div>
            <div class="card"><b>📜 身份：</b>${npc.identity}</div>
            ${relationInfo}
            ${npcRelHtml}
            <div class="card">
                <div class="progress-row">❤️ 友好值 <progress class="heart-bar" value="${npc.favorability}" max="100"></progress> ${npc.favorability}</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
                <button class="btn" id="giftNpcBtn">🎁送礼</button>
                <button class="btn" id="visitNpcBtn">🏠拜访</button>
            </div>
        `;

        document.getElementById('backToNpcs').addEventListener('click', () => renderNPCList());
        const renameEl = document.querySelector('.rename-icon[data-role="npc"]');
        if (renameEl) {
            renameEl.addEventListener('click', function() {
                const id = this.dataset.id;
                renameRole(id, 'npc');
            });
        }
        document.querySelectorAll('.network-guy-item').forEach(el => {
            el.addEventListener('click', function() {
                const guyId = this.dataset.guyId;
                renderGuyDetail(guyId);
            });
        });
        document.querySelectorAll('.network-npc-item').forEach(el => {
            el.addEventListener('click', function() {
                const npcId = this.dataset.npcId;
                renderNPCDetail(npcId);
            });
        });

        document.getElementById('giftNpcBtn').addEventListener('click', () => {
            if (state.player.inventory.length === 0) { showNoGiftModal(); return; }
            const gift = state.player.inventory.pop();
            const gain = 3 + Math.floor(Math.random() * 4);
            const bonus = isNPCBirthday(npc, state.player.day) ? Math.floor(gain * 0.3) : 0;
            npc.favorability = Math.min(100, npc.favorability + gain + bonus);
            addLog(`你送给${npc.name}${gift}，友好值+${gain+bonus}${bonus>0?'（生日加成）':''}`, null, 'npc');
            showToast(`送给${npc.name}礼物，友好值+${gain+bonus}`);
            renderNPCDetail(npcId);
        });

        document.getElementById('visitNpcBtn').addEventListener('click', () => {
            if (!canGoOut()) { showCantGoOutModal(); return; }
            if (Math.random() < 0.3) {
                const logText = `${npc.name}不在家，你白跑一趟。`;
                addLog(logText, null, 'npc');
                advanceTime();
                updateTopBar();
                showVisitResultModal(logText, null, npcId);
                return;
            }
            const dialogs = [
                `${npc.name}热情地招待了你，你们聊了很多。`,
                `你帮${npc.name}做了些家务，她/他非常感激。`,
                `${npc.name}给你讲了一个部落的古老传说。`,
                `你们一起品尝了${npc.name}做的点心，气氛融洽。`
            ];
            const text = dialogs[Math.floor(Math.random() * dialogs.length)];
            const gain = 1 + Math.floor(Math.random() * 3);
            npc.favorability = Math.min(100, npc.favorability + gain);
            let logText = `拜访${npc.name}：${text} 友好值+${gain}`;
            
            let encounteredGuy = null;
            if (npc.favorability > 50) {
                const mappedGuyId = state.relationshipMap ? state.relationshipMap[npc.id] : null;
                if (mappedGuyId) {
                    const guy = getGuy(mappedGuyId);
                    if (guy) {
                        let prob = (npc.favorability >= 100) ? 0.5 : (0.4 + state.player.stats.charm / 300);
                        if (guy.locked) prob = 0.4;
                        if (Math.random() < prob) encounteredGuy = guy;
                    }
                }
                if (!encounteredGuy && npc.relationTag) {
                    for (let guy of state.guys) {
                        if (guy.banished) continue;
                        if (npc.relationTag === guy.id + '_network') {
                            let prob = (npc.favorability >= 100) ? 0.5 : (0.3 + state.player.stats.charm / 300);
                            if (guy.locked) prob = 0.4;
                            if (Math.random() < prob) { encounteredGuy = guy; break; }
                        }
                    }
                }
            }
            if (encounteredGuy) {
                const wasLocked = encounteredGuy.locked;
                if (wasLocked) {
                    encounteredGuy.locked = false;
                    showFirstMeetModal(encounteredGuy, { name: npc.name + '的家' }, `在拜访${npc.name}时意外遇到了${encounteredGuy.name}！`);
                    addLog(`在拜访${npc.name}时，你首次遇到了${encounteredGuy.name}！`, null, 'guy');
                } else {
                    const affGain = 3 + Math.floor(Math.random() * 3);
                    addAffectionAndObsession(encounteredGuy, affGain, false);
                    const relationType = npc.relationType || '好友';
                    addLog(`在拜访${npc.name}（${relationType}）时，意外遇到了${encounteredGuy.name}！好感度+${affGain}。`, null, 'guy');
                    showToast(`在${npc.name}家遇到了${encounteredGuy.name}！`);
                    logText += `<br>💕 意外遇到 ${encounteredGuy.emoji} ${encounteredGuy.name}（${relationType}），好感度 +${affGain}`;
                }
            }
            addLog(logText, null, 'npc');
            advanceTime();
            updateTopBar();
            showVisitResultModal(logText, gain, npcId);
        });
    } catch (e) {
        console.error('❌ renderNPCDetail 执行失败:', e);
        document.getElementById('contentArea').innerHTML = `<div style="padding:20px;color:red;text-align:center;"><h3>角色详情加载失败</h3><p>${e.message}</p></div>`;
    }
}

// ===== 地点列表 =====
export function renderPlaces() {
    try {
        const outAllowed = canGoOut();
        const p = state.player;
        const events = getTodayEvents(state.player.day);
        const lockedSet = new Set();
        events.forEach(ev => { if (ev.effects?.lockedPlaces) ev.effects.lockedPlaces.forEach(pl => lockedSet.add(pl)); });
        const isHunting = isHuntingSeason(state.player.day);
        reorderPlaces();

        const placesHtml = state.places.map(pl => {
            let extraInfo = '';
            const isEventLocked = lockedSet.has(pl.name) && !pl.locked;
            const isHome = pl.name === '我家' || (pl.type === 'guyhome' && pl.isMovedIn);
            const isTempLocked = !isHome && !outAllowed;
            const isLocked = pl.locked || isTempLocked || isEventLocked;
            if (isLocked) {
                if (isEventLocked && !pl.locked) extraInfo = `<span class="place-unlock-hint">⚔️活动关闭</span>`;
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
            if (isHunting && pl.type === 'public' && !pl.locked && !isTempLocked && !isEventLocked) {
                extraInfo = `<span class="place-unlock-hint" style="background:#ffecd2;">🏹狩猎中</span>`;
            }
            const sickHome = (pl.name === '我家' && p.sick) ? ' 🤒' : '';
            const movedInTag = pl.isMovedIn ? ' 🏠同居' : '';
            const hintText = pl.hint ? `<div class="place-hint">${pl.hint}</div>` : '';
            return `<div class="place-item ${isLocked?'locked':''}" data-place="${pl.name}" style="aspect-ratio:1/1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:auto;min-height:85px;max-height:100px;padding:6px 4px;text-align:center;">
                <span class="place-icon">${pl.icon}</span>
                <span class="place-name">${pl.name}${sickHome}${movedInTag}</span>
                ${hintText}
                ${extraInfo}
            </div>`;
        }).join('');

        const eventBanner = events.length
            ? `<div class="event-banner">🎉 ${events.map(e => `${e.name} 📍${e.locations.join('、')}`).join(' & ')} 进行中！</div>`
            : '';

        document.getElementById('contentArea').innerHTML = `${eventBanner}<div class="place-grid">${placesHtml}</div>`;
        document.querySelectorAll('.place-item').forEach(item => {
            item.addEventListener('click', () => {
                const placeName = item.dataset.place;
                const place = state.places.find(p => p.name === placeName);
                if (!place) return;
                const isEventLocked = lockedSet.has(placeName) && !place.locked;
                const isHome = placeName === '我家' || (place.type === 'guyhome' && place.isMovedIn);
                const isTempLocked = !isHome && !outAllowed;
                if (place.locked || isTempLocked || isEventLocked) {
                    if (isTempLocked && !place.locked) showCantGoOutModal();
                    else if (isEventLocked && !place.locked) showCantGoOutModal();
                    else showLockedPlaceHint(place);
                } else {
                    openPlaceActions(placeName);
                }
            });
        });
    } catch (e) {
        console.error('❌ renderPlaces 执行失败:', e);
        document.getElementById('contentArea').innerHTML = `<div style="padding:20px;color:red;text-align:center;"><h3>地点列表加载失败</h3><p>${e.message}</p></div>`;
    }
}

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
    const html = `<div class="modal-overlay" id="lockedHintModal"><div class="modal-box"><div style="font-size:2em;">🔒</div><p>${msg}</p><button class="btn" id="closeLockedHint" style="width:100%;margin-top:10px;">知道了</button></div></div>`;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    document.getElementById('closeLockedHint').addEventListener('click', () => {
        document.getElementById('lockedHintModal').remove();
    });
}

export function showCantGoOutModal() {
    const p = state.player;
    const isMovedIn = p.movedIn !== null;
    const homeName = isMovedIn ? getGuy(p.movedIn)?.name + '的家' : '我家';
    const reason = p.sick
        ? '你生病了，只能待在家里休养。'
        : (p.time === 3 && p.stats.health < 100
            ? '深夜时分，生命值不满100，不能外出。'
            : '现在无法外出。');
    const html = `<div class="modal-overlay" id="cantGoModal">
        <div class="modal-box" style="text-align:center;">
            <div style="font-size:2em;">🏠</div>
            <p>${reason}</p>
            <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;justify-content:center;">
                <button class="btn" id="goHomeBtn" style="background:var(--accent);">🏠 一键回家（${homeName}）</button>
                <button class="btn" id="closeCantGo" style="background:#ccc;color:#666;">知道了</button>
            </div>
        </div>
    </div>`;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    document.getElementById('closeCantGo').addEventListener('click', () => {
        document.getElementById('cantGoModal').remove();
    });
    document.getElementById('goHomeBtn').addEventListener('click', () => {
        document.getElementById('cantGoModal').remove();
        if (isMovedIn) {
            const guyHome = state.places.find(p => p.guy === p.movedIn && p.type === 'guyhome');
            if (guyHome && !guyHome.locked) {
                openPlaceActions(guyHome.name);
                return;
            }
        }
        openPlaceActions('我家');
    });
}

export function showActionResult(logText, place) {
    if (!logText || logText.trim() === '') {
        logText = '你进行了一次探索。';
    }
    const pn = place ? place.name : '某处';
    const highlightedLog = highlightNames(logText);
    const rl = state.logs.filter(l => l.place === pn).slice(0, 5);
    const hh = rl.length
        ? rl.map(l => `<div class="log-entry"><span style="color:var(--accent);">${l.time}</span> ${highlightNames(l.text)}</div>`).join('')
        : '<div style="color:var(--text2);">暂无近期记录</div>';
    const existing = document.getElementById('resultModal');
    if (existing) existing.remove();
    const html = `<div class="global-overlay" id="resultModal">
        <div class="modal-box" style="max-width:600px;max-height:80vh;overflow-y:auto;">
            <div style="font-weight:700;color:var(--accent);font-size:1.1em;margin-bottom:8px;">📍 ${pn}</div>
            <div style="margin:12px 0;font-size:1em;line-height:1.8;background:#fff5f8;padding:12px;border-radius:12px;border:1px solid var(--border);">
                ${highlightedLog}
            </div>
            <div style="text-align:left;margin-top:10px;">
                <div style="font-weight:700;color:var(--accent);margin-bottom:4px;font-size:0.85em;">📜 近期记录</div>
                <div style="max-height:200px;overflow-y:auto;font-size:0.85em;">${hh}</div>
            </div>
            <button class="btn" id="closeResult" style="width:100%;margin-top:12px;">继续</button>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'resultModal');
    if (!modal) { showToast(logText); return; }
    const closeBtn = modal.querySelector('#closeResult');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.remove();
            render();
            checkAndShowPendingDailyEvents();
        });
    }
    modal.addEventListener('click', function(e) {
        if (e.target === modal) { modal.remove(); }
    });
}

export function showNoGiftModal() {
    const html = `<div class="modal-overlay" id="noGiftModal"><div class="modal-box"><div style="font-size:2em;">🎁</div><p>你还没有准备礼物呢！</p><button class="btn" id="closeNoGift" style="width:100%;margin-top:10px;">知道了</button></div></div>`;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    document.getElementById('closeNoGift').addEventListener('click', () => {
        document.getElementById('noGiftModal').remove();
    });
}

// ===== 设置页 =====
export function renderSettings() {
    try {
        const tb = Object.entries(themes).map(([k, t]) =>
            `<div class="color-dot${state.currentTheme===k?' active':''}" data-theme="${k}" style="background:${t.primary};" title="${t.name}"></div>`
        ).join('');
        const autoModes = ['never', 'day', 'week'];
        const modeNames = { never:'从不', day:'每1天', week:'每7天' };
        const modeBtns = autoModes.map(m =>
            `<button class="btn${state.autoSaveMode===m?' active-btn':''}" id="autoModeBtn_${m}">${modeNames[m]}</button>`
        ).join('');

        const avatarDisplay = state.player.avatar && state.player.avatar.startsWith('data:image')
            ? `<img src="${state.player.avatar}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">`
            : `<span style="font-size:2em;">${state.player.avatar || '⭐'}</span>`;

        const logTypes = state.player.logTypes || { player: true, guy: true, npc: true, system: true };
        const typeLabels = { player: '👤 我的', guy: '❤️ 男主', npc: '👥 NPC', system: '📋 系统' };
        const isLoggedIn = state.player.tapUser !== null;
        const cloudAvailable = isCloudSaveSupported();
        const loginStatusText = isLoggedIn ? `✅ 已登录: ${state.player.tapUser?.nickName || '玩家'}` : '❌ 未登录';

        document.getElementById('contentArea').innerHTML = `
            <div class="card"><b>👤 我的头像</b><br>
                <div style="display:flex;align-items:center;gap:10px;justify-content:center;flex-wrap:wrap;">
                    ${avatarDisplay}
                    <button class="btn" id="changePlayerAvatarBtn">更换头像</button>
                </div>
            </div>
            <div class="card"><b>🎂 我的生日</b><br>
                <div style="display:flex;gap:10px;justify-content:center;align-items:center;flex-wrap:wrap;">
                    <span>月</span>
                    <input type="number" id="birthMonthInput" min="1" max="12" value="${state.player.birthMonth}" style="width:60px;padding:8px;border-radius:12px;border:2px solid var(--border);text-align:center;font-size:1em;">
                    <span>日</span>
                    <input type="number" id="birthDayInput" min="1" max="30" value="${state.player.birthDay}" style="width:60px;padding:8px;border-radius:12px;border:2px solid var(--border);text-align:center;font-size:1em;">
                    <button class="btn" id="saveBirthdayBtn">保存</button>
                </div>
                <div style="font-size:0.8em;color:var(--text2);text-align:center;margin-top:4px;">设置后，生日当天好感>50的男主会主动送礼</div>
            </div>
            <div class="card"><b>🔑 TapTap 登录</b><br>
                <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
                    <button class="btn" id="loginSettingBtn" style="background:#3498db;">${isLoggedIn ? '🔄 切换账号' : '🔑 登录'}</button>
                    <span style="font-size:0.9em;color:var(--text2);align-self:center;">${loginStatusText}</span>
                </div>
            </div>
            <div class="card"><b>☁️ 云存档</b><br>
                <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
                    <button class="btn" id="cloudUploadSettingBtn" style="background:var(--accent);" ${!isLoggedIn ? 'disabled style="opacity:0.5;"' : ''}>📤 上传当前存档</button>
                    <button class="btn" id="cloudManageSettingBtn" style="background:#2ecc71;" ${!isLoggedIn ? 'disabled style="opacity:0.5;"' : ''}>📂 管理云存档</button>
                </div>
                <div style="font-size:0.8em;color:var(--text2);text-align:center;margin-top:4px;">
                    ${isLoggedIn ? (cloudAvailable ? '☁️ 云存档已就绪' : '⚠️ 云存档不可用') : '🔑 请先登录'}
                </div>
            </div>
            <div class="card"><b>📋 日志过滤</b><br>
                <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
                    ${['player','guy','npc','system'].map(type => {
                        const checked = logTypes[type] ? 'checked' : '';
                        return `<label style="display:flex;align-items:center;gap:4px;cursor:pointer;">
                            <input type="checkbox" class="log-type-toggle" data-type="${type}" ${checked}>
                            <span>${typeLabels[type]}</span>
                        </label>`;
                    }).join('')}
                </div>
                <div style="font-size:0.7em;color:var(--text2);margin-top:4px;">取消勾选后，对应的日志将不再显示在主页</div>
            </div>
            <div class="card"><b>💾 存档管理</b><br><button class="btn" id="openSaveLoad">📂 存档 / 读档（共5个存档位）</button></div>
            <div class="card"><b>🏆 收藏品</b><br><div style="display:flex;gap:8px;justify-content:center;">
                <button class="btn" id="openEndingGallery2">📖 结局图鉴</button>
                <button class="btn" id="openAchievementGallery2">🏆 成就查看</button>
                <button class="btn" id="openCollectibleGallery">🏺 收藏品图鉴</button>
            </div></div>
            <div class="card"><b>⚙️ 自动存档</b><br><div style="display:flex;gap:8px;justify-content:center;">${modeBtns}</div>
                <div style="font-size:0.75em;color:var(--text2);margin-top:8px;">自动存档位：存档1（仅可读档）</div>
            </div>
            <div class="card">
                <b>🎵 背景音乐</b><br>
                <div style="text-align:center; margin-bottom:6px; font-size:0.9em; color:var(--accent);" id="currentSongName">加载中...</div>
                <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">
                    <button class="btn" id="prevTrackBtn" style="flex:1; min-width:50px;">⏮️</button>
                    <button class="btn" id="toggleBgmBtn" style="flex:1; min-width:80px;">⏯️</button>
                    <button class="btn" id="nextTrackBtn" style="flex:1; min-width:50px;">⏭️</button>
                </div>
                <div style="display:flex; gap:6px; justify-content:center; margin-top:6px;">
                    <button class="btn mode-btn" id="modeOrder" style="flex:1;">🔁 顺序</button>
                    <button class="btn mode-btn" id="modeRandom" style="flex:1;">🎲 随机</button>
                    <button class="btn mode-btn" id="modeSingle" style="flex:1;">🔂 单曲</button>
                </div>
            </div>
            <div class="card"><b>🎨 UI色调</b><br><div style="display:flex;justify-content:center;flex-wrap:wrap;">${tb}</div></div>
            <div class="card studio-logo-card">
                <div class="studio-logo-wrapper">
                    <img src="img/logo/studio-logo.png" alt="你的工作室名称" class="studio-logo-footer" id="studioLogoImg" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
                    <div class="studio-logo-text" style="display:none;">© 2026 半醒梦境坊 PCY边墨</div>
                </div>
            </div>
            <div class="card"><button class="btn" id="restartBtn">🔄 重新开始</button></div>
        `;

        // 头像更换
        document.getElementById('changePlayerAvatarBtn').addEventListener('click', () => {
            showAvatarSelectorModal((newAvatar) => {
                state.player.avatar = newAvatar;
                updateTopBar();
                renderSettings();
                showToast('头像已更新');
            });
        });

        // 生日保存
        document.getElementById('saveBirthdayBtn').addEventListener('click', () => {
            const month = parseInt(document.getElementById('birthMonthInput').value);
            const day = parseInt(document.getElementById('birthDayInput').value);
            if (month >= 1 && month <= 12 && day >= 1 && day <= 30) {
                state.player.birthMonth = month;
                state.player.birthDay = day;
                showToast(`✅ 生日已设置为 ${month}月${day}日`);
                renderSettings();
            } else {
                showToast('⚠️ 请输入有效的日期（月1-12，日1-30）');
            }
        });

        // 日志过滤
        document.querySelectorAll('.log-type-toggle').forEach(cb => {
            cb.addEventListener('change', function() {
                const type = this.dataset.type;
                state.player.logTypes[type] = this.checked;
                if (state.currentTab === 'home') renderHome();
            });
        });

        // 登录
        document.getElementById('loginSettingBtn').addEventListener('click', async () => {
            if (state.player.tapUser) {
                if (confirm('确定要切换账号吗？')) {
                    state.player.tapUser = null;
                    state.player.cloudEnabled = false;
                    showToast('已登出');
                    renderSettings();
                }
            } else {
                try {
                    if (window.loginWithTapTap) {
                        await window.loginWithTapTap();
                        renderSettings();
                    } else {
                        showToast('⚠️ 登录功能不可用');
                    }
                } catch (e) {
                    console.warn('登录异常，不影响设置', e);
                    showToast('登录异常，请稍后重试');
                }
            }
        });

        // 云存档上传
        document.getElementById('cloudUploadSettingBtn').addEventListener('click', () => {
            if (!state.player.tapUser) { showToast('⚠️ 请先登录'); return; }
            if (!isCloudSaveSupported()) { showToast('⚠️ 云存档不可用'); return; }
            if (!localStorage.getItem('beastLove_slot_0')) { showToast('⚠️ 没有本地存档可上传'); return; }
            const nameInput = prompt('请输入云存档名称（可选）', `第${state.player.day}天存档`);
            const summaryInput = prompt('请输入简要描述（可选）', `金币:${state.player.gold}`);
            uploadArchiveToCloud(0, nameInput || undefined, summaryInput || undefined)
                .then(() => showToast('✅ 上传成功'))
                .catch(err => showToast('❌ 上传失败: ' + err.message));
        });

        // 云存档管理
        document.getElementById('cloudManageSettingBtn').addEventListener('click', () => {
            if (!state.player.tapUser) { showToast('⚠️ 请先登录'); return; }
            if (!isCloudSaveSupported()) { showToast('⚠️ 云存档不可用'); return; }
            showCloudSaveManagerUI();
        });

        // 音乐控制
        const bgmBtn = document.getElementById('toggleBgmBtn');
        const prevBtn = document.getElementById('prevTrackBtn');
        const nextBtn = document.getElementById('nextTrackBtn');
        const songNameEl = document.getElementById('currentSongName');
        const modeOrder = document.getElementById('modeOrder');
        const modeRandom = document.getElementById('modeRandom');
        const modeSingle = document.getElementById('modeSingle');

        function updateMusicUI() {
            if (songNameEl) songNameEl.textContent = getCurrentTrackName();
            if (bgmBtn) bgmBtn.textContent = getMusicPaused() ? '▶️ 播放' : '⏯️ 暂停';
            updateModeButtons();
        }
        function updateModeButtons() {
            const current = getPlayMode();
            [modeOrder, modeRandom, modeSingle].forEach(btn => btn.classList.remove('active-btn'));
            if (current === 'order') modeOrder.classList.add('active-btn');
            else if (current === 'random') modeRandom.classList.add('active-btn');
            else if (current === 'single') modeSingle.classList.add('active-btn');
        }
        if (bgmBtn) bgmBtn.addEventListener('click', () => { togglePlayPause(); updateMusicUI(); });
        if (prevBtn) prevBtn.addEventListener('click', () => { prevTrack(); updateMusicUI(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { nextTrack(); updateMusicUI(); });
        modeOrder.addEventListener('click', () => { setPlayMode('order'); updateMusicUI(); });
        modeRandom.addEventListener('click', () => { setPlayMode('random'); updateMusicUI(); });
        modeSingle.addEventListener('click', () => { setPlayMode('single'); updateMusicUI(); });
        updateMusicUI();

        document.getElementById('openSaveLoad').addEventListener('click', openSaveLoadModal);
        document.getElementById('openEndingGallery2').addEventListener('click', showEndingGallery);
        document.getElementById('openAchievementGallery2').addEventListener('click', showAchievementsModal);
        document.getElementById('openCollectibleGallery').addEventListener('click', showCollectibleGallery);
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
    } catch (e) {
        console.error('❌ renderSettings 执行失败:', e);
        document.getElementById('contentArea').innerHTML = `<div style="padding:20px;color:red;text-align:center;"><h3>设置页加载失败</h3><p>${e.message}</p></div>`;
    }
}

// ===== 存档管理 =====
export function openSaveLoadModal() {
    try {
        const slots = getSaveSlots();
        const saveNames = state.player.saveNames || {};
        let html = '';
        for (let i = 0; i < 5; i++) {
            const d = slots[i];
            const isAuto = i === 0;
            const currentName = saveNames[i] || '';
            html += `<div class="save-slot${isAuto?' auto-slot':''}">
                <b>存档 ${i+1}${isAuto?' (自动)':''}</b><br>
                <span style="color:var(--text2)">${d?formatSlotInfo(d):'空'}</span>
                <div style="margin-top:5px;">
                    <input type="text" class="save-name-input" data-slot="${i}" placeholder="输入存档名称..." value="${currentName}" maxlength="20">
                </div>
                <div style="margin-top:5px;display:flex;gap:5px;">
                    ${!isAuto?`<button class="btn save-action" data-slot="${i}" style="flex:1;">💾保存</button>`:''}
                    <button class="btn load-action" data-slot="${i}" style="flex:1;">📤读取</button>
                    ${!isAuto && d ? `<button class="btn delete-action" data-slot="${i}" style="flex:1;background:#ff6b6b;">🗑️删除</button>` : ''}
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
        
        document.querySelectorAll('.save-name-input').forEach(input => {
            input.addEventListener('change', function() {
                const slot = parseInt(this.dataset.slot);
                if (!state.player.saveNames) state.player.saveNames = {};
                state.player.saveNames[slot] = this.value.trim() || '';
                const d = JSON.parse(localStorage.getItem(`beastLove_slot_${slot}`) || '{}');
                if (d.player) {
                    d.saveNames = state.player.saveNames;
                    localStorage.setItem(`beastLove_slot_${slot}`, JSON.stringify(d));
                }
            });
        });
        
        document.querySelectorAll('.save-action').forEach(btn => btn.addEventListener('click', function() {
            const slot = parseInt(this.dataset.slot);
            if (getSaveSlots()[slot] && !confirm(`存档 ${slot+1} 已有记录，确定覆盖吗？`)) return;
            const input = document.querySelector(`.save-name-input[data-slot="${slot}"]`);
            if (input) {
                if (!state.player.saveNames) state.player.saveNames = {};
                state.player.saveNames[slot] = input.value.trim() || '';
            }
            saveToSlot(slot);
            document.querySelectorAll('.global-overlay').forEach(el => el.remove());
            document.getElementById('saveModal')?.remove();
            showToast(`✅ 已保存到存档 ${slot+1}`);
            if (state.currentTab === 'settings') renderSettings();
        }));
        document.querySelectorAll('.load-action').forEach(btn => btn.addEventListener('click', function() {
            const slot = parseInt(this.dataset.slot);
            if (loadFromSlot(slot)) {
                document.querySelectorAll('.global-overlay').forEach(el => el.remove());
                document.getElementById('saveModal')?.remove();
                showToast(`✅ 已读取存档 ${slot+1}`);
                document.getElementById('topBar').style.display = 'flex';
                document.getElementById('navBar').style.display = 'flex';
                state.gameStarted = true;
                updateTopBar();
                renderHome();
            } else {
                alert('该存档位为空。');
            }
        }));
        document.querySelectorAll('.delete-action').forEach(btn => btn.addEventListener('click', function() {
            const slot = parseInt(this.dataset.slot);
            if (!confirm(`确定删除存档 ${slot+1} 吗？`)) return;
            localStorage.removeItem(`beastLove_slot_${slot}`);
            if (state.player.saveNames) delete state.player.saveNames[slot];
            showToast(`🗑️ 已删除存档 ${slot+1}`);
            document.getElementById('saveModal').remove();
            openSaveLoadModal();
        }));
    } catch (e) {
        console.error('❌ openSaveLoadModal 执行失败:', e);
        showToast('⚠️ 存档管理加载失败');
    }
}

// ===== 结局图鉴 =====
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

// ===== 成就查看 =====
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

// ===== 收藏品图鉴 =====
function showCollectibleGallery() {
    const collected = state.player.collectedItems || [];
    const allCollectibles = [];
    Object.values(COLLECTIBLES).forEach(arr => allCollectibles.push(...arr));
    let html = `<div class="modal-overlay" id="collectibleModal">
        <div class="modal-box">
            <div style="font-weight:700;color:var(--accent);font-size:1.2em;margin-bottom:10px;">🏺 收藏品 (${collected.length}/${allCollectibles.length})</div>
            <div style="max-height:60vh;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px;">`;
    allCollectibles.forEach(c => {
        const found = collected.includes(c.id);
        html += `<div class="collectible-item ${found?'found':'missing'}" style="border:1px solid #ffd6e7;border-radius:8px;padding:6px;text-align:center;">
            <div style="font-size:1.8em;">${found ? c.name.split(' ')[0] : '❓'}</div>
            <div style="font-size:0.75em;font-weight:600;">${found ? c.name : '未发现'}</div>
            <div style="font-size:0.6em;color:var(--text2);">${found ? c.desc : '???'}</div>
        </div>`;
    });
    html += `</div><button class="btn" id="closeCollectible" style="width:100%;margin-top:10px;">关闭</button></div></div>`;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    document.getElementById('closeCollectible').addEventListener('click', () => document.getElementById('collectibleModal').remove());
}

// ===== 开始界面 =====
export function renderStartScreen() {
    try {
        // 确保全局变量存在
        if (!window.tempStats) {
            window.tempStats = { health:90, charm:12, intuition:10, endurance:5, talent:8, affinity:15 };
        }
        if (!window.selectedAvatar) {
            window.selectedAvatar = '⭐';
        }
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
        const birthdayHtml = `
            <div style="font-weight:700;color:var(--accent);margin-top:5px;">🎂 你的生日</div>
            <div style="display:flex;gap:10px;justify-content:center;align-items:center;">
                <span>月</span>
                <input type="number" id="startBirthMonthInput" min="1" max="12" value="1" style="width:60px;padding:8px;border-radius:12px;border:2px solid var(--border);text-align:center;font-size:1em;">
                <span>日</span>
                <input type="number" id="startBirthDayInput" min="1" max="30" value="1" style="width:60px;padding:8px;border-radius:12px;border:2px solid var(--border);text-align:center;font-size:1em;">
            </div>
        `;

        document.getElementById('contentArea').innerHTML = `
            <div class="start-screen">
                <div class="start-title">兽 世 恋 歌</div>
                <div class="start-subtitle">～ 现代少女 × 毛茸茸兽人 ～</div>
                <div style="font-size:0.8em;color:var(--text2);">兽历222年1月1日 · 春季</div>
                <div class="input-group"><label>✏️ 你的名字</label><br><input type="text" id="playerNameInput" value="小春" maxlength="10"></div>
                <div style="font-weight:700;color:var(--accent);">👩🏻 选择头像</div>
                <div class="avatar-grid" id="startAvatarGrid" style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;align-items:center;">
                    ${ah}
                </div>
                ${birthdayHtml}
                <div class="stats-mini">
                    <div class="stats-mini-title">✨ 初始属性（生命上限可通过锻炼提升至100，其他属性上限100）</div>
                    <div class="stats-mini-grid">${sh}</div>
                    <button class="random-btn" id="randomStatsBtn">🎲 随机属性</button>
                </div>
                <button class="start-btn" id="enterGameBtn">🌸 踏入兽世 🌸</button>
                <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
                    <button class="btn" id="loginStartBtn" style="background:#3498db;">🔑 TapTap 登录</button>
                    <button class="btn" id="cloudStartBtn" style="background:#2ecc71;">☁️ 云存档管理</button>
                    <button class="btn" id="loadManualStartBtn" style="background:#8e44ad;">📂 读档</button>
                    <button class="btn" id="galleryBtn" style="background:#aaa;">📖 结局图鉴</button>
                    <button class="btn" id="achievementStartBtn" style="background:#aaa;">🏆 成就</button>
                </div>
            </div>`;
        
        const updateStatsDisplay = () => {
            keys.forEach((k, i) => {
                const el = document.getElementById('val'+k.charAt(0).toUpperCase()+k.slice(1));
                if (el) el.textContent = window.tempStats[k];
            });
        };
        updateStatsDisplay();

        document.querySelectorAll('#startAvatarGrid .avatar-option[data-avatar]').forEach(opt => opt.addEventListener('click', function() {
            document.querySelectorAll('#startAvatarGrid .avatar-option[data-avatar]').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            window.selectedAvatar = this.dataset.avatar;
        }));

        document.getElementById('randomStatsBtn').addEventListener('click', () => {
            window.tempStats.health = Math.floor(Math.random()*21)+80;
            window.tempStats.charm = Math.floor(Math.random()*8)+8;
            window.tempStats.intuition = Math.floor(Math.random()*9)+6;
            window.tempStats.endurance = Math.floor(Math.random()*8)+3;
            window.tempStats.talent = Math.floor(Math.random()*8)+5;
            window.tempStats.affinity = Math.floor(Math.random()*11)+10;
            updateStatsDisplay();
        });

        document.getElementById('loginStartBtn').addEventListener('click', async () => {
            try {
                if (window.loginWithTapTap) {
                    await window.loginWithTapTap();
                    if (state.gameStarted) { render(); }
                } else {
                    showToast('⚠️ 登录功能不可用');
                }
            } catch (e) {
                console.warn('登录流程出现异常，游戏可继续', e);
                showToast('登录异常，游戏可离线进行');
            }
        });

        document.getElementById('cloudStartBtn').addEventListener('click', () => {
            if (!state.player.tapUser) { showToast('⚠️ 请先登录 TapTap 账号'); return; }
            if (!isCloudSaveSupported()) { showToast('⚠️ 云存档不可用，请检查网络'); return; }
            showCloudSaveManagerUI();
        });

        document.getElementById('loadManualStartBtn').addEventListener('click', () => {
            openSaveLoadModal();
        });

        document.getElementById('enterGameBtn').addEventListener('click', () => {
            const birthMonth = parseInt(document.getElementById('startBirthMonthInput').value);
            const birthDay = parseInt(document.getElementById('startBirthDayInput').value);
            if (birthMonth < 1 || birthMonth > 12 || birthDay < 1 || birthDay > 30) {
                showToast('⚠️ 请填写正确的生日（月1-12，日1-30）');
                return;
            }
            state.player.name = document.getElementById('playerNameInput').value.trim() || '小春';
            if (!window.selectedAvatar || window.selectedAvatar === '👧🏻') {
                window.selectedAvatar = '⭐';
            }
            state.player.avatar = window.selectedAvatar;
            if (birthMonth >= 1 && birthMonth <= 12 && birthDay >= 1 && birthDay <= 30) {
                state.player.birthMonth = birthMonth;
                state.player.birthDay = birthDay;
            } else {
                state.player.birthMonth = 1;
                state.player.birthDay = 1;
            }
            Object.keys(window.tempStats).forEach(k => state.player.stats[k] = window.tempStats[k]);
            state.player.maxHealth = window.tempStats.health;
            state.player.day = 1;
            showTutorialChoiceModal();
        });

        document.getElementById('galleryBtn').addEventListener('click', showEndingGallery);
        document.getElementById('achievementStartBtn').addEventListener('click', showAchievementsModal);
        playMusic();
    } catch (e) {
        console.error('❌ renderStartScreen 执行失败:', e);
        document.getElementById('contentArea').innerHTML = `
            <div style="padding:20px;color:red;text-align:center;">
                <h3>游戏加载失败</h3>
                <p style="font-size:0.9rem;color:var(--text2);">${e.message}</p>
                <button class="btn" onclick="location.reload()">重新加载</button>
            </div>
        `;
    }
}

// ===== 教程选择弹窗 =====
function showTutorialChoiceModal() {
    const html = `<div class="global-overlay" id="tutorialChoiceModal">
        <div class="modal-box" style="max-width:450px;text-align:center;">
            <div style="font-size:3em;margin-bottom:10px;">🌸</div>
            <h2 style="color:var(--accent);">是否观看新手指导？</h2>
            <div style="line-height:2;font-size:0.95em;color:var(--text2);">
                <p>新手指导将带你了解游戏的基本玩法和系统。</p>
                <p style="font-size:0.85em;">推荐初次游玩的玩家观看哦！</p>
            </div>
            <div style="display:flex;gap:10px;margin-top:15px;">
                <button class="btn" id="skipTutorialChoice" style="flex:1;background:#ccc;color:#666;">跳过</button>
                <button class="btn" id="watchTutorialChoice" style="flex:2;background:var(--accent);">📖 观看指导</button>
            </div>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'tutorialChoiceModal');
    if (!modal) return;
    modal.querySelector('#watchTutorialChoice').addEventListener('click', () => {
        modal.remove();
        showIntroModalWithTutorial();
    });
    modal.querySelector('#skipTutorialChoice').addEventListener('click', () => {
        modal.remove();
        skipTutorial();
        showIntroModal();
    });
}

// ===== 引导教程入口 =====
function showIntroModalWithTutorial() {
    document.getElementById('contentArea').innerHTML = `<div class="modal-overlay" id="introModal">
        <div class="modal-box">
            <div style="font-size:2.5em;">🌸</div>
            <b style="font-size:1.1em;color:var(--accent);">欢迎来到兽世</b>
            <p>✨ 你——<b>${state.player.name}</b>，一名21世纪的普通大学生。<br>在一次意外中穿越到了兽人统治的原始世界。<br><br>
            📅 现在是<b>兽历222年1月1日</b>，春季伊始。<br><br>
            接下来将引导你了解游戏的基本操作。</p>
            <button class="btn" id="closeIntro">🌸 开始新手指导</button>
        </div>
    </div>`;
    document.getElementById('closeIntro').addEventListener('click', () => {
        document.getElementById('introModal').remove();
        state.gameStarted = true;
        document.getElementById('topBar').style.display = 'flex';
        document.getElementById('navBar').style.display = 'flex';
        playMusic();
        addLog('你从21世纪穿越到了兽世部落，长老收留了你。', null, 'system');
        addLog('📅 兽历222年1月1日，你开始了在兽世的第一天。', null, 'system');
        addWorldManual('📖 【兽世大陆】这是一个由兽人统治的原始世界，各族在此和谐共处。');
        addWorldManual('📖 兽世由六大兽人族群共同守护：霜月狼族、赤金虎族、九尾玄狐、大地熊族、苍羽鹰族、碧鳞蛇族。');
        addWorldManual('📖 部落由大长老统领，他是一位睿智慈祥的长者，精通兽世的历史与秘闻。');
        addWorldManual('📖 你所在的部落名为"月影部落"，坐落于兽世大陆的中央地带，四季分明。');
        addWorldManual('');
        addWorldManual('🌿 【四季系统】兽世一年分为春季、夏季、雨季、冬季，每个季节持续3个月（每月30天）。');
        addWorldManual('🌸 春季（1-3月）：万物复苏，兽神诞日（1月1日）、春市集、春分祭等节日丰富。');
        addWorldManual('☀️ 夏季（4-6月）：炎热干旱，需注意防暑，夏至庆典和祈雨祭典在此季举行。');
        addWorldManual('🌧️ 雨季（7-10月）：暴雨连绵，其中7月为狩猎季，兽人早出晚归狩猎储备过冬食物。');
        addWorldManual('❄️ 冬季（11-12月）：大雪封山，兽人会变回原型保暖，部分兽人进入冬眠。');
        addWorldManual('💡 在不同季节，部落会举行不同的庆典活动，注意查看公告栏！');
        addWorldManual('💡 不同季节的探索收获和事件也会有所不同，请留意季节变化。');
        addWorldManual('');
        addWorldManual('💡 新手提示：点击底部【地点】标签，选择地点进行探索吧！');
        addWorldManual('💡 恢复生命：在家休息可恢复5-10点生命，温泉恢复20点，锻炼也能小幅恢复。');
        if (state.player.maxHealth < 100) addWorldManual('💡 提升生命上限：去训练场锻炼身体有概率提升生命值上限（最高100点）。');
        addWorldManual('💡 偶遇男主：在训练场、月崖、密林小径等地探索，有机会邂逅他们。');
        addWorldManual('💡 送礼技巧：男主生日当天送礼好感度+30%，玩家生日当天好感>50的男主会主动送礼。');
        const elderData = {
            id: 'elder',
            name: '大长老',
            emoji: '🐺',
            gender: '男',
            race: '狼族',
            age: 70,
            birthMonth: 1,
            birthDay: 1,
            personality: '睿智慈祥，博学多识。他是兽世部落的灵魂人物，知晓许多古老的传说和知识。',
            appearance: '灰白狼耳，银白长须，手持木杖，眼神深邃而慈祥，穿着朴素的兽皮长袍。',
            identity: '部落大长老',
            favorability: 30
        };
        addNPC(elderData);
        addLog('👥 大长老已加入你的角色列表，他将在你的兽世旅程中给予指引。', null, 'npc');
        buildRelationshipMap();
        updateTopBar();
        preloadStudioLogo();
        startTutorial();
    });
}

// ===== 跳过教程直接开始 =====
function showIntroModal() {
    document.getElementById('contentArea').innerHTML = `<div class="modal-overlay" id="introModal">
        <div class="modal-box">
            <div style="font-size:2.5em;">🌸</div>
            <b style="font-size:1.1em;color:var(--accent);">欢迎来到兽世</b>
            <p>✨ 你——<b>${state.player.name}</b>，一名21世纪的普通大学生。<br>在一次意外中穿越到了兽人统治的原始世界。<br><br>
            📅 现在是<b>兽历222年1月1日</b>，春季伊始。<br><br>
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
        playMusic();
        addLog('你从21世纪穿越到了兽世部落，长老收留了你。', null, 'system');
        addLog('📅 兽历222年1月1日，你开始了在兽世的第一天。', null, 'system');
        addWorldManual('📖 【兽世大陆】这是一个由兽人统治的原始世界，各族在此和谐共处。');
        addWorldManual('📖 兽世由六大兽人族群共同守护：霜月狼族、赤金虎族、九尾玄狐、大地熊族、苍羽鹰族、碧鳞蛇族。');
        addWorldManual('📖 部落由大长老统领，他是一位睿智慈祥的长者，精通兽世的历史与秘闻。');
        addWorldManual('📖 你所在的部落名为"月影部落"，坐落于兽世大陆的中央地带，四季分明。');
        addWorldManual('');
        addWorldManual('🌿 【四季系统】兽世一年分为春季、夏季、雨季、冬季，每个季节持续3个月（每月30天）。');
        addWorldManual('🌸 春季（1-3月）：万物复苏，兽神诞日（1月1日）、春市集、春分祭等节日丰富。');
        addWorldManual('☀️ 夏季（4-6月）：炎热干旱，需注意防暑，夏至庆典和祈雨祭典在此季举行。');
        addWorldManual('🌧️ 雨季（7-10月）：暴雨连绵，其中7月为狩猎季，兽人早出晚归狩猎储备过冬食物。');
        addWorldManual('❄️ 冬季（11-12月）：大雪封山，兽人会变回原型保暖，部分兽人进入冬眠。');
        addWorldManual('💡 在不同季节，部落会举行不同的庆典活动，注意查看公告栏！');
        addWorldManual('💡 不同季节的探索收获和事件也会有所不同，请留意季节变化。');
        addWorldManual('');
        addWorldManual('💡 新手提示：点击底部【地点】标签，选择地点进行探索吧！');
        addWorldManual('💡 恢复生命：在家休息可恢复5-10点生命，温泉恢复20点，锻炼也能小幅恢复。');
        if (state.player.maxHealth < 100) addWorldManual('💡 提升生命上限：去训练场锻炼身体有概率提升生命值上限（最高100点）。');
        addWorldManual('💡 偶遇男主：在训练场、月崖、密林小径等地探索，有机会邂逅他们。');
        addWorldManual('💡 送礼技巧：男主生日当天送礼好感度+30%，玩家生日当天好感>50的男主会主动送礼。');
        const elderData = {
            id: 'elder',
            name: '大长老',
            emoji: '🐺',
            gender: '男',
            race: '狼族',
            age: 70,
            birthMonth: 1,
            birthDay: 1,
            personality: '睿智慈祥，博学多识。他是兽世部落的灵魂人物，知晓许多古老的传说和知识。',
            appearance: '灰白狼耳，银白长须，手持木杖，眼神深邃而慈祥，穿着朴素的兽皮长袍。',
            identity: '部落大长老',
            favorability: 30
        };
        addNPC(elderData);
        addLog('👥 大长老已加入你的角色列表，他将在你的兽世旅程中给予指引。', null, 'npc');
        buildRelationshipMap();
        updateTopBar();
        preloadStudioLogo();
        renderHome();
    });
}

function showVisitResultModal(logText, gain, npcId) {
    const highlightedLog = highlightNames(logText);
    const html = `<div class="modal-overlay" id="visitResultModal">
        <div class="modal-box">
            <div style="font-weight:700;color:var(--accent);">🏠 拜访结果</div>
            <div style="margin:15px 0;font-size:1em;">${highlightedLog}</div>
            ${gain ? `<div style="color:var(--accent);">❤️ 友好值 +${gain}</div>` : ''}
            <button class="btn" id="closeVisitResult" style="width:100%;margin-top:10px;">继续</button>
        </div>
    </div>`;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    document.getElementById('closeVisitResult').addEventListener('click', () => {
        document.getElementById('visitResultModal').remove();
        renderNPCDetail(npcId);
    });
}