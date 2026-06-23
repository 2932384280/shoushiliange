// actions.js - 完整，只修改 acceptConfession 和 rejectConfession
import { state, getGuy, addLog, updateTopBar, getCurrentEvents, getCycleDay, getTopGuy, hasAnyDating, canGoOut, saveToSlot, loadFromSlot, applyTheme, formatSlotInfo, hasAnySave, CYCLE_LENGTH } from './state.js';
import { statInfo, beastWorldKnowledge, firstMeetStories, confessionStories, soulOathStories, imprisonmentStories, unrequitedStories, TRIBAL_EVENTS } from './data.js';
import { showToast, showGlobalModal } from './ui.js';
import { renderHome, renderPlaces, showActionResult, showNoGiftModal, openSaveLoadModal, showCantGoOutModal } from './render.js';
import { triggerDisaster, triggerRandomEvent, triggerHeartEvent, showCombinedEventModal, checkAndShowPendingDailyEvents } from './events.js';

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

export function getBulletins() {
    const current = getCurrentEvents();
    if (current.length) return [`📢 公告：【${current[0].name}】正在${current[0].locations.join('、')}举行！`];
    const tomorrow = TRIBAL_EVENTS.filter(e => e.cycleStart === getCycleDay() + 1 || (getCycleDay() === CYCLE_LENGTH && e.cycleStart === 1));
    if (tomorrow.length) return [`📢 预告：明天将在${tomorrow[0].locations.join('、')}举行【${tomorrow[0].name}】`];
    return baseBulletins;
}

export function getRumors() {
    const current = getCurrentEvents();
    if (current.length) return [`🗣️ 大家都在谈论今天的【${current[0].name}】`];
    const tomorrow = TRIBAL_EVENTS.filter(e => e.cycleStart === getCycleDay() + 1 || (getCycleDay() === CYCLE_LENGTH && e.cycleStart === 1));
    if (tomorrow.length) return [`🗣️ 居民们都在期待明天的【${tomorrow[0].name}】`];
    return baseRumors;
}

