// state.js - 完整版（包含所有状态、任务系统、用户信息）
import { themes, TRIBAL_EVENTS } from './data.js';

export const MAX_SLOTS = 5;
export const CYCLE_LENGTH = 360;
export const MAX_NPC = 100;
export const DAILY_FOOD_COST = 4;

// ========== 日期计算 ==========
export function getDateInfo(day) {
    const year = 222 + Math.floor((day - 1) / 360);
    const dayInYear = ((day - 1) % 360) + 1;
    const month = Math.floor((dayInYear - 1) / 30) + 1;
    const dayInMonth = ((dayInYear - 1) % 30) + 1;
    const weekDay = ((day - 1) % 7) + 1;
    const weekNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return { year, month, dayInMonth, dayInYear, weekDay, weekName: weekNames[weekDay - 1] };
}

export function getSeason(month) {
    if (month >= 1 && month <= 3) return '春季';
    if (month >= 4 && month <= 6) return '夏季';
    if (month >= 7 && month <= 10) return '雨季';
    if (month >= 11 && month <= 12) return '冬季';
    return '春季';
}

export function getSeasonEmoji(month) {
    const s = getSeason(month);
    if (s === '春季') return '🌸';
    if (s === '夏季') return '☀️';
    if (s === '雨季') return '🌧️';
    if (s === '冬季') return '❄️';
    return '🌸';
}

export function isHuntingSeason(day) {
    const { month } = getDateInfo(day);
    return month === 7;
}

export function isRainySeason(day) {
    const { month } = getDateInfo(day);
    return month >= 7 && month <= 10;
}

export function getAge(character) {
    return character.age || 0;
}

let _eventCache = null;

export function getTodayEvents(day) {
    if (!_eventCache) return [];
    const { month, dayInMonth } = getDateInfo(day);
    return _eventCache.filter(e => e.month === month && e.day === dayInMonth);
}

export function refreshEvents(eventsData) {
    _eventCache = eventsData;
}

