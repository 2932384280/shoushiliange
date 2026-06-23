// state.js - 完整版（含NPC系统、新地点、男主固定年龄）
import { themes, TRIBAL_EVENTS, NPC_POOL } from './data.js';

export const MAX_SLOTS = 5;
export const CYCLE_LENGTH = 360;
export const MAX_NPC = 20;

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

// ========== 年龄计算（直接返回固定年龄） ==========
export function getAge(character) {
    return character.age || 0; // 若无 age 字段则返回0
}

// ========== 活动系统 ==========
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
            birthdayGiftReceived: false,
            metNpcs: []
        },
        guys: [
            {
                id: 'cangye', name: '苍夜', emoji: '🐺', race: '霜月狼族', color: '#6b7fa8',
                age: 30, // 固定年龄
                avatar: 'img/avatars/cangye.jpg',
                affection: 0, obsession: 0, locked: true, injured: false, injuredDays: 0,
                dating: false, banished: false, proposed: false, heProposed: false, heRejectedDay: 0,
                obsessType: 'early', obsessActive: false, meetPlace: '月崖', cluePlace: '部落广场',
                personality: '对外威严寡言，内心孤独。尾巴会不经意圈住你。',
                background: '霜月狼族首领，左眼有一道细疤。',
                likes: '月光、烤肉、你的味道', ability: '夜视、呼唤狼群', petDetail: '银白巨狼，耳后根敏感。',
                sulkingDays: 0, sulkingTarget: null, hidden: false,
                lastInviteDay: 0, inviteCooldown: 5,
                birthMonth: 12, birthDay: 15,
                mainPlaces: ['月崖', '密林小径']
            },
            {
                id: 'lieyang', name: '烈阳', emoji: '🐯', race: '赤金虎族', color: '#e08a3a',
                age: 24,
                avatar: 'img/avatars/lieyang.jpg',
                affection: 0, obsession: 0, locked: true, injured: false, injuredDays: 0,
                dating: false, banished: false, proposed: false, heProposed: false, heRejectedDay: 0,
                obsessType: 'late', obsessActive: false, meetPlace: '训练场', cluePlace: '训练场',
                personality: '直率热情，表达爱意直接。吃醋会生闷气。',
                background: '24岁，部落最强战士，狩猎队长。',
                likes: '晒太阳、摔跤、甜食', ability: '巨力、虎啸', petDetail: '猛虎，揉肉垫会呼噜。',
                sulkingDays: 0, sulkingTarget: null, hidden: false,
                lastInviteDay: 0, inviteCooldown: 4,
                birthMonth: 6, birthDay: 21,
                mainPlaces: ['训练场', '部落广场']
            },
            {
                id: 'xuanyu', name: '玄羽', emoji: '🦊', race: '九尾玄狐', color: '#9b59b6',
                age: 200,
                avatar: 'img/avatars/xuanyu.jpg',
                affection: 0, obsession: 0, locked: true, injured: false, injuredDays: 0,
                dating: false, banished: false, proposed: false, heProposed: false, heRejectedDay: 0,
                obsessType: 'early', obsessActive: false, meetPlace: '密林小径', cluePlace: '河边',
                personality: '喜欢逗弄你，以温柔方式展现占有欲。',
                background: '200+岁，最后的九尾狐，萨满祭司。',
                likes: '药草、古籍、你的反应', ability: '炼药、幻术', petDetail: '小黑狐，尾根敏感。',
                sulkingDays: 0, sulkingTarget: null, hidden: false,
                lastInviteDay: 0, inviteCooldown: 6,
                birthMonth: 3, birthDay: 3,
                mainPlaces: ['密林小径', '河边']
            },
            {
                id: 'yanyue', name: '岩岳', emoji: '🐻', race: '大地熊族', color: '#8B5A2B',
                age: 28,
                avatar: 'img/avatars/yanyue.jpg',
                affection: 0, obsession: 0, locked: true, injured: false, injuredDays: 0,
                dating: false, banished: false, proposed: false, heProposed: false, heRejectedDay: 0,
                obsessType: 'late', obsessActive: false, meetPlace: '铁匠铺', cluePlace: '铁匠铺',
                personality: '默默付出，不善言辞。冬天用兽形给你暖脚。',
                background: '28岁，部落唯一的铁匠。',
                likes: '蜂蜜、锻造、你的料理', ability: '怪力、金属加工', petDetail: '棕熊，最喜欢被摸肚子。',
                sulkingDays: 0, sulkingTarget: null, hidden: false,
                lastInviteDay: 0, inviteCooldown: 5,
                birthMonth: 10, birthDay: 10,
                mainPlaces: ['铁匠铺', '市场']
            },
            {
                id: 'liuyun', name: '流云', emoji: '🦅', race: '苍羽鹰族', color: '#5DADE2',
                age: 22,
                avatar: 'img/avatars/liuyun.jpg',
                affection: 0, obsession: 0, locked: true, injured: false, injuredDays: 0,
                dating: false, banished: false, proposed: false, heProposed: false, heRejectedDay: 0,
                obsessType: 'late', obsessActive: false, meetPlace: '哨塔', cluePlace: '训练场',
                personality: '嘴上嫌弃，却偷偷保护你。会圈地盘。',
                background: '22岁，独居哨塔的鹰族哨兵。',
                likes: '高处、宝石、夸奖', ability: '飞行、超远视力', petDetail: '苍鹰，羽冠敏感。',
                sulkingDays: 0, sulkingTarget: null, hidden: false,
                lastInviteDay: 0, inviteCooldown: 4,
                birthMonth: 4, birthDay: 7,
                mainPlaces: ['哨塔', '月崖']
            },
            {
                id: 'moli', name: '墨漓', emoji: '🐍', race: '碧鳞蛇族', color: '#20B2AA',
                age: 1000,
                avatar: 'img/avatars/moli.jpg',
                affection: 0, obsession: 0, locked: true, injured: false, injuredDays: 0,
                dating: false, banished: false, proposed: false, heProposed: false, heRejectedDay: 0,
                obsessType: 'early', obsessActive: false, meetPlace: '密林', cluePlace: '密林',
                personality: '神秘莫测，温柔中带着疏离。',
                background: '独居竹楼的巫医，来历不明。',
                likes: '草药、安宁、你的健康', ability: '精通医术与蛇毒', petDetail: '碧鳞大蛇，鳞片冰凉。',
                sulkingDays: 0, sulkingTarget: null, hidden: true, noInjure: true,
                lastInviteDay: 0, inviteCooldown: 7,
                birthMonth: 8, birthDay: 8,
                mainPlaces: ['密林', '河边']
            }
        ],
        npcs: [],
        places: [
            { name: '我家', icon: '🏠', locked: false, type: 'home' },
            { name: '部落广场', icon: '🏛️', locked: false, type: 'public', unlockTarget: '月崖', exploreCount: 0, needCount: 3 },
            { name: '训练场', icon: '💪', locked: false, type: 'public', guy: 'lieyang', unlockTarget: '哨塔', exploreCount: 0, needCount: 3 },
            { name: '铁匠铺', icon: '🔨', locked: false, type: 'public', guy: 'yanyue' },
            { name: '河边', icon: '🌊', locked: false, type: 'public', unlockTarget: '密林小径', exploreCount: 0, needCount: 3 },
            { name: '市场', icon: '🛒', locked: false, type: 'public', unlockTarget: '萨满祭坛', exploreCount: 0, needCount: 3 },
            { name: '月崖', icon: '🌙', locked: true, type: 'public', guy: 'cangye' },
            { name: '萨满祭坛', icon: '🔮', locked: true, type: 'public' },
            { name: '哨塔', icon: '🗼', locked: true, type: 'public', guy: 'liuyun' },
            { name: '温泉', icon: '♨️', locked: true, type: 'public' },
            { name: '密林小径', icon: '🌿', locked: true, type: 'public', guy: 'xuanyu', unlockTarget: '密林', exploreCount: 0, needCount: 3 },
            { name: '密林', icon: '🌲', locked: true, type: 'public', guy: 'moli' },
            { name: '花田', icon: '🌺', locked: true, type: 'public', unlockTarget: null, exploreCount: 0, needCount: 0 },
            { name: '山涧瀑布', icon: '💧', locked: true, type: 'public', unlockTarget: null, exploreCount: 0, needCount: 0 },
            { name: '古树广场', icon: '🌳', locked: true, type: 'public', unlockTarget: null, exploreCount: 0, needCount: 0 },
            { name: '苍夜之窟', icon: '🐺', locked: true, type: 'guyhome', guy: 'cangye' },
            { name: '烈阳木屋', icon: '🐯', locked: true, type: 'guyhome', guy: 'lieyang' },
            { name: '玄羽幻香居', icon: '🦊', locked: true, type: 'guyhome', guy: 'xuanyu' },
            { name: '岩岳石洞', icon: '🐻', locked: true, type: 'guyhome', guy: 'yanyue' },
            { name: '流云云巢', icon: '🦅', locked: true, type: 'guyhome', guy: 'liuyun' },
            { name: '巫医所', icon: '🐍', locked: true, type: 'guyhome', guy: 'moli' }
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
    state.npcs.push(npcData);
    if (!state.player.metNpcs.includes(npcData.id)) {
        state.player.metNpcs.push(npcData.id);
    }
    return true;
}