export function checkHealthStatus() {
    const p = state.player;
    const e = p.stats.endurance;
    const threshold = 40 - Math.floor(e / 2);
    if (p.sick && p.sickDays > 0) {
        if (p.caregiver) {
            const guy = getGuy(p.caregiver);
            if (guy && !guy.locked && !guy.banished) {
                p.stats.health = Math.min(p.maxHealth, p.stats.health + 2);
                guy.affection = Math.min(100, guy.affection + 1);
            }
        }
        p.sickDays--;
        if (p.sickDays <= 0) { p.sick = false; p.caregiver = null; addLog('你的病已经痊愈了！'); }
    } else if (p.sick && p.sickDays <= 0) {
        p.sick = false; p.caregiver = null;
    }
    if (!p.sick && p.stats.health <= threshold) {
        const prob = Math.max(0.1, 0.5 - e * 0.005);
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
    if (!p.sick && p.stats.health <= p.maxHealth * 0.2 && Math.random() < 0.3) {
        const moli = getGuy('moli');
        if (moli && moli.locked) {
            moli.locked = false;
            state.places.find(p => p.name === '巫医所').locked = false;
            p.stats.health = Math.min(p.maxHealth, p.stats.health + 30);
            addLog('你生命垂危，一位神秘的巫医出现并救治了你。他自称墨漓，似乎对你产生了兴趣。');
            showFirstMeetModal(moli, { name:'某处' }, '墨漓救了你，生命恢复了30点。');
        } else if (moli && !moli.locked && !moli.banished) {
            p.stats.health = Math.min(p.maxHealth, p.stats.health + 20);
            addLog('墨漓再次出现，为你治疗了伤口。');
        }
    }
}

export function advanceTime() {
    if (state._processingEvent) return;
    state._processingEvent = true;
    try {
        state.player.time++;
        if (state.player.time > 3) {
            state.player.time = 0;
            state.player.day++;
            const currentEvents = getCurrentEvents();
            if (currentEvents.length) state._pendingDailyEvents = currentEvents;
            state.player.stats.health = Math.min(state.player.maxHealth, state.player.stats.health + 5);
            addLog('新的一天，生命恢复了少许。');
            if (Math.random() < 0.1) triggerDisaster();
            else checkHealthStatus();
            autoSave();
        }
        updateTopBar();
    } finally {
        state._processingEvent = false;
    }
}

export function autoSave() {
    if (state.autoSaveMode === 'never') return;
    const d = state.player.day;
    if (state.autoSaveMode === 'day') { saveToSlot(0); return; }
    if (state.autoSaveMode === 'week' && d % 7 === 0) saveToSlot(0);
}

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

function generateMeetInteraction(guy, place, action) {
    const aff = guy.affection;
    const shortName = guy.name;
    const placeName = place.name;
    const meetPool = [];
    if (placeName === '训练场') {
        if (guy.id === 'lieyang') meetPool.push(`烈阳正在训练场挥汗如雨，看见你走过来立刻停下动作，露出灿烂的笑容："来得正好！陪我练几招！"`, `你在训练场看到了烈阳，他正单手举着石锁，看见你后单手放下石锁擦了把汗："嘿，要不要来比试一下？"`, `烈阳在场地中央热身，虎尾愉快地甩动，看到你就喊道："今天我们练练摔跤？"`, `烈阳刚做完一组俯卧撑，见你来到，耳朵动了动："今天有没有偷懒？来，我教你一个新招式。"`);
        else meetPool.push(`${shortName}在训练场边缘做着基础练习，看到你后微微点头示意。`, `${shortName}正在调整训练器材，发现你后停下手中的活，简单打了个招呼。`);
    } else if (placeName === '铁匠铺') {
        if (guy.id === 'yanyue') meetPool.push(`岩岳在炉火前捶打铁块，火星四溅，他抬头看见你，用围裙擦擦手："小心点，这里烫。今天想学锻造吗？"`, `岩岳正蹲在炉边吹火，听到脚步声转过头，憨厚地笑道："来得正好，帮我递一下那把钳子。"`, `你走进铁匠铺，岩岳正在打磨一把新剑，他抬头看你一眼，递过来一块温热的蜂蜜面包："刚烤的，尝尝。"`);
        else meetPool.push(`铁匠铺里热浪袭人，${shortName}站在炉边，看见你后简单问候了一句。`);
    } else if (placeName === '月崖') {
        if (guy.id === 'cangye') meetPool.push(`苍夜独坐在月崖边缘，银发在风中微扬，他转头看你，冰蓝的眼眸中掠过一丝柔光："这里风大，站我身后。"`, `苍夜正仰头望着月亮，听见脚步声，狼耳轻轻转动，低沉地说："你也来了。今晚的月光很美。"`, `月崖上，苍夜化作银白巨狼，静静趴卧，见你到来，变回人形轻声道："来，陪我坐一会儿。"`);
        else meetPool.push(`月崖上夜风清凉，${shortName}站在崖边远眺，看到你后微微颔首。`);
    } else if (placeName === '河边') {
        if (guy.id === 'xuanyu') meetPool.push(`玄羽正在河边采集药草，九条尾巴优雅地摆动，他抬眸看见你，狐狸眼微弯："来得正好，帮我拿着这个。"`, `河边雾气缭绕，玄羽倚在柳树下，手中把玩着一株发光草药，轻笑道："你也是来寻草药的？"`, `玄羽坐在河石上，赤脚轻点水面，看见你后嘴角上扬："水很凉，要不要试试？"`);
        else meetPool.push(`河水流淌，${shortName}正在河边洗衣，看见你后微笑示意。`);
    } else if (placeName === '密林小径') {
        if (guy.id === 'xuanyu') meetPool.push(`密林中幽香浮动，玄羽从古树后走出，折扇掩面："哎呀，迷路的小家伙，又见面了。"`, `你在密林小径中穿行，玄羽突然从树枝上轻盈落地，九尾微摇："猜猜我采到了什么稀罕药草？"`);
        else meetPool.push(`林中小径，${shortName}正在观察树木，看见你后简单交谈了几句。`);
    } else if (placeName === '哨塔') {
        if (guy.id === 'liuyun') meetPool.push(`流云站在哨塔顶端，苍鹰的羽翼在风中微张，他转头瞥了你一眼，语气平淡："这里风大，你来做什么？"但翅膀却悄悄为你挡了风。`, `流云正在瞭望远方，听到你的脚步声，转过身来，金色的瞳孔扫过你："今天云层很厚，可能会下雨。"他顿了顿，"没事就早点回去。"`, `你在哨塔上找到了流云，他正用磨刀石打磨箭头，看到你后头也不抬："那边有我留下的鹰羽，你要是喜欢就拿去。"`);
        else meetPool.push(`哨塔视野开阔，${shortName}正在放哨，发现你后提醒你注意安全。`);
    } else if (placeName === '部落广场') meetPool.push(`部落广场上人群熙攘，${shortName}站在公告栏前，看见你后招手示意。`, `你在广场上遇到了${shortName}，他正帮忙搬运货物，看到你后停下脚步闲聊了几句。`);
    else if (placeName === '市场') meetPool.push(`市场里叫卖声不断，${shortName}正在挑选货物，发现你后推荐道："今天的野果很新鲜。"`, `你在市场中闲逛，${shortName}从摊位后探出头，手里拿着一条熏鱼："要不要尝尝？"`);
    else if (placeName === '温泉') meetPool.push(`温泉边水汽氤氲，${shortName}正泡在水里，看到你后有些不好意思地移开视线。`, `你来到温泉，发现${shortName}刚泡完准备离开，头发还滴着水，他略显尴尬地打了个招呼。`);
    else if (placeName === '萨满祭坛') meetPool.push(`祭坛的烛火摇曳，${shortName}正在默念祷文，感知到你后缓缓睁开眼睛。`, `萨满祭坛庄严肃穆，${shortName}站在符文阵中，见你到来，示意你保持安静。`);
    else if (placeName === '密林') {
        if (guy.id === 'moli') meetPool.push(`密林深处药香浮动，墨漓倚在一株古木旁，手中捻着几片奇特的叶子，见你到来，他微微抬眸："这片林子藏着不少秘密，小心些。"`, `你在密林中穿行，发现墨漓正蹲在溪边清洗药草，碧鳞蛇尾轻轻拨弄着水面，他抬头看你："来得正好，帮我分辨一下这几株草药的药性。"`, `墨漓从树后缓步走出，手中捧着一朵散发幽光的蘑菇，轻声道："这是稀有的夜光菌，入药极佳。你若感兴趣，我可以教你辨识。"`);
        else meetPool.push(`密林幽深，${shortName}正在巡视，看到你后提醒道："这里野兽出没，注意安全。"`);
    } else meetPool.push(`你在${placeName}遇见了${shortName}，他正在忙碌，看到你后微微一笑。`, `${shortName}出现在${placeName}，你们简单交谈了几句。`, `路过${placeName}时，你发现${shortName}也在，他友好地和你打招呼。`);
    let interactionText = meetPool[Math.floor(Math.random() * meetPool.length)];
    if (aff >= 70 && !guy.dating) interactionText += ' ' + [`${shortName}的目光在你身上停留得比往常更久，似乎想多和你待一会儿。`, `他说话时，眼神不自觉地追随着你，带着一丝不易察觉的温柔。`, `${shortName}在你转身时，悄悄地又看了你一眼，尾巴不自觉地轻轻摆动。`][Math.floor(Math.random() * 3)];
    return interactionText;
}

export function addAffectionAndObsession(guy, amount, triggerJealousy = true) {
    if (!guy || guy.locked || guy.banished) return;
    guy.affection = Math.min(100, guy.affection + amount);
    const obsessGain = amount;
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

function triggerConfession(guy) {
    const others = state.guys.filter(g => !g.locked && !g.banished && g.id !== guy.id && g.affection >= 70);
    const htmlContent = `<div class="global-overlay" id="confessionModal"><div class="modal-box">${confessionStories[guy.id] || `<h2>${guy.name}的告白</h2>`}<div class="actions"><button class="btn" id="acceptConfession" style="background:#ff4d6d;">💕 答应他</button><button class="btn" id="rejectConfession">💔 拒绝</button></div></div></div>`;
    const modal = showGlobalModal(htmlContent, 'confessionModal');
    modal.querySelector('#acceptConfession').addEventListener('click', () => { modal.remove(); acceptConfession(guy, others); });
    modal.querySelector('#rejectConfession').addEventListener('click', () => { modal.remove(); rejectConfession(guy); });
}

function acceptConfession(guy, others) {
    guy.dating = true; guy.affection = 100; state.player.movedIn = guy.id; state.gameActive = true;
    addLog(`💕 你接受了${guy.name}的告白，搬到了他的家中与他共同生活。`);
    others.forEach(g => g.obsession = Math.min(100, g.obsession + 3 + Math.floor(Math.random() * 5)));
    updateTopBar();
    // 强制切换到主页避免卡死
    state.currentTab = 'home';
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('.nav-item[data-tab="home"]').classList.add('active');
    renderHome();
}

function rejectConfession(guy) {
    guy.affection = Math.max(0, guy.affection - 15); guy.proposed = false; state.gameActive = true;
    addLog(`你婉拒了${guy.name}的告白，他的眼神黯淡了下去。`);
    updateTopBar();
    // 强制切换到主页避免卡死
    state.currentTab = 'home';
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('.nav-item[data-tab="home"]').classList.add('active');
    renderHome();
}

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
        cangye:'你成为了狼王的伴侣，在月崖之下与他共度余生。',
        lieyang:'你留在了木屋中，每天都有新鲜的猎物和温暖的阳光。',
        xuanyu:'你在幻香居中停止了时间，与他一起漫步于幻术与真实之间。',
        yanyue:'石洞中炉火不灭，他为你打造了无数小物件。',
        liuyun:'云巢之上，你与他共赏日升月落。',
        moli:'竹楼药香中，墨漓以血为引，守护你一生。'
    };
    document.getElementById('contentArea').innerHTML = `<div class="modal-overlay"><div class="modal-box" style="text-align:center;"><div style="font-size:2em;">🔒</div><b>囚禁结局：${guy.name}的挚爱</b><p>${endingTexts[guy.id]||'你留在了他的身边。'}</p><div class="actions"><button class="btn" id="loadSaveEnding">📤 读档</button><button class="btn" id="restartEnding">🔄 重新开始</button></div></div></div>`;
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
        cangye:'灵魂契约达成。狼群齐声长啸，月光为你们披上永恒的祝福。',
        lieyang:'虎啸震彻山林，太阳神为你们洒下金色光芒。',
        xuanyu:'九尾魂灯升入夜空，狐族先祖的低语祝福着你们。',
        yanyue:'炉火轰然升腾，熊族守护之石嵌入了你们的戒指。',
        liuyun:'风神呼啸而过，将你们的誓言传遍天际。',
        moli:'碧鳞印记融入血脉，从此你的伤痛皆由他承担。'
    };
    document.getElementById('contentArea').innerHTML = `<div class="modal-overlay"><div class="modal-box" style="text-align:center;"><div style="font-size:2em;">💞</div><b>完美结局：与${guy.name}的灵魂相伴</b><p>${texts[guy.id] || '你们缔结了灵魂契约，从此幸福地生活在一起。'}</p><div class="actions"><button class="btn" id="loadSaveHE">📤 读档</button><button class="btn" id="restartHE">🔄 重新开始</button></div></div></div>`;
    document.getElementById('loadSaveHE').addEventListener('click', () => { openSaveLoadModal(); document.querySelector('.modal-overlay').remove(); });
    document.getElementById('restartHE').addEventListener('click', () => window.restartGame());
}