// ========== 默认状态 ==========
export function defaultState() {
    return {
        player: {
            name: '小春',
            avatar: '👧🏻',
            day: 1,
            time: 0,
            stats: { health: 90, charm: 12, intuition: 10, endurance: 5, talent: 8, affinity: 15 },
            maxHealth: 90,
            gold: 50,
            daysWithoutFood: 0,
            isDead: false,
            sick: false,
            sickDays: 0,
            caregiver: null,
            inventory: [],
            movedIn: null,
            prisonRecord: [],
            actionCounts: {},
            datingInvites: [],
            lastInviteDay: 0,
            birthMonth: 1,
            birthDay: 1,
            guyBirthdayGiftReceived: false,
            npcBirthdayGiftReceived: false,
            metNpcs: [],
            tutorialStep: 0,
            tutorialSkipped: false,
            firstTrainingDone: false,
            _lieyangFirstMeetDone: false,
            _moliTriggered: false,
            activeQuest: null,
            completedQuests: [],
            collectedItems: [],
            triggeredStories: [],
            festivalStories: [],
            guyInteractions: [],
            logFilter: 'all',
            _goldWarningShown: false,
            logTypes: { player: true, guy: true, npc: true, system: true },
            saveNames: {},
            heEndings: [],
            quests: {},
            tapUser: null,
            cloudEnabled: false,
            _firstCuddle: false,
            _firstLantern: false,
            _firstStar: false,
            _wishMade: 0
        },
        guys: [
            {
                id: 'cangye', name: '苍夜', emoji: '🐺', race: '霜月狼族', color: '#6b7fa8',
                age: 30, avatar: 'img/avatars/cangye.jpg',
                affection: 0, obsession: 0, locked: true, injured: false, injuredDays: 0,
                dating: false, banished: false, proposed: false, heProposed: false, heRejectedDay: 0,
                obsessType: 'early', obsessActive: false, meetPlace: '月崖', cluePlace: '部落广场',
                personality: '对外威严寡言，内心孤独。尾巴会不经意圈住你。',
                background: '霜月狼族首领，左眼有一道细疤。',
                likes: '月光、烤肉、你的味道', ability: '夜视、呼唤狼群', petDetail: '银白巨狼，耳后根敏感。',
                sulkingDays: 0, sulkingTarget: null, hidden: false,
                lastInviteDay: 0, inviteCooldown: 5,
                birthMonth: 12, birthDay: 15,
                mainPlaces: ['月崖', '密林小径'],
                renameUnlocked: false,
                customName: '',
                heLocked: false
            },
            {
                id: 'lieyang', name: '烈阳', emoji: '🐯', race: '赤金虎族', color: '#e08a3a',
                age: 24, avatar: 'img/avatars/lieyang.jpg',
                affection: 0, obsession: 0, locked: true, injured: false, injuredDays: 0,
                dating: false, banished: false, proposed: false, heProposed: false, heRejectedDay: 0,
                obsessType: 'late', obsessActive: false, meetPlace: '训练场', cluePlace: '训练场',
                personality: '直率热情，表达爱意直接。吃醋会生闷气。',
                background: '24岁，部落最强战士，狩猎队长。',
                likes: '晒太阳、摔跤、甜食', ability: '巨力、虎啸', petDetail: '猛虎，揉肉垫会呼噜。',
                sulkingDays: 0, sulkingTarget: null, hidden: false,
                lastInviteDay: 0, inviteCooldown: 4,
                birthMonth: 6, birthDay: 21,
                mainPlaces: ['训练场', '部落广场'],
                renameUnlocked: false,
                customName: '',
                heLocked: false
            },
            {
                id: 'xuanyu', name: '玄羽', emoji: '🦊', race: '九尾玄狐', color: '#9b59b6',
                age: 200, avatar: 'img/avatars/xuanyu.jpg',
                affection: 0, obsession: 0, locked: true, injured: false, injuredDays: 0,
                dating: false, banished: false, proposed: false, heProposed: false, heRejectedDay: 0,
                obsessType: 'early', obsessActive: false, meetPlace: '密林小径', cluePlace: '河边',
                personality: '喜欢逗弄你，以温柔方式展现占有欲。',
                background: '200+岁，最后的九尾狐，萨满祭司。',
                likes: '药草、古籍、你的反应', ability: '炼药、幻术', petDetail: '小黑狐，尾根敏感。',
                sulkingDays: 0, sulkingTarget: null, hidden: false,
                lastInviteDay: 0, inviteCooldown: 6,
                birthMonth: 3, birthDay: 3,
                mainPlaces: ['密林小径', '河边'],
                renameUnlocked: false,
                customName: '',
                heLocked: false
            },
            {
                id: 'yanyue', name: '岩岳', emoji: '🐻', race: '大地熊族', color: '#8B5A2B',
                age: 28, avatar: 'img/avatars/yanyue.jpg',
                affection: 0, obsession: 0, locked: true, injured: false, injuredDays: 0,
                dating: false, banished: false, proposed: false, heProposed: false, heRejectedDay: 0,
                obsessType: 'late', obsessActive: false, meetPlace: '铁匠铺', cluePlace: '铁匠铺',
                personality: '默默付出，不善言辞。冬天用兽形给你暖脚。',
                background: '28岁，部落唯一的铁匠。',
                likes: '蜂蜜、锻造、你的料理', ability: '怪力、金属加工', petDetail: '棕熊，最喜欢被摸肚子。',
                sulkingDays: 0, sulkingTarget: null, hidden: false,
                lastInviteDay: 0, inviteCooldown: 5,
                birthMonth: 10, birthDay: 10,
                mainPlaces: ['铁匠铺', '市场'],
                renameUnlocked: false,
                customName: '',
                heLocked: false
            },
            {
                id: 'liuyun', name: '流云', emoji: '🦅', race: '苍羽鹰族', color: '#5DADE2',
                age: 22, avatar: 'img/avatars/liuyun.jpg',
                affection: 0, obsession: 0, locked: true, injured: false, injuredDays: 0,
                dating: false, banished: false, proposed: false, heProposed: false, heRejectedDay: 0,
                obsessType: 'late', obsessActive: false, meetPlace: '哨塔', cluePlace: '训练场',
                personality: '嘴上嫌弃，却偷偷保护你。会圈地盘。',
                background: '22岁，独居哨塔的鹰族哨兵。',
                likes: '高处、宝石、夸奖', ability: '飞行、超远视力', petDetail: '苍鹰，羽冠敏感。',
                sulkingDays: 0, sulkingTarget: null, hidden: false,
                lastInviteDay: 0, inviteCooldown: 4,
                birthMonth: 4, birthDay: 7,
                mainPlaces: ['哨塔', '月崖'],
                renameUnlocked: false,
                customName: '',
                heLocked: false
            },
            {
                id: 'moli', name: '墨漓', emoji: '🐍', race: '碧鳞蛇族', color: '#20B2AA',
                age: 250, avatar: 'img/avatars/moli.jpg',
                affection: 0, obsession: 0, locked: true, injured: false, injuredDays: 0,
                dating: false, banished: false, proposed: false, heProposed: false, heRejectedDay: 0,
                obsessType: 'early', obsessActive: false, meetPlace: '密林', cluePlace: '密林',
                personality: '神秘莫测，温柔中带着疏离。',
                background: '独居竹楼的巫医，已活了数百年。碧鳞蛇族寿命悠长，使他仍保持着青年般的容貌。',
                likes: '草药、安宁、你的健康', ability: '精通医术与蛇毒', petDetail: '碧鳞大蛇，鳞片冰凉。',
                sulkingDays: 0, sulkingTarget: null, hidden: true, noInjure: true,
                lastInviteDay: 0, inviteCooldown: 7,
                birthMonth: 8, birthDay: 8,
                mainPlaces: ['密林', '河边'],
                renameUnlocked: false,
                customName: '',
                heLocked: false
            }
        ],
        npcs: [],
        relationshipMap: {},
        pendingRelationships: {},
        worldManual: [],
        places: [
            { name: '我家', icon: '🏠', locked: false, type: 'home', hint: '🏠 休息与制作' },
            { name: '部落广场', icon: '🏛️', locked: false, type: 'public', unlockTarget: '月崖', exploreCount: 0, needCount: 3, hint: '🗣️ 交流与公告' },
            { name: '训练场', icon: '💪', locked: false, type: 'public', guy: 'lieyang', unlockTarget: '哨塔', exploreCount: 0, needCount: 3, hint: '💪 锻炼与比试' },
            { name: '铁匠铺', icon: '🔨', locked: false, type: 'public', guy: 'yanyue', hint: '🔨 锻造与学习' },
            { name: '河边', icon: '🌊', locked: false, type: 'public', unlockTarget: '密林小径', exploreCount: 0, needCount: 3, hint: '🎣 采集与放松' },
            { name: '市场', icon: '🛒', locked: false, type: 'public', unlockTarget: '萨满祭坛', exploreCount: 0, needCount: 3, hint: '🛍️ 购物与情报' },
            { name: '月崖', icon: '🌙', locked: true, type: 'public', guy: 'cangye', hint: '🌙 观星与秘密' },
            { name: '萨满祭坛', icon: '🔮', locked: true, type: 'public', hint: '🔮 学习与占卜' },
            { name: '哨塔', icon: '🗼', locked: true, type: 'public', guy: 'liuyun', hint: '🗼 瞭望与探索' },
            { name: '温泉', icon: '♨️', locked: true, type: 'public', hint: '♨️ 恢复与冥想' },
            { name: '密林小径', icon: '🌿', locked: true, type: 'public', guy: 'xuanyu', unlockTarget: '密林', exploreCount: 0, needCount: 3, hint: '🌿 探险与奇遇' },
            { name: '密林', icon: '🌲', locked: true, type: 'public', guy: 'moli', hint: '🌲 采集与危险' },
            { name: '花田', icon: '🌺', locked: true, type: 'public', unlockTarget: null, exploreCount: 0, needCount: 0, hint: '🌸 赏花与采蜜' },
            { name: '山涧瀑布', icon: '💧', locked: true, type: 'public', unlockTarget: null, exploreCount: 0, needCount: 0, hint: '💧 戏水与冥想' },
            { name: '古树广场', icon: '🌳', locked: true, type: 'public', unlockTarget: null, exploreCount: 0, needCount: 0, hint: '🌳 阅读与聆听' },
            { name: '湖边', icon: '🏞️', locked: true, type: 'public', unlockTarget: null, exploreCount: 0, needCount: 0, hint: '🏞️ 泛舟与垂钓' },
            { name: '果园', icon: '🍎', locked: true, type: 'public', unlockTarget: null, exploreCount: 0, needCount: 0, hint: '🍎 采摘与休憩' },
            { name: '观星台', icon: '🔭', locked: true, type: 'public', unlockTarget: null, exploreCount: 0, needCount: 0, hint: '🔭 观星与许愿' },
            { name: '苍夜之窟', icon: '🐺', locked: true, type: 'guyhome', guy: 'cangye', hint: '🐺 狼王的居所' },
            { name: '烈阳木屋', icon: '🐯', locked: true, type: 'guyhome', guy: 'lieyang', hint: '🐯 虎族的木屋' },
            { name: '玄羽幻香居', icon: '🦊', locked: true, type: 'guyhome', guy: 'xuanyu', hint: '🦊 幻术的秘境' },
            { name: '岩岳石洞', icon: '🐻', locked: true, type: 'guyhome', guy: 'yanyue', hint: '🐻 熊族的石洞' },
            { name: '流云云巢', icon: '🦅', locked: true, type: 'guyhome', guy: 'liuyun', hint: '🦅 云端之巢' },
            { name: '巫医所', icon: '🐍', locked: true, type: 'guyhome', guy: 'moli', hint: '🐍 药香与秘密' }
        ],
        logs: [],
        currentTab: 'home',
        gameStarted: false,
        gameActive: true,
        currentTheme: 'sakura',
        autoSaveMode: 'never',
        _processingEvent: false,
        _pendingDailyEvents: [],
        pendingDate: null,
        dateHistory: [],
        npcInteractions: []
    };
}