export function addLog(text, placeName = null) {
    const dateInfo = getDateInfo(state.player.day);
    const dateStr = `兽历${dateInfo.year}年 ${getSeason(dateInfo.month)} ${dateInfo.month}月${dateInfo.dayInMonth}日 ${dateInfo.weekName}`;
    state.logs.unshift({ time: dateStr, text, place: placeName });
    if (state.logs.length > 80) state.logs.length = 50;
}

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
    document.getElementById('headerDay').textContent = `${dateInfo.year}年 ${season} ${dateInfo.month}月${dateInfo.dayInMonth}日 ${dateInfo.weekName}`;
    const timeNames = ['🌅 早晨', '☀️ 中午', '🌇 傍晚', '🌙 深夜'];
    document.getElementById('headerTime').textContent = `${seasonEmoji} ${timeNames[state.player.time]}`;
    const p = state.player;
    const hpPercent = Math.round((p.stats.health / p.maxHealth) * 100);
    document.getElementById('healthFill').style.width = hpPercent + '%';
    document.getElementById('healthText').textContent = p.stats.health + '/' + p.maxHealth;
    updateEventIndicator();
}

export function updateEventIndicator() {
    const events = getTodayEvents(state.player.day);
    const el = document.getElementById('eventIndicator');
    if (el) el.innerHTML = events.length ? `<span class="event-badge">${events[0].name}进行中</span>` : '';
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

// ========== 外出权限 ==========
export function canGoOut() {
    const p = state.player;
    if (p.sick) return false;
    if (p.time === 3 && p.stats.health < 100) return false;
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
        logs: JSON.parse(JSON.stringify(state.logs)),
        npcs: JSON.parse(JSON.stringify(state.npcs)),
        dateHistory: JSON.parse(JSON.stringify(state.dateHistory || [])),
        day: state.player.day,
        time: state.player.time,
        gameStarted: state.gameStarted,
        gameActive: state.gameActive,
        currentTheme: state.currentTheme,
        autoSaveMode: state.autoSaveMode
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
        state.dateHistory = d.dateHistory || [];
        state.gameStarted = d.gameStarted;
        state.gameActive = d.gameActive;
        state.autoSaveMode = d.autoSaveMode || 'never';
        if (d.currentTheme) applyTheme(d.currentTheme);
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
    return `兽历${dateInfo.year}年 ${getSeason(dateInfo.month)} | ${p.name} | 已解锁:${u}`;
}

export function hasAnySave() {
    for (let i = 0; i < MAX_SLOTS; i++) if (localStorage.getItem(`beastLove_slot_${i}`)) return true;
    return false;
}