export function resolveExplore(place, action) {
    const stats = state.player.stats;
    const events = getCurrentEvents();
    let logParts = [];
    state.player.actionCounts['explore'] = (state.player.actionCounts['explore'] || 0) + 1;
    const isSafeAction = action.includes('休息') || action.includes('温泉') || action.includes('放松') || action.includes('打个盹') || action.includes('制作礼物') || action.includes('购买礼物') || action.includes('查看公告') || action.includes('打听消息') || action.includes('学习知识');

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
                state.player.inventory.push(treasures[Math.floor(Math.random() * treasures.length)]);
                logParts.push(`你发现了一个隐藏的宝箱，获得了宝物！`);
            } else logParts.push('你翻遍了灌木丛，只找到一些普通的石头。');
        }
        if (Math.random() < getDeepForestInjuryProb()) { const dmg = 15 + Math.floor(Math.random() * 15); stats.health = Math.max(0, stats.health - dmg); logParts.push(`密林中的野兽突然袭击了你，生命值减少了${dmg}点！`); addLog(`在密林探索时被野兽袭击，生命值减少${dmg}。`, place.name); }
    } else {
        let eventHandled = false;
        for (let ev of events) {
            if (ev.effects.placeBoosts && ev.effects.placeBoosts[place.name]) {
                const boost = ev.effects.placeBoosts[place.name];
                if (boost.actions && boost.actions.includes(action)) {
                    if (action === '🎉 参加庆典') { stats.affinity = Math.min(100, stats.affinity + 3); stats.charm = Math.min(100, stats.charm + 1); logParts.push('你参加了丰收祭，与大家载歌载舞，亲和与魅力提升了！'); eventHandled = true; }
                    else if (action === '🌠 观星祈愿') { stats.intuition = Math.min(100, stats.intuition + 2); stats.endurance = Math.min(100, stats.endurance + 1); logParts.push('你在流星下许愿，直觉与体质获得了提升。'); eventHandled = true; }
                    else if (action === '⚒️ 协助锻造武器') { stats.talent = Math.min(100, stats.talent + 2); stats.affinity = Math.min(100, stats.affinity + 1); logParts.push('你协助岩岳为远征打造武器，才艺与亲和提升了。'); state.player.actionCounts['forge'] = (state.player.actionCounts['forge'] || 0) + 1; eventHandled = true; }
                    else if (action === '🥩 追踪猎物') { state.player.inventory.push('🍖熏肉干'); logParts.push('你追踪到一头猎物，获得了一块熏肉干。'); eventHandled = true; }
                    else if (action === '🌿 协助治疗') { stats.talent = Math.min(100, stats.talent + 2); stats.affinity = Math.min(100, stats.affinity + 2); state.player.stats.health = state.player.maxHealth; let healedGuys = 0; state.guys.forEach(g => { if (g.injured && !g.locked && !g.banished) { g.injured = false; g.injuredDays = 0; healedGuys++; addLog(`${g.name}在治愈之日接受了治疗，伤势痊愈。`); } }); logParts.push('你帮助医女小蔓治疗伤者，才艺与亲和提升了！你的生命值完全恢复！'); if (healedGuys > 0) logParts.push(`${healedGuys}位受伤的男主也恢复了健康。`); eventHandled = true; }
                    else if (action === '💎 购买稀有礼物') { state.player.inventory.push('💎月光石'); logParts.push('你从流浪商人那里买到了一块稀有的月光石。'); eventHandled = true; }
                    else if (action === '🔥 围火共舞') { stats.endurance = Math.min(100, stats.endurance + 2); stats.affinity = Math.min(100, stats.affinity + 2); logParts.push('你围绕篝火跳舞，体质与亲和提升了！'); eventHandled = true; }
                    else if (action === '🔮 领取护符') { state.player.inventory.push('🔥火灵护符'); logParts.push('岩岳为你打造了火灵护符，放入背包。'); eventHandled = true; }
                    break;
                }
            }
        }
        if (!eventHandled) {
            if (action === '🛏️休息恢复') { const heal = 5 + Math.floor(Math.random() * 6); stats.health = Math.min(state.player.maxHealth, stats.health + heal); logParts.push(`你好好休息了一番，生命恢复了${heal}点。`); }
            else if (action === '🎁制作礼物') { state.player.inventory.push('🧸手工小物'); logParts.push('你精心制作了一件小礼物，放入了背包。'); state.player.actionCounts['craft'] = (state.player.actionCounts['craft'] || 0) + 1; }
            else if (action === '🎁购买礼物') {
                stats.affinity = Math.min(100, stats.affinity + 1);
                if (stats.affinity >= 16 && Math.random() < 0.4) { state.player.inventory.push('💐鲜花束','🍖熏肉干'); logParts.push('亲和力高，商贩多送了你一块熏肉干！获得了两件礼物。'); }
                else if (Math.random() < 0.6) { state.player.inventory.push('💐鲜花束'); logParts.push('你在市场买了一束鲜花。'); }
                else { state.player.inventory.push('🍖熏肉干'); logParts.push('你从商人那里换到一块熏肉干。'); }
                state.player.actionCounts['buy_gift'] = (state.player.actionCounts['buy_gift'] || 0) + 1;
            }
            else if (action === '📋查看公告') { stats.intuition = Math.min(100, stats.intuition + 1); const bulletin = getBulletins()[Math.floor(Math.random()*getBulletins().length)]; logParts.push(`公告栏上写着："${bulletin}"`); state.player.actionCounts['bulletin'] = (state.player.actionCounts['bulletin'] || 0) + 1; }
            else if (action === '🗣️打听消息') { stats.affinity = Math.min(100, stats.affinity + 1); const rumor = getRumors()[Math.floor(Math.random()*getRumors().length)]; logParts.push(`你听到人们在议论："${rumor}"`); state.player.actionCounts['rumor'] = (state.player.actionCounts['rumor'] || 0) + 1; }
            else if (action === '📚学习知识') { stats.intuition = Math.min(100, stats.intuition + 1); const knowledge = beastWorldKnowledge[Math.floor(Math.random()*beastWorldKnowledge.length)]; logParts.push(`你在祭坛翻阅古籍，学到了新知识："${knowledge}"`); state.player.actionCounts['learn'] = (state.player.actionCounts['learn'] || 0) + 1; if (state.player.actionCounts['learn'] >= 10) unlockAchievement('scholar'); addLog(`在祭坛学习兽世知识：${knowledge}`, place.name); }
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

    if (place.type === 'guyhome') {
        const hg = getGuy(place.guy);
        if (hg && !hg.locked && !hg.banished) {
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
                addAffectionAndObsession(hg, 5 + bonus);
                state.player.stats.talent = Math.min(100, state.player.stats.talent + 1);
                state.player.actionCounts['gift'] = (state.player.actionCounts['gift'] || 0) + 1;
                logParts.push(`送给${hg.name}${gift}，他很喜欢。${bonus>0?'魅力加成额外+2好感！':''}`);
                addLog(logParts.join('<br>'), place.name); checkAchievements(); return logParts.join('<br>');
            }
            if (action === '💬聊天') { addAffectionAndObsession(hg, 3); logParts.push(`你和${hg.name}聊了一会儿，关系更亲近了。`); addLog(logParts.join('<br>'), place.name); checkAchievements(); return logParts.join('<br>'); }
        }
    }

    if (place.name !== '密林' && Math.random() < getInjuryProb() && !isSafeAction) { const dmg = 8 + Math.floor(Math.random() * 10); stats.health = Math.max(0, stats.health - dmg); logParts.push(`你遭遇意外，生命值减少了${dmg}点！`); addLog(`你在探索中受了轻伤，生命值减少${dmg}。`, place.name); }
    if (place.exploreCount !== undefined) place.exploreCount = (place.exploreCount || 0) + 1;
    if (place.unlockTarget) {
        const target = state.places.find(p => p.name === place.unlockTarget);
        if (target && target.locked && place.exploreCount >= place.needCount) { target.locked = false; logParts.push(`🗺️发现了通往<b>${target.name}</b>的路！`); addLog(`探索${place.name}多次后发现了新地点：${target.name}。`, place.name); place.exploreCount = 0; }
    }
    if (place.type === 'public') {
        const pguy = place.guy ? getGuy(place.guy) : null;
        if (pguy && !pguy.banished && pguy.sulkingDays <= 0 && !(pguy.id === 'moli' && pguy.locked)) {
            let meetBonus = 0;
            events.forEach(ev => { if (ev.effects.guyMods && ev.effects.guyMods[pguy.id]) meetBonus = ev.effects.guyMods[pguy.id].meetBonus || 0; });
            const uc = 0.25 + stats.intuition / 120;
            const mc = 0.25 + stats.charm / 120 + meetBonus/100;
            if (pguy.locked) {
                if (Math.random() < uc) { pguy.locked = false; addAffectionAndObsession(pguy, 5); const meetLog = `你首次遇到了${pguy.name}！`; addLog(meetLog, place.name); logParts.push(meetLog); showFirstMeetModal(pguy, place, logParts.join('<br>')); return null; }
            } else {
                if (Math.random() < mc) { addAffectionAndObsession(pguy, 3); logParts.push(generateMeetInteraction(pguy, place, action)); if (pguy.id === 'moli' && stats.health < state.player.maxHealth) { const heal = 10 + Math.floor(Math.random() * 11); stats.health = Math.min(state.player.maxHealth, stats.health + heal); logParts.push(`墨漓随手为你调理了气息，生命恢复了${heal}点。`); } }
            }
        }
        if (Math.random() < 0.12 + stats.charm / 200) {
            const og = state.guys.filter(g => !g.locked && !g.banished && g.id !== (place.guy || '') && !events.some(ev=>ev.effects.guyMods&&ev.effects.guyMods[g.id]?.locked) && g.sulkingDays <= 0 && !(g.id === 'moli' && g.locked));
            if (og.length) { const rg = og[Math.floor(Math.random() * og.length)]; addAffectionAndObsession(rg, 2); logParts.push(`没想到${rg.name}也在这里。`); }
        }
        const presentGuys = state.guys.filter(g => !g.locked && !g.banished && g.sulkingDays <= 0 && (g.id === (place.guy || '') || (Math.random() < 0.12 + stats.charm / 200)) && !(g.id === 'moli' && g.locked));
        const highAffGuys = presentGuys.filter(g => g.affection >= 70);
        if (highAffGuys.length >= 2 && Math.random() < 0.3) { const logText = logParts.join('<br>'); addLog(logText, place.name); triggerMultiGuyConflict(highAffGuys, place); return null; }
    }
    if (Math.random() < 0.03) {
        const cand = state.guys.filter(g => !g.locked && !g.injured && !g.banished && g.id !== 'moli' && !events.some(ev=>ev.effects.guyMods&&ev.effects.guyMods[g.id]?.locked) && g.sulkingDays <= 0);
        if (cand.length) { const u = cand[Math.floor(Math.random() * cand.length)]; u.injured = true; u.injuredDays = 3 + Math.floor(Math.random() * 3); logParts.push(`听说${u.name}受伤了！`); addLog(`${u.name}在与野兽搏斗中受伤，需要休养${u.injuredDays}天。`, place.name); }
    }
    if (state.player.day >= 3 && state.places.find(pl => pl.name === '温泉').locked && Math.random() < 0.3) { state.places.find(pl => pl.name === '温泉').locked = false; logParts.push('可以使用温泉了。'); }
    state.guys.forEach(g => { if (!g.locked && !g.banished && g.affection >= 30) { const home = state.places.find(pl => pl.guy === g.id && pl.type === 'guyhome'); if (home && home.locked) { home.locked = false; addLog(`${g.name}邀请你去他家做客。`, home.name); } } });
    const logText = logParts.join('<br>');
    addLog(logText, place.name);
    checkAchievements();
    if (!state.gameActive) return logText;
    checkHESoulOath();
    return logText;
}