export let state = defaultState();

// ========== 工具函数 ==========
export function getGuy(id) { return state.guys.find(g => g.id === id); }
export function getNPCs() { return state.npcs; }
export function getNPC(id) { return state.npcs.find(n => n.id === id); }

export function addNPC(npcData) {
    if (state.npcs.length >= MAX_NPC) return false;
    if (state.npcs.some(n => n.id === npcData.id)) return false;
    if (npcData.renameUnlocked === undefined) npcData.renameUnlocked = false;
    if (npcData.customName === undefined) npcData.customName = '';
    if (!npcData.relations) npcData.relations = [];
    state.npcs.push(npcData);
    if (!state.player.metNpcs.includes(npcData.id)) {
        state.player.metNpcs.push(npcData.id);
    }
    if (state.npcs.length > 1 && Math.random() < 0.2) {
        const others = state.npcs.filter(n => n.id !== npcData.id);
        if (others.length > 0) {
            const target = others[Math.floor(Math.random() * others.length)];
            const relTypes = ['朋友', '邻居', '旧识', '伙伴', '竞争对手'];
            const type = relTypes[Math.floor(Math.random() * relTypes.length)];
            npcData.relations.push({ targetId: target.id, type: type });
            if (!target.relations) target.relations = [];
            target.relations.push({ targetId: npcData.id, type: type });
            addLog(`📌 ${npcData.name}与${target.name}建立了${type}关系。`, null, 'npc');
        }
    }
    return true;
}

