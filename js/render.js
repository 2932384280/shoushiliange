// render.js - 完整版（含NPC系统、生日、新地点）
import { state, getGuy, getNPC, getNPCs, addLog, updateTopBar, getTodayEvents, canGoOut, saveToSlot, loadFromSlot, getSaveSlots, applyTheme, formatSlotInfo, getDateInfo, getSeason, getSeasonEmoji, isHuntingSeason, getMeetProbability, isGuyBirthday, isPlayerBirthday, getAge, MAX_NPC, addNPC } from './state.js';
import { statInfo, themes, avatarList, ALL_ENDINGS, ACHIEVEMENTS, HIDDEN_ACHIEVEMENTS, NPC_POOL } from './data.js';
import { showToast, showGlobalModal, showInventoryModal, showNPCFirstMeetModal, showNPCRescueModal, showNPCGiftModal, playMusic, togglePlayPause, nextTrack, prevTrack, setPlayMode, getPlayMode, getCurrentTrackName, getMusicPaused } from './ui.js';
import { openPlaceActions, handleGuyHomeVisit, resolveExplore, advanceTime } from './actions.js';
import { checkAndShowPendingDailyEvents } from './events.js';

// ========== 头像选择模态框（玩家用） ==========
export function showAvatarSelectorModal(callback) {
    const emojiList = avatarList;
    let html = `<div class="global-overlay" id="avatarSelectorModal">
        <div class="modal-box">
            <div style="font-weight:700;color:var(--accent);margin-bottom:10px;">👤 选择头像</div>
            <div class="avatar-grid" style="justify-content:center;">
                ${emojiList.map(av => `<div class="avatar-option" data-avatar="${av.emoji}" title="${av.desc}">${av.emoji}</div>`).join('')}
                <label class="avatar-option" style="cursor:pointer;background:#fff;border:2px solid #ffd6e7;border-radius:50%;width:50px;height:50px;display:flex;align-items:center;justify-content:center;font-size:1.8em;transition:0.2s;">
                    📷
                    <input type="file" accept="image/*" id="uploadAvatarInput" style="display:none;">
                </label>
            </div>
            <button class="btn" id="closeAvatarSelector" style="width:100%;margin-top:10px;">取消</button>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    const modal = document.getElementById('avatarSelectorModal');
    modal.querySelectorAll('.avatar-option[data-avatar]').forEach(el => {
        el.addEventListener('click', function() {
            const avatar = this.dataset.avatar;
            modal.remove();
            if (callback) callback(avatar);
        });
    });
    const fileInput = modal.querySelector('#uploadAvatarInput');
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            const dataUrl = ev.target.result;
            modal.remove();
            if (callback) callback(dataUrl);
        };
        reader.readAsDataURL(file);
    });
    modal.querySelector('#closeAvatarSelector').addEventListener('click', () => modal.remove());
}

// ========== 关系文本 ==========
function getRelationText(guy) {
    if (guy.dating) return '💕 伴侣';
    if (guy.affection >= 70) return '👭 亲友';
    if (guy.affection >= 50) return '👫 朋友';
    if (guy.affection >= 20) return '🤝 熟悉';
    return '❓ 陌生';
}

// ========== 判断NPC生日 ==========
export function isNPCBirthday(npc, day) {
    const { month, dayInMonth } = getDateInfo(day);
    return month === npc.birthMonth && dayInMonth === npc.birthDay;
}

// ========== 渲染主页 ==========
export function renderHome() {
    const stats = state.player.stats;
    const maxHp = state.player.maxHealth;
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
    
    const logHtml = state.logs.slice(0, 20).map(l =>
        `<div style="border-bottom:1px dotted #ffd6e7;padding:3px 0;font-size:0.78em;"><span style="color:var(--accent);">${l.time}</span> ${l.text}</div>`
    ).join('');
    const events = getTodayEvents(state.player.day);
    const eventBanner = events.length ? `<div class="event-banner">🎉 ${events.map(e=>e.name).join(' & ')} 进行中！</div>` : '';

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

// ========== 渲染男主列表 ==========
export function renderGuyList() {
    const guysHtml = state.guys.filter(g => !g.hidden || !g.locked).map(g => {
        let hintText = '';
        if (g.locked) {
            hintText = g.cluePlace === g.meetPlace ? `💡在<b>${g.meetPlace}</b>多探索几次或许能遇到他` : `💡在<b>${g.cluePlace}</b>探索可发现<b>${g.meetPlace}</b>`;
        } else if (g.sulkingDays > 0) {
            hintText = `💔 因心碎而躲着你，${g.sulkingDays}天后才愿意见你。`;
        }
        const avatarContent = g.avatar ? `<img src="${g.avatar}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;background:#fff;">` : `<span style="font-size:2.6em;">${g.emoji}</span>`;
        const isBirthday = isGuyBirthday(g, state.player.day);
        return `<div class="guy-card ${g.locked?'locked':''} ${g.banished?'banished':''}" data-guy-id="${g.id}">
            <div style="display:flex;align-items:center;gap:6px;">
                ${avatarContent}
                <span style="font-size:1.2em;opacity:0.6;">${g.emoji}</span>
                ${isBirthday ? '<span style="font-size:1.2em;">🎂</span>' : ''}
            </div>
            <div style="flex:1;font-size:0.8em;">
                <div style="font-weight:700;color:${g.locked||g.banished?'var(--gray)':g.color}">
                    ${g.name} ${g.injured?'🤕':''} ${g.dating?'💕':''}
                    <span class="relation-tag">${getRelationText(g)}</span>
                    ${isBirthday ? '<span style="color:#c0392b;font-weight:700;"> 🎂生日</span>' : ''}
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

// ========== 渲染男主详情 ==========
export function renderGuyDetail(guyId) {
    const guy = getGuy(guyId);
    if (!guy || guy.locked || guy.banished) return;
    const guyLogs = state.logs.filter(l => l.text.includes(guy.name)).slice(0, 5);
    const logsHtml = guyLogs.length ? guyLogs.map(l => `<div style="font-size:0.75em;">${l.time} ${l.text}</div>`).join('') : '暂无';
    const avatarHtml = guy.avatar ? `<img src="${guy.avatar}" style="width:70px;height:70px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);background:#fff;">` : `<span style="font-size:3em;">${guy.emoji}</span>`;
    const meetProb = getMeetProbability(guy);
    const meetProbText = isHuntingSeason(state.player.day) ? `狩猎季相遇概率：${Math.round(meetProb * 100)}%` : '';
    const isBirthday = isGuyBirthday(guy, state.player.day);
    const age = getAge(guy.birthMonth, guy.birthDay, state.player.day);
    
    const birthdayInfo = guy.affection >= 30 ? 
        `<div class="card"><b>🎂 生日：</b>${guy.birthMonth}月${guy.birthDay}日（${getSeason(guy.birthMonth)}） · ${age}岁${isBirthday ? ' 🎉 今天生日！' : ''}</div>` :
        `<div class="card" style="color:var(--text2);"><b>🎂 生日：</b>💡 好感度达到30后可得知</div>`;
    
    document.getElementById('contentArea').innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap;">
            <button class="btn" id="backToGuys">←</button>
            <div style="display:flex;align-items:center;gap:6px;">
                ${avatarHtml}
                <span style="font-size:1.5em;opacity:0.7;">${guy.emoji}</span>
                ${isBirthday ? '<span style="font-size:1.5em;">🎂</span>' : ''}
            </div>
            <span style="font-weight:700;color:${guy.color};font-size:1.2em;">${guy.name}</span>
            ${guy.injured?'🤕':''}${guy.dating?'💕':''}
            <span class="relation-tag">${getRelationText(guy)}</span>
            ${isBirthday ? '<span style="color:#c0392b;font-weight:700;"> 🎂今天生日！</span>' : ''}
        </div>
        ${meetProbText ? `<div style="font-size:0.8em;color:var(--text2);margin-bottom:6px;">${meetProbText}</div>` : ''}
        <div class="card"><b>📋 种族：</b>${guy.race}<br><b>性格：</b>${guy.personality}</div>
        <div class="card"><b>📖 背景：</b>${guy.background}</div>
        <div class="card"><b>💝 喜好：</b>${guy.likes}<br><b>✨ 能力：</b>${guy.ability}</div>
        <div class="card"><b>🐾 兽形：</b>${guy.petDetail}</div>
        <div class="card"><b>📍 主要出没：</b>${guy.mainPlaces ? guy.mainPlaces.join('、') : guy.meetPlace}</div>
        ${birthdayInfo}
        <div class="card">
            <div class="progress-row">❤️ 好感度 <progress class="heart-bar" value="${guy.affection}" max="100"></progress> ${guy.affection}</div>
            <div class="progress-row">🔒 占有欲 <progress class="obsess-bar" value="${guy.obsession}" max="100"></progress> ${guy.obsession}</div>
        </div>
        <div class="card"><b>📜 互动记录</b><br>${logsHtml}</div>
    `;
    document.getElementById('backToGuys').addEventListener('click', () => renderGuyList());
}

// ========== 渲染角色（NPC）列表 ==========
export function renderNPCList() {
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
        return `<div class="guy-card" data-npc-id="${npc.id}" style="cursor:pointer;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:2.5em;">${npc.emoji}</span>
                <span style="font-size:1.2em;opacity:0.6;">${npc.race}</span>
                ${isToday ? '<span style="font-size:1.2em;">🎂</span>' : ''}
            </div>
            <div style="flex:1;font-size:0.85em;">
                <div style="font-weight:700;color:var(--accent);">
                    ${npc.name} ${isToday ? '🎂生日' : ''}
                    <span style="font-weight:400;color:var(--text2);">${npc.identity}</span>
                </div>
                <div style="color:var(--text2);">${npc.gender} · ${npc.race}</div>
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
}

// ========== NPC详情页 ==========
export function renderNPCDetail(npcId) {
    const npc = getNPC(npcId);
    if (!npc) return;

    const age = getAge(npc.birthMonth, npc.birthDay, state.player.day);
    const isToday = isNPCBirthday(npc, state.player.day);

    document.getElementById('contentArea').innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap;">
            <button class="btn" id="backToNpcs">←</button>
            <span style="font-size:3em;">${npc.emoji}</span>
            <span style="font-weight:700;font-size:1.2em;color:var(--accent);">${npc.name}</span>
            ${isToday ? '<span style="color:#c0392b;font-weight:700;"> 🎂今天生日！</span>' : ''}
        </div>
        <div class="card"><b>📋 性别：</b>${npc.gender}<br><b>种族：</b>${npc.race}</div>
        <div class="card"><b>🎂 生日：</b>${npc.birthMonth}月${npc.birthDay}日 · ${age}岁</div>
        <div class="card"><b>🎭 性格：</b>${npc.personality}</div>
        <div class="card"><b>👤 外貌：</b>${npc.appearance}</div>
        <div class="card"><b>📜 身份：</b>${npc.identity}</div>
        <div class="card">
            <div class="progress-row">❤️ 友好值 <progress class="heart-bar" value="${npc.favorability}" max="100"></progress> ${npc.favorability}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
            <button class="btn" id="giftNpcBtn">🎁送礼</button>
            <button class="btn" id="visitNpcBtn">🏠拜访</button>
        </div>
    `;

    document.getElementById('backToNpcs').addEventListener('click', () => renderNPCList());

    // 送礼
    document.getElementById('giftNpcBtn').addEventListener('click', () => {
        if (state.player.inventory.length === 0) {
            showNoGiftModal();
            return;
        }
        const gift = state.player.inventory.pop();
        const gain = 3 + Math.floor(Math.random() * 4);
        const bonus = isNPCBirthday(npc, state.player.day) ? Math.floor(gain * 0.3) : 0;
        npc.favorability = Math.min(100, npc.favorability + gain + bonus);
        addLog(`你送给${npc.name}${gift}，友好值+${gain+bonus}${bonus>0?'（生日加成）':''}`);
        showToast(`送给${npc.name}礼物，友好值+${gain+bonus}`);
        renderNPCDetail(npcId);
    });

    // 拜访（消耗一次行动）
    document.getElementById('visitNpcBtn').addEventListener('click', () => {
        if (!canGoOut()) {
            showCantGoOutModal();
            return;
        }
        if (Math.random() < 0.3) {
            addLog(`${npc.name}不在家，你白跑一趟。`);
            showToast(`${npc.name}不在家`);
            advanceTime();
            updateTopBar();
            renderNPCDetail(npcId);
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
        addLog(`拜访${npc.name}：${text} 友好值+${gain}`);
        showToast(`与${npc.name}交谈，友好值+${gain}`);
        advanceTime();
        updateTopBar();
        renderNPCDetail(npcId);
    });
}

// ========== 渲染地点列表 ==========
export function renderPlaces() {
    const outAllowed = canGoOut();
    const p = state.player;
    const events = getTodayEvents(state.player.day);
    const lockedSet = new Set();
    events.forEach(ev => { if (ev.effects?.lockedPlaces) ev.effects.lockedPlaces.forEach(pl => lockedSet.add(pl)); });
    const isHunting = isHuntingSeason(state.player.day);

    const placesHtml = state.places.map(pl => {
        let extraInfo = '';
        const isEventLocked = lockedSet.has(pl.name) && !pl.locked;
        const isTempLocked = (pl.name !== '我家' && !outAllowed);
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
        return `<div class="place-item ${isLocked?'locked':''}" data-place="${pl.name}">
            <span class="place-icon">${pl.icon}</span>
            <span class="place-name">${pl.name}${sickHome}</span>
            ${extraInfo}
        </div>`;
    }).join('');

    const eventBanner = events.length
        ? `<div class="event-banner">🎉 ${events.map(e=>e.name).join(' & ')} 进行中！</div>`
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

// ========== 设置页面 ==========
export function renderSettings() {
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
        : `<span style="font-size:2em;">${state.player.avatar || '👧🏻'}</span>`;

    document.getElementById('contentArea').innerHTML = `
        <div class="card"><b>👤 我的头像</b><br>
            <div style="display:flex;align-items:center;gap:10px;justify-content:center;">
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
        <div class="card"><button class="btn" id="restartBtn">🔄 重新开始</button></div>
    `;

    document.getElementById('changePlayerAvatarBtn').addEventListener('click', () => {
        showAvatarSelectorModal((newAvatar) => {
            state.player.avatar = newAvatar;
            updateTopBar();
            renderSettings();
            showToast('头像已更新');
        });
    });

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

// ========== 存档管理 ==========
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

// ========== 结局图鉴 ==========
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

// ========== 成就查看 ==========
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

// ========== 开始界面 ==========
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
    const uploadHtml = `<label class="avatar-option" style="cursor:pointer;background:#fff;border:2px solid #ffd6e7;border-radius:50%;width:50px;height:50px;display:flex;align-items:center;justify-content:center;font-size:1.8em;transition:0.2s;">
        📷
        <input type="file" accept="image/*" id="startUploadAvatar" style="display:none;">
    </label>`;
    document.getElementById('contentArea').innerHTML = `
        <div class="start-screen">
            <div class="start-title">兽 世 恋 歌</div>
            <div class="start-subtitle">～ 现代少女 × 毛茸茸兽人 ～</div>
            <div style="font-size:0.8em;color:var(--text2);">兽历222年1月1日 · 春季</div>
            <div class="input-group"><label>✏️ 你的名字</label><br><input type="text" id="playerNameInput" value="小春" maxlength="10"></div>
            <div style="font-weight:700;color:var(--accent);">👩🏻 选择头像</div>
            <div class="avatar-grid" id="startAvatarGrid">
                ${ah}
                ${uploadHtml}
            </div>
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
    window.tempStats = window.tempStats || { health:90, charm:12, intuition:10, endurance:5, talent:8, affinity:15 };
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

    const fileInput = document.getElementById('startUploadAvatar');
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            const dataUrl = ev.target.result;
            window.selectedAvatar = dataUrl;
            document.querySelectorAll('#startAvatarGrid .avatar-option[data-avatar]').forEach(o => o.classList.remove('selected'));
            const label = fileInput.closest('.avatar-option');
            label.style.borderColor = 'var(--accent)';
            label.style.background = '#ffd6e7';
            showToast('图片已选择，点击开始游戏即可使用');
        };
        reader.readAsDataURL(file);
    });

    document.getElementById('randomStatsBtn').addEventListener('click', () => {
        window.tempStats.health = Math.floor(Math.random()*21)+80;
        window.tempStats.charm = Math.floor(Math.random()*8)+8;
        window.tempStats.intuition = Math.floor(Math.random()*9)+6;
        window.tempStats.endurance = Math.floor(Math.random()*8)+3;
        window.tempStats.talent = Math.floor(Math.random()*8)+5;
        window.tempStats.affinity = Math.floor(Math.random()*11)+10;
        updateStatsDisplay();
    });

    document.getElementById('enterGameBtn').addEventListener('click', () => {
        state.player.name = document.getElementById('playerNameInput').value.trim() || '小春';
        state.player.avatar = window.selectedAvatar || '👧🏻';
        Object.keys(window.tempStats).forEach(k => state.player.stats[k] = window.tempStats[k]);
        state.player.maxHealth = window.tempStats.health;
        state.player.day = 1;
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

        addLog('你从21世纪穿越到了兽世部落，长老收留了你。');
        addLog('💡新手提示：点击底部【地点】标签，选择地点进行探索吧！');
        addLog('💡恢复生命：在家休息可恢复5-10点生命，温泉恢复20点，锻炼也能小幅恢复。');
        if (state.player.maxHealth < 100) addLog('💡提升生命上限：去训练场锻炼身体有概率提升生命值上限（最高100点）。');
        addLog('💡偶遇男主：在训练场、月崖、密林小径等地探索，有机会邂逅他们。');
        addLog('📅 兽历222年1月1日，你开始了在兽世的第一天。');
        updateTopBar();
        renderHome();
    });
}