function triggerMultiGuyConflict(guyList, place) {
    const names = guyList.map(g => g.name).join('和');
    const all100 = guyList.every(g => g.affection >= 100);
    const desc = all100 ? `${names}看到彼此与你亲近，怒气冲冲，甚至准备大打出手！` : `${names}看到彼此与你亲近，眼神交锋，言语间弥漫着浓浓的火药味。`;
    let html = `<div class="global-overlay" id="conflictModal"><div class="modal-box"><div style="font-weight:700;color:var(--accent);">⚡ 冲突爆发</div><p>${desc}</p><div class="actions">`;
    html += all100 ? `<button class="btn" id="ignoreFight">🛑 不管他们</button>` : `<button class="btn" id="ignoreFight">🛑 不插手</button>`;
    guyList.forEach(g => { html += `<button class="btn" data-id="${g.id}">${all100 ? '🛡️ 护着' : '💬 为'}${g.name}${all100 ? '' : '说话'}</button>`; });
    html += `</div></div></div>`;
    const modal = showGlobalModal(html, 'conflictModal');
    modal.querySelector('#ignoreFight').addEventListener('click', () => { modal.remove(); if (all100) { guyList.forEach(g => { g.injured = true; g.injuredDays = 4 + Math.floor(Math.random() * 3); }); addLog(`${guyList.map(g=>g.name).join('和')}打了起来，两人都受伤了！`, place.name); } else addLog(`你没有插手，${guyList.map(g=>g.name).join('和')}不欢而散。`, place.name); checkHealthStatus(); advanceTime(); updateTopBar(); renderPlaces(); });
    modal.querySelectorAll('[data-id]').forEach(btn => btn.addEventListener('click', () => { modal.remove(); const favoredId = btn.dataset.id; const favored = guyList.find(g => g.id === favoredId); const other = guyList.find(g => g.id !== favoredId); if (favored) addAffectionAndObsession(favored, 5); if (other) { other.affection = Math.max(0, other.affection - 5); other.sulkingDays = 3 + Math.floor(Math.random() * 2); other.sulkingTarget = favoredId; addLog(`你偏袒了${favored.name}，${other.name}心碎地离开了，暂时不愿见你。`, place.name); unlockAchievement('peacemaker'); checkAchievements(); } checkHealthStatus(); advanceTime(); updateTopBar(); renderPlaces(); }));
}