export function addLog(text, placeName = null, type = 'system') {
    const dateInfo = getDateInfo(state.player.day);
    const dateStr = `兽历${dateInfo.year}年 ${getSeason(dateInfo.month)} ${dateInfo.month}月${dateInfo.dayInMonth}日 ${dateInfo.weekName}`;
    state.logs.unshift({ time: dateStr, text, place: placeName, type: type || 'system' });
    if (state.logs.length > 80) {
        state.logs.pop();
    }
}

export function addWorldManual(text) {
    if (!state.worldManual.includes(text)) {
        state.worldManual.push(text);
        if (state.worldManual.length > 100) {
            state.worldManual.splice(0, state.worldManual.length - 100);
        }
    }
}

export function addCollectible(itemId) {
    if (!state.player.collectedItems.includes(itemId)) {
        state.player.collectedItems.push(itemId);
        return true;
    }
    return false;
}

export function hasCollectible(itemId) {
    return state.player.collectedItems.includes(itemId);
}

export function getCollectibleCount() {
    return state.player.collectedItems.length;
}

// ========== 任务系统 ==========
export function getQuestStatus(questId) {
    if (!state.player.quests[questId]) {
        state.player.quests[questId] = { accepted: false, completed: false, stepIndex: 0, guyId: null };
    }
    return state.player.quests[questId];
}

export function acceptQuest(questId, guyId) {
    const qs = getQuestStatus(questId);
    if (qs.accepted || qs.completed) return false;
    qs.accepted = true;
    qs.stepIndex = 0;
    if (guyId) qs.guyId = guyId;
    addLog(`📋 接取了任务：${questId}`, null, 'system');
    return true;
}

export function advanceQuestStep(questId) {
    const qs = getQuestStatus(questId);
    if (!qs.accepted || qs.completed) return false;
    qs.stepIndex++;
    return true;
}

