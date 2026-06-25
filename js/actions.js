// actions.js - 完整版（含所有之前功能 + 交往弹窗 + 墨漓低血量救治 + 打工/出售草药等）
import { state, getGuy, getNPCs, addNPC, addLog, updateTopBar, getTodayEvents, getTopGuy, hasAnyDating, canGoOut, saveToSlot, loadFromSlot, applyTheme, formatSlotInfo, hasAnySave, CYCLE_LENGTH, getDateInfo, getSeason, getSeasonEmoji, isHuntingSeason, isRainySeason, isGuyBirthday, isPlayerBirthday, getAge, MAX_NPC, reorderPlaces, DAILY_FOOD_COST } from './state.js';
import { statInfo, beastWorldKnowledge, firstMeetStories, confessionStories, soulOathStories, imprisonmentStories, unrequitedStories, TRIBAL_EVENTS, DATE_CONTENTS, DEFAULT_DATE, NPC_INTERACTIONS, GUY_RELATIONSHIPS, FIRST_NAMES_MALE, FIRST_NAMES_FEMALE, LAST_NAMES, RACES, RACES_EMOJI, PERSONALITIES, APPEARANCES_MALE, APPEARANCES_FEMALE, IDENTITIES, ELDER_DATA, RELATION_TYPES, IDENTITY_AGE_REQUIREMENTS } from './data.js';
import { showToast, showGlobalModal, showNPCInteractionModal, showNPCFirstMeetModal, showNPCRescueModal, showNPCGiftModal, showGiftFromGuyModal } from './ui.js';
import { renderHome, renderPlaces, showActionResult, showNoGiftModal, openSaveLoadModal, showCantGoOutModal, renderGuyList, renderNPCList, render } from './render.js';
import { triggerDisaster, triggerRandomEvent, triggerHeartEvent, showCombinedEventModal, checkAndShowPendingDailyEvents } from './events.js';

// ========== 防卡死锁（仅用于advanceTime） ==========
let _processingLock = false;

const baseBulletins = [
    '今日收获：猎队带回三头野猪，蜂蜜储备充足。',
    '长老提醒：近日河边有野兽出没，请居民小心。',
    '庆典预告：下周将举办丰收祭，欢迎报名参加。',
    '铁匠铺通知：岩岳大师新锻造了一批农具。',
    '天气预警：明日可能有暴雨，请加固房屋。'
];
const baseRumors = [
    '听说烈阳昨天独自猎杀了一头巨熊。',
    '有人看见玄羽深夜在祭坛独自徘徊。',
    '苍夜首领最近经常独自前往月崖。',
    '河边采花的女孩们说最近在密林附近听到了奇怪的歌声。',
    '据说有位流浪商人带来了一块会发光的宝石。'
];

// ========== 公告与传闻 ==========
export function getBulletins() {
    const day = state.player.day;
    const { month } = getDateInfo(day);
    const events = getTodayEvents(day);
    if (events.length) return [`📢 公告：【${events[0].name}】正在${events[0].locations.join('、')}举行！`];
    const tomorrow = getTodayEvents(day + 1);
    if (tomorrow.length) return [`📢 预告：明天将举行【${tomorrow[0].name}】`];
    const season = getSeason(month);
    if (season === '雨季' && month === 7) return ['🏹 狩猎季开始！猎人们已整装待发，祝他们满载而归！'];
    if (season === '雨季' && month === 8) return ['🌧️ 雨季持续，河边水位上涨，请居民注意安全。'];
    if (season === '冬季') return ['❄️ 冬季已至，请备好木柴和冬衣，注意保暖。'];
    if (season === '春季') return ['🌸 春回大地，万物复苏，部落即将迎来兽神诞日。'];
    if (season === '夏季') return ['☀️ 夏季炎热，请注意防暑，午后尽量在阴凉处活动。'];
    for (let guy of state.guys) {
        if (isGuyBirthday(guy, day)) {
            return [`🎂 今天是 ${guy.emoji} ${guy.name} 的生日！`];
        }
    }
    if (isPlayerBirthday(day)) {
        return [`🎂 今天是你的生日！兽人们可能会给你送来惊喜。`];
    }
    return baseBulletins;
}

export function getRumors() {
    const day = state.player.day;
    const { month } = getDateInfo(day);
    const events = getTodayEvents(day);
    if (events.length) return [`🗣️ 大家都在谈论今天的【${events[0].name}】`];
    const season = getSeason(month);
    if (season === '雨季' && month === 7) return ['🗣️ 猎人们都在摩拳擦掌，准备大干一场！'];
    if (season === '雨季' && month === 8) return ['🗣️ 听说有人在密林深处发现了巨型野兽的足迹。'];
    if (season === '冬季') return ['🗣️ 长老说今年冬天会比往年更冷，得多备些木柴。'];
    if (season === '春季') return ['🗣️ 小梅说她看到祭坛上方的星星特别亮，可能是有好事要发生。'];
    if (season === '夏季') return ['🗣️ 市场新到了一批清凉果，据说能解暑。'];
    return baseRumors;
}

// ========== 健康状态检查 ==========
export function checkHealthStatus() {
    const p = state.player;
    const e = p.stats.endurance;
    const threshold = 40 - Math.floor(e / 2);
    const { month } = getDateInfo(p.day);
    const isWinter = getSeason(month) === '冬季';

    if (p.sick && p.sickDays > 0) {
        if (p.caregiver) {
            const guy = getGuy(p.caregiver);
            if (guy && !guy.locked && !guy.banished) {
                p.stats.health = Math.min(p.maxHealth, p.stats.health + 2);
                guy.affection = Math.min(100, guy.affection + 1);
                if (!window._caregiverShown) {
                    window._caregiverShown = true;
                    showGlobalModal(`<div class="global-overlay" id="caregiverModal"><div class="modal-box">${guy.emoji} ${guy.name} 轻轻为你擦去额头的汗，守了你一整夜。“别担心，我会一直陪着你。”</div></div>`, 'caregiverModal');
                    setTimeout(() => { window._caregiverShown = false; }, 5000);
                }
            }
        }
        p.sickDays--;
        if (p.sickDays <= 0) { p.sick = false; p.caregiver = null; addLog('你的病已经痊愈了！'); }
    } else if (p.sick && p.sickDays <= 0) {
        p.sick = false; p.caregiver = null;
    }

    const sicknessModifier = isWinter ? 1.5 : 1;
    if (!p.sick && p.stats.health <= threshold) {
        const prob = Math.max(0.1, 0.5 - e * 0.005) * sicknessModifier;
        if (Math.random() < prob) {
            p.sick = true;
            p.sickDays = 3 + Math.floor(Math.random() * 2);
            const tg = getTopGuy();
            if (tg) { p.caregiver = tg.id; addLog(`你因身体虚弱病倒了。${tg.name}主动来照顾你。`); }
            else addLog('你病倒了，独自躺在小屋里……');
        }
    }

    state.guys.forEach(g => {
        if (g.injured && g.injuredDays > 0) { g.injuredDays--; if (g.injuredDays <= 0) { g.injured = false; addLog(`${g.name}的伤已经痊愈了。`); } }
        if (g.sulkingDays > 0) { g.sulkingDays--; if (g.sulkingDays <= 0) addLog(`${g.name}似乎不再生闷气了，愿意出来走动了。`); }
    });

    // 生命低于30时墨漓高概率出现
    if (p.stats.health < 30 && !p.sick && !p.isDead) {
        const moli = getGuy('moli');
        if (moli && !moli.banished) {
            if (Math.random() < 0.7) {
                if (moli.locked) {
                    moli.locked = false;
                    state.places.find(p => p.name === '巫医所').locked = false;
                    p.stats.health = Math.min(p.maxHealth, p.stats.health + 30);
                    addLog('💚 墨漓突然出现，为你救治，生命恢复30点。');
                    showGlobalModal(`<div class="global-overlay" id="moliHealModal"><div class="modal-box">🐍 墨漓从密林深处走来，他看了看你的伤势，轻轻摇头：“你这条命，我救定了。”他手中碧光一闪，你的伤口迅速愈合。</div></div>`, 'moliHealModal');
                } else {
                    p.stats.health = Math.min(p.maxHealth, p.stats.health + 20);
                    addLog('💚 墨漓为你调理气息，生命恢复20点。');
                    showToast('墨漓治愈了你。');
                }
            }
        }
    }

    // 原有墨漓低概率救治（保留但降低概率）
    if (!p.sick && p.stats.health <= p.maxHealth * 0.2 && Math.random() < 0.1) {
        const moli = getGuy('moli');
        if (moli && moli.locked) {
            moli.locked = false;
            state.places.find(p => p.name === '巫医所').locked = false;
            p.stats.health = Math.min(p.maxHealth, p.stats.health + 30);
            addLog('你生命垂危，一位神秘的巫医出现并救治了你。他自称墨漓，似乎对你产生了兴趣。');
            showFirstMeetModal(moli, { name: '某处' }, '墨漓救了你，生命恢复了30点。');
        } else if (moli && !moli.locked && !moli.banished) {
            p.stats.health = Math.min(p.maxHealth, p.stats.health + 20);
            addLog('墨漓再次出现，为你治疗了伤口。');
        }
    }
}

// ========== 时间推进 ==========
export function advanceTime() {
    if (state._processingEvent) {
        console.warn('⚠️ 检测到事件循环，跳过本次执行');
        return;
    }
    if (_processingLock) {
        console.warn('⚠️ 处理锁已激活，跳过本次执行');
        return;
    }
    _processingLock = true;
    state._processingEvent = true;
    try {
        state.player.time++;
        if (state.player.time > 3) {
            state.player.time = 0;
            state.player.day++;
            const dateInfo = getDateInfo(state.player.day);
            const season = getSeason(dateInfo.month);

            const recoverAmount = season === '春季' ? 8 : (season === '冬季' ? 3 : 5);
            state.player.stats.health = Math.min(state.player.maxHealth, state.player.stats.health + recoverAmount);
            addLog(`新的一天，生命恢复了${recoverAmount}点。`);

            const p = state.player;
            const isMovedIn = p.movedIn !== null;
            if (!isMovedIn) {
                if (p.gold >= DAILY_FOOD_COST) {
                    p.gold -= DAILY_FOOD_COST;
                    p.daysWithoutFood = 0;
                    addLog(`支付了今日的食物费用${DAILY_FOOD_COST}金币。`);
                } else {
                    p.daysWithoutFood++;
                    addLog(`💰 金币不足，无法支付食物费用（已持续${p.daysWithoutFood}天）！`);
                    if (p.daysWithoutFood === 1) {
                        showToast('⚠️ 金币不足！去部落广场、训练场等地「打工赚钱」可获取金币。');
                    }
                    if (p.daysWithoutFood >= 3 && p.daysWithoutFood < 5) {
                        if (p.stats.health > 20) {
                            p.stats.health = 20;
                            addLog('⚠️ 因长期饥饿，你的生命值骤降至20！');
                            showToast('⚠️ 你已虚弱不堪，生命值降为20！');
                        }
                    } else if (p.daysWithoutFood >= 5) {
                        p.isDead = true;
                        p.stats.health = 0;
                        addLog('💀 你因饥饿过度而倒下了……');
                        showDeathEnding();
                        updateTopBar();
                        _processingLock = false;
                        state._processingEvent = false;
                        return;
                    }
                }
            } else {
                addLog('🏠 与男主同居，他为你支付了今日的食物费用。');
                p.daysWithoutFood = 0;
            }

            // 重置生日礼物标记（拆分为两个独立标记）
            state.player.guyBirthdayGiftReceived = false;
            state.player.npcBirthdayGiftReceived = false;

            const events = getTodayEvents(state.player.day);
            if (events.length) state._pendingDailyEvents = events;

            const disasterProb = season === '雨季' ? 0.15 : (season === '夏季' ? 0.12 : 0.08);
            if (Math.random() < disasterProb) triggerDisaster();
            else checkHealthStatus();

            checkAndTriggerDateInvites();
            checkNPCInteractions();
            checkPlayerBirthdayGifts();
            checkNpcBirthdayGifts();

            reorderPlaces();

            autoSave();
        }
        updateTopBar();
    } finally {
        state._processingEvent = false;
        _processingLock = false;
    }
}