export function openPlaceActions(placeName) {
    const place = state.places.find(p => p.name === placeName);
    if (!place || place.locked) return;
    if (getCurrentEvents().some(ev => ev.effects.lockedPlaces && ev.effects.lockedPlaces.includes(placeName))) return;
    if (!canGoOut() && placeName !== '我家') { showCantGoOutModal(); return; }
    const html = `<div class="modal-overlay" id="actionModal"><div class="modal-box"><div style="font-weight:700;color:var(--accent);">📍 ${placeName}</div><div id="actionOptions"></div><button class="btn" id="closeModal" style="width:100%;margin-top:8px;">返回</button></div></div>`;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    document.getElementById('closeModal').addEventListener('click', () => document.getElementById('actionModal').remove());
    generateActions(place);
}

function generateActions(place) {
    const div = document.getElementById('actionOptions');
    let acts = [];
    const events = getCurrentEvents();
    let eventActions = [];
    events.forEach(ev => { if (ev.effects.placeBoosts && ev.effects.placeBoosts[place.name] && ev.effects.placeBoosts[place.name].actions) eventActions = eventActions.concat(ev.effects.placeBoosts[place.name].actions); });
    if (place.type === 'home') acts = ['🛏️休息恢复', '🎁制作礼物', '📝写日记'];
    else if (place.name === '部落广场') acts = ['🤝帮忙杂务', '💬与居民聊天', '📋查看公告'];
    else if (place.name === '训练场') acts = ['💪锻炼身体', '🥊观看训练'];
    else if (place.name === '铁匠铺') acts = ['🔨帮忙锻造', '🛠️学习技艺'];
    else if (place.name === '河边') acts = ['🎣抓鱼', '🧺洗衣服', '🌸采花探索'];
    else if (place.name === '市场') acts = ['🛒闲逛购物', '🎁购买礼物', '🗣️打听消息'];
    else if (place.name === '月崖') acts = ['🌙静坐赏月', '🌿采集草药'];
    else if (place.name === '萨满祭坛') acts = ['📚学习知识', '🌟观星占卜'];
    else if (place.name === '哨塔') acts = ['🗼登高望远', '☁️观察天象'];
    else if (place.name === '密林小径') acts = ['🍄采集药草', '👣追踪兽迹'];
    else if (place.name === '温泉') acts = ['♨️泡温泉', '🧘放松冥想'];
    else if (place.name === '密林') acts = ['🔍深入探索', '🍀寻找草药', '📦搜寻宝藏'];
    else if (place.type === 'guyhome') {
        const guy = getGuy(place.guy);
        if (!guy || guy.banished) acts = ['🔍探索'];
        else { if (guy.injured) acts.push('💊照顾他'); if (state.player.movedIn === place.guy) acts = acts.concat(['🎁送礼', '💬聊天', '🚶邀请出门']); else acts = acts.concat(['🏠拜访', '🚶邀请出门']); }
    } else acts = ['🔍探索', '🌿采集', '🚶散步'];
    acts = eventActions.concat(acts.filter(a => !eventActions.includes(a)));
    if (Math.random() < 0.5) {
        const randomPool = [{ text:'✨ 发现奇怪的东西', exclude:['home','guyhome'] }, { text:'🐦 与一只小鸟玩耍', exclude:['home'] }, { text:'📦 捡到一个小包裹', exclude:['home','guyhome'] }, { text:'💤 打个盹', exclude:[] }, { text:'🗣️ 与陌生人搭话', exclude:['home','guyhome'] }].filter(r => !r.exclude.includes(place.type));
        if (randomPool.length) acts.push('🎲 ' + randomPool[Math.floor(Math.random() * randomPool.length)].text);
    }
    div.innerHTML = acts.map(a => `<button class="btn" style="width:100%;margin:2px 0;" data-action="${a}">${a}</button>`).join('');
    div.querySelectorAll('button').forEach(btn => btn.addEventListener('click', function() {
        const action = this.dataset.action;
        document.getElementById('actionModal').remove();
        if (place.type === 'guyhome' && action === '🏠拜访') { handleGuyHomeVisit(place); return; }
        const logText = resolveExplore(place, action);
        if (logText === null) return;
        if (!state.gameActive) return;
        checkHealthStatus();
        advanceTime();
        updateTopBar();
        if (place.type === 'public' && Math.random() < 0.05) triggerRandomEvent(place, logText);
        else if (place.type === 'guyhome' && action.includes('拜访') && Math.random() < 0.3) {
            const guy = getGuy(place.guy);
            if (guy && !guy.locked && !guy.banished && guy.affection >= 50) triggerHeartEvent(place, guy, logText);
            else showActionResult(logText, place);
        } else showActionResult(logText, place);
    }));
}

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
    if (guy.sulkingDays > 0) { const logText = `${guy.name}还在生闷气，不愿见你。`; addLog(logText, place.name); checkHealthStatus(); advanceTime(); updateTopBar(); showActionResult(logText, place); return; }
    const isHome = guy.affection >= 70 ? Math.random() < 0.8 : Math.random() < 0.3;
    if (!isHome) { const logText = `${guy.name}不在家。`; addLog(logText, place.name); checkHealthStatus(); advanceTime(); updateTopBar(); showActionResult(logText, place); return; }
    const html = `<div class="modal-overlay" id="visitSubModal"><div class="modal-box"><div style="font-weight:700;color:var(--accent);">拜访${guy.name}</div>${healMsg}<div style="margin:12px 0;">他在家，你想做什么？</div><div style="display:flex;flex-direction:column;gap:8px;"><button class="btn" id="visitGiftBtn">🎁送礼</button><button class="btn" id="visitChatBtn">💬聊天</button></div></div></div>`;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    document.getElementById('visitGiftBtn').addEventListener('click', () => {
        document.getElementById('visitSubModal').remove();
        if (state.player.inventory.length === 0) { showNoGiftModal(); return; }
        const gift = state.player.inventory.pop();
        const bonus = state.player.stats.charm >= 16 ? 2 : 0;
        addAffectionAndObsession(guy, 5 + bonus);
        state.player.stats.talent = Math.min(100, state.player.stats.talent + 1);
        state.player.actionCounts['gift'] = (state.player.actionCounts['gift'] || 0) + 1;
        checkAchievements();
        const logText = `送给${guy.name}${gift}，他很喜欢。${bonus>0?'魅力加成额外+2好感！':''}`;
        addLog(logText, place.name);
        checkHealthStatus(); advanceTime(); updateTopBar();
        showActionResult(logText, place);
    });
    document.getElementById('visitChatBtn').addEventListener('click', () => {
        document.getElementById('visitSubModal').remove();
        addAffectionAndObsession(guy, 3);
        checkAchievements();
        const logText = `你和${guy.name}聊了一会儿，关系更亲近了。`;
        addLog(logText, place.name);
        checkHealthStatus(); advanceTime(); updateTopBar();
        showActionResult(logText, place);
    });
}

function unlockAchievement(id) { const achievements = JSON.parse(localStorage.getItem('beastLove_achievements') || '[]'); if (!achievements.includes(id)) { achievements.push(id); localStorage.setItem('beastLove_achievements', JSON.stringify(achievements)); } }
function unlockEnding(id) { const endings = JSON.parse(localStorage.getItem('beastLove_endings') || '[]'); if (!endings.includes(id)) { endings.push(id); localStorage.setItem('beastLove_endings', JSON.stringify(endings)); } }
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