export function completeQuest(questId) {
    const qs = getQuestStatus(questId);
    if (!qs.accepted || qs.completed) return false;
    qs.completed = true;
    if (!state.player.completedQuests.includes(questId)) {
        state.player.completedQuests.push(questId);
    }
    addLog(`✅ 完成任务：${questId}`, null, 'system');
    return true;
}

export function isQuestAccepted(questId) {
    return getQuestStatus(questId).accepted;
}

export function isQuestCompleted(questId) {
    return getQuestStatus(questId).completed;
}

export function getQuestStep(questId) {
    return getQuestStatus(questId).stepIndex;
}

export function getActiveQuest() {
    for (let qid in state.player.quests) {
        const qs = state.player.quests[qid];
        if (qs.accepted && !qs.completed) {
            return { questId: qid, stepIndex: qs.stepIndex, guyId: qs.guyId };
        }
    }
    return null;
}

// ========== 剧情事件系统 ==========
export function hasTriggeredStory(storyId) {
    return state.player.triggeredStories.includes(storyId);
}

export function markStoryTriggered(storyId) {
    if (!state.player.triggeredStories.includes(storyId)) {
        state.player.triggeredStories.push(storyId);
    }
}

export function hasTriggeredFestival(festivalId) {
    return state.player.festivalStories.includes(festivalId);
}

export function markFestivalTriggered(festivalId) {
    if (!state.player.festivalStories.includes(festivalId)) {
        state.player.festivalStories.push(festivalId);
    }
}

// ========== 地点排序 ==========
export function reorderPlaces() {
    const movedInId = state.player.movedIn;
    const home = state.places.find(p => p.name === '我家');
    state.places.forEach(p => { p.isMovedIn = false; });
    
    if (movedInId) {
        const guyHome = state.places.find(p => p.guy === movedInId && p.type === 'guyhome');
        if (guyHome) {
            const index = state.places.indexOf(guyHome);
            if (index > 1) {
                state.places.splice(index, 1);
                state.places.splice(1, 0, guyHome);
            }
            guyHome.isMovedIn = true;
            guyHome.locked = false;
        }
        if (home) home.locked = false;
    } else {
        if (home) home.locked = false;
    }
}