// ========== 死亡结局 ==========
function showDeathEnding() {
    const html = `<div class="global-overlay" id="deathEndingModal">
        <div class="modal-box" style="text-align:center;">
            <div style="font-size:4em;">💀</div>
            <h2 style="color:red;">死亡结局</h2>
            <p>你因连续多日无法支付食物费用，<br>最终饿死在了兽世大陆……</p>
            <p style="font-size:0.9em;color:var(--text2);">第 ${state.player.day} 天</p>
            <div class="actions">
                <button class="btn" id="loadSaveDeath">📤 读档</button>
                <button class="btn" id="restartDeath" style="background:#ff4d6d;">🔄 重新开始</button>
            </div>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'deathEndingModal');
    modal.querySelector('#loadSaveDeath').addEventListener('click', () => {
        modal.remove();
        openSaveLoadModal();
    });
    modal.querySelector('#restartDeath').addEventListener('click', () => {
        if (confirm('确定重新开始？')) window.restartGame();
    });
}

// ========== 自动存档 ==========
export function autoSave() {
    if (state.autoSaveMode === 'never') return;
    const d = state.player.day;
    if (state.autoSaveMode === 'day') { saveToSlot(0); return; }
    if (state.autoSaveMode === 'week' && d % 7 === 0) saveToSlot(0);
}

// ========== 首次相遇 ==========
export function showFirstMeetModal(guy, place, logText) {
    const htmlContent = `<div class="global-overlay" id="firstMeetModal"><div class="modal-box">${firstMeetStories[guy.id] || `<h2>初遇${guy.name}</h2><p>你第一次见到了${guy.name}。</p>`}<button class="btn" id="closeFirstMeet" style="width:100%;margin-top:15px;">继续</button></div></div>`;
    const modal = showGlobalModal(htmlContent, 'firstMeetModal');
    modal.querySelector('#closeFirstMeet').addEventListener('click', () => {
        modal.remove();
        state.gameActive = true;
        checkHealthStatus();
        advanceTime();
        updateTopBar();
        showActionResult(logText, place);
    });
}

// ========== 男主约会邀请 ==========
function checkAndTriggerDateInvites() {
    const day = state.player.day;
    const availableGuys = state.guys.filter(g => !g.locked && !g.banished && g.affection >= 70);
    if (availableGuys.length === 0) return;
    for (let guy of availableGuys) {
        if (day - guy.lastInviteDay < guy.inviteCooldown) continue;
        const baseProb = 0.08 + (guy.affection - 70) * 0.002;
        if (Math.random() < baseProb) {
            guy.lastInviteDay = day;
            triggerDateInvite(guy);
            return;
        }
    }
}

function triggerDateInvite(guy) {
    const availableLocations = getAvailableDateLocations(guy);
    if (availableLocations.length === 0) return;
    const location = availableLocations[Math.floor(Math.random() * availableLocations.length)];
    const dateContent = DATE_CONTENTS[guy.id]?.[location] || DEFAULT_DATE;
    const html = `<div class="global-overlay" id="dateInviteModal">
        <div class="modal-box" style="max-width:600px;">
            <div style="font-size:2em;text-align:center;color:var(--accent);">💌 约会邀请</div>
            <p style="text-align:center;font-size:1.1em;font-weight:700;">${guy.emoji} ${guy.name} 邀请你一起去${location}</p>
            <div style="background:#fff5f8;border-radius:12px;padding:12px;margin:12px 0;border:1px solid var(--border);">
                <p style="font-size:0.95em;color:var(--text);line-height:1.8;">“${dateContent.title ? '我们一起去' + location + '吧，我有话想对你说。' : '可以陪我去' + location + '吗？' }”</p>
                <p style="font-size:0.8em;color:var(--text2);text-align:right;">—— ${guy.name}</p>
            </div>
            <div class="actions"><button class="btn" id="acceptDate" style="background:#ff4d6d;min-width:120px;">💕 答应他</button><button class="btn" id="rejectDate" style="min-width:120px;">💔 婉拒</button></div>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'dateInviteModal');
    modal.querySelector('#acceptDate').addEventListener('click', () => { modal.remove(); executeDate(guy, location, dateContent); });
    modal.querySelector('#rejectDate').addEventListener('click', () => { modal.remove(); addLog(`你婉拒了${guy.name}的约会邀请。`); showToast(`你婉拒了${guy.name}的邀请`); updateTopBar(); render(); });
}

function getAvailableDateLocations(guy) {
    const locations = ['部落广场', '河边', '月崖'];
    const guyLocations = {
        cangye: ['月崖', '苍夜之窟', '河边', '部落广场'],
        lieyang: ['训练场', '烈阳木屋', '河边', '部落广场'],
        xuanyu: ['密林小径', '玄羽幻香居', '月崖', '河边'],
        yanyue: ['铁匠铺', '岩岳石洞', '河边', '部落广场'],
        liuyun: ['哨塔', '流云云巢', '月崖', '河边'],
        moli: ['密林', '巫医所', '河边', '月崖']
    };
    const available = guyLocations[guy.id] || locations;
    return available.filter(loc => {
        const place = state.places.find(p => p.name === loc);
        return place && !place.locked;
    });
}

