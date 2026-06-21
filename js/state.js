import { themes, TRIBAL_EVENTS } from './data.js';

export const MAX_SLOTS = 5;
export const timeNames = ['🌅 早晨', '☀️ 中午', '🌇 傍晚', '🌙 深夜'];
export const CYCLE_LENGTH = 30;  // 导出供其他模块使用

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
            actionCounts: {}
        },
        guys: [
            { id: 'cangye', name: '苍夜', emoji: '🐺', race: '霜月狼族', color: '#6b7fa8', affection: 0, obsession: 0, locked: true, injured: false, injuredDays: 0, dating: false, banished: false, proposed: false, heProposed: false, heRejectedDay: 0, obsessType: 'early', obsessActive: false, meetPlace: '月崖', cluePlace: '部落广场', personality: '对外威严寡言，内心孤独。尾巴会不经意圈住你。', background: '26岁，霜月狼族首领，左眼有一道细疤。', likes: '月光、烤肉、你的味道', ability: '夜视、呼唤狼群', petDetail: '银白巨狼，耳后根敏感。', sulkingDays: 0, sulkingTarget: null, hidden: false },
            { id: 'lieyang', name: '烈阳', emoji: '🐯', race: '赤金虎族', color: '#e08a3a', affection: 0, obsession: 0, locked: true, injured: false, injuredDays: 0, dating: false, banished: false, proposed: false, heProposed: false, heRejectedDay: 0, obsessType: 'late', obsessActive: false, meetPlace: '训练场', cluePlace: '训练场', personality: '直率热情，表达爱意直接。吃醋会生闷气。', background: '24岁，部落最强战士，狩猎队长。', likes: '晒太阳、摔跤、甜食', ability: '巨力、虎啸', petDetail: '猛虎，揉肉垫会呼噜。', sulkingDays: 0, sulkingTarget: null, hidden: false },
            { id: 'xuanyu', name: '玄羽', emoji: '🦊', race: '九尾玄狐', color: '#9b59b6', affection: 0, obsession: 0, locked: true, injured: false, injuredDays: 0, dating: false, banished: false, proposed: false, heProposed: false, heRejectedDay: 0, obsessType: 'early', obsessActive: false, meetPlace: '密林小径', cluePlace: '河边', personality: '喜欢逗弄你，以温柔方式展现占有欲。', background: '200+岁，最后的九尾狐，萨满祭司。', likes: '药草、古籍、你的反应', ability: '炼药、幻术', petDetail: '小黑狐，尾根敏感。', sulkingDays: 0, sulkingTarget: null, hidden: false },
            { id: 'yanyue', name: '岩岳', emoji: '🐻', race: '大地熊族', color: '#8B5A2B', affection: 0, obsession: 0, locked: true, injured: false, injuredDays: 0, dating: false, banished: false, proposed: false, heProposed: false, heRejectedDay: 0, obsessType: 'late', obsessActive: false, meetPlace: '铁匠铺', cluePlace: '铁匠铺', personality: '默默付出，不善言辞。冬天用兽形给你暖脚。', background: '28岁，部落唯一的铁匠。', likes: '蜂蜜、锻造、你的料理', ability: '怪力、金属加工', petDetail: '棕熊，最喜欢被摸肚子。', sulkingDays: 0, sulkingTarget: null, hidden: false },
            { id: 'liuyun', name: '流云', emoji: '🦅', race: '苍羽鹰族', color: '#5DADE2', affection: 0, obsession: 0, locked: true, injured: false, injuredDays: 0, dating: false, banished: false, proposed: false, heProposed: false, heRejectedDay: 0, obsessType: 'late', obsessActive: false, meetPlace: '哨塔', cluePlace: '训练场', personality: '嘴上嫌弃，却偷偷保护你。会圈地盘。', background: '22岁，独居哨塔的鹰族哨兵。', likes: '高处、宝石、夸奖', ability: '飞行、超远视力', petDetail: '苍鹰，羽冠敏感。', sulkingDays: 0, sulkingTarget: null, hidden: false },
            { id: 'moli', name: '墨漓', emoji: '🐍', race: '碧鳞蛇族', color: '#20B2AA', affection: 0, obsession: 0, locked: true, injured: false, injuredDays: 0, dating: false, banished: false, proposed: false, heProposed: false, heRejectedDay: 0, obsessType: 'early', obsessActive: false, meetPlace: '密林', cluePlace: '密林', personality: '神秘莫测，温柔中带着疏离。', background: '独居竹楼的巫医，来历不明。', likes: '草药、安宁、你的健康', ability: '精通医术与蛇毒', petDetail: '碧鳞大蛇，鳞片冰凉。', sulkingDays: 0, sulkingTarget: null, hidden: true, noInjure: true }
        ],
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
        _pendingDailyEvents: []
    };
}

export let state = defaultState();

export function getGuy(id) { return state.guys.find(g => g.id === id); }

export function addLog(text, placeName = null) {
    state.logs.unshift({ time: `第${state.player.day}天·${timeNames[state.player.time]}`, text, place: placeName });
    if (state.logs.length > 80) state.logs.length = 50;
}

export function updateTopBar() {
    document.getElementById('headerAvatar').textContent = state.player.avatar;
    document.getElementById('headerName').textContent = state.player.name;
    document.getElementById('headerDay').textContent = state.player.day;
    document.getElementById('headerTime').textContent = timeNames[state.player.time];
    const p = state.player;
    const hpPercent = Math.round((p.stats.health / p.maxHealth) * 100);
    document.getElementById('healthFill').style.width = hpPercent + '%';
    document.getElementById('healthText').textContent = p.stats.health + '/' + p.maxHealth;
    updateEventIndicator();
}

export function updateEventIndicator() {
    const events = getCurrentEvents();
    const el = document.getElementById('eventIndicator');
    if (el) el.innerHTML = events.length ? `<span class="event-badge">${events[0].name}进行中</span>` : '';
}

export function getCurrentEvents() {
    const cd = getCycleDay();
    return TRIBAL_EVENTS.filter(e => cd >= e.cycleStart && cd <= e.cycleEnd);
}

export function getCycleDay() { return ((state.player.day - 1) % CYCLE_LENGTH) + 1; }

export function hasAnyDating() { return state.guys.some(g => g.dating); }

export function getTopGuy() {
    const u = state.guys.filter(g => !g.locked && g.affection > 50 && !g.banished);
    if (u.length === 0) return null;
    return u.reduce((a, b) => a.affection > b.affection ? a : b);
}

export function canGoOut() {
    const p = state.player;
    if (p.sick) return false;
    if (p.time === 3 && p.stats.health < 100) return false;
    return true;
}

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
    const u = d.guys ? d.guys.filter(g => !g.locked).length : 0;
    return `第${d.day || p.day}天 ${timeNames[d.time || 0]} | ${p.name} | 已解锁男主:${u}`;
}

export function hasAnySave() {
    for (let i = 0; i < MAX_SLOTS; i++) if (localStorage.getItem(`beastLove_slot_${i}`)) return true;
    return false;
}