// ========== ★ 顶部栏更新（适配新三段式布局） ==========
export function updateTopBar() {
    const avatar = state.player.avatar;
    const headerAvatar = document.getElementById('headerAvatar');
    if (avatar && avatar.startsWith('data:image')) {
        headerAvatar.innerHTML = `<img src="${avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    } else {
        headerAvatar.textContent = avatar || '👧🏻';
    }
    document.getElementById('headerName').textContent = state.player.name;
    const dateInfo = getDateInfo(state.player.day);
    const season = getSeason(dateInfo.month);
    const seasonEmoji = getSeasonEmoji(dateInfo.month);
    // 日期显示在 headerDay
    document.getElementById('headerDay').textContent = `兽历${dateInfo.year}年 ${season} ${dateInfo.month}月${dateInfo.dayInMonth}日`;
    const timeNames = ['🌅 早晨', '☀️ 中午', '🌇 傍晚', '🌙 深夜'];
    document.getElementById('headerTime').textContent = `${seasonEmoji} ${timeNames[state.player.time]}`;
    const p = state.player;
    const hpPercent = Math.round((p.stats.health / p.maxHealth) * 100);
    document.getElementById('healthFill').style.width = hpPercent + '%';
    document.getElementById('healthText').textContent = p.stats.health + '/' + p.maxHealth;
    const goldEl = document.getElementById('headerGold');
    if (goldEl) {
        const isMovedIn = p.movedIn !== null;
        const foodDisplay = isMovedIn ? '（无需支付）' : `（每日需${DAILY_FOOD_COST}）`;
        goldEl.textContent = `💰${p.gold} ${foodDisplay}`;
    }
    updateEventIndicator();
}

// ========== ★ 事件指示器更新（适配新布局） ==========
export function updateEventIndicator() {
    const events = getTodayEvents(state.player.day);
    const el = document.getElementById('eventIndicator');
    if (el) {
        el.innerHTML = events.length ? `<span class="event-badge">${events[0].name}进行中</span>` : '';
    }
}

export function getCycleDay() { return ((state.player.day - 1) % 360) + 1; }
export function hasAnyDating() { return state.guys.some(g => g.dating); }

export function getTopGuy() {
    const u = state.guys.filter(g => !g.locked && g.affection > 50 && !g.banished);
    if (u.length === 0) return null;
    return u.reduce((a, b) => a.affection > b.affection ? a : b);
}

export function isPlayerBirthday(day) {
    const { month, dayInMonth } = getDateInfo(day);
    return month === state.player.birthMonth && dayInMonth === state.player.birthDay;
}

export function isGuyBirthday(guy, day) {
    const { month, dayInMonth } = getDateInfo(day);
    return month === guy.birthMonth && dayInMonth === guy.birthDay;
}

export function canGoOut() {
    const p = state.player;
    if (p.sick) return false;
    if (p.time === 3 && p.stats.health < 100) return false;
    if (p.isDead) return false;
    return true;
}

// ========== 存档 ==========
export function getSaveSlots() {
    const s = {};
    for (let i = 0; i < MAX_SLOTS; i++) {
        const r = localStorage.getItem(`beastLove_slot_${i}`);
        if (r) { try { s[i] = JSON.parse(r); } catch (e) {} }
    }
    return s;
}

export function saveToSlot(i) {
    const d = {
        player: JSON.parse(JSON.stringify(state.player)),
        guys: JSON.parse(JSON.stringify(state.guys)),
        places: JSON.parse(JSON.stringify(state.places)),
        logs: JSON.parse(JSON.stringify(state.logs.slice(0, 60))),
        npcs: JSON.parse(JSON.stringify(state.npcs)),
        relationshipMap: state.relationshipMap || {},
        pendingRelationships: state.pendingRelationships || {},
        worldManual: state.worldManual || [],
        dateHistory: JSON.parse(JSON.stringify((state.dateHistory || []).slice(0, 30))),
        day: state.player.day,
        time: state.player.time,
        gameStarted: state.gameStarted,
        gameActive: state.gameActive,
        currentTheme: state.currentTheme,
        autoSaveMode: state.autoSaveMode,
        saveNames: state.player.saveNames || {},
        heEndings: state.player.heEndings || [],
        quests: state.player.quests || {}
    };
    localStorage.setItem(`beastLove_slot_${i}`, JSON.stringify(d));
}

export function loadFromSlot(i) {
    const r = localStorage.getItem(`beastLove_slot_${i}`);
    if (!r) return false;
    try {
        const d = JSON.parse(r);
        state.player = d.player;
        state.guys = d.guys;
        state.places = d.places;
        state.logs = d.logs || [];
        state.npcs = d.npcs || [];
        state.relationshipMap = d.relationshipMap || {};
        state.pendingRelationships = d.pendingRelationships || {};
        state.worldManual = d.worldManual || [];
        state.dateHistory = d.dateHistory || [];
        state.gameStarted = d.gameStarted;
        state.gameActive = d.gameActive;
        state.autoSaveMode = d.autoSaveMode || 'never';
        if (d.saveNames) state.player.saveNames = d.saveNames;
        if (d.heEndings) state.player.heEndings = d.heEndings;
        if (d.quests) state.player.quests = d.quests;
        if (d.currentTheme) applyTheme(d.currentTheme);
        reorderPlaces();
        return true;
    } catch (e) { return false; }
}

export function applyTheme(tn) {
    const t = themes[tn];
    if (!t) return;
    state.currentTheme = tn;
    for (let [k, v] of Object.entries({ '--accent': t.primary, '--accent2': t.secondary, '--bg': t.bg, '--button': t.button, '--border': t.border })) {
        document.documentElement.style.setProperty(k, v);
    }
    localStorage.setItem('beastLove_theme', tn);
}

export function formatSlotInfo(d) {
    if (!d) return '空';
    const p = d.player;
    const dateInfo = getDateInfo(p.day || 1);
    const u = d.guys ? d.guys.filter(g => !g.locked).length : 0;
    const name = (d.saveNames && d.saveNames[Object.keys(d.saveNames)[0]]) ? d.saveNames[Object.keys(d.saveNames)[0]] : '';
    return `${name ? name + ' - ' : ''}兽历${dateInfo.year}年 ${getSeason(dateInfo.month)} | ${p.name} | 金币:${p.gold||0} | 已解锁:${u}`;
}

export function hasAnySave() {
    for (let i = 0; i < MAX_SLOTS; i++) if (localStorage.getItem(`beastLove_slot_${i}`)) return true;
    return false;
}