function executeDate(guy, location, dateContent) {
    advanceTime();
    const isHunting = isHuntingSeason(state.player.day);
    const affectionGain = isHunting ? Math.floor(dateContent.affectionGain * 0.6) : dateContent.affectionGain;
    const obsessionGain = isHunting ? Math.floor(dateContent.obsessionGain * 0.7) : dateContent.obsessionGain;
    guy.affection = Math.min(100, guy.affection + affectionGain);
    guy.obsession = Math.min(100, guy.obsession + obsessionGain);
    if (!state.dateHistory) state.dateHistory = [];
    state.dateHistory.push({ guyId: guy.id, location, date: state.player.day, content: dateContent.content });
    const html = `<div class="global-overlay" id="dateResultModal">
        <div class="modal-box" style="max-width:650px;">
            <div style="font-size:1.8em;text-align:center;color:var(--accent);">💕 ${dateContent.title || '浪漫约会'}</div>
            <div style="text-align:center;font-size:0.9em;color:var(--text2);margin-bottom:12px;">📍 ${location} · 与 ${guy.emoji} ${guy.name}</div>
            <div style="background:#fff5f8;border-radius:12px;padding:16px;border:1px solid var(--border);max-height:400px;overflow-y:auto;line-height:1.9;font-size:0.95em;white-space:pre-wrap;">${dateContent.content}</div>
            <div style="margin-top:12px;text-align:center;font-size:0.9em;color:var(--accent);">${guy.name} 好感度 +${affectionGain}，占有欲 +${obsessionGain}</div>
            <button class="btn" id="closeDateResult" style="width:100%;margin-top:12px;">继续</button>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'dateResultModal');
    modal.querySelector('#closeDateResult').addEventListener('click', () => { modal.remove(); addLog(`你与${guy.name}在${location}约会了。`, location); updateTopBar(); render(); });
}

// ========== NPC互动 ==========
function checkNPCInteractions() {
    if (Math.random() > 0.3) return;
    const availableNpcs = state.npcs.filter(n => n.favorability >= 10);
    if (availableNpcs.length === 0) return;
    const npc = availableNpcs[Math.floor(Math.random() * availableNpcs.length)];
    const interaction = NPC_INTERACTIONS[npc.id];
    if (!interaction) return;
    const types = ['talk'];
    if (Math.random() < 0.3) types.push('greet');
    const type = types[Math.floor(Math.random() * types.length)];
    let text = '';
    if (type === 'greet') text = interaction.greet || `${npc.name}向你打了招呼。`;
    else { const talks = interaction.talk || ['${npc.name}和你聊了几句。']; text = talks[Math.floor(Math.random() * talks.length)]; }
    showNPCInteractionModal(npc, text);
    npc.favorability = Math.min(100, npc.favorability + (interaction.affectionGain || 1));
}

// ========== NPC生日送礼（使用独立标记） ==========
function checkNpcBirthdayGifts() {
    const day = state.player.day;
    if (!isPlayerBirthday(day)) return;
    if (state.player.npcBirthdayGiftReceived) return;
    const giftGivers = state.npcs.filter(n => n.favorability >= 70);
    if (giftGivers.length === 0) return;
    const npc = giftGivers[Math.floor(Math.random() * giftGivers.length)];
    const giftNames = ['🌺一束鲜花', '🍯一罐蜂蜜', '🧣一条围巾', '📜一本古籍', '🪶一支羽毛笔', '🍞一篮面包', '🧵刺绣手帕', '🪔一盏油灯'];
    const giftText = `${npc.name}送给你一份生日礼物：${giftNames[Math.floor(Math.random() * giftNames.length)]}`;
    const gain = 3 + Math.floor(Math.random() * 5);
    const goldGift = Math.random() < 0.3 ? 5 + Math.floor(Math.random() * 10) : 0;
    npc.favorability = Math.min(100, npc.favorability + 1);
    state.player.npcBirthdayGiftReceived = true;
    if (goldGift > 0) {
        state.player.gold += goldGift;
        addLog(`🎂 ${npc.name}在你生日这天送来了礼物和 ${goldGift} 金币！`);
        showNPCGiftModal(npc, `${giftText}<br>💰 额外获得 ${goldGift} 金币！`, gain);
    } else {
        addLog(`🎂 ${npc.name}在你生日这天送来了礼物！`);
        showNPCGiftModal(npc, giftText, gain);
    }
}

// ========== 男主生日送礼（使用独立标记） ==========
function checkPlayerBirthdayGifts() {
    const day = state.player.day;
    if (!isPlayerBirthday(day)) return;
    if (state.player.guyBirthdayGiftReceived) return;
    const giftGivers = state.guys.filter(g => !g.locked && !g.banished && g.affection >= 50);
    if (giftGivers.length === 0) return;
    const guy = giftGivers[Math.floor(Math.random() * giftGivers.length)];
    const affectionGain = 5 + Math.floor(guy.affection / 20);
    const goldGift = Math.random() < 0.4 ? 10 + Math.floor(Math.random() * 20) : 0;
    const giftMessages = {
        cangye: `“今天是你的生日，我特意为你准备了这份礼物。霜月狼族的传统，生日这天要送一件亲手制作的东西。”苍夜递给你一枚雕刻着狼头图腾的月光石吊坠，眼中带着罕见的温柔。“戴上它，就像我一直在你身边。”`,
        lieyang: `“生日快乐！我一大早就去山里打猎了，给你弄了最好的猎物！”烈阳扛着一头处理好的鹿，笑得眼睛都弯成了月牙。“今晚我烤肉给你吃，保证是部落第一！”`,
        xuanyu: `“生辰吉乐。”玄羽将一朵散发着幽蓝色光芒的花递到你面前。“这是我用百年灵力培育的‘永夜花’，能在黑暗中为你指路。收下它，就像我把一部分灵力分给了你。”`,
        yanyue: `“给、给你的。”岩岳红着脸递给你一个精致的小木盒，打开是一枚用星铁打造的戒指。“我……我打了好几个晚上，希望你喜欢。生日快乐。”`,
        liuyun: `“听说今天是你生日。”流云站在你面前，别过头去，但翅膀却轻轻展开，从羽翼间落下一根泛着金光的飞羽。“这是鹰族的祝福之羽，能带来好运。我不太会说好听的话……但希望你开心。”`,
        moli: `“你这条小命，又长大了一岁。”墨漓从竹楼走出来，手中托着一枚碧绿色的药丸。“这是我用百年蛇蜕炼制的‘碧寿丹’，能延年益寿。生日快乐，愿你长命百岁。”`
    };
    let giftText = giftMessages[guy.id] || `${guy.name}送给你一份精心准备的生日礼物！`;
    if (goldGift > 0) {
        giftText += `<br>💰 还悄悄塞给你 ${goldGift} 金币！`;
    }
    guy.affection = Math.min(100, guy.affection + affectionGain);
    state.player.guyBirthdayGiftReceived = true;
    if (goldGift > 0) {
        state.player.gold += goldGift;
        addLog(`🎂 ${guy.name}在你生日这天送来了礼物和 ${goldGift} 金币！好感度+${affectionGain}`);
    } else {
        addLog(`🎂 ${guy.name}在你生日这天送来了礼物！好感度+${affectionGain}`);
    }
    showGiftFromGuyModal(guy, giftText, affectionGain);
}

// ========== 好感度与占有欲 ==========
export function addAffectionAndObsession(guy, amount, triggerJealousy = true) {
    if (!guy || guy.locked || guy.banished) return;
    const isHunting = isHuntingSeason(state.player.day);
    const effectiveAmount = isHunting ? Math.floor(amount * 0.7) : amount;
    guy.affection = Math.min(100, guy.affection + effectiveAmount);
    const obsessGain = effectiveAmount;
    if (!guy.obsessActive) {
        if (guy.obsessType === 'early' && guy.affection >= 60) guy.obsessActive = true;
        else if (guy.obsessType === 'late' && guy.affection >= 100) guy.obsessActive = true;
    }
    if (guy.obsessActive) guy.obsession = Math.min(100, guy.obsession + obsessGain);
    if (guy.dating && guy.obsession < 30) guy.obsession = Math.max(guy.obsession, 30);
    if (triggerJealousy) {
        const others = state.guys.filter(g => !g.locked && !g.banished && g.id !== guy.id);
        others.forEach(g => { if (Math.random() < 0.2) g.obsession = Math.min(100, g.obsession + 1 + Math.floor(Math.random() * 2)); });
    }
    if (guy.obsession >= 100 && !hasAnyDating() && state.gameActive) {
        state.gameActive = false;
        if (!state.player.prisonRecord.includes(guy.id)) state.player.prisonRecord.push(guy.id);
        triggerImprisonment(guy);
        return;
    }
    if (guy.affection >= 90 && !guy.dating && !guy.proposed && !hasAnyDating() && state.gameActive) {
        if (Math.random() < 0.7) {
            state.gameActive = false;
            guy.proposed = true;
            setTimeout(() => triggerConfession(guy), 100);
        }
    }
}

// ========== 告白系统 ==========
function triggerConfession(guy) {
    const others = state.guys.filter(g => !g.locked && !g.banished && g.id !== guy.id && g.affection >= 70);
    const htmlContent = `<div class="global-overlay" id="confessionModal"><div class="modal-box">${confessionStories[guy.id] || `<h2>${guy.name}的告白</h2>`}<div class="actions"><button class="btn" id="acceptConfession" style="background:#ff4d6d;">💕 答应他</button><button class="btn" id="rejectConfession">💔 拒绝</button></div></div></div>`;
    const modal = showGlobalModal(htmlContent, 'confessionModal');
    modal.querySelector('#acceptConfession').addEventListener('click', () => { modal.remove(); acceptConfession(guy, others); });
    modal.querySelector('#rejectConfession').addEventListener('click', () => { modal.remove(); rejectConfession(guy); });
}

// ========== 修改 acceptConfession 添加弹窗 ==========
function acceptConfession(guy, others) {
    guy.dating = true;
    guy.affection = 100;
    state.player.movedIn = guy.id;
    state.gameActive = true;
    addLog(`💕 你接受了${guy.name}的告白，搬到了他的家中与他共同生活。`);
    others.forEach(g => g.obsession = Math.min(100, g.obsession + 3 + Math.floor(Math.random() * 5)));
    reorderPlaces();
    updateTopBar();
    state.currentTab = 'home';
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('.nav-item[data-tab="home"]').classList.add('active');
    renderHome();

    // 添加交往成功弹窗
    const modalHtml = `<div class="global-overlay" id="confessionSuccessModal">
        <div class="modal-box" style="text-align:center;">
            <div style="font-size:3em;">💕</div>
            <h2 style="color:var(--accent);">交往成功！</h2>
            <p>你和 <b>${guy.emoji} ${guy.name}</b> 开始了交往，<br>你搬到了他的家中与他共同生活。</p>
            <p style="color:var(--accent);">🏠 ${guy.name} 会为你准备每日吃食，<br>你不再需要花费金币购买食物！</p>
            <button class="btn" id="closeConfessionSuccess">继续</button>
        </div>
    </div>`;
    const modal = showGlobalModal(modalHtml, 'confessionSuccessModal');
    modal.querySelector('#closeConfessionSuccess').addEventListener('click', () => modal.remove());
}

function rejectConfession(guy) {
    guy.affection = Math.max(0, guy.affection - 15); guy.proposed = false; state.gameActive = true;
    addLog(`你婉拒了${guy.name}的告白，他的眼神黯淡了下去。`);
    updateTopBar();
    state.currentTab = 'home';
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('.nav-item[data-tab="home"]').classList.add('active');
    renderHome();
}

// ========== 囚禁系统 ==========
function triggerImprisonment(guy) {
    const rescuers = state.guys.filter(g => !g.locked && !g.banished && g.id !== guy.id && g.affection > 70);
    const willRescue = rescuers.length > 0 && Math.random() < 0.6;
    const rescuer = willRescue ? rescuers[Math.floor(Math.random() * rescuers.length)] : null;
    let html = `<div class="global-overlay" id="prisonModal"><div class="modal-box">${imprisonmentStories[guy.id] || `<h2>${guy.name}的囚笼</h2>`}<div class="actions">`;
    if (rescuer) {
        html += `<p style="text-align:center;color:var(--accent);">⚡ ${rescuer.name}察觉到了异常，赶来救你！</p>`;
        html += `<button class="btn" id="stayPrison">💕 留在${guy.name}身边</button><button class="btn" id="leavePrison" style="background:#ff4d6d;">🆓 跟${rescuer.name}离开</button>`;
    } else {
        html += `<p style="text-align:center;color:var(--text2);">没有人知道你被带到了这里……</p><button class="btn" id="acceptPrison">💔 接受命运</button>`;
    }
    html += `<button class="btn" id="loadSavePrison" style="background:#aaa;">📤 读档</button><button class="btn" id="restartPrison" style="background:#aaa;">🔄 重新开始</button></div></div></div>`;
    const modal = showGlobalModal(html, 'prisonModal');
    if (rescuer) {
        modal.querySelector('#stayPrison').addEventListener('click', () => { modal.remove(); imprisonEnding(guy); });
        modal.querySelector('#leavePrison').addEventListener('click', () => { modal.remove(); escapePrison(guy, rescuer); });
    } else {
        modal.querySelector('#acceptPrison').addEventListener('click', () => { modal.remove(); imprisonEnding(guy); });
    }
    modal.querySelector('#loadSavePrison').addEventListener('click', () => { modal.remove(); openSaveLoadModal(); });
    modal.querySelector('#restartPrison').addEventListener('click', () => { if (confirm('确定重新开始？手动存档保留。')) window.restartGame(); });
}

function imprisonEnding(guy) {
    unlockEnding('prison_' + guy.id);
    if (state.player.prisonRecord.length >= 4) unlockAchievement('flower_heart');
    checkAchievements();
    const endingTexts = {
        cangye: '你成为了狼王的伴侣，在月崖之下与他共度余生。',
        lieyang: '你留在了木屋中，每天都有新鲜的猎物和温暖的阳光。',
        xuanyu: '你在幻香居中停止了时间，与他一起漫步于幻术与真实之间。',
        yanyue: '石洞中炉火不灭，他为你打造了无数小物件。',
        liuyun: '云巢之上，你与他共赏日升月落。',
        moli: '竹楼药香中，墨漓以血为引，守护你一生。'
    };
    document.getElementById('contentArea').innerHTML = `<div class="modal-overlay"><div class="modal-box" style="text-align:center;"><div style="font-size:2em;">🔒</div><b>囚禁结局：${guy.name}的挚爱</b><p>${endingTexts[guy.id] || '你留在了他的身边。'}</p><div class="actions"><button class="btn" id="loadSaveEnding">📤 读档</button><button class="btn" id="restartEnding">🔄 重新开始</button></div></div></div>`;
    document.getElementById('loadSaveEnding').addEventListener('click', () => { openSaveLoadModal(); document.querySelector('.modal-overlay').remove(); });
    document.getElementById('restartEnding').addEventListener('click', () => window.restartGame());
}

function escapePrison(guy, rescuer) {
    guy.banished = true; rescuer.affection = Math.min(100, rescuer.affection + 5); state.gameActive = true;
    unlockEnding('hidden_unrequited_' + guy.id);
    if (state.player.prisonRecord.length >= 4) unlockAchievement('flower_heart');
    checkAchievements();
    addLog(`${rescuer.name}将你从${guy.name}手中救出。${guy.name}从此不再见你。`);
    const unrequitedHtml = `<div class="global-overlay" id="unrequitedModal"><div class="modal-box">${unrequitedStories[guy.id] || `<h2>${guy.name}·爱而不得</h2>`}<button class="btn" id="closeUnrequited" style="width:100%;margin-top:10px;">继续</button></div></div>`;
    const modal = showGlobalModal(unrequitedHtml, 'unrequitedModal');
    modal.querySelector('#closeUnrequited').addEventListener('click', () => {
        modal.remove();
        document.getElementById('contentArea').innerHTML = `<div class="modal-overlay" id="escapeModal"><div class="modal-box" style="text-align:center;"><div style="font-size:2em;">🆓</div><b>${rescuer.name}救出了你！</b><p>他将你带回安全的地方。</p><button class="btn" id="closeEscape" style="width:100%;margin-top:10px;">继续冒险</button></div></div>`;
        document.getElementById('closeEscape').addEventListener('click', () => { document.getElementById('escapeModal').remove(); updateTopBar(); renderHome(); });
    });
}

// ========== 灵魂契约 ==========
function checkHESoulOath() {
    for (let guy of state.guys) {
        if (guy.locked || guy.banished || !guy.dating) continue;
        if (guy.affection >= 100 && guy.obsession >= 100 && !guy.heProposed && state.gameActive) {
            if (guy.heRejectedDay && state.player.day - guy.heRejectedDay < 3) continue;
            state.gameActive = false;
            triggerSoulOath(guy);
            return;
        }
    }
}

function triggerSoulOath(guy) {
    const htmlContent = `<div class="global-overlay" id="soulOathModal"><div class="modal-box">${soulOathStories[guy.id] || `<h2>${guy.name} · 灵魂之誓</h2>`}<div class="actions"><button class="btn" id="acceptOath" style="background:#ff4d6d;">💞 我愿意接受契约</button><button class="btn" id="rejectOath">💔 拒绝</button></div></div></div>`;
    const modal = showGlobalModal(htmlContent, 'soulOathModal');
    modal.querySelector('#acceptOath').addEventListener('click', () => { modal.remove(); guy.heProposed = true; happyEnding(guy); });
    modal.querySelector('#rejectOath').addEventListener('click', () => { modal.remove(); guy.heRejectedDay = state.player.day; state.gameActive = true; addLog(`你暂时拒绝了${guy.name}的灵魂契约。`); updateTopBar(); renderHome(); });
}

function happyEnding(guy) {
    unlockEnding('he_' + guy.id);
    if (state.player.prisonRecord.length >= 4) unlockAchievement('flower_heart');
    checkAchievements();
    const texts = {
        cangye: '灵魂契约达成。狼群齐声长啸，月光为你们披上永恒的祝福。',
        lieyang: '虎啸震彻山林，太阳神为你们洒下金色光芒。',
        xuanyu: '九尾魂灯升入夜空，狐族先祖的低语祝福着你们。',
        yanyue: '炉火轰然升腾，熊族守护之石嵌入了你们的戒指。',
        liuyun: '风神呼啸而过，将你们的誓言传遍天际。',
        moli: '碧鳞印记融入血脉，从此你的伤痛皆由他承担。'
    };
    document.getElementById('contentArea').innerHTML = `<div class="modal-overlay"><div class="modal-box" style="text-align:center;"><div style="font-size:2em;">💞</div><b>完美结局：与${guy.name}的灵魂相伴</b><p>${texts[guy.id] || '你们缔结了灵魂契约，从此幸福地生活在一起。'}</p><div class="actions"><button class="btn" id="loadSaveHE">📤 读档</button><button class="btn" id="restartHE">🔄 重新开始</button></div></div></div>`;
    document.getElementById('loadSaveHE').addEventListener('click', () => { openSaveLoadModal(); document.querySelector('.modal-overlay').remove(); });
    document.getElementById('restartHE').addEventListener('click', () => window.restartGame());
}

// ========== ★ 核心：男主相遇概率 ==========
export function getMeetProbability(guy) {
    if (!guy || guy.locked || guy.banished) return 0;
    const isHunting = isHuntingSeason(state.player.day);
    if (!isHunting) return 1;
    const aff = guy.affection;
    const isDating = guy.dating || state.player.movedIn === guy.id;
    if (isDating) return 0.95;
    if (aff >= 90) return 0.75;
    if (aff >= 70) return 0.55;
    if (aff >= 30) return 0.35;
    return 0.15;
}

// ========== 根据年龄获取合适职业 ==========
function getIdentityForAge(age, gender) {
    const candidates = [];
    for (let id of IDENTITIES) {
        const req = IDENTITY_AGE_REQUIREMENTS[id];
        if (!req) {
            if (age >= 18 && age <= 60) candidates.push(id);
            continue;
        }
        if (age >= req.minAge && age <= req.maxAge) {
            candidates.push(id);
        }
    }
    if (candidates.length === 0) {
        return age < 30 ? '学徒' : '农夫';
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
}

// ========== 生成随机NPC ==========
function generateRandomNPC(placeName) {
    const gender = Math.random() < 0.5 ? '男' : '女';
    let firstName;
    if (gender === '男') {
        firstName = FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)];
    } else {
        firstName = FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)];
    }
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const fullName = lastName + firstName;
    const race = RACES[Math.floor(Math.random() * RACES.length)];
    const emoji = RACES_EMOJI[race] || '🐾';
    const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
    const appearancePool = gender === '男' ? APPEARANCES_MALE : APPEARANCES_FEMALE;
    const appearance = appearancePool[Math.floor(Math.random() * appearancePool.length)];
    const age = 18 + Math.floor(Math.random() * 43);
    const birthMonth = 1 + Math.floor(Math.random() * 12);
    const birthDay = 1 + Math.floor(Math.random() * 30);
    let favorability = 5 + Math.floor(Math.random() * 16);
    const identity = getIdentityForAge(age, gender);
    let relationTag = null;
    if (Math.random() < 0.05) {
        const availableGuys = state.guys.filter(g => !g.locked && !g.banished);
        if (availableGuys.length > 0) {
            const guy = availableGuys[Math.floor(Math.random() * availableGuys.length)];
            relationTag = guy.id + '_network';
            favorability = Math.min(100, favorability + 15);
        }
    }
    return {
        id: 'npc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        name: fullName,
        emoji: emoji,
        gender: gender,
        race: race,
        age: age,
        birthMonth: birthMonth,
        birthDay: birthDay,
        personality: personality,
        appearance: appearance,
        identity: identity,
        favorability: favorability,
        metPlace: placeName || '某处',
        relationTag: relationTag
    };
}

// ========== 构建动态关系网 ==========
export function buildRelationshipMap() {
    const map = {};
    const usedNpcIds = new Set();
    for (let guy of state.guys) {
        if (guy.locked || guy.banished) continue;
        const relationCount = 1 + Math.floor(Math.random() * 3);
        const availableTypes = [...RELATION_TYPES];
        for (let i = 0; i < relationCount && availableTypes.length > 0; i++) {
            const totalWeight = availableTypes.reduce((sum, t) => sum + t.weight, 0);
            let rand = Math.random() * totalWeight;
            let selectedIdx = 0;
            for (let j = 0; j < availableTypes.length; j++) {
                rand -= availableTypes[j].weight;
                if (rand <= 0) { selectedIdx = j; break; }
            }
            const relation = availableTypes.splice(selectedIdx, 1)[0];
            const npc = generateRelationNPC(guy, relation);
            if (npc && !usedNpcIds.has(npc.id)) {
                usedNpcIds.add(npc.id);
                addNPC(npc);
                map[npc.id] = guy.id;
                addLog(`📌 ${guy.name}的${relation.type} — ${npc.name}（${npc.race}）加入了部落。`);
            }
        }
    }
    state.relationshipMap = map;
    return map;
}

// ========== 生成关系 NPC ==========
function generateRelationNPC(guy, relation) {
    let gender = '男';
    if (['母亲','姐姐','妹妹','姑姑','伯母'].includes(relation.type)) {
        gender = '女';
    } else if (['父亲','哥哥','弟弟','叔叔','伯父'].includes(relation.type)) {
        gender = '男';
    } else {
        gender = Math.random() < 0.5 ? '男' : '女';
    }
    const firstNamePool = gender === '男' ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE;
    const firstName = firstNamePool[Math.floor(Math.random() * firstNamePool.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const fullName = lastName + firstName;
    const race = RACES[Math.floor(Math.random() * RACES.length)];
    const emoji = RACES_EMOJI[race] || '🐾';
    let age = 0;
    const guyAge = guy.age || 30;
    switch (relation.type) {
        case '父亲':
        case '母亲':
            age = guyAge + 20 + Math.floor(Math.random() * 15);
            break;
        case '哥哥':
        case '姐姐':
            age = guyAge + 1 + Math.floor(Math.random() * 8);
            break;
        case '弟弟':
        case '妹妹':
            age = Math.max(5, guyAge - 2 - Math.floor(Math.random() * 12));
            break;
        case '叔叔':
        case '姑姑':
            age = guyAge + 15 + Math.floor(Math.random() * 20);
            break;
        case '伯父':
        case '伯母':
            age = guyAge + 20 + Math.floor(Math.random() * 25);
            break;
        default:
            age = 18 + Math.floor(Math.random() * 30);
    }
    age = Math.max(5, Math.min(150, age));
    const birthMonth = 1 + Math.floor(Math.random() * 12);
    const birthDay = 1 + Math.floor(Math.random() * 30);
    const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
    const appearancePool = gender === '男' ? APPEARANCES_MALE : APPEARANCES_FEMALE;
    const appearance = appearancePool[Math.floor(Math.random() * appearancePool.length)];
    const identity = getIdentityForAge(age, gender);
    const favorability = 15 + Math.floor(Math.random() * 20);
    return {
        id: 'rel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        name: fullName,
        emoji: emoji,
        gender: gender,
        race: race,
        age: age,
        birthMonth: birthMonth,
        birthDay: birthDay,
        personality: personality,
        appearance: appearance,
        identity: identity,
        favorability: favorability,
        metPlace: '部落',
        relationType: relation.type,
        relationGuy: guy.id,
        relationTag: guy.id + '_network'
    };
}

// ========== 探索功能 ==========
export function resolveExplore(place, action) {
    // ✅ 已移除 _processingEvent 和 _processingLock 检查，交由 advanceTime 内部处理
    const stats = state.player.stats;
    const events = getTodayEvents(state.player.day);
    let logParts = [];
    state.player.actionCounts['explore'] = (state.player.actionCounts['explore'] || 0) + 1;
    const isSafeAction = action.includes('休息') || action.includes('温泉') || action.includes('放松') || action.includes('打个盹') || action.includes('制作礼物') || action.includes('购买礼物') || action.includes('查看公告') || action.includes('打听消息') || action.includes('学习知识') || action.includes('出售草药');
    const isHunting = isHuntingSeason(state.player.day);
    let isEventAction = false;
    for (let ev of events) {
        if (ev.effects?.placeBoosts?.[place.name]?.actions) {
            if (ev.effects.placeBoosts[place.name].actions.includes(action)) {
                isEventAction = true;
                break;
            }
        }
    }

    // 打工赚钱
    const workActions = ['💼打工赚钱', '🔨帮忙锻造', '🧹打扫卫生', '📦搬运货物'];
    if (workActions.includes(action) && place.type === 'public') {
        const goldEarn = 3 + Math.floor(Math.random() * 6);
        state.player.gold += goldEarn;
        const statKeys = ['charm', 'intuition', 'endurance', 'talent', 'affinity'];
        const statKey = statKeys[Math.floor(Math.random() * statKeys.length)];
        stats[statKey] = Math.min(100, stats[statKey] + 1);
        addLog(`你打工赚了 ${goldEarn} 金币，${statInfo[statKey]?.name || statKey} +1。`);
        showToast(`💰 赚了 ${goldEarn} 金币！`);
        checkHealthStatus();
        // advanceTime 由外部统一调用，这里不调用
        updateTopBar();
        const resultText = `你通过打工赚取了 ${goldEarn} 金币。`;
        showActionResult(resultText, place);
        return resultText;
    }

    // 采集草药卖钱
    if (action === '🌿采集草药卖钱' && place.name === '密林') {
        const herbs = ['🌿止血草', '🍄夜光菌', '🌸安神花', '🌱蛇涎果', '🍂枯荣叶'];
        const found = herbs[Math.floor(Math.random() * herbs.length)];
        const goldEarn = 2 + Math.floor(Math.random() * 5);
        state.player.gold += goldEarn;
        stats.talent = Math.min(100, stats.talent + 1);
        addLog(`你采集到${found}，卖了 ${goldEarn} 金币。`);
        showToast(`🌿 卖了 ${goldEarn} 金币！`);
        checkHealthStatus();
        // advanceTime 由外部统一调用
        updateTopBar();
        const resultText = `你采集到${found}，获得 ${goldEarn} 金币。`;
        showActionResult(resultText, place);
        return resultText;
    }

    // 出售草药
    if (action === '💊 出售草药') {
        const herbKeywords = ['🌿止血草','🍄夜光菌','🌸安神花','🌱蛇涎果','🍂枯荣叶'];
        const herbIndex = state.player.inventory.findIndex(item => herbKeywords.includes(item));
        if (herbIndex === -1) {
            logParts.push('你没有可出售的草药。');
        } else {
            const herb = state.player.inventory[herbIndex];
            const price = 2 + Math.floor(Math.random() * 4);
            state.player.gold += price;
            state.player.inventory.splice(herbIndex, 1);
            logParts.push(`你出售了${herb}，获得 ${price} 金币。`);
            showToast(`💰 出售${herb}获得 ${price} 金币`);
        }
    }

    // 随机事件
    if (action.startsWith('🎲 ')) {
        const et = action.replace('🎲 ', '');
        if (et.includes('发现奇怪的东西')) { stats.intuition = Math.min(100, stats.intuition + 1); logParts.push('你发现了一块发光的石头，直觉提升了。'); }
        else if (et.includes('小鸟')) { stats.charm = Math.min(100, stats.charm + 1); logParts.push('和小鸟玩耍，魅力微增。'); }
        else if (et.includes('包裹')) { stats.talent = Math.min(100, stats.talent + 1); logParts.push('包裹里有草药，才艺微升。'); }
        else if (et.includes('打个盹')) { stats.health = Math.min(state.player.maxHealth, stats.health + 15); logParts.push('小睡片刻，生命恢复了少许。'); }
        else if (et.includes('搭话')) { stats.affinity = Math.min(100, stats.affinity + 1); logParts.push('与路人聊天，亲和力微增。'); }
        else logParts.push('你进行了一次随机的探索。');
    } else if (place.name === '密林') {
        if (action === '🔍深入探索') { stats.intuition = Math.min(100, stats.intuition + 1); logParts.push('你在密林深处仔细探索，对这片神秘森林有了更深的理解。'); state.player.actionCounts['forest'] = (state.player.actionCounts['forest'] || 0) + 1; }
        else if (action === '🍀寻找草药') {
            const herbs = ['🌿止血草', '🍄夜光菌', '🌸安神花', '🌱蛇涎果', '🍂枯荣叶'];
            const found = herbs[Math.floor(Math.random() * herbs.length)];
            state.player.inventory.push(found);
            stats.talent = Math.min(100, stats.talent + 1);
            logParts.push(`你找到了珍稀草药【${found}】，才艺提升了。`);
            state.player.actionCounts['herb'] = (state.player.actionCounts['herb'] || 0) + 1;
        } else if (action === '📦搜寻宝藏') {
            if (Math.random() < 0.5) {
                const treasures = ['💎宝石', '📜古老卷轴', '🪙金币', '🔮灵珠'];
                const treasure = treasures[Math.floor(Math.random() * treasures.length)];
                state.player.inventory.push(treasure);
                if (treasure === '🪙金币') {
                    const goldFound = 5 + Math.floor(Math.random() * 10);
                    state.player.gold += goldFound;
                    logParts.push(`你发现了一袋金币！获得 ${goldFound} 金币。`);
                } else {
                    logParts.push(`你发现了一个隐藏的宝箱，获得了${treasure}！`);
                }
            } else logParts.push('你翻遍了灌木丛，只找到一些普通的石头。');
        }
        if (Math.random() < getDeepForestInjuryProb()) { const dmg = 15 + Math.floor(Math.random() * 15); stats.health = Math.max(0, stats.health - dmg); logParts.push(`密林中的野兽突然袭击了你，生命值减少了${dmg}点！`); addLog(`在密林探索时被野兽袭击，生命值减少${dmg}。`, place.name); }
    } else {
        let eventHandled = false;
        for (let ev of events) {
            if (ev.effects?.placeBoosts?.[place.name]) {
                const boost = ev.effects.placeBoosts[place.name];
                if (boost.actions && boost.actions.includes(action)) {
                    if (action === '🎉 参加庆典') { stats.affinity = Math.min(100, stats.affinity + 3); stats.charm = Math.min(100, stats.charm + 1); logParts.push('你参加了庆典，与大家载歌载舞，亲和与魅力提升了！'); eventHandled = true; }
                    else if (action === '🙏 参与祭祀') { stats.intuition = Math.min(100, stats.intuition + 3); stats.endurance = Math.min(100, stats.endurance + 2); logParts.push('你虔诚地参与了祭祀之礼，直觉与体质获得了提升！'); eventHandled = true; }
                    else if (action === '🛍️ 逛春市') { if (Math.random() < 0.6) { state.player.inventory.push('🌱神奇种子'); logParts.push('你在春市上买到了一包神奇种子！'); } else { state.player.inventory.push('🌸花环'); logParts.push('你买到了一个漂亮的花环。'); } eventHandled = true; }
                    else if (action === '🌾 参与春耕祭') { stats.talent = Math.min(100, stats.talent + 2); stats.affinity = Math.min(100, stats.affinity + 1); logParts.push('你参与了春耕祭，与兽人们一起播种希望。'); eventHandled = true; }
                    else if (action === '🏋️ 参加力量赛') { stats.endurance = Math.min(100, stats.endurance + 3); stats.charm = Math.min(100, stats.charm + 1); logParts.push('你在力量赛中表现出色，获得了大家的喝彩！'); eventHandled = true; }
                    else if (action === '🔥 祈火仪式') { state.player.inventory.push('🔥火灵护符'); logParts.push('你参与了祈火仪式，获得了火灵护符。'); eventHandled = true; }
                    else if (action === '🍉 购买夏季特产') { if (Math.random() < 0.5) { state.player.stats.health = Math.min(state.player.maxHealth, state.player.stats.health + 15); logParts.push('你吃了清凉果，生命恢复了15点！'); } else { state.player.inventory.push('🌿草帽'); logParts.push('你买了一顶漂亮的草帽。'); } eventHandled = true; }
                    else if (action === '💧 祈雨') { stats.intuition = Math.min(100, stats.intuition + 2); stats.affinity = Math.min(100, stats.affinity + 1); logParts.push('你向雨神祈求甘霖，兽人们都对你充满感激。'); eventHandled = true; }
                    else if (action === '🔮 祈福') { stats.intuition = Math.min(100, stats.intuition + 2); state.player.inventory.push('🪶猎运符'); logParts.push('你向兽神祈福，获得了猎运符，本月的狩猎将更加顺利！'); eventHandled = true; }
                    else if (action === '🚩 送行') { stats.affinity = Math.min(100, stats.affinity + 2); logParts.push('你为出征的猎人们送行，他们感动地向你挥手致意。'); eventHandled = true; }
                    else if (action === '🌀 安抚雨神') { stats.intuition = Math.min(100, stats.intuition + 2); stats.talent = Math.min(100, stats.talent + 1); logParts.push('你在河畔举行安抚仪式，暴雨似乎减弱了一些。'); eventHandled = true; }
                    else if (action === '🍗 参加宴席') { stats.health = Math.min(state.player.maxHealth, stats.health + 15); stats.affinity = Math.min(100, stats.affinity + 2); logParts.push('你在猎归宴上大快朵颐，心情愉悦，生命恢复了15点！'); eventHandled = true; }
                    else if (action === '🪓 打造冬具') { state.player.inventory.push('🧤防寒手套'); stats.talent = Math.min(100, stats.talent + 1); logParts.push('你在铁匠铺打造了防寒手套，为过冬做好了准备。'); eventHandled = true; }
                    else if (action === '🕯️ 祭祖') { stats.intuition = Math.min(100, stats.intuition + 3); stats.endurance = Math.min(100, stats.endurance + 1); logParts.push('你参加了冬至祭祖仪式，感受到了先祖的庇佑。'); eventHandled = true; }
                    else if (action === '🔥 守岁') { Object.keys(stats).forEach(k => stats[k] = Math.min(100, stats[k] + 1)); stats.health = Math.min(state.player.maxHealth, stats.health + 1); logParts.push('你与兽人们一起守岁，在篝火中迎来了新年，全属性+1！'); eventHandled = true; }
                    else if (action === '🧤 购买冬货') { if (Math.random() < 0.5) { state.player.inventory.push('🧣羊毛围巾'); logParts.push('你买了一条温暖的羊毛围巾。'); } else { state.player.inventory.push('🧤毛皮手套'); logParts.push('你买了一副毛皮手套。'); } eventHandled = true; }
                    else if (action === '⛄ 玩雪') { stats.charm = Math.min(100, stats.charm + 2); stats.affinity = Math.min(100, stats.affinity + 1); logParts.push('你和大家一起堆雪人、打雪仗，欢乐的气氛感染了所有人。'); eventHandled = true; }
                    break;
                }
            }
        }
        if (!eventHandled) {
            if (action === '🛏️休息恢复') { const heal = 5 + Math.floor(Math.random() * 6); stats.health = Math.min(state.player.maxHealth, stats.health + heal); logParts.push(`你好好休息了一番，生命恢复了${heal}点。`); }
            else if (action === '🎁制作礼物') { state.player.inventory.push('🧸手工小物'); logParts.push('你精心制作了一件小礼物，放入了背包。'); state.player.actionCounts['craft'] = (state.player.actionCounts['craft'] || 0) + 1; }
            else if (action === '🎁购买礼物') {
                if (state.player.gold < 5) {
                    logParts.push('💰 金币不足（需要5金币），无法购买礼物。');
                } else {
                    state.player.gold -= 5;
                    stats.affinity = Math.min(100, stats.affinity + 1);
                    if (stats.affinity >= 16 && Math.random() < 0.4) {
                        state.player.inventory.push('💐鲜花束', '🍖熏肉干');
                        logParts.push('亲和力高，商贩多送了你一块熏肉干！获得了两件礼物。');
                    } else if (Math.random() < 0.6) {
                        state.player.inventory.push('💐鲜花束');
                        logParts.push('你在市场买了一束鲜花。');
                    } else {
                        state.player.inventory.push('🍖熏肉干');
                        logParts.push('你从商人那里换到一块熏肉干。');
                    }
                    state.player.actionCounts['buy_gift'] = (state.player.actionCounts['buy_gift'] || 0) + 1;
                }
            }
            else if (action === '📋查看公告') { stats.intuition = Math.min(100, stats.intuition + 1); const bulletin = getBulletins()[Math.floor(Math.random() * getBulletins().length)]; logParts.push(`公告栏上写着："${bulletin}"`); state.player.actionCounts['bulletin'] = (state.player.actionCounts['bulletin'] || 0) + 1; }
            else if (action === '🗣️打听消息') { stats.affinity = Math.min(100, stats.affinity + 1); const rumor = getRumors()[Math.floor(Math.random() * getRumors().length)]; logParts.push(`你听到人们在议论："${rumor}"`); state.player.actionCounts['rumor'] = (state.player.actionCounts['rumor'] || 0) + 1; }
            else if (action === '📚学习知识') { stats.intuition = Math.min(100, stats.intuition + 1); const knowledge = beastWorldKnowledge[Math.floor(Math.random() * beastWorldKnowledge.length)]; logParts.push(`你在祭坛翻阅古籍，学到了新知识："${knowledge}"`); state.player.actionCounts['learn'] = (state.player.actionCounts['learn'] || 0) + 1; if (state.player.actionCounts['learn'] >= 10) unlockAchievement('scholar'); addLog(`在祭坛学习兽世知识：${knowledge}`, place.name); }
            else {
                if (action.includes('锻炼') || action.includes('训练')) {
                    const gain = 3 + Math.floor(Math.random() * 5);
                    stats.health = Math.min(state.player.maxHealth, stats.health + gain);
                    stats.endurance = Math.min(100, stats.endurance + 1);
                    if (state.player.maxHealth < 100 && Math.random() < 0.4) { state.player.maxHealth = Math.min(100, state.player.maxHealth + 1); stats.health = Math.min(state.player.maxHealth, stats.health + 8); logParts.push('通过锻炼，你的生命力上限提升了，身体也更加有活力了！'); }
                    state.player.actionCounts['exercise'] = (state.player.actionCounts['exercise'] || 0) + 1;
                }
                if (action.includes('采集') || action.includes('药草')) { stats.talent = Math.min(100, stats.talent + 1); stats.intuition = Math.min(100, stats.intuition + 1); state.player.actionCounts['herb'] = (state.player.actionCounts['herb'] || 0) + 1; }
                if (action.includes('聊天') || action.includes('居民')) { stats.charm = Math.min(100, stats.charm + 1); stats.affinity = Math.min(100, stats.affinity + 1); state.player.actionCounts['chat'] = (state.player.actionCounts['chat'] || 0) + 1; }
                if (action.includes('观星占卜') || action.includes('登高望远') || action.includes('观察天象')) { stats.endurance = Math.min(100, stats.endurance + 1); if (action.includes('观星占卜')) state.player.actionCounts['astrology'] = (state.player.actionCounts['astrology'] || 0) + 1; if (action.includes('登高望远')) state.player.actionCounts['tower'] = (state.player.actionCounts['tower'] || 0) + 1; if (action.includes('观察天象')) state.player.actionCounts['sky_watch'] = (state.player.actionCounts['sky_watch'] || 0) + 1; }
                if (action.includes('放松') || action.includes('温泉')) { stats.health = Math.min(state.player.maxHealth, stats.health + 20); state.player.actionCounts['hotspring'] = (state.player.actionCounts['hotspring'] || 0) + 1; }
                if (action.includes('帮忙杂务')) state.player.actionCounts['square'] = (state.player.actionCounts['square'] || 0) + 1;
                if (action.includes('静坐赏月')) state.player.actionCounts['moon_cliff'] = (state.player.actionCounts['moon_cliff'] || 0) + 1;
                if (action.includes('写日记')) state.player.actionCounts['diary'] = (state.player.actionCounts['diary'] || 0) + 1;
                if (action.includes('抓鱼')) state.player.actionCounts['fish'] = (state.player.actionCounts['fish'] || 0) + 1;
                if (logParts.length === 0) logParts.push(`你在${place.name}进行了${action}。`);
            }
        }
    }

    // 男主家互动（含同居功能）
    if (place.type === 'guyhome') {
        const hg = getGuy(place.guy);
        if (hg && !hg.locked && !hg.banished) {
            if (place.isMovedIn) {
                if (action === '🛏️休息恢复') {
                    const heal = 5 + Math.floor(Math.random() * 6);
                    stats.health = Math.min(state.player.maxHealth, stats.health + heal);
                    logParts.push(`你在${hg.name}的家中安心休息，生命恢复了${heal}点。`);
                    addLog(logParts.join('<br>'), place.name);
                    checkAchievements();
                    return logParts.join('<br>');
                }
                if (action === '🎁制作礼物') {
                    state.player.inventory.push('🧸手工小物');
                    logParts.push(`你在${hg.name}的家中精心制作了一件小礼物。`);
                    state.player.actionCounts['craft'] = (state.player.actionCounts['craft'] || 0) + 1;
                    addLog(logParts.join('<br>'), place.name);
                    checkAchievements();
                    return logParts.join('<br>');
                }
            }
            if (action === '💊照顾他') {
                if (!hg.injured) logParts.push('他并没有受伤。');
                else { hg.injuredDays = Math.max(0, hg.injuredDays - 2); if (hg.injuredDays <= 0) { hg.injured = false; logParts.push(`在你的照顾下，${hg.name}的伤势已经痊愈了！`); } else logParts.push(`你照顾了受伤的${hg.name}，他的伤势好转了。`); state.player.stats.talent = Math.min(100, state.player.stats.talent + 1); addAffectionAndObsession(hg, 2); }
                addLog(logParts.join('<br>'), place.name); checkAchievements(); return logParts.join('<br>');
            }
            if (action === '🚶邀请出门') {
                if (hg.sulkingDays > 0) logParts.push(`${hg.name}还在生闷气，拒绝了你的邀请。`);
                else { const willAccept = (state.player.movedIn === hg.id) ? true : (Math.random() < (0.3 + hg.affection / 200)); if (willAccept) { addAffectionAndObsession(hg, 4); logParts.push(`${hg.name}很高兴地答应了你的邀请，你们一起出门散步。`); } else { addAffectionAndObsession(hg, 1); logParts.push(`${hg.name}婉拒了你的邀请，看起来有些不好意思。`); } }
                addLog(logParts.join('<br>'), place.name); checkAchievements(); return logParts.join('<br>');
            }
            if (action === '🎁送礼') {
                if (state.player.inventory.length === 0) { showNoGiftModal(); return null; }
                const gift = state.player.inventory.pop();
                const bonus = state.player.stats.charm >= 16 ? 2 : 0;
                let baseAmount = 5 + bonus;
                if (isGuyBirthday(hg, state.player.day)) {
                    baseAmount = Math.floor(baseAmount * 1.3);
                    addLog(`🎂 今天是${hg.name}的生日！送礼物效果额外+30%！`);
                    showToast(`🎂 今天是${hg.name}的生日！好感度额外+30%！`);
                }
                addAffectionAndObsession(hg, baseAmount);
                state.player.stats.talent = Math.min(100, state.player.stats.talent + 1);
                state.player.actionCounts['gift'] = (state.player.actionCounts['gift'] || 0) + 1;
                checkAchievements();
                const logText = `送给${hg.name}${gift}，他很喜欢。${bonus > 0 ? '魅力加成额外+2好感！' : ''}${isGuyBirthday(hg, state.player.day) ? ' 🎂生日加成30%！' : ''}`;
                addLog(logText, place.name);
                checkHealthStatus();
                // ✅ 移除了内部的 advanceTime()，由外部统一调用
                updateTopBar();
                showActionResult(logText, place);
                return logText;  // ✅ 返回描述文本
            }
            if (action === '💬聊天') { addAffectionAndObsession(hg, 3); logParts.push(`你和${hg.name}聊了一会儿，关系更亲近了。`); addLog(logParts.join('<br>'), place.name); checkAchievements(); return logParts.join('<br>'); }
            if (action === '🏠拜访') {
                logParts.push(`你拜访了${hg.name}。`);
                addLog(logParts.join('<br>'), place.name);
                return logParts.join('<br>');
            }
        }
    }

    // 受伤概率
    let dmg = 0;
    const injuryModifier = isHunting ? 1.5 : 1;
    if (place.name !== '密林' && Math.random() < getInjuryProb() * injuryModifier && !isSafeAction) {
        dmg = 8 + Math.floor(Math.random() * 10);
        stats.health = Math.max(0, stats.health - dmg);
        logParts.push(`你遭遇意外，生命值减少了${dmg}点！`);
        addLog(`你在探索中受了轻伤，生命值减少${dmg}。`, place.name);
        if (dmg > 0) {
            const helpers = state.npcs.filter(n => n.favorability >= 70);
            if (helpers.length > 0 && Math.random() < 0.3) {
                const helper = helpers[Math.floor(Math.random() * helpers.length)];
                const heal = 10 + Math.floor(Math.random() * 10);
                stats.health = Math.min(state.player.maxHealth, stats.health + heal);
                logParts.push(`💕 ${helper.name}及时出现救了你！生命恢复${heal}点。`);
                addLog(`${helper.name}救了你，生命恢复${heal}点。`, place.name);
                helper.favorability = Math.min(100, helper.favorability + 2);
                showNPCRescueModal(helper, heal);
            }
        }
    }

    // 探索计数 & 解锁
    if (place.exploreCount !== undefined) place.exploreCount = (place.exploreCount || 0) + 1;
    if (place.unlockTarget) {
        const target = state.places.find(p => p.name === place.unlockTarget);
        if (target && target.locked && place.exploreCount >= place.needCount) {
            target.locked = false;
            logParts.push(`🗺️发现了通往<b>${target.name}</b>的路！`);
            addLog(`探索${place.name}多次后发现了新地点：${target.name}。`, place.name);
            place.exploreCount = 0;
        }
    }

    // 新地点自动解锁
    if (state.player.day >= 5 && state.places.find(p => p.name === '花田')?.locked) {
        state.places.find(p => p.name === '花田').locked = false;
        logParts.push('🌸 你发现了一片美丽的花田！');
        addLog('发现新地点：花田');
    }
    if (state.player.day >= 10 && state.places.find(p => p.name === '山涧瀑布')?.locked) {
        state.places.find(p => p.name === '山涧瀑布').locked = false;
        logParts.push('💧 你听到了瀑布的水声，循声找到了山涧瀑布！');
        addLog('发现新地点：山涧瀑布');
    }
    if (state.player.day >= 15 && state.places.find(p => p.name === '古树广场')?.locked) {
        state.places.find(p => p.name === '古树广场').locked = false;
        logParts.push('🌳 你发现了一棵巨大的古树，树下是一片宽阔的广场。');
        addLog('发现新地点：古树广场');
    }

    // 公共地点相遇
    if (place.type === 'public' && !place.locked) {
        const pguy = place.guy ? getGuy(place.guy) : null;
        if (pguy && !pguy.banished && pguy.sulkingDays <= 0 && !(pguy.id === 'moli' && pguy.locked)) {
            let meetProb = getMeetProbability(pguy);
            if (isEventAction) {
                meetProb = Math.min(1, meetProb + 0.3);
            }
            if (Math.random() < meetProb) {
                if (pguy.locked) {
                    let uc = 0.25 + stats.intuition / 120;
                    if (place.name === '训练场' && pguy.id === 'lieyang' && !state.player._lieyangFirstMeetDone) {
                        uc = 1;
                    }
                    if (Math.random() < uc) {
                        pguy.locked = false;
                        state.player._lieyangFirstMeetDone = true;
                        addAffectionAndObsession(pguy, 5);
                        const meetLog = `你首次遇到了${pguy.name}！`;
                        addLog(meetLog, place.name);
                        logParts.push(meetLog);
                        logParts.push(generateMeetInteraction(pguy, place, action));
                        showFirstMeetModal(pguy, place, logParts.join('<br>'));
                        return null;
                    }
                } else {
                    addAffectionAndObsession(pguy, 3);
                    const interactionText = generateMeetInteraction(pguy, place, action);
                    logParts.push(interactionText);
                    if (pguy.id === 'moli' && stats.health < state.player.maxHealth) {
                        const heal = 10 + Math.floor(Math.random() * 11);
                        stats.health = Math.min(state.player.maxHealth, stats.health + heal);
                        logParts.push(`墨漓随手为你调理了气息，生命恢复了${heal}点。`);
                    }
                }
            }
        }

        // 偶遇其他男主
        if (Math.random() < 0.12 + stats.charm / 200) {
            const og = state.guys.filter(g => !g.locked && !g.banished && g.id !== (place.guy || '') && !events.some(ev => ev.effects?.guyMods?.[g.id]?.locked) && g.sulkingDays <= 0 && !(g.id === 'moli' && g.locked));
            if (og.length) {
                const rg = og[Math.floor(Math.random() * og.length)];
                const meetProb = getMeetProbability(rg);
                if (Math.random() < meetProb) {
                    addAffectionAndObsession(rg, 2);
                    const interactionText = generateMeetInteraction(rg, place, action);
                    logParts.push(`没想到${rg.name}也在这里。` + interactionText);
                }
            }
        }

        // 多男主冲突
        const presentGuys = state.guys.filter(g => !g.locked && !g.banished && g.sulkingDays <= 0 && (g.id === (place.guy || '') || (Math.random() < 0.12 + stats.charm / 200)) && !(g.id === 'moli' && g.locked));
        const highAffGuys = presentGuys.filter(g => g.affection >= 70);
        if (highAffGuys.length >= 2 && Math.random() < 0.3) {
            const logText = logParts.join('<br>');
            addLog(logText, place.name);
            triggerMultiGuyConflict(highAffGuys, place);
            return null;
        }

        // NPC相遇（概率40%）
        if (state.npcs.length < MAX_NPC && Math.random() < 0.4) {
            const newNPC = generateRandomNPC(place.name);
            if (!state.npcs.some(n => n.name === newNPC.name && n.race === newNPC.race)) {
                addNPC(newNPC);
                const pronoun = newNPC.gender === '女' ? '她' : '他';
                const meetMsg = `你遇到了 ${newNPC.emoji} ${newNPC.name}（${newNPC.identity}）。${newNPC.appearance} ${pronoun}看起来${newNPC.personality}。`;
                logParts.push(meetMsg);
                addLog(meetMsg, place.name);
            }
        }
        // 与已认识的NPC互动（概率50%）
        if (state.npcs.length > 0 && Math.random() < 0.5) {
            const known = state.npcs.filter(n => n.favorability < 100);
            if (known.length > 0) {
                const npc = known[Math.floor(Math.random() * known.length)];
                const gain = 1 + Math.floor(Math.random() * 3);
                npc.favorability = Math.min(100, npc.favorability + gain);
                const dialog = `${npc.emoji} ${npc.name}向你打招呼，你们聊了几句，友好值+${gain}`;
                logParts.push(dialog);
                addLog(dialog, place.name);
                showToast(`与${npc.name}相遇，友好值+${gain}`);
            }
        }
    }

    // 随机事件
    if (Math.random() < 0.03) {
        const cand = state.guys.filter(g => !g.locked && !g.injured && !g.banished && g.id !== 'moli' && !events.some(ev => ev.effects?.guyMods?.[g.id]?.locked) && g.sulkingDays <= 0);
        if (cand.length) {
            const u = cand[Math.floor(Math.random() * cand.length)];
            u.injured = true;
            u.injuredDays = 3 + Math.floor(Math.random() * 3);
            logParts.push(`听说${u.name}受伤了！`);
            addLog(`${u.name}在与野兽搏斗中受伤，需要休养${u.injuredDays}天。`, place.name);
        }
    }

    // 温泉解锁
    if (state.player.day >= 3 && state.places.find(pl => pl.name === '温泉').locked && Math.random() < 0.3) {
        state.places.find(pl => pl.name === '温泉').locked = false;
        logParts.push('可以使用温泉了。');
    }

    // 男主家解锁
    state.guys.forEach(g => {
        if (!g.locked && !g.banished && g.affection >= 30) {
            const home = state.places.find(pl => pl.guy === g.id && pl.type === 'guyhome');
            if (home && home.locked) {
                home.locked = false;
                addLog(`${g.name}邀请你去他家做客。`, home.name);
            }
        }
    });

    const logText = logParts.join('<br>');
    addLog(logText, place.name);
    checkAchievements();
    if (!state.gameActive) return logText;
    checkHESoulOath();
    return logText;
}

// ========== 生成相遇互动 ==========
function generateMeetInteraction(guy, place, action) {
    const aff = guy.affection;
    const shortName = guy.name;
    const placeName = place.name;
    const meetPool = [];
    if (placeName === '训练场') {
        if (guy.id === 'lieyang') meetPool.push(`烈阳正在训练场挥汗如雨，看见你走过来立刻停下动作，露出灿烂的笑容："来得正好！陪我练几招！"`, `你在训练场看到了烈阳，他正单手举着石锁，看见你后单手放下石锁擦了把汗："嘿，要不要来比试一下？"`, `烈阳在场地中央热身，虎尾愉快地甩动，看到你就喊道："今天我们练练摔跤？"`);
        else meetPool.push(`${shortName}在训练场边缘做着基础练习，看到你后微微点头示意。`, `${shortName}正在调整训练器材，发现你后停下手中的活，简单打了个招呼。`);
    } else if (placeName === '铁匠铺') {
        if (guy.id === 'yanyue') meetPool.push(`岩岳在炉火前捶打铁块，火星四溅，他抬头看见你，用围裙擦擦手："小心点，这里烫。今天想学锻造吗？"`, `岩岳正蹲在炉边吹火，听到脚步声转过头，憨厚地笑道："来得正好，帮我递一下那把钳子。"`);
        else meetPool.push(`铁匠铺里热浪袭人，${shortName}站在炉边，看见你后简单问候了一句。`);
    } else if (placeName === '月崖') {
        if (guy.id === 'cangye') meetPool.push(`苍夜独坐在月崖边缘，银发在风中微扬，他转头看你，冰蓝的眼眸中掠过一丝柔光："这里风大，站我身后。"`, `苍夜正仰头望着月亮，听见脚步声，狼耳轻轻转动，低沉地说："你也来了。今晚的月光很美。"`);
        else meetPool.push(`月崖上夜风清凉，${shortName}站在崖边远眺，看到你后微微颔首。`);
    } else if (placeName === '河边') {
        if (guy.id === 'xuanyu') meetPool.push(`玄羽正在河边采集药草，九条尾巴优雅地摆动，他抬眸看见你，狐狸眼微弯："来得正好，帮我拿着这个。"`, `河边雾气缭绕，玄羽倚在柳树下，手中把玩着一株发光草药，轻笑道："你也是来寻草药的？"`);
        else meetPool.push(`河水流淌，${shortName}正在河边洗衣，看见你后微笑示意。`);
    } else if (placeName === '密林小径') {
        if (guy.id === 'xuanyu') meetPool.push(`密林中幽香浮动，玄羽从古树后走出，折扇掩面："哎呀，迷路的小家伙，又见面了。"`, `你在密林小径中穿行，玄羽突然从树枝上轻盈落地，九尾微摇："猜猜我采到了什么稀罕药草？"`);
        else meetPool.push(`林中小径，${shortName}正在观察树木，看见你后简单交谈了几句。`);
    } else if (placeName === '哨塔') {
        if (guy.id === 'liuyun') meetPool.push(`流云站在哨塔顶端，苍鹰的羽翼在风中微张，他转头瞥了你一眼，语气平淡："这里风大，你来做什么？"但翅膀却悄悄为你挡了风。`, `流云正在瞭望远方，听到你的脚步声，转过身来，金色的瞳孔扫过你："今天云层很厚，可能会下雨。"他顿了顿，"没事就早点回去。"`);
        else meetPool.push(`哨塔视野开阔，${shortName}正在放哨，发现你后提醒你注意安全。`);
    } else if (placeName === '密林') {
        if (guy.id === 'moli') meetPool.push(`密林深处药香浮动，墨漓倚在一株古木旁，手中捻着几片奇特的叶子，见你到来，他微微抬眸："这片林子藏着不少秘密，小心些。"`, `你在密林中穿行，发现墨漓正蹲在溪边清洗药草，碧鳞蛇尾轻轻拨弄着水面，他抬头看你："来得正好，帮我分辨一下这几株草药的药性。"`);
        else meetPool.push(`密林幽深，${shortName}正在巡视，看到你后提醒道："这里野兽出没，注意安全。"`);
    } else meetPool.push(`你在${placeName}遇见了${shortName}，他正在忙碌，看到你后微微一笑。`, `${shortName}出现在${placeName}，你们简单交谈了几句。`);
    let interactionText = meetPool[Math.floor(Math.random() * meetPool.length)];
    if (aff >= 70 && !guy.dating) interactionText += ' ' + [`${shortName}的目光在你身上停留得比往常更久，似乎想多和你待一会儿。`, `他说话时，眼神不自觉地追随着你，带着一丝不易察觉的温柔。`, `${shortName}在你转身时，悄悄地又看了你一眼，尾巴不自觉地轻轻摆动。`][Math.floor(Math.random() * 3)];
    return interactionText;
}

// ========== 多男主冲突 ==========
function triggerMultiGuyConflict(guyList, place) {
    const names = guyList.map(g => g.name).join('和');
    const all100 = guyList.every(g => g.affection >= 100);
    const desc = all100 ? `${names}看到彼此与你亲近，怒气冲冲，甚至准备大打出手！` : `${names}看到彼此与你亲近，眼神交锋，言语间弥漫着浓浓的火药味。`;
    let html = `<div class="global-overlay" id="conflictModal"><div class="modal-box"><div style="font-weight:700;color:var(--accent);">⚡ 冲突爆发</div><p>${desc}</p><div class="actions">`;
    html += all100 ? `<button class="btn" id="ignoreFight">🛑 不管他们</button>` : `<button class="btn" id="ignoreFight">🛑 不插手</button>`;
    guyList.forEach(g => { html += `<button class="btn" data-id="${g.id}">${all100 ? '🛡️ 护着' : '💬 为'}${g.name}${all100 ? '' : '说话'}</button>`; });
    html += `</div></div></div>`;
    const modal = showGlobalModal(html, 'conflictModal');
    modal.querySelector('#ignoreFight').addEventListener('click', () => { modal.remove(); if (all100) { guyList.forEach(g => { g.injured = true; g.injuredDays = 4 + Math.floor(Math.random() * 3); }); addLog(`${guyList.map(g => g.name).join('和')}打了起来，两人都受伤了！`, place.name); } else addLog(`你没有插手，${guyList.map(g => g.name).join('和')}不欢而散。`, place.name); checkHealthStatus(); advanceTime(); updateTopBar(); renderPlaces(); });
    modal.querySelectorAll('[data-id]').forEach(btn => btn.addEventListener('click', () => { modal.remove(); const favoredId = btn.dataset.id; const favored = guyList.find(g => g.id === favoredId); const other = guyList.find(g => g.id !== favoredId); if (favored) addAffectionAndObsession(favored, 5); if (other) { other.affection = Math.max(0, other.affection - 5); other.sulkingDays = 3 + Math.floor(Math.random() * 2); other.sulkingTarget = favoredId; addLog(`你偏袒了${favored.name}，${other.name}心碎地离开了，暂时不愿见你。`, place.name); unlockAchievement('peacemaker'); checkAchievements(); } checkHealthStatus(); advanceTime(); updateTopBar(); renderPlaces(); }));
}

// ========== 打开地点行动 ==========
export function openPlaceActions(placeName) {
    const place = state.places.find(p => p.name === placeName);
    if (!place || place.locked) return;
    if (getTodayEvents(state.player.day).some(ev => ev.effects?.lockedPlaces?.includes(placeName))) return;
    if (!canGoOut() && placeName !== '我家') { showCantGoOutModal(); return; }
    const html = `<div class="modal-overlay" id="actionModal"><div class="modal-box"><div style="font-weight:700;color:var(--accent);">📍 ${placeName}</div><div id="actionOptions"></div><button class="btn" id="closeModal" style="width:100%;margin-top:8px;">返回</button></div></div>`;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    document.getElementById('closeModal').addEventListener('click', () => document.getElementById('actionModal').remove());
    generateActions(place);
}

function generateActions(place) {
    const div = document.getElementById('actionOptions');
    let acts = [];
    const events = getTodayEvents(state.player.day);
    let eventActions = [];
    events.forEach(ev => { if (ev.effects?.placeBoosts?.[place.name]?.actions) eventActions = eventActions.concat(ev.effects.placeBoosts[place.name].actions); });
    if (place.type === 'home') {
        acts = ['🛏️休息恢复', '🎁制作礼物', '📝写日记'];
    } else if (place.name === '部落广场') {
        acts = ['🤝帮忙杂务', '💬与居民聊天', '📋查看公告', '💼打工赚钱'];
    } else if (place.name === '训练场') {
        acts = ['💪锻炼身体', '🥊观看训练', '💼打工赚钱'];
    } else if (place.name === '铁匠铺') {
        acts = ['🔨帮忙锻造', '🛠️学习技艺', '💼打工赚钱'];
    } else if (place.name === '河边') {
        acts = ['🎣抓鱼', '🧺洗衣服', '🌸采花探索'];
    } else if (place.name === '市场') {
        acts = ['🛒闲逛购物', '🎁购买礼物', '🗣️打听消息', '💊出售草药'];
    } else if (place.name === '月崖') {
        acts = ['🌙静坐赏月', '🌿采集草药'];
    } else if (place.name === '萨满祭坛') {
        acts = ['📚学习知识', '🌟观星占卜'];
    } else if (place.name === '哨塔') {
        acts = ['🗼登高望远', '☁️观察天象'];
    } else if (place.name === '密林小径') {
        acts = ['🍄采集药草', '👣追踪兽迹'];
    } else if (place.name === '温泉') {
        acts = ['♨️泡温泉', '🧘放松冥想'];
    } else if (place.name === '密林') {
        acts = ['🔍深入探索', '🍀寻找草药', '📦搜寻宝藏', '🌿采集草药卖钱'];
    } else if (place.name === '花田') {
        acts = ['🌸赏花采蜜', '🦋追逐蝴蝶'];
    } else if (place.name === '山涧瀑布') {
        acts = ['💧戏水', '🧘‍♀️瀑布冥想'];
    } else if (place.name === '古树广场') {
        acts = ['🌳树下阅读', '🎵聆听鸟鸣'];
    } else if (place.type === 'guyhome') {
        const guy = getGuy(place.guy);
        if (!guy || guy.banished) acts = ['🔍探索'];
        else {
            if (place.isMovedIn) {
                acts = ['🛏️休息恢复', '🎁制作礼物', '💬聊天', '🚶邀请出门'];
            } else {
                if (guy.injured) acts.push('💊照顾他');
                acts.push('🏠拜访', '🚶邀请出门');
                if (guy.affection >= 30) acts.push('🎁送礼');
            }
        }
    } else {
        acts = ['🔍探索', '🌿采集', '🚶散步'];
    }
    if (Math.random() < 0.5) {
        const randomPool = [{ text: '✨ 发现奇怪的东西', exclude: ['home', 'guyhome'] }, { text: '🐦 与一只小鸟玩耍', exclude: ['home'] }, { text: '📦 捡到一个小包裹', exclude: ['home', 'guyhome'] }, { text: '💤 打个盹', exclude: [] }, { text: '🗣️ 与陌生人搭话', exclude: ['home', 'guyhome'] }];
        const filtered = randomPool.filter(r => !r.exclude.includes(place.type));
        if (filtered.length) acts.push('🎲 ' + filtered[Math.floor(Math.random() * filtered.length)].text);
    }
    acts = eventActions.concat(acts.filter(a => !eventActions.includes(a)));
    div.innerHTML = acts.map(a => `<button class="btn" style="width:100%;margin:2px 0;" data-action="${a}">${a}</button>`).join('');
    div.querySelectorAll('button').forEach(btn => btn.addEventListener('click', function() {
        const action = this.dataset.action;
        document.getElementById('actionModal').remove();
        if (place.type === 'guyhome' && action === '🏠拜访') { handleGuyHomeVisit(place); return; }
        const logText = resolveExplore(place, action);
        if (logText === null) return;
        if (!state.gameActive) return;
        checkHealthStatus();
        advanceTime();  // 外部统一推进时间
        updateTopBar();
        if (place.type === 'public' && Math.random() < 0.05) triggerRandomEvent(place, logText);
        else if (place.type === 'guyhome' && action.includes('拜访') && Math.random() < 0.3) {
            const guy = getGuy(place.guy);
            if (guy && !guy.locked && !guy.banished && guy.affection >= 50) triggerHeartEvent(place, guy, logText);
            else showActionResult(logText, place);
        } else showActionResult(logText, place);
    }));
}

// ========== 拜访男主家 ==========
export function handleGuyHomeVisit(place) {
    const guy = getGuy(place.guy);
    if (!guy || guy.locked || guy.banished) return;
    let healMsg = '';
    if (guy.id === 'moli' && state.player.stats.health < state.player.maxHealth) {
        const heal = 15 + Math.floor(Math.random() * 10);
        state.player.stats.health = Math.min(state.player.maxHealth, state.player.stats.health + heal);
        addAffectionAndObsession(guy, 1);
        addLog(`墨漓为你治疗，生命恢复了${heal}点。`, place.name);
        healMsg = `<p style="color:var(--accent);">🌿 墨漓为你调理了身体，生命恢复了${heal}点。</p>`;
    }
    if (guy.sulkingDays > 0) {
        const logText = `${guy.name}还在生闷气，不愿见你。`;
        addLog(logText, place.name);
        checkHealthStatus();
        advanceTime();
        updateTopBar();
        showActionResult(logText, place);
        return;
    }
    const isHome = guy.affection >= 70 ? Math.random() < 0.8 : Math.random() < 0.3;
    if (!isHome) {
        const logText = `${guy.name}不在家。`;
        addLog(logText, place.name);
        checkHealthStatus();
        advanceTime();
        updateTopBar();
        showActionResult(logText, place);
        return;
    }
    const html = `<div class="modal-overlay" id="visitSubModal"><div class="modal-box"><div style="font-weight:700;color:var(--accent);">拜访${guy.name}</div>${healMsg}<div style="margin:12px 0;">他在家，你想做什么？</div><div style="display:flex;flex-direction:column;gap:8px;"><button class="btn" id="visitGiftBtn">🎁送礼</button><button class="btn" id="visitChatBtn">💬聊天</button></div></div></div>`;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    document.getElementById('visitGiftBtn').addEventListener('click', () => {
        document.getElementById('visitSubModal').remove();
        if (state.player.inventory.length === 0) { showNoGiftModal(); return; }
        const gift = state.player.inventory.pop();
        const bonus = state.player.stats.charm >= 16 ? 2 : 0;
        let baseAmount = 5 + bonus;
        if (isGuyBirthday(guy, state.player.day)) {
            baseAmount = Math.floor(baseAmount * 1.3);
            showToast(`🎂 今天是${guy.name}的生日！好感度额外+30%！`);
        }
        addAffectionAndObsession(guy, baseAmount);
        state.player.stats.talent = Math.min(100, state.player.stats.talent + 1);
        state.player.actionCounts['gift'] = (state.player.actionCounts['gift'] || 0) + 1;
        checkAchievements();
        const logText = `送给${guy.name}${gift}，他很喜欢。${bonus > 0 ? '魅力加成额外+2好感！' : ''}${isGuyBirthday(guy, state.player.day) ? ' 🎂生日加成30%！' : ''}`;
        addLog(logText, place.name);
        checkHealthStatus();
        advanceTime();
        updateTopBar();
        showActionResult(logText, place);
    });
    document.getElementById('visitChatBtn').addEventListener('click', () => {
        document.getElementById('visitSubModal').remove();
        addAffectionAndObsession(guy, 3);
        checkAchievements();
        const logText = `你和${guy.name}聊了一会儿，关系更亲近了。`;
        addLog(logText, place.name);
        checkHealthStatus();
        advanceTime();
        updateTopBar();
        showActionResult(logText, place);
    });
}

// ========== 成就/结局 ==========
function unlockAchievement(id) {
    const achievements = JSON.parse(localStorage.getItem('beastLove_achievements') || '[]');
    if (!achievements.includes(id)) { achievements.push(id); localStorage.setItem('beastLove_achievements', JSON.stringify(achievements)); }
}

function unlockEnding(id) {
    const endings = JSON.parse(localStorage.getItem('beastLove_endings') || '[]');
    if (!endings.includes(id)) { endings.push(id); localStorage.setItem('beastLove_endings', JSON.stringify(endings)); }
}

function checkAchievements() {
    const ac = state.player.actionCounts;
    if ((ac['explore'] || 0) >= 1) unlockAchievement('first_explore');
    if (state.guys.filter(g => !g.hidden).every(g => !g.locked)) unlockAchievement('collector');
    if ((ac['learn'] || 0) >= 10) unlockAchievement('scholar');
    if ((ac['gift'] || 0) >= 15) unlockAchievement('gift_master');
    if ((ac['exercise'] || 0) >= 20) unlockAchievement('exercise_fan');
    if ((ac['chat'] || 0) >= 15) unlockAchievement('social_butterfly');
    if ((ac['buy_gift'] || 0) >= 15) unlockAchievement('shopaholic');
    if ((ac['forge'] || 0) >= 10) unlockAchievement('smith_helper');
    if ((ac['fish'] || 0) >= 10) unlockAchievement('fisherman');
    if ((ac['moon_cliff'] || 0) >= 10) unlockAchievement('moon_cliff_regular');
    if ((ac['hotspring'] || 0) >= 10) unlockAchievement('hotspring_lover');
    if ((ac['forest'] || 0) >= 10) unlockAchievement('forest_explorer');
    if ((ac['tower'] || 0) >= 10) unlockAchievement('tower_watcher');
    if ((ac['square'] || 0) >= 10) unlockAchievement('square_regular');
    if (state.player.maxHealth >= 100) unlockAchievement('survival_expert');
    if (state.player.stats.endurance >= 100) unlockAchievement('iron_body');
    if (state.player.stats.charm >= 100) unlockAchievement('popular');
    if (state.player.stats.intuition >= 100) unlockAchievement('prophet');
    if (state.player.stats.talent >= 100) unlockAchievement('artist');
    if (state.player.stats.affinity >= 100) unlockAchievement('diplomat');
    if (state.player.maxHealth >= 100 && Object.values(state.player.stats).every(v => v >= 100)) unlockAchievement('max_all');
    if (state.player.day >= 100) unlockAchievement('long_lasting');
    if ((ac['diary'] || 0) >= 20) unlockAchievement('diary_writer');
    if ((ac['craft'] || 0) >= 20) unlockAchievement('craft_master');
    if ((ac['bulletin'] || 0) >= 15) unlockAchievement('bulletin_reader');
    if ((ac['rumor'] || 0) >= 15) unlockAchievement('rumor_monger');
    if ((ac['astrology'] || 0) >= 10) unlockAchievement('astrologer');
    if ((ac['sky_watch'] || 0) >= 10) unlockAchievement('sky_watcher');
    if ((ac['herb'] || 0) >= 10) unlockAchievement('herb_expert');
}

function getInjuryProb() { const e = state.player.stats.endurance; if (e >= 90) return 0; if (e >= 70) return 0.03; if (e >= 50) return 0.08; return 0.15; }
function getDeepForestInjuryProb() { const e = state.player.stats.endurance; if (e >= 90) return 0; if (e >= 70) return 0.1; if (e >= 50) return 0.3; return 0.6; }