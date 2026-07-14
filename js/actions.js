// actions.js - 完整版（集成男主剧情线、NPC剧情线、新地点、收藏品扩展）
import { state, getGuy, getNPCs, addNPC, addLog, updateTopBar, getTodayEvents, getTopGuy, hasAnyDating, canGoOut, saveToSlot, loadFromSlot, applyTheme, formatSlotInfo, hasAnySave, CYCLE_LENGTH, getDateInfo, getSeason, getSeasonEmoji, isHuntingSeason, isRainySeason, isGuyBirthday, isPlayerBirthday, getAge, MAX_NPC, reorderPlaces, DAILY_FOOD_COST, addCollectible, hasCollectible, getActiveQuest, isQuestAccepted, isQuestCompleted, completeQuest, acceptQuest, advanceQuestStep, getQuestStatus, getQuestStep, markStoryTriggered, hasTriggeredStory } from './state.js';
import { statInfo, beastWorldKnowledge, firstMeetStories, confessionStories, soulOathStories, imprisonmentStories, unrequitedStories, TRIBAL_EVENTS, DATE_CONTENTS, DEFAULT_DATE, NPC_INTERACTIONS, GUY_RELATIONSHIPS, FIRST_NAMES_MALE, FIRST_NAMES_FEMALE, LAST_NAMES, RACES, RACES_EMOJI, PERSONALITIES, APPEARANCES_MALE, APPEARANCES_FEMALE, IDENTITIES, ELDER_DATA, RELATION_TYPES, IDENTITY_AGE_REQUIREMENTS, getRelationDescription, COLLECTIBLES, GUY_STORY_EVENTS, NPC_STORY_EVENTS, ALL_ENDINGS, ACHIEVEMENTS, HIDDEN_ACHIEVEMENTS } from './data.js';
import { showToast, showGlobalModal, showNPCInteractionModal, showNPCFirstMeetModal, showNPCRescueModal, showNPCGiftModal, showGiftFromGuyModal } from './ui.js';
import { renderHome, renderPlaces, showActionResult, showNoGiftModal, openSaveLoadModal, showCantGoOutModal, renderGuyList, renderNPCList, render } from './render.js';
import { triggerDisaster, triggerRandomEvent, triggerHeartEvent, showCombinedEventModal, checkAndShowPendingDailyEvents, triggerNPCGuyInteraction, triggerGuyStoryEvent, triggerNPCmatchmaking } from './events.js';

// ========== ★ 男主支线任务（完整版） ==========
export const GUY_QUESTS = {
    cangye: [
        {
            id: 'cangye_quest_1',
            name: '🐺 狼族的信任',
            desc: '苍夜想让你认识狼群，但需要先获得狼群的认可。去月崖寻找狼群留下的印记。',
            steps: [
                { 
                    text: '前往月崖，在月光下寻找狼群的爪印（月崖探索3次）', 
                    action: '月崖', 
                    check: () => state.player.actionCounts['moon_cliff'] >= 3 
                }
            ],
            reward: { affection: 6, obsession: 2 },
            nextQuest: 'cangye_quest_2',
            unlockCondition: { affection: 20, day: 5 },
            location: '月崖',
            display: true
        },
        {
            id: 'cangye_quest_2',
            name: '🐺 月崖之约',
            desc: '苍夜约你在满月之夜到月崖相见。在周五（满月夜）前往月崖静坐赏月。',
            steps: [
                { 
                    text: '在周五（满月夜）前往月崖静坐赏月', 
                    action: '月崖', 
                    check: () => getDateInfo(state.player.day).weekDay === '周五' 
                }
            ],
            reward: { affection: 8, obsession: 3 },
            nextQuest: 'cangye_quest_3',
            unlockCondition: { questCompleted: 'cangye_quest_1' },
            location: '月崖',
            display: true
        },
        {
            id: 'cangye_quest_3',
            name: '🐺 狼王的礼物',
            desc: '苍夜想送你一件亲手制作的礼物，需要你帮他收集材料：在月崖探索时找到月光石。',
            steps: [
                { 
                    text: '在月崖探索，寻找月光石（探索时有概率获得）', 
                    action: '月崖', 
                    check: () => state.player.inventory.some(i => i.includes('月光石')) 
                }
            ],
            reward: { affection: 10, obsession: 4 },
            nextQuest: null,
            unlockCondition: { questCompleted: 'cangye_quest_2' },
            location: '月崖',
            display: true
        }
    ],
    lieyang: [
        {
            id: 'lieyang_quest_1',
            name: '🐯 最强战士的考验',
            desc: '烈阳想看看你的实力，邀请你进行一场训练比试。你需要体质达到25以上。',
            steps: [
                { 
                    text: '在训练场和烈阳比试（需要体质≥25）', 
                    action: '训练场', 
                    check: () => state.player.stats.endurance >= 25 
                }
            ],
            reward: { affection: 6, health: 10 },
            nextQuest: 'lieyang_quest_2',
            unlockCondition: { affection: 20, day: 3 },
            location: '训练场',
            display: true
        },
        {
            id: 'lieyang_quest_2',
            name: '🐯 狩猎的伙伴',
            desc: '烈阳想带你去狩猎，但需要准备一把好弓。在铁匠铺打造弓箭（需要15金币）。',
            steps: [
                { 
                    text: '前往铁匠铺打造弓箭（需要15金币）', 
                    action: '铁匠铺', 
                    check: () => state.player.gold >= 15 
                }
            ],
            reward: { affection: 8, gold: 10 },
            nextQuest: 'lieyang_quest_3',
            unlockCondition: { questCompleted: 'lieyang_quest_1' },
            location: '铁匠铺',
            display: true
        },
        {
            id: 'lieyang_quest_3',
            name: '🐯 虎族的祝福',
            desc: '烈阳想带你去月崖，在月光下接受虎族的祝福。在月崖静坐赏月2次。',
            steps: [
                { 
                    text: '和烈阳一起去月崖接受祝福（月崖静坐赏月累计2次）', 
                    action: '月崖', 
                    check: () => state.player.actionCounts['moon_cliff'] >= 2 
                }
            ],
            reward: { affection: 10, obsession: 4 },
            nextQuest: null,
            unlockCondition: { questCompleted: 'lieyang_quest_2' },
            location: '月崖',
            display: true
        }
    ],
    xuanyu: [
        {
            id: 'xuanyu_quest_1',
            name: '🦊 药草的指引',
            desc: '玄羽需要一种罕见的草药“夜光菌”，只有在密林深处才能找到。在密林采集草药时概率获得。',
            steps: [
                { 
                    text: '在密林寻找夜光菌（采集草药时概率获得）', 
                    action: '密林', 
                    check: () => state.player.inventory.some(i => i.includes('夜光菌')) 
                }
            ],
            reward: { affection: 6, talent: 3 },
            nextQuest: 'xuanyu_quest_2',
            unlockCondition: { affection: 25, day: 5 },
            location: '密林',
            display: true
        },
        {
            id: 'xuanyu_quest_2',
            name: '🦊 幻术的试炼',
            desc: '玄羽想教你幻术，但需要你证明自己有足够的直觉。在萨满祭坛学习知识提升直觉到30。',
            steps: [
                { 
                    text: '在萨满祭坛学习知识（直觉≥30）', 
                    action: '萨满祭坛', 
                    check: () => state.player.stats.intuition >= 30 
                }
            ],
            reward: { affection: 8, intuition: 5 },
            nextQuest: 'xuanyu_quest_3',
            unlockCondition: { questCompleted: 'xuanyu_quest_1' },
            location: '萨满祭坛',
            display: true
        },
        {
            id: 'xuanyu_quest_3',
            name: '🦊 九尾之誓',
            desc: '玄羽想带你去玄羽幻香居，展示他最后的秘密。需要先解锁玄羽幻香居。',
            steps: [
                { 
                    text: '前往玄羽幻香居（需先解锁该地点）', 
                    action: '玄羽幻香居', 
                    check: () => state.places.find(p => p.name === '玄羽幻香居')?.locked === false 
                }
            ],
            reward: { affection: 10, obsession: 4 },
            nextQuest: null,
            unlockCondition: { questCompleted: 'xuanyu_quest_2' },
            location: '玄羽幻香居',
            display: true
        }
    ],
    yanyue: [
        {
            id: 'yanyue_quest_1',
            name: '🐻 铁匠的学徒',
            desc: '岩岳想教你锻造基础，但需要先从河边取来淬火用的水。在河边抓鱼2次。',
            steps: [
                { 
                    text: '去河边取水（河边抓鱼累计2次）', 
                    action: '河边', 
                    check: () => state.player.actionCounts['fish'] >= 2 
                }
            ],
            reward: { affection: 6, talent: 3 },
            nextQuest: 'yanyue_quest_2',
            unlockCondition: { affection: 15, day: 4 },
            location: '河边',
            display: true
        },
        {
            id: 'yanyue_quest_2',
            name: '🐻 星铁的秘密',
            desc: '岩岳发现了一块陨铁，但需要你帮忙去市场找一位商人换取锻打工具（需要10金币）。',
            steps: [
                { 
                    text: '去市场寻找商人（需要10金币）', 
                    action: '市场', 
                    check: () => state.player.gold >= 10 
                }
            ],
            reward: { affection: 8, gold: 5 },
            nextQuest: 'yanyue_quest_3',
            unlockCondition: { questCompleted: 'yanyue_quest_1' },
            location: '市场',
            display: true
        },
        {
            id: 'yanyue_quest_3',
            name: '🐻 熊族的守护',
            desc: '岩岳想送你一件亲手打造的护甲，需要你陪他去月崖采集兽骨。',
            steps: [
                { 
                    text: '和岩岳一起去月崖采集兽骨（月崖静坐赏月1次）', 
                    action: '月崖', 
                    check: () => state.player.actionCounts['moon_cliff'] >= 1 
                }
            ],
            reward: { affection: 10, obsession: 4 },
            nextQuest: null,
            unlockCondition: { questCompleted: 'yanyue_quest_2' },
            location: '月崖',
            display: true
        }
    ],
    liuyun: [
        {
            id: 'liuyun_quest_1',
            name: '🦅 高处的视野',
            desc: '流云想让你体验飞行的感觉，但需要你先克服对高处的恐惧。在哨塔登高望远3次。',
            steps: [
                { 
                    text: '在哨塔登高望远（累计3次）', 
                    action: '哨塔', 
                    check: () => state.player.actionCounts['tower'] >= 3 
                }
            ],
            reward: { affection: 6, endurance: 3 },
            nextQuest: 'liuyun_quest_2',
            unlockCondition: { affection: 20, day: 6 },
            location: '哨塔',
            display: true
        },
        {
            id: 'liuyun_quest_2',
            name: '🦅 风中的信物',
            desc: '流云想送你一根飞羽，但需要你先找到一片完整的苍鹰羽毛。在月崖探索时概率获得。',
            steps: [
                { 
                    text: '在月崖寻找苍鹰羽毛（探索时概率获得）', 
                    action: '月崖', 
                    check: () => state.player.inventory.some(i => i.includes('羽毛')) 
                }
            ],
            reward: { affection: 8, charm: 3 },
            nextQuest: 'liuyun_quest_3',
            unlockCondition: { questCompleted: 'liuyun_quest_1' },
            location: '月崖',
            display: true
        },
        {
            id: 'liuyun_quest_3',
            name: '🦅 云巢之约',
            desc: '流云想带你去云巢看日出，这是他从未带任何人去过的地方。需要先解锁流云云巢。',
            steps: [
                { 
                    text: '前往流云云巢（需先解锁该地点）', 
                    action: '流云云巢', 
                    check: () => state.places.find(p => p.name === '流云云巢')?.locked === false 
                }
            ],
            reward: { affection: 10, obsession: 4 },
            nextQuest: null,
            unlockCondition: { questCompleted: 'liuyun_quest_2' },
            location: '流云云巢',
            display: true
        }
    ],
    moli: [
        {
            id: 'moli_quest_1',
            name: '🐍 药引之寻',
            desc: '墨漓需要一味罕见的药引“蛇涎果”，只在密林最深处的古树下生长。在密林采集时概率获得。',
            steps: [
                { 
                    text: '在密林寻找蛇涎果（采集时概率获得）', 
                    action: '密林', 
                    check: () => state.player.inventory.some(i => i.includes('蛇涎果')) 
                }
            ],
            reward: { affection: 6, health: 10 },
            nextQuest: 'moli_quest_2',
            unlockCondition: { affection: 20, day: 5 },
            location: '密林',
            display: true
        },
        {
            id: 'moli_quest_2',
            name: '🐍 碧鳞之血',
            desc: '墨漓想用他的血为你炼制一枚护身符，但需要你去河边取来清水。',
            steps: [
                { 
                    text: '去河边取水（河边抓鱼1次）', 
                    action: '河边', 
                    check: () => state.player.actionCounts['fish'] >= 1 
                }
            ],
            reward: { affection: 8, endurance: 3 },
            nextQuest: 'moli_quest_3',
            unlockCondition: { questCompleted: 'moli_quest_1' },
            location: '河边',
            display: true
        },
        {
            id: 'moli_quest_3',
            name: '🐍 蛇族的守护',
            desc: '墨漓想正式将你引入蛇族的庇护之下，需要你接受他的碧鳞印记。前往巫医所。',
            steps: [
                { 
                    text: '前往巫医所接受印记（需先解锁巫医所）', 
                    action: '巫医所', 
                    check: () => state.places.find(p => p.name === '巫医所')?.locked === false 
                }
            ],
            reward: { affection: 10, obsession: 4 },
            nextQuest: null,
            unlockCondition: { questCompleted: 'moli_quest_2' },
            location: '巫医所',
            display: true
        }
    ]
};

// ========== 防卡死锁 ==========
let _processingLock = false;
let _allHeEndingTriggered = false;

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
                    const modal = showGlobalModal(`<div class="global-overlay" id="caregiverModal"><div class="modal-box">${guy.emoji} ${guy.name} 轻轻为你擦去额头的汗，守了你一整夜。"别担心，我会一直陪着你。"<button class="btn" id="closeCaregiver" style="width:100%;margin-top:15px;">继续</button></div></div>`, 'caregiverModal');
                    if (window._caregiverTimer) clearTimeout(window._caregiverTimer);
                    modal.querySelector('#closeCaregiver').addEventListener('click', () => {
                        modal.remove();
                        window._caregiverShown = false;
                        if (window._caregiverTimer) {
                            clearTimeout(window._caregiverTimer);
                            window._caregiverTimer = null;
                        }
                    });
                    window._caregiverTimer = setTimeout(() => {
                        const existing = document.getElementById('caregiverModal');
                        if (existing) {
                            existing.remove();
                            window._caregiverShown = false;
                            window._caregiverTimer = null;
                        }
                    }, 30000);
                }
            }
        }
        p.sickDays--;
        if (p.sickDays <= 0) { p.sick = false; p.caregiver = null; addLog('你的病已经痊愈了！', null, 'system'); }
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
            if (tg) { p.caregiver = tg.id; addLog(`你因身体虚弱病倒了。${tg.name}主动来照顾你。`, null, 'system'); }
            else addLog('你病倒了，独自躺在小屋里……', null, 'system');
        }
    }

    state.guys.forEach(g => {
        if (g.injured && g.injuredDays > 0) { g.injuredDays--; if (g.injuredDays <= 0) { g.injured = false; addLog(`${g.name}的伤已经痊愈了。`, null, 'guy'); } }
        if (g.sulkingDays > 0) { g.sulkingDays--; if (g.sulkingDays <= 0) addLog(`${g.name}似乎不再生闷气了，愿意出来走动了。`, null, 'guy'); }
    });

    if (p.stats.health < 30 && !p.sick && !p.isDead && !p._moliTriggered) {
        p._moliTriggered = true;
        const moli = getGuy('moli');
        if (moli && !moli.banished) {
            if (moli.locked) {
                moli.locked = false;
                state.places.find(p => p.name === '巫医所').locked = false;
                p.stats.health = Math.min(p.maxHealth, p.stats.health + 30);
                addLog('💚 墨漓突然出现，为你救治，生命恢复30点。', null, 'guy');
                showFirstMeetModal(moli, { name: '某处' }, '墨漓救了你，生命恢复了30点。');
            } else {
                p.stats.health = Math.min(p.maxHealth, p.stats.health + 20);
                addLog('💚 墨漓为你调理气息，生命恢复20点。', null, 'guy');
                showToast('墨漓治愈了你。');
            }
        }
    }
}

// ========== ★ 触发男主剧情事件（完整4阶段） ==========
function triggerGuyStoryEventWithPhase(guy, placeName) {
    if (!guy || guy.locked || guy.banished) return;
    const stories = GUY_STORY_EVENTS[guy.id];
    if (!stories) return;
    
    const available = stories.filter(s => 
        guy.affection >= s.minAffection && 
        !hasTriggeredStory(s.id) &&
        (!s.locations || s.locations.includes(placeName))
    );
    if (available.length === 0) return;
    
    // 随机选一个可用事件
    const story = available[Math.floor(Math.random() * available.length)];
    // 概率控制：根据好感度阶段调整触发概率
    let triggerProb = 0.12;
    if (guy.affection >= 80) triggerProb = 0.20;
    else if (guy.affection >= 60) triggerProb = 0.16;
    else if (guy.affection >= 30) triggerProb = 0.10;
    if (Math.random() > triggerProb) return;
    
    markStoryTriggered(story.id);
    guy.affection = Math.min(100, guy.affection + story.gain);
    guy.obsession = Math.min(100, guy.obsession + story.obsessionGain);
    addLog(`💖 ${story.title}：${story.content.substring(0, 50)}...`, placeName, 'guy');
    
    const html = `<div class="global-overlay" id="storyEventModal">
        <div class="modal-box" style="max-width:600px;">
            <div style="font-weight:700;color:var(--accent);font-size:1.2em;">${story.title}</div>
            <div style="font-size:0.8em;color:var(--text2);margin-bottom:8px;">💕 好感度 ${guy.affection} · ${story.phase}期</div>
            <div style="margin:12px 0;line-height:1.8;white-space:pre-wrap;">${story.content}</div>
            <div style="color:var(--accent);">好感度 +${story.gain}，占有欲 +${story.obsessionGain}</div>
            <button class="btn" id="closeStoryEvent" style="width:100%;margin-top:12px;">继续</button>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'storyEventModal');
    modal.querySelector('#closeStoryEvent').addEventListener('click', () => modal.remove());
    
    // 检查是否触发成就
    checkAchievements();
}

// ========== ★ 触发NPC独立剧情线 ==========
function triggerNPCStoryEvent(npc, placeName) {
    if (!npc) return;
    const stories = NPC_STORY_EVENTS[npc.id];
    if (!stories) return;
    
    const available = stories.filter(s => 
        npc.favorability >= s.minFavorability && 
        !hasTriggeredStory(s.id)
    );
    if (available.length === 0) return;
    
    const story = available[Math.floor(Math.random() * available.length)];
    if (Math.random() > 0.15) return;
    
    markStoryTriggered(story.id);
    npc.favorability = Math.min(100, npc.favorability + story.gain + 1);
    addLog(`📜 ${story.title}：${story.content.substring(0, 40)}...`, placeName, 'npc');
    
    const html = `<div class="global-overlay" id="npcStoryModal">
        <div class="modal-box" style="max-width:500px;">
            <div style="font-weight:700;color:var(--accent2);font-size:1.1em;">${story.title}</div>
            <div style="display:flex;align-items:center;gap:8px;margin:8px 0;">
                <span style="font-size:2em;">${npc.emoji}</span>
                <span style="font-weight:600;">${npc.name}</span>
                <span style="font-size:0.8em;color:var(--text2);">友好值 ${npc.favorability}</span>
            </div>
            <div style="background:#fff5f8;border-radius:12px;padding:12px;border:1px solid var(--border);line-height:1.8;">
                ${story.content}
            </div>
            <div style="color:var(--accent2);margin-top:8px;">友好值 +${story.gain + 1}</div>
            <button class="btn" id="closeNpcStory" style="width:100%;margin-top:12px;">继续</button>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'npcStoryModal');
    modal.querySelector('#closeNpcStory').addEventListener('click', () => modal.remove());
}

// ========== 每日检查可接取任务 ==========
function checkAvailableQuests() {
    const day = state.player.day;
    for (let guyId in GUY_QUESTS) {
        const quests = GUY_QUESTS[guyId];
        const guy = getGuy(guyId);
        if (!guy || guy.locked || guy.banished) continue;
        for (let q of quests) {
            if (isQuestAccepted(q.id) || isQuestCompleted(q.id)) continue;
            let canAccept = true;
            let unlockReason = '';
            if (q.unlockCondition) {
                const cond = q.unlockCondition;
                if (cond.affection !== undefined && guy.affection < cond.affection) {
                    canAccept = false;
                    unlockReason = `好感度需达到 ${cond.affection}`;
                }
                if (cond.day !== undefined && day < cond.day) {
                    canAccept = false;
                    unlockReason = `需等到第 ${cond.day} 天`;
                }
                if (cond.questCompleted !== undefined && !isQuestCompleted(cond.questCompleted)) {
                    canAccept = false;
                    unlockReason = `需先完成前置任务`;
                }
            }
            if (canAccept) {
                acceptQuest(q.id, guyId);
                addLog(`📋 新任务可接取：${q.name}（地点：${q.location}）`, null, 'system');
                showToast(`📋 新任务：${q.name}，前往「${q.location}」开始。`);
            }
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
            addLog(`新的一天，生命恢复了${recoverAmount}点。`, null, 'system');

            const p = state.player;
            const isMovedIn = p.movedIn !== null;
            if (!isMovedIn) {
                if (p.gold >= DAILY_FOOD_COST) {
                    p.gold -= DAILY_FOOD_COST;
                    p.daysWithoutFood = 0;
                    addLog(`支付了今日的食物费用${DAILY_FOOD_COST}金币。`, null, 'system');
                } else {
                    p.daysWithoutFood++;
                    addLog(`💰 金币不足，无法支付食物费用（已持续${p.daysWithoutFood}天）！`, null, 'system');
                    if (p.daysWithoutFood === 1) {
                        showToast('⚠️ 金币不足！去部落广场、训练场等地「打工赚钱」可获取金币。');
                    }
                    if (p.daysWithoutFood >= 3 && p.daysWithoutFood < 5) {
                        if (p.stats.health > 20) {
                            p.stats.health = 20;
                            addLog('⚠️ 因长期饥饿，你的生命值骤降至20！', null, 'system');
                            showToast('⚠️ 你已虚弱不堪，生命值降为20！');
                        }
                    } else if (p.daysWithoutFood >= 5) {
                        p.isDead = true;
                        p.stats.health = 0;
                        addLog('💀 你因饥饿过度而倒下了……', null, 'system');
                        showDeathEnding();
                        updateTopBar();
                        _processingLock = false;
                        state._processingEvent = false;
                        return;
                    }
                }
            } else {
                addLog('🏠 与男主同居，他为你支付了今日的食物费用。', null, 'guy');
                p.daysWithoutFood = 0;
            }

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

            if (Math.random() < 0.1) triggerNPCGuyInteraction();

            checkAvailableQuests();

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

// ========== 关系网生成 ==========
export function buildRelationshipMapForGuy(guyId) {
    const guy = getGuy(guyId);
    if (!guy || guy.banished) return;
    if (state.pendingRelationships[guyId] && state.pendingRelationships[guyId].length > 0) return;
    
    const relationCount = 2 + Math.floor(Math.random() * 3);
    const availableTypes = [...RELATION_TYPES].filter(r => r.category !== 'romance');
    const usedTypes = new Set();
    const candidates = [];
    
    const friendTypes = availableTypes.filter(r => r.category === 'friend' || r.category === 'bond');
    if (friendTypes.length > 0) {
        const friendRel = friendTypes[Math.floor(Math.random() * friendTypes.length)];
        const npcData = generateRelationNPCData(guy, friendRel);
        if (npcData) {
            candidates.push(npcData);
            usedTypes.add(friendRel.type);
        }
    }
    
    for (let i = 0; i < relationCount && availableTypes.length > 0; i++) {
        const filtered = availableTypes.filter(r => !usedTypes.has(r.type) && r.category !== 'rival' && r.category !== 'romance');
        if (filtered.length === 0) break;
        const totalWeight = filtered.reduce((sum, t) => sum + t.weight, 0);
        let rand = Math.random() * totalWeight;
        let selectedIdx = 0;
        for (let j = 0; j < filtered.length; j++) {
            rand -= filtered[j].weight;
            if (rand <= 0) { selectedIdx = j; break; }
        }
        const relation = filtered[selectedIdx];
        const npcData = generateRelationNPCData(guy, relation);
        if (npcData) {
            candidates.push(npcData);
            usedTypes.add(relation.type);
        }
    }
    
    if (Math.random() < 0.2 && state.guys.length > 1) {
        const otherGuys = state.guys.filter(g => g.id !== guy.id && !g.banished);
        if (otherGuys.length > 0) {
            const rivalGuy = otherGuys[Math.floor(Math.random() * otherGuys.length)];
            const rivalRel = RELATION_TYPES.find(r => r.type === '情敌');
            if (rivalRel) {
                const npcData = generateRelationNPCData(rivalGuy, rivalRel);
                if (npcData) {
                    npcData.relationGuy = guy.id;
                    npcData.relationTag = guy.id + '_network';
                    npcData.relationDesc = `${npcData.name}是${guy.name}的情敌，因为${rivalGuy.name}的关系而产生了竞争。`;
                    candidates.push(npcData);
                }
            }
        }
    }
    if (candidates.length > 0) {
        state.pendingRelationships[guyId] = candidates;
    }
}

export function generateNPCRomance() {
    const npcs = state.npcs.filter(n => n.gender === '女' || n.gender === '男');
    if (npcs.length < 2) return;
    const eligible = npcs.filter(n => n.age >= 18 && n.age <= 45);
    if (eligible.length < 2) return;
    const males = eligible.filter(n => n.gender === '男');
    const females = eligible.filter(n => n.gender === '女');
    if (males.length === 0 || females.length === 0) return;
    const hasRomance = (npc1, npc2) => {
        if (!npc1.relations || !npc2.relations) return false;
        return npc1.relations.some(r => r.targetId === npc2.id && ['恋人', '暗恋对象', '青梅竹马'].includes(r.type)) ||
               npc2.relations.some(r => r.targetId === npc1.id && ['恋人', '暗恋对象', '青梅竹马'].includes(r.type));
    };
    if (Math.random() > 0.1) return;
    const male = males[Math.floor(Math.random() * males.length)];
    const female = females[Math.floor(Math.random() * females.length)];
    if (hasRomance(male, female)) return;
    if (Math.abs(male.age - female.age) > 15) return;
    const romanceTypes = ['恋人', '青梅竹马', '暗恋对象'];
    const type = romanceTypes[Math.floor(Math.random() * romanceTypes.length)];
    if (!male.relations) male.relations = [];
    if (!female.relations) female.relations = [];
    if (type === '暗恋对象') {
        if (Math.random() < 0.5) {
            male.relations.push({ targetId: female.id, type: '暗恋对象' });
            addLog(`💕 ${male.name}暗恋着${female.name}，但一直没有勇气表白。`, null, 'npc');
        } else {
            female.relations.push({ targetId: male.id, type: '暗恋对象' });
            addLog(`💕 ${female.name}暗恋着${male.name}，但一直没有勇气表白。`, null, 'npc');
        }
    } else {
        male.relations.push({ targetId: female.id, type: type });
        female.relations.push({ targetId: male.id, type: type });
        addLog(`💕 ${male.name}和${female.name}成为了${type}！`, null, 'npc');
    }
}

export function showFirstMeetModal(guy, place, logText, callback) {
    const htmlContent = `<div class="global-overlay" id="firstMeetModal"><div class="modal-box">${firstMeetStories[guy.id] || `<h2>初遇${guy.name}</h2><p>你第一次见到了${guy.name}。</p>`}<button class="btn" id="closeFirstMeet" style="width:100%;margin-top:15px;">继续</button></div></div>`;
    const modal = showGlobalModal(htmlContent, 'firstMeetModal');
    modal.querySelector('#closeFirstMeet').addEventListener('click', () => {
        modal.remove();
        state.gameActive = true;
        checkHealthStatus();
        advanceTime();
        updateTopBar();
        setTimeout(() => {
            showActionResult(logText, place);
        }, 100);
        if (typeof callback === 'function') {
            callback();
        }
    });
}

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
                <p style="font-size:0.95em;color:var(--text);line-height:1.8;">"${dateContent.title ? '我们一起去' + location + '吧，我有话想对你说。' : '可以陪我去' + location + '吗？' }"</p>
                <p style="font-size:0.8em;color:var(--text2);text-align:right;">—— ${guy.name}</p>
            </div>
            <div class="actions"><button class="btn" id="acceptDate" style="background:#ff4d6d;min-width:120px;">💕 答应他</button><button class="btn" id="rejectDate" style="min-width:120px;">💔 婉拒</button></div>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'dateInviteModal');
    modal.querySelector('#acceptDate').addEventListener('click', () => { modal.remove(); executeDate(guy, location, dateContent); });
    modal.querySelector('#rejectDate').addEventListener('click', () => { modal.remove(); addLog(`你婉拒了${guy.name}的约会邀请。`, null, 'guy'); showToast(`你婉拒了${guy.name}的邀请`); updateTopBar(); render(); });
}

function getAvailableDateLocations(guy) {
    const locations = ['部落广场', '河边', '月崖', '湖边', '果园', '观星台'];
    const guyLocations = {
        cangye: ['月崖', '苍夜之窟', '河边', '部落广场', '观星台'],
        lieyang: ['训练场', '烈阳木屋', '河边', '部落广场', '果园'],
        xuanyu: ['密林小径', '玄羽幻香居', '月崖', '河边', '湖边'],
        yanyue: ['铁匠铺', '岩岳石洞', '河边', '部落广场', '果园'],
        liuyun: ['哨塔', '流云云巢', '月崖', '河边', '观星台'],
        moli: ['密林', '巫医所', '河边', '月崖', '湖边']
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
    modal.querySelector('#closeDateResult').addEventListener('click', () => { modal.remove(); addLog(`你与${guy.name}在${location}约会了。`, location, 'guy'); updateTopBar(); render(); });
}

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
    
    // 触发NPC剧情线
    triggerNPCStoryEvent(npc, '部落广场');
}

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
        addLog(`🎂 ${npc.name}在你生日这天送来了礼物和 ${goldGift} 金币！`, null, 'npc');
        showNPCGiftModal(npc, `${giftText}<br>💰 额外获得 ${goldGift} 金币！`, gain);
    } else {
        addLog(`🎂 ${npc.name}在你生日这天送来了礼物！`, null, 'npc');
        showNPCGiftModal(npc, giftText, gain);
    }
}

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
        cangye: `"今天是你的生日，我特意为你准备了这份礼物。霜月狼族的传统，生日这天要送一件亲手制作的东西。"苍夜递给你一枚雕刻着狼头图腾的月光石吊坠，眼中带着罕见的温柔。"戴上它，就像我一直在你身边。"`,
        lieyang: `"生日快乐！我一大早就去山里打猎了，给你弄了最好的猎物！"烈阳扛着一头处理好的鹿，笑得眼睛都弯成了月牙。"今晚我烤肉给你吃，保证是部落第一！"`,
        xuanyu: `"生辰吉乐。"玄羽将一朵散发着幽蓝色光芒的花递到你面前。"这是我用百年灵力培育的'永夜花'，能在黑暗中为你指路。收下它，就像我把一部分灵力分给了你。"`,
        yanyue: `"给、给你的。"岩岳红着脸递给你一个精致的小木盒，打开是一枚用星铁打造的戒指。"我……我打了好几个晚上，希望你喜欢。生日快乐。"`,
        liuyun: `"听说今天是你生日。"流云站在你面前，别过头去，但翅膀却轻轻展开，从羽翼间落下一根泛着金光的飞羽。"这是鹰族的祝福之羽，能带来好运。我不太会说好听的话……但希望你开心。"`,
        moli: `"你这条小命，又长大了一岁。"墨漓从竹楼走出来，手中托着一枚碧绿色的药丸。"这是我用百年蛇蜕炼制的'碧寿丹'，能延年益寿。生日快乐，愿你长命百岁。"`
    };
    let giftText = giftMessages[guy.id] || `${guy.name}送给你一份精心准备的生日礼物！`;
    if (goldGift > 0) {
        giftText += `<br>💰 还悄悄塞给你 ${goldGift} 金币！`;
    }
    guy.affection = Math.min(100, guy.affection + affectionGain);
    state.player.guyBirthdayGiftReceived = true;
    if (goldGift > 0) {
        state.player.gold += goldGift;
        addLog(`🎂 ${guy.name}在你生日这天送来了礼物和 ${goldGift} 金币！好感度+${affectionGain}`, null, 'guy');
    } else {
        addLog(`🎂 ${guy.name}在你生日这天送来了礼物！好感度+${affectionGain}`, null, 'guy');
    }
    showGiftFromGuyModal(guy, giftText, affectionGain);
}

export function addAffectionAndObsession(guy, amount, triggerJealousy = true) {
    if (!guy || guy.locked || guy.banished) return;
    if (guy.heLocked) return;
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

function triggerConfession(guy) {
    const others = state.guys.filter(g => !g.locked && !g.banished && g.id !== guy.id && g.affection >= 70);
    const htmlContent = `<div class="global-overlay" id="confessionModal"><div class="modal-box">${confessionStories[guy.id] || `<h2>${guy.name}的告白</h2>`}<div class="actions"><button class="btn" id="acceptConfession" style="background:#ff4d6d;">💕 答应他</button><button class="btn" id="rejectConfession">💔 拒绝</button></div></div></div>`;
    const modal = showGlobalModal(htmlContent, 'confessionModal');
    modal.querySelector('#acceptConfession').addEventListener('click', () => { modal.remove(); acceptConfession(guy, others); });
    modal.querySelector('#rejectConfession').addEventListener('click', () => { modal.remove(); rejectConfession(guy); });
}

function acceptConfession(guy, others) {
    guy.dating = true;
    guy.affection = 100;
    state.player.movedIn = guy.id;
    state.gameActive = true;
    addLog(`💕 你接受了${guy.name}的告白，搬到了他的家中与他共同生活。`, null, 'guy');
    others.forEach(g => g.obsession = Math.min(100, g.obsession + 3 + Math.floor(Math.random() * 5)));
    reorderPlaces();
    updateTopBar();
    state.currentTab = 'home';
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('.nav-item[data-tab="home"]').classList.add('active');
    renderHome();

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
    addLog(`你婉拒了${guy.name}的告白，他的眼神黯淡了下去。`, null, 'guy');
    updateTopBar();
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
        cangye: '你成为了狼王的伴侣，在月崖之下与他共度余生。',
        lieyang: '你留在了木屋中，每天都有新鲜的猎物和温暖的阳光。',
        xuanyu: '你在幻香居中停止了时间，与他一起漫步于幻术与真实之间。',
        yanyue: '石洞中炉火不灭，他为你打造了无数小物件。',
        liuyun: '云巢之上，你与他共赏日升月落。',
        moli: '竹楼药香中，墨漓以血为引，守护你一生。'
    };
    document.getElementById('contentArea').innerHTML = `<div class="modal-overlay" id="endingOverlay"><div class="modal-box" style="text-align:center;"><div style="font-size:2em;">🔒</div><b>囚禁结局：${guy.name}的挚爱</b><p>${endingTexts[guy.id] || '你留在了他的身边。'}</p><div class="actions"><button class="btn" id="loadSaveEnding">📤 读档</button><button class="btn" id="restartEnding">🔄 重新开始</button></div></div></div>`;
    document.getElementById('loadSaveEnding').addEventListener('click', () => {
        document.getElementById('endingOverlay').remove();
        openSaveLoadModal();
    });
    document.getElementById('restartEnding').addEventListener('click', () => window.restartGame());
}

function escapePrison(guy, rescuer) {
    guy.banished = true; rescuer.affection = Math.min(100, rescuer.affection + 5); state.gameActive = true;
    unlockEnding('hidden_unrequited_' + guy.id);
    if (state.player.prisonRecord.length >= 4) unlockAchievement('flower_heart');
    checkAchievements();
    addLog(`${rescuer.name}将你从${guy.name}手中救出。${guy.name}从此不再见你。`, null, 'guy');
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
    modal.querySelector('#acceptOath').addEventListener('click', () => { modal.remove(); happyEnding(guy); });
    modal.querySelector('#rejectOath').addEventListener('click', () => {
        modal.remove();
        guy.heRejectedDay = state.player.day;
        state.gameActive = true;
        addLog(`你暂时拒绝了${guy.name}的灵魂契约。`, null, 'guy');
        updateTopBar();
        renderHome();
    });
}

function happyEnding(guy) {
    if (!state.player.heEndings.includes(guy.id)) {
        state.player.heEndings.push(guy.id);
    }
    guy.heLocked = true;
    
    const html = `
        <div class="global-overlay" id="heEndingModal">
            <div class="modal-box" style="text-align:center;">
                <div style="font-size:3em;">💞</div>
                <h2>与 ${guy.name} 的灵魂契约达成！</h2>
                <p>你们的灵魂已紧密相连，从此生死相依。</p>
                <p style="color:var(--accent);">${guy.name} 的好感度和占有欲已锁定，不再变化。</p>
                <div class="actions">
                    <button class="btn" id="heContinue">📖 继续冒险</button>
                    <button class="btn" id="heRestart" style="background:#ff4d6d;">🔄 重新开始</button>
                </div>
            </div>
        </div>
    `;
    const modal = showGlobalModal(html, 'heEndingModal');
    modal.querySelector('#heContinue').addEventListener('click', () => {
        modal.remove();
        state.gameActive = true;
        addLog(`💞 与 ${guy.name} 缔结了灵魂契约，好感度已锁定。`, null, 'system');
        checkAllHeEnding();
        updateTopBar();
        renderHome();
    });
    modal.querySelector('#heRestart').addEventListener('click', () => {
        modal.remove();
        if (confirm('确定重新开始？')) window.restartGame();
    });
}

function checkAllHeEnding() {
    if (_allHeEndingTriggered) return;
    const allGuys = state.guys.filter(g => !g.banished && !g.hidden);
    const allHe = allGuys.every(g => state.player.heEndings.includes(g.id));
    if (allHe && allGuys.length > 0) {
        _allHeEndingTriggered = true;
        triggerAllHeEnding();
    }
}

function triggerAllHeEnding() {
    const guys = state.guys.filter(g => !g.banished && !g.hidden);
    const names = guys.map(g => g.emoji + g.name).join('、');
    const html = `
        <div class="global-overlay" id="allHeEndingModal">
            <div class="modal-box" style="text-align:center;max-width:600px;">
                <div style="font-size:4em;">🏠</div>
                <h2 style="color:var(--accent);">"我只想给每个人一个家"</h2>
                <div style="background:#fff5f8;border-radius:12px;padding:16px;margin:12px 0;border:1px solid var(--border);">
                    <p style="font-size:1.1em;line-height:1.8;">
                        你与每一位男主都缔结了灵魂契约。<br>
                        他们虽然彼此之间曾有芥蒂，但都深爱着你。<br>
                        在月影部落的篝火旁，他们达成了和解，<br>
                        决定共同守护你，给你一个温暖的家。
                    </p>
                    <p style="color:var(--accent);">❤️ ${names} ❤️</p>
                    <p style="font-size:0.9em;color:var(--text2);">"我们愿意为了你，放下一切争执。"—— 众人齐声说。</p>
                </div>
                <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:15px;">
                    <button class="btn" id="allHeContinue" style="flex:1;min-width:120px;background:var(--accent);">📖 继续游戏</button>
                    <button class="btn" id="allHeRestart" style="flex:1;min-width:120px;background:#ff4d6d;">🔄 重新开始</button>
                </div>
            </div>
        </div>
    `;
    const modal = showGlobalModal(html, 'allHeEndingModal');
    const continueBtn = modal.querySelector('#allHeContinue');
    const restartBtn = modal.querySelector('#allHeRestart');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            modal.remove();
            addLog('🏠 达成了最终结局"我只想给每个人一个家"！所有男主和谐相处。', null, 'system');
            updateTopBar();
            renderHome();
        });
    }
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            modal.remove();
            if (confirm('确定重新开始？')) window.restartGame();
        });
    }
}

export function getMeetProbability(guy) {
    if (!guy || guy.locked || guy.banished) return 0;
    const isHunting = isHuntingSeason(state.player.day);
    let base = 0.3;
    base += Math.min(guy.affection, 100) * 0.003;
    if (isHunting) base *= 0.7;
    if (guy.dating || state.player.movedIn === guy.id) base = Math.min(1, base + 0.3);
    return Math.min(1, Math.max(0.3, base));
}

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
        relationTag: relationTag,
        relations: []
    };
}

function generateRelationNPCData(guy, relation) {
    let gender = '男';
    if (relation.gender === 'female') {
        gender = '女';
    } else if (relation.gender === 'opposite') {
        gender = '男';
    } else if (relation.gender === 'any') {
        gender = Math.random() < 0.5 ? '男' : '女';
    } else {
        gender = Math.random() < 0.5 ? '男' : '女';
    }
    const isFamily = relation.category === 'family';
    const firstNamePool = gender === '男' ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE;
    const firstName = firstNamePool[Math.floor(Math.random() * firstNamePool.length)];
    const lastName = isFamily ? (guy.name.slice(0, 1) + '氏') : LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const fullName = lastName + firstName;
    const race = isFamily ? guy.race : RACES[Math.floor(Math.random() * RACES.length)];
    const emoji = RACES_EMOJI[race] || '🐾';
    let age = 0;
    const guyAge = guy.age || 30;
    switch (relation.type) {
        case '父亲':
        case '母亲':
            age = guyAge + 20 + Math.floor(Math.random() * 16);
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
            age = guyAge + 16 + Math.floor(Math.random() * 20);
            break;
        case '伯父':
        case '伯母':
            age = guyAge + 20 + Math.floor(Math.random() * 26);
            break;
        case '祖父':
        case '祖母':
            age = guyAge + 40 + Math.floor(Math.random() * 21);
            break;
        case '挚友':
        case '死党':
        case '闺蜜':
        case '知己':
        case '损友':
        case '玩伴':
        case '恩师':
        case '学徒':
        case '盟友':
        case '邻居':
        case '合作伙伴':
        case '兄弟':
            const ageDiff = 3 + Math.floor(Math.random() * 8);
            if (Math.random() < 0.5) {
                age = Math.max(18, guyAge - ageDiff);
            } else {
                age = guyAge + ageDiff;
            }
            age = Math.max(18, Math.min(60, age));
            break;
        case '情敌':
        case '宿敌':
            age = Math.max(18, guyAge - 2 + Math.floor(Math.random() * 10));
            age = Math.min(60, age);
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
    const favorability = 15 + Math.floor(Math.random() * 25);
    const relationDesc = getRelationDescription(relation.type, guy.name, fullName, gender === '女' ? '女' : '男');
    let metPlace = '部落';
    if (relation.type === '父亲' || relation.type === '母亲' || relation.type === '哥哥' || relation.type === '姐姐' ||
        relation.type === '弟弟' || relation.type === '妹妹' || relation.type === '叔叔' || relation.type === '姑姑' ||
        relation.type === '伯父' || relation.type === '伯母' || relation.type === '祖父' || relation.type === '祖母') {
        metPlace = guy.mainPlaces ? guy.mainPlaces[Math.floor(Math.random() * guy.mainPlaces.length)] : '部落广场';
    } else if (relation.category === 'friend' || relation.category === 'bond') {
        metPlace = guy.mainPlaces ? guy.mainPlaces[Math.floor(Math.random() * guy.mainPlaces.length)] : '部落广场';
    } else if (relation.category === 'social') {
        metPlace = guy.mainPlaces ? guy.mainPlaces[Math.floor(Math.random() * guy.mainPlaces.length)] : '市场';
    } else {
        metPlace = '部落广场';
    }
    return {
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
        metPlace: metPlace,
        relationType: relation.type,
        relationGuy: guy.id,
        relationTag: guy.id + '_network',
        relationDesc: relationDesc,
        relations: []
    };
}

export function buildRelationshipMap() {
    const map = {};
    for (let guy of state.guys) {
        if (guy.banished) continue;
        if (state.pendingRelationships[guy.id] && state.pendingRelationships[guy.id].length > 0) continue;
        const relationCount = 1 + Math.floor(Math.random() * 2);
        const availableTypes = [...RELATION_TYPES].filter(r => r.category !== 'romance');
        const candidates = [];
        for (let i = 0; i < relationCount && availableTypes.length > 0; i++) {
            const totalWeight = availableTypes.reduce((sum, t) => sum + t.weight, 0);
            let rand = Math.random() * totalWeight;
            let selectedIdx = 0;
            for (let j = 0; j < availableTypes.length; j++) {
                rand -= availableTypes[j].weight;
                if (rand <= 0) { selectedIdx = j; break; }
            }
            const relation = availableTypes.splice(selectedIdx, 1)[0];
            const npcData = generateRelationNPCData(guy, relation);
            if (npcData) {
                candidates.push(npcData);
            }
        }
        if (candidates.length > 0) {
            state.pendingRelationships[guy.id] = candidates;
        }
    }
    state.relationshipMap = map;
    setTimeout(() => {
        generateNPCRomance();
    }, 500);
    return map;
}

function tryMeetRelationshipNPC(placeName) {
    for (let guyId in state.pendingRelationships) {
        const candidates = state.pendingRelationships[guyId];
        if (!candidates || candidates.length === 0) continue;
        const matched = candidates.filter(npc => npc.metPlace === placeName);
        if (matched.length === 0) continue;
        const index = candidates.indexOf(matched[0]);
        const npcData = candidates.splice(index, 1)[0];
        const id = 'rel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        const npc = {
            id: id,
            ...npcData
        };
        addNPC(npc);
        if (!state.relationshipMap) state.relationshipMap = {};
        state.relationshipMap[id] = guyId;
        addLog(`你遇到了 ${npc.emoji} ${npc.name}（${npc.identity}）。${npc.appearance} 看起来${npc.personality}。`, placeName, 'npc');
        showToast(`💬 你遇到了 ${npc.name}，ta是${getGuy(guyId)?.name}的${npc.relationType}`);
        return true;
    }
    return false;
}

function tryCollectCollectible(place) {
    const placeName = place.name;
    const collectibles = COLLECTIBLES[placeName];
    if (!collectibles) return false;
    if (Math.random() > 0.15) return false;
    const available = collectibles.filter(c => !hasCollectible(c.id));
    if (available.length === 0) return false;
    const picked = available[Math.floor(Math.random() * available.length)];
    addCollectible(picked.id);
    addLog(`🏺 发现收藏品【${picked.name}】${picked.desc}`, placeName, 'system');
    showToast(`🏺 获得收藏品：${picked.name}`);
    // 检查收藏品成就
    checkAchievements();
    return true;
}

function checkQuestProgress(place, action) {
    const active = getActiveQuest();
    if (!active) return;
    const questData = GUY_QUESTS[active.guyId]?.find(q => q.id === active.questId);
    if (!questData) return;
    const step = questData.steps[active.stepIndex];
    if (!step) return;
    const isCorrectAction = step.action === place.name;
    if (!isCorrectAction) {
        const hasShown = localStorage.getItem('quest_hint_' + active.questId);
        if (!hasShown) {
            showToast(`💡 当前任务需要在「${step.action}」进行`);
            localStorage.setItem('quest_hint_' + active.questId, 'true');
        }
        return;
    }
    let conditionMet = true;
    if (step.check && typeof step.check === 'function') {
        try {
            conditionMet = step.check();
        } catch (e) {
            console.warn('任务条件检查异常:', e);
            conditionMet = false;
        }
    }
    if (!conditionMet) {
        let hint = '条件尚未满足';
        if (step.text) {
            const match = step.text.match(/（(.+?)）/);
            if (match) hint = match[1];
        }
        showToast(`⚠️ ${hint}，请继续努力`);
        return;
    }
    advanceQuestStep(active.questId);
    addLog(`📋 任务进度更新：${questData.name} - ${step.text} ✅ 已完成`, place.name, 'system');
    showToast(`✅ 任务进度更新：${step.text} 已完成`);
    const qs = getQuestStatus(active.questId);
    if (qs.stepIndex >= questData.steps.length) {
        completeQuest(active.questId);
        const reward = questData.reward;
        let rewardText = '';
        if (reward.affection) {
            const guy = getGuy(active.guyId);
            if (guy) addAffectionAndObsession(guy, reward.affection);
            rewardText += `💕 好感 +${reward.affection} `;
        }
        if (reward.health) {
            state.player.stats.health = Math.min(state.player.maxHealth, state.player.stats.health + reward.health);
            rewardText += `❤️ 生命 +${reward.health} `;
        }
        if (reward.gold) {
            state.player.gold += reward.gold;
            rewardText += `💰 金币 +${reward.gold} `;
        }
        if (reward.obsession) rewardText += `🔒 占有欲 +${reward.obsession} `;
        if (reward.intuition) { state.player.stats.intuition = Math.min(100, state.player.stats.intuition + reward.intuition); rewardText += `🔮 直觉 +${reward.intuition} `; }
        if (reward.talent) { state.player.stats.talent = Math.min(100, state.player.stats.talent + reward.talent); rewardText += `🎨 才艺 +${reward.talent} `; }
        if (reward.endurance) { state.player.stats.endurance = Math.min(100, state.player.stats.endurance + reward.endurance); rewardText += `🛡️ 体质 +${reward.endurance} `; }
        if (reward.charm) { state.player.stats.charm = Math.min(100, state.player.stats.charm + reward.charm); rewardText += `💖 魅力 +${reward.charm} `; }
        addLog(`✅ 完成任务：${questData.name}，获得奖励！`, null, 'system');
        const completeHtml = `<div class="global-overlay" id="questCompleteModal">
            <div class="modal-box" style="text-align:center;max-width:500px;">
                <div style="font-size:3em;margin-bottom:8px;">🎉</div>
                <h2 style="color:var(--accent);">任务完成！</h2>
                <div style="font-size:1.2em;font-weight:700;margin:8px 0;">${questData.name}</div>
                <div style="background:#fff5f8;border-radius:12px;padding:12px;border:1px solid var(--border);line-height:2;">
                    <p>${questData.desc}</p>
                    <p style="color:var(--accent);font-weight:700;">🏆 奖励：${rewardText || '无'}</p>
                </div>
                <button class="btn" id="closeQuestComplete" style="width:100%;margin-top:12px;">太好了！</button>
            </div>
        </div>`;
        const modal = showGlobalModal(completeHtml, 'questCompleteModal');
        modal.querySelector('#closeQuestComplete').addEventListener('click', () => modal.remove());
        if (questData.nextQuest) {
            const next = GUY_QUESTS[active.guyId]?.find(q => q.id === questData.nextQuest);
            if (next) {
                acceptQuest(next.id, active.guyId);
                addLog(`📋 新任务已自动接取：${next.name} - ${next.desc}`, null, 'system');
                showToast(`📋 新任务已接取：${next.name}`);
            }
        }
        localStorage.removeItem('quest_hint_' + active.questId);
        checkAchievements();
    }
}

// ========== 核心探索函数 ==========
export function resolveExplore(place, action) {
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

    const workActions = ['💼打工赚钱', '🔨帮忙锻造', '🧹打扫卫生', '📦搬运货物'];
    if (workActions.includes(action) && place.type === 'public') {
        const goldEarn = 3 + Math.floor(Math.random() * 6);
        state.player.gold += goldEarn;
        const statKeys = ['charm', 'intuition', 'endurance', 'talent', 'affinity'];
        const statKey = statKeys[Math.floor(Math.random() * statKeys.length)];
        stats[statKey] = Math.min(100, stats[statKey] + 1);
        addLog(`你打工赚了 ${goldEarn} 金币，${statInfo[statKey]?.name || statKey} +1。`, place.name, 'player');
        showToast(`💰 赚了 ${goldEarn} 金币！`);
        checkHealthStatus();
        updateTopBar();
        const resultText = `你通过打工赚取了 ${goldEarn} 金币。`;
        showActionResult(resultText, place);
        return resultText;
    }

    if (action === '💊 出售草药') {
        const herbKeywords = ['🌿止血草', '🍄夜光菌', '🌸安神花', '🌱蛇涎果', '🍂枯荣叶'];
        const herbIndex = state.player.inventory.findIndex(item => herbKeywords.includes(item));
        if (herbIndex === -1) {
            const msg = '你没有可出售的草药。💡 可前往「密林」或「密林小径」采集草药。';
            addLog(msg, place.name, 'player');
            showToast('❌ 背包中没有可出售的草药');
            return msg;
        } else {
            const herb = state.player.inventory[herbIndex];
            const price = 2 + Math.floor(Math.random() * 4);
            state.player.gold += price;
            state.player.inventory.splice(herbIndex, 1);
            const msg = `你出售了${herb}，获得 ${price} 金币。`;
            addLog(msg, place.name, 'player');
            showToast(`💰 出售${herb}获得 ${price} 金币`);
            updateTopBar();
            return msg;
        }
    }

    if (action.startsWith('🎲 ')) {
        const et = action.replace('🎲 ', '');
        if (et.includes('发现奇怪的东西')) { stats.intuition = Math.min(100, stats.intuition + 1); addLog('你发现了一块发光的石头，直觉提升了。', place.name, 'player'); }
        else if (et.includes('小鸟')) { stats.charm = Math.min(100, stats.charm + 1); addLog('和小鸟玩耍，魅力微增。', place.name, 'player'); }
        else if (et.includes('包裹')) { stats.talent = Math.min(100, stats.talent + 1); addLog('包裹里有草药，才艺微升。', place.name, 'player'); }
        else if (et.includes('打个盹')) { stats.health = Math.min(state.player.maxHealth, stats.health + 15); addLog('小睡片刻，生命恢复了少许。', place.name, 'player'); }
        else if (et.includes('搭话')) { stats.affinity = Math.min(100, stats.affinity + 1); addLog('与路人聊天，亲和力微增。', place.name, 'player'); }
        else addLog('你进行了一次随机的探索。', place.name, 'player');
    } else if (place.name === '密林') {
        if (action === '🔍深入探索') { stats.intuition = Math.min(100, stats.intuition + 1); addLog('你在密林深处仔细探索，对这片神秘森林有了更深的理解。', place.name, 'player'); state.player.actionCounts['forest'] = (state.player.actionCounts['forest'] || 0) + 1; }
        else if (action === '🍀寻找草药') {
            const herbs = ['🌿止血草', '🍄夜光菌', '🌸安神花', '🌱蛇涎果', '🍂枯荣叶'];
            const found = herbs[Math.floor(Math.random() * herbs.length)];
            state.player.inventory.push(found);
            stats.talent = Math.min(100, stats.talent + 1);
            const isFirstHerb = (state.player.actionCounts['herb'] || 0) === 0;
            let logMsg = `你找到了珍稀草药【${found}】，才艺提升了。`;
            if (isFirstHerb) {
                logMsg += ` 💡 采集到的草药可以在市集「出售草药」换取金币！`;
            }
            addLog(logMsg, place.name, 'player');
            state.player.actionCounts['herb'] = (state.player.actionCounts['herb'] || 0) + 1;
            showToast(`🌿 获得了 ${found}！${isFirstHerb ? ' 💡可在市集出售' : ''}`);
        } else if (action === '📦搜寻宝藏') {
            if (Math.random() < 0.5) {
                const treasures = ['💎宝石', '📜古老卷轴', '🪙金币', '🔮灵珠'];
                const treasure = treasures[Math.floor(Math.random() * treasures.length)];
                state.player.inventory.push(treasure);
                if (treasure === '🪙金币') {
                    const goldFound = 5 + Math.floor(Math.random() * 10);
                    state.player.gold += goldFound;
                    addLog(`你发现了一袋金币！获得 ${goldFound} 金币。`, place.name, 'player');
                } else {
                    addLog(`你发现了一个隐藏的宝箱，获得了${treasure}！`, place.name, 'player');
                }
            } else addLog('你翻遍了灌木丛，只找到一些普通的石头。', place.name, 'player');
        }
        if (Math.random() < getDeepForestInjuryProb()) { const dmg = 15 + Math.floor(Math.random() * 15); stats.health = Math.max(0, stats.health - dmg); addLog(`密林中的野兽突然袭击了你，生命值减少了${dmg}点！`, place.name, 'system'); }
    } else {
        let eventHandled = false;
        for (let ev of events) {
            if (ev.effects?.placeBoosts?.[place.name]) {
                const boost = ev.effects.placeBoosts[place.name];
                if (boost.actions && boost.actions.includes(action)) {
                    if (action === '🎉 参加庆典') { stats.affinity = Math.min(100, stats.affinity + 3); stats.charm = Math.min(100, stats.charm + 1); addLog('你参加了庆典，与大家载歌载舞，亲和与魅力提升了！', place.name, 'player'); eventHandled = true; }
                    else if (action === '🙏 参与祭祀') { stats.intuition = Math.min(100, stats.intuition + 3); stats.endurance = Math.min(100, stats.endurance + 2); addLog('你虔诚地参与了祭祀之礼，直觉与体质获得了提升！', place.name, 'player'); eventHandled = true; }
                    else if (action === '🛍️ 逛春市') { if (Math.random() < 0.6) { state.player.inventory.push('🌱神奇种子'); addLog('你在春市上买到了一包神奇种子！', place.name, 'player'); } else { state.player.inventory.push('🌸花环'); addLog('你买到了一个漂亮的花环。', place.name, 'player'); } eventHandled = true; }
                    else if (action === '🌾 参与春耕祭') { stats.talent = Math.min(100, stats.talent + 2); stats.affinity = Math.min(100, stats.affinity + 1); addLog('你参与了春耕祭，与兽人们一起播种希望。', place.name, 'player'); eventHandled = true; }
                    else if (action === '🏋️ 参加力量赛') { stats.endurance = Math.min(100, stats.endurance + 3); stats.charm = Math.min(100, stats.charm + 1); addLog('你在力量赛中表现出色，获得了大家的喝彩！', place.name, 'player'); eventHandled = true; }
                    else if (action === '🔥 祈火仪式') { state.player.inventory.push('🔥火灵护符'); addLog('你参与了祈火仪式，获得了火灵护符。', place.name, 'player'); eventHandled = true; }
                    else if (action === '🍉 购买夏季特产') { if (Math.random() < 0.5) { state.player.stats.health = Math.min(state.player.maxHealth, state.player.stats.health + 15); addLog('你吃了清凉果，生命恢复了15点！', place.name, 'player'); } else { state.player.inventory.push('🌿草帽'); addLog('你买了一顶漂亮的草帽。', place.name, 'player'); } eventHandled = true; }
                    else if (action === '💧 祈雨') { stats.intuition = Math.min(100, stats.intuition + 2); stats.affinity = Math.min(100, stats.affinity + 1); addLog('你向雨神祈求甘霖，兽人们都对你充满感激。', place.name, 'player'); eventHandled = true; }
                    else if (action === '🔮 祈福') { stats.intuition = Math.min(100, stats.intuition + 2); state.player.inventory.push('🪶猎运符'); addLog('你向兽神祈福，获得了猎运符，本月的狩猎将更加顺利！', place.name, 'player'); eventHandled = true; }
                    else if (action === '🚩 送行') { stats.affinity = Math.min(100, stats.affinity + 2); addLog('你为出征的猎人们送行，他们感动地向你挥手致意。', place.name, 'player'); eventHandled = true; }
                    else if (action === '🌀 安抚雨神') { stats.intuition = Math.min(100, stats.intuition + 2); stats.talent = Math.min(100, stats.talent + 1); addLog('你在河畔举行安抚仪式，暴雨似乎减弱了一些。', place.name, 'player'); eventHandled = true; }
                    else if (action === '🍗 参加宴席') { stats.health = Math.min(state.player.maxHealth, stats.health + 15); stats.affinity = Math.min(100, stats.affinity + 2); addLog('你在猎归宴上大快朵颐，心情愉悦，生命恢复了15点！', place.name, 'player'); eventHandled = true; }
                    else if (action === '🪓 打造冬具') { state.player.inventory.push('🧤防寒手套'); stats.talent = Math.min(100, stats.talent + 1); addLog('你在铁匠铺打造了防寒手套，为过冬做好了准备。', place.name, 'player'); eventHandled = true; }
                    else if (action === '🕯️ 祭祖') { stats.intuition = Math.min(100, stats.intuition + 3); stats.endurance = Math.min(100, stats.endurance + 1); addLog('你参加了冬至祭祖仪式，感受到了先祖的庇佑。', place.name, 'player'); eventHandled = true; }
                    else if (action === '🔥 守岁') { Object.keys(stats).forEach(k => stats[k] = Math.min(100, stats[k] + 1)); stats.health = Math.min(state.player.maxHealth, stats.health + 1); addLog('你与兽人们一起守岁，在篝火中迎来了新年，全属性+1！', place.name, 'player'); eventHandled = true; }
                    else if (action === '🧤 购买冬货') { if (Math.random() < 0.5) { state.player.inventory.push('🧣羊毛围巾'); addLog('你买了一条温暖的羊毛围巾。', place.name, 'player'); } else { state.player.inventory.push('🧤毛皮手套'); addLog('你买了一副毛皮手套。', place.name, 'player'); } eventHandled = true; }
                    else if (action === '⛄ 玩雪') { stats.charm = Math.min(100, stats.charm + 2); stats.affinity = Math.min(100, stats.affinity + 1); addLog('你和大家一起堆雪人、打雪仗，欢乐的气氛感染了所有人。', place.name, 'player'); eventHandled = true; }
                    break;
                }
            }
        }
        if (!eventHandled) {
            // ========== ★ 扩展地点动作（每个地点最多6个） ==========
            if (action === '🛏️休息恢复') { const heal = 5 + Math.floor(Math.random() * 6); stats.health = Math.min(state.player.maxHealth, stats.health + heal); addLog(`你好好休息了一番，生命恢复了${heal}点。`, place.name, 'player'); }
            else if (action === '🎁制作礼物') { state.player.inventory.push('🧸手工小物'); addLog('你精心制作了一件小礼物，放入了背包。', place.name, 'player'); state.player.actionCounts['craft'] = (state.player.actionCounts['craft'] || 0) + 1; }
            // ★ 新增：烹饪
            else if (action === '🍳 烹饪料理') { 
                if (state.player.inventory.some(i => i.includes('野菜') || i.includes('鱼') || i.includes('肉'))) {
                    const heal = 10 + Math.floor(Math.random() * 10);
                    stats.health = Math.min(state.player.maxHealth, stats.health + heal);
                    addLog(`你烹饪了一顿美味的料理，生命恢复了${heal}点。`, place.name, 'player');
                    showToast(`🍳 料理完成！生命 +${heal}`);
                } else {
                    addLog('你没有合适的食材，需要先采集野菜、鱼或肉类。', place.name, 'player');
                    showToast('⚠️ 缺少食材');
                }
            }
            // ★ 新增：编织花环
            else if (action === '🌸 编织花环') {
                state.player.inventory.push('🌸手编花环');
                stats.talent = Math.min(100, stats.talent + 1);
                addLog('你用花朵编织了一个漂亮的花环。', place.name, 'player');
                showToast('🌸 获得手编花环');
            }
            // ★ 新增：学习兽语
            else if (action === '📖 学习兽语') {
                stats.charm = Math.min(100, stats.charm + 1);
                stats.affinity = Math.min(100, stats.affinity + 1);
                addLog('你学习了兽人的语言，交流更加顺畅了。', place.name, 'player');
                showToast('📖 魅力+1，亲和+1');
            }
            // ★ 新增：采集野果
            else if (action === '🍎 采集野果') {
                const fruits = ['🍎野苹果', '🍐野梨', '🍒野樱桃', '🍓野草莓'];
                const found = fruits[Math.floor(Math.random() * fruits.length)];
                state.player.inventory.push(found);
                addLog(`你采集了【${found}】。`, place.name, 'player');
                showToast(`🍎 获得了 ${found}`);
            }
            // ★ 新增：生火取暖
            else if (action === '🔥 生火取暖') {
                stats.endurance = Math.min(100, stats.endurance + 1);
                const heal = 5 + Math.floor(Math.random() * 5);
                stats.health = Math.min(state.player.maxHealth, stats.health + heal);
                addLog(`你生起篝火取暖，身体暖和起来了，生命+${heal}。`, place.name, 'player');
                showToast(`🔥 生命 +${heal}`);
            }
            // ★ 新增：星语心愿
            else if (action === '🌠 星语心愿') {
                stats.intuition = Math.min(100, stats.intuition + 2);
                state.player._wishMade = (state.player._wishMade || 0) + 1;
                addLog('你对着星星许下了一个心愿。', place.name, 'player');
                showToast('🌠 直觉+2');
            }
            // ★ 新增：放河灯
            else if (action === '🏮 放河灯') {
                stats.affinity = Math.min(100, stats.affinity + 2);
                addLog('你放了一盏河灯，河水承载着祝福流向远方。', place.name, 'player');
                showToast('🏮 亲和+2');
                if (!state.player._firstLantern) {
                    state.player._firstLantern = true;
                    addLog('💡 河灯是兽世重要的祈福方式，每个季节都有不同的河灯仪式。', null, 'system');
                }
            }
            // ★ 新增：独木舟
            else if (action === '🚣 划独木舟') {
                stats.endurance = Math.min(100, stats.endurance + 1);
                stats.affinity = Math.min(100, stats.affinity + 1);
                addLog('你在湖上划着独木舟，享受着宁静的时光。', place.name, 'player');
                showToast('🚣 体质+1，亲和+1');
            }
            // ★ 新增：垂钓
            else if (action === '🎣 垂钓') {
                if (Math.random() < 0.6) {
                    state.player.inventory.push('🐟鲜鱼');
                    addLog('你钓到了一条鲜鱼！', place.name, 'player');
                    showToast('🐟 获得鲜鱼');
                } else {
                    addLog('你钓了半天，什么也没钓到。', place.name, 'player');
                }
                state.player.actionCounts['fish'] = (state.player.actionCounts['fish'] || 0) + 1;
            }
            // ★ 新增：果园采摘
            else if (action === '🍎 果园采摘') {
                const fruits = ['🍎金苹果', '🍐香梨', '🍑蜜桃'];
                const found = fruits[Math.floor(Math.random() * fruits.length)];
                state.player.inventory.push(found);
                addLog(`你在果园采摘了【${found}】。`, place.name, 'player');
                showToast(`🍎 获得 ${found}`);
            }
            // ★ 新增：望远镜观星
            else if (action === '🔭 望远镜观星') {
                stats.intuition = Math.min(100, stats.intuition + 2);
                stats.endurance = Math.min(100, stats.endurance + 1);
                addLog('你通过望远镜观察星空，发现了一颗从未见过的星星。', place.name, 'player');
                showToast('🔭 直觉+2，体质+1');
                if (!state.player._firstStar) {
                    state.player._firstStar = true;
                    addLog('💡 这颗星在兽世被称为"命运之星"，据说看到它的人会获得兽神的祝福。', null, 'system');
                }
            }
            // ★ 新增：记录星图
            else if (action === '📝 记录星图') {
                stats.talent = Math.min(100, stats.talent + 2);
                addLog('你将观测到的星图画了下来，完成了一份星图。', place.name, 'player');
                showToast('📝 才艺+2');
            }
            else if (action === '🎁购买礼物') {
                if (state.player.gold < 5) {
                    addLog('💰 金币不足（需要5金币），无法购买礼物。', place.name, 'player');
                } else {
                    state.player.gold -= 5;
                    stats.affinity = Math.min(100, stats.affinity + 1);
                    if (stats.affinity >= 16 && Math.random() < 0.4) {
                        state.player.inventory.push('💐鲜花束', '🍖熏肉干');
                        addLog('亲和力高，商贩多送了你一块熏肉干！获得了两件礼物。', place.name, 'player');
                    } else if (Math.random() < 0.6) {
                        state.player.inventory.push('💐鲜花束');
                        addLog('你在市场买了一束鲜花。', place.name, 'player');
                    } else {
                        state.player.inventory.push('🍖熏肉干');
                        addLog('你从商人那里换到一块熏肉干。', place.name, 'player');
                    }
                    state.player.actionCounts['buy_gift'] = (state.player.actionCounts['buy_gift'] || 0) + 1;
                }
            }
            else if (action === '📋查看公告') { stats.intuition = Math.min(100, stats.intuition + 1); const bulletin = getBulletins()[Math.floor(Math.random() * getBulletins().length)]; addLog(`公告栏上写着："${bulletin}"`, place.name, 'player'); state.player.actionCounts['bulletin'] = (state.player.actionCounts['bulletin'] || 0) + 1; }
            else if (action === '🗣️打听消息') { stats.affinity = Math.min(100, stats.affinity + 1); const rumor = getRumors()[Math.floor(Math.random() * getRumors().length)]; addLog(`你听到人们在议论："${rumor}"`, place.name, 'player'); state.player.actionCounts['rumor'] = (state.player.actionCounts['rumor'] || 0) + 1; }
            else if (action === '📚学习知识') { 
                stats.intuition = Math.min(100, stats.intuition + 1); 
                const knowledge = beastWorldKnowledge[Math.floor(Math.random() * beastWorldKnowledge.length)]; 
                addLog(`你在祭坛翻阅古籍，学到了新知识："${knowledge}"`, place.name, 'player'); 
                state.player.actionCounts['learn'] = (state.player.actionCounts['learn'] || 0) + 1; 
                if (state.player.actionCounts['learn'] >= 10) unlockAchievement('scholar');
                showToast(`🔮 直觉 +1，学习了新知识`);
            }
            // ★ 新增：亲密互动
            else if (action === '💕 依偎取暖') {
                stats.health = Math.min(state.player.maxHealth, stats.health + 10);
                stats.charm = Math.min(100, stats.charm + 1);
                addLog('你依偎在温暖的皮毛中，感受到了前所未有的安心。', place.name, 'player');
                showToast('💕 生命+10，魅力+1');
                if (!state.player._firstCuddle) {
                    state.player._firstCuddle = true;
                    unlockAchievement('first_kiss');
                }
            }
            else if (action === '💋 亲吻额头') {
                stats.charm = Math.min(100, stats.charm + 2);
                stats.affinity = Math.min(100, stats.affinity + 2);
                addLog('你轻轻吻了他的额头，他的耳朵瞬间红了。', place.name, 'player');
                showToast('💋 魅力+2，亲和+2');
            }
            else {
                if (action.includes('锻炼') || action.includes('训练')) {
                    const gain = 3 + Math.floor(Math.random() * 5);
                    stats.health = Math.min(state.player.maxHealth, stats.health + gain);
                    stats.endurance = Math.min(100, stats.endurance + 1);
                    if (state.player.maxHealth < 100 && Math.random() < 0.4) { state.player.maxHealth = Math.min(100, state.player.maxHealth + 1); stats.health = Math.min(state.player.maxHealth, stats.health + 8); addLog('通过锻炼，你的生命力上限提升了，身体也更加有活力了！', place.name, 'player'); }
                    state.player.actionCounts['exercise'] = (state.player.actionCounts['exercise'] || 0) + 1;
                }
                if (action.includes('采集') || action.includes('药草')) { stats.talent = Math.min(100, stats.talent + 1); stats.intuition = Math.min(100, stats.intuition + 1); state.player.actionCounts['herb'] = (state.player.actionCounts['herb'] || 0) + 1; addLog('你采集了一些药草。', place.name, 'player'); }
                if (action.includes('聊天') || action.includes('居民')) { stats.charm = Math.min(100, stats.charm + 1); stats.affinity = Math.min(100, stats.affinity + 1); state.player.actionCounts['chat'] = (state.player.actionCounts['chat'] || 0) + 1; addLog('你和居民聊了聊天。', place.name, 'player'); }
                if (action.includes('观星占卜') || action.includes('登高望远') || action.includes('观察天象')) { stats.endurance = Math.min(100, stats.endurance + 1); if (action.includes('观星占卜')) state.player.actionCounts['astrology'] = (state.player.actionCounts['astrology'] || 0) + 1; if (action.includes('登高望远')) state.player.actionCounts['tower'] = (state.player.actionCounts['tower'] || 0) + 1; if (action.includes('观察天象')) state.player.actionCounts['sky_watch'] = (state.player.actionCounts['sky_watch'] || 0) + 1; addLog('你观察了天象。', place.name, 'player'); }
                if (action.includes('放松') || action.includes('温泉')) { stats.health = Math.min(state.player.maxHealth, stats.health + 20); state.player.actionCounts['hotspring'] = (state.player.actionCounts['hotspring'] || 0) + 1; addLog('你在温泉中放松了身心，生命恢复了20点。', place.name, 'player'); }
                if (action.includes('帮忙杂务')) { state.player.actionCounts['square'] = (state.player.actionCounts['square'] || 0) + 1; addLog('你在广场帮忙做了一些杂务。', place.name, 'player'); }
                if (action.includes('静坐赏月')) { state.player.actionCounts['moon_cliff'] = (state.player.actionCounts['moon_cliff'] || 0) + 1; addLog('你在月崖静坐赏月。', place.name, 'player'); }
                if (action.includes('写日记')) { state.player.actionCounts['diary'] = (state.player.actionCounts['diary'] || 0) + 1; addLog('你写下了今天的冒险日记。', place.name, 'player'); }
                if (action.includes('抓鱼')) { state.player.actionCounts['fish'] = (state.player.actionCounts['fish'] || 0) + 1; addLog('你在河边抓了几条鱼。', place.name, 'player'); }
                if (!action.includes('锻炼') && !action.includes('采集') && !action.includes('聊天') && !action.includes('观星') && !action.includes('放松') && !action.includes('帮忙') && !action.includes('静坐') && !action.includes('写日记') && !action.includes('抓鱼')) {
                    addLog(`你在${place.name}进行了${action}。`, place.name, 'player');
                }
            }
        }
    }

    if (place.type === 'guyhome') {
        const hg = getGuy(place.guy);
        if (hg && !hg.locked && !hg.banished) {
            if (place.isMovedIn) {
                if (action === '🛏️休息恢复') {
                    const heal = 5 + Math.floor(Math.random() * 6);
                    stats.health = Math.min(state.player.maxHealth, stats.health + heal);
                    addLog(`你在${hg.name}的家中安心休息，生命恢复了${heal}点。`, place.name, 'player');
                    checkAchievements();
                    return logParts.join('<br>');
                }
                if (action === '🎁制作礼物') {
                    state.player.inventory.push('🧸手工小物');
                    addLog(`你在${hg.name}的家中精心制作了一件小礼物。`, place.name, 'player');
                    state.player.actionCounts['craft'] = (state.player.actionCounts['craft'] || 0) + 1;
                    checkAchievements();
                    return logParts.join('<br>');
                }
                // ★ 新增：同居亲密互动
                if (action === '💕 依偎取暖') {
                    stats.health = Math.min(state.player.maxHealth, stats.health + 10);
                    stats.charm = Math.min(100, stats.charm + 1);
                    addAffectionAndObsession(hg, 3);
                    addLog(`你依偎在${hg.name}的怀中，感受到了前所未有的安心。`, place.name, 'player');
                    showToast('💕 生命+10，好感+3');
                    if (!state.player._firstCuddle) {
                        state.player._firstCuddle = true;
                        unlockAchievement('first_kiss');
                    }
                    return logParts.join('<br>');
                }
                if (action === '💋 亲吻额头') {
                    stats.charm = Math.min(100, stats.charm + 2);
                    stats.affinity = Math.min(100, stats.affinity + 2);
                    addAffectionAndObsession(hg, 5);
                    addLog(`你轻轻吻了${hg.name}的额头，他的耳朵瞬间红了。`, place.name, 'player');
                    showToast('💋 好感+5，魅力+2');
                    return logParts.join('<br>');
                }
            }
            if (action === '💊照顾他') {
                if (!hg.injured) addLog('他并没有受伤。', place.name, 'guy');
                else { hg.injuredDays = Math.max(0, hg.injuredDays - 2); if (hg.injuredDays <= 0) { hg.injured = false; addLog(`在你的照顾下，${hg.name}的伤势已经痊愈了！`, place.name, 'guy'); } else addLog(`你照顾了受伤的${hg.name}，他的伤势好转了。`, place.name, 'guy'); state.player.stats.talent = Math.min(100, state.player.stats.talent + 1); addAffectionAndObsession(hg, 2); }
                checkAchievements();
                return logParts.join('<br>');
            }
            if (action === '🚶邀请出门') {
                if (hg.sulkingDays > 0) addLog(`${hg.name}还在生闷气，拒绝了你的邀请。`, place.name, 'guy');
                else { const willAccept = (state.player.movedIn === hg.id) ? true : (Math.random() < (0.3 + hg.affection / 200)); if (willAccept) { addAffectionAndObsession(hg, 4); addLog(`${hg.name}很高兴地答应了你的邀请，你们一起出门散步。`, place.name, 'guy'); } else { addAffectionAndObsession(hg, 1); addLog(`${hg.name}婉拒了你的邀请，看起来有些不好意思。`, place.name, 'guy'); } }
                checkAchievements();
                return logParts.join('<br>');
            }
            if (action === '🎁送礼') {
                if (state.player.inventory.length === 0) { showNoGiftModal(); return null; }
                const gift = state.player.inventory.pop();
                const bonus = state.player.stats.charm >= 16 ? 2 : 0;
                let baseAmount = 5 + bonus;
                if (isGuyBirthday(hg, state.player.day)) {
                    baseAmount = Math.floor(baseAmount * 1.3);
                    addLog(`🎂 今天是${hg.name}的生日！送礼物效果额外+30%！`, null, 'guy');
                    showToast(`🎂 今天是${hg.name}的生日！好感度额外+30%！`);
                }
                addAffectionAndObsession(hg, baseAmount);
                state.player.stats.talent = Math.min(100, state.player.stats.talent + 1);
                state.player.actionCounts['gift'] = (state.player.actionCounts['gift'] || 0) + 1;
                // 检查首次送礼成就
                if (state.player.actionCounts['gift'] === 1) unlockAchievement('first_gift');
                checkAchievements();
                const logText = `送给${hg.name}${gift}，他很喜欢。${bonus > 0 ? '魅力加成额外+2好感！' : ''}${isGuyBirthday(hg, state.player.day) ? ' 🎂生日加成30%！' : ''}`;
                addLog(logText, place.name, 'guy');
                checkHealthStatus();
                updateTopBar();
                showActionResult(logText, place);
                return logText;
            }
            if (action === '💬聊天') { addAffectionAndObsession(hg, 3); addLog(`你和${hg.name}聊了一会儿，关系更亲近了。`, place.name, 'guy'); checkAchievements(); return logParts.join('<br>'); }
            if (action === '🏠拜访') {
                addLog(`你拜访了${hg.name}。`, place.name, 'guy');
                return logParts.join('<br>');
            }
        }
    }

    let dmg = 0;
    const injuryModifier = isHunting ? 1.5 : 1;
    if (place.name !== '密林' && Math.random() < getInjuryProb() * injuryModifier && !isSafeAction) {
        dmg = 8 + Math.floor(Math.random() * 10);
        stats.health = Math.max(0, stats.health - dmg);
        addLog(`你遭遇意外，生命值减少了${dmg}点！`, place.name, 'system');
        if (dmg > 0) {
            const helpers = state.npcs.filter(n => n.favorability >= 70);
            if (helpers.length > 0 && Math.random() < 0.3) {
                const helper = helpers[Math.floor(Math.random() * helpers.length)];
                const heal = 10 + Math.floor(Math.random() * 10);
                stats.health = Math.min(state.player.maxHealth, stats.health + heal);
                addLog(`💕 ${helper.name}及时出现救了你！生命恢复${heal}点。`, place.name, 'npc');
                helper.favorability = Math.min(100, helper.favorability + 2);
                showNPCRescueModal(helper, heal);
            }
        }
    }

    if (place.exploreCount !== undefined) place.exploreCount = (place.exploreCount || 0) + 1;
    if (place.unlockTarget) {
        const target = state.places.find(p => p.name === place.unlockTarget);
        if (target && target.locked && place.exploreCount >= place.needCount) {
            target.locked = false;
            addLog(`🗺️发现了通往<b>${target.name}</b>的路！`, place.name, 'system');
            place.exploreCount = 0;
        }
    }

    // ★ 新地点自动解锁
    if (state.player.day >= 5 && state.places.find(p => p.name === '花田')?.locked) {
        state.places.find(p => p.name === '花田').locked = false;
        addLog('🌸 你发现了一片美丽的花田！', null, 'system');
    }
    if (state.player.day >= 10 && state.places.find(p => p.name === '山涧瀑布')?.locked) {
        state.places.find(p => p.name === '山涧瀑布').locked = false;
        addLog('💧 你听到了瀑布的水声，循声找到了山涧瀑布！', null, 'system');
    }
    if (state.player.day >= 15 && state.places.find(p => p.name === '古树广场')?.locked) {
        state.places.find(p => p.name === '古树广场').locked = false;
        addLog('🌳 你发现了一棵巨大的古树，树下是一片宽阔的广场。', null, 'system');
    }
    // ★ 新地点：湖边（第8天解锁）
    if (state.player.day >= 8 && state.places.find(p => p.name === '湖边')?.locked) {
        state.places.find(p => p.name === '湖边').locked = false;
        addLog('🏞️ 你发现了一个宁静的湖泊，湖面如镜！', null, 'system');
    }
    // ★ 新地点：果园（第12天解锁）
    if (state.player.day >= 12 && state.places.find(p => p.name === '果园')?.locked) {
        state.places.find(p => p.name === '果园').locked = false;
        addLog('🍎 你发现了一片果实累累的果园！', null, 'system');
    }
    // ★ 新地点：观星台（第20天解锁）
    if (state.player.day >= 20 && state.places.find(p => p.name === '观星台')?.locked) {
        state.places.find(p => p.name === '观星台').locked = false;
        addLog('🔭 你发现了一座古老的观星台，视野极佳！', null, 'system');
    }

    if (place.type === 'public' && !place.locked) {
        if (Math.random() < 0.3) {
            tryMeetRelationshipNPC(place.name);
        }

        const pguy = place.guy ? getGuy(place.guy) : null;
        if (pguy && !pguy.banished && pguy.sulkingDays <= 0 && !(pguy.id === 'moli' && pguy.locked)) {
            let meetProb = getMeetProbability(pguy);
            if (isEventAction) {
                meetProb = 0.75;
            }
            if (place.name === '训练场' && pguy.id === 'lieyang' && !state.player._lieyangFirstMeetDone) {
                meetProb = 1;
            }
            if (Math.random() < meetProb) {
                if (pguy.locked) {
                    let baseProb = (pguy.mainPlaces && pguy.mainPlaces.includes(place.name)) ? 0.75 : 0.4;
                    if (place.name === '训练场' && pguy.id === 'lieyang' && !state.player._lieyangFirstMeetDone) {
                        baseProb = 1;
                    }
                    if (Math.random() < baseProb) {
                        pguy.locked = false;
                        state.player._lieyangFirstMeetDone = true;
                        addAffectionAndObsession(pguy, 5);
                        const meetLog = `你首次遇到了${pguy.name}！`;
                        addLog(meetLog, place.name, 'guy');
                        logParts.push(meetLog);
                        logParts.push(generateMeetInteraction(pguy, place, action));
                        if (!state.pendingRelationships[pguy.id] || state.pendingRelationships[pguy.id].length === 0) {
                            buildRelationshipMapForGuy(pguy.id);
                        }
                        triggerGuyStoryEventWithPhase(pguy, place.name);
                        showFirstMeetModal(pguy, place, logParts.join('<br>'));
                        return logParts.join('<br>');
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
                    // ★ 触发男主剧情事件
                    triggerGuyStoryEventWithPhase(pguy, place.name);
                }
            }
        }

        if (Math.random() < 0.12 + stats.charm / 200) {
            const og = state.guys.filter(g => !g.locked && !g.banished && g.id !== (place.guy || '') && !events.some(ev => ev.effects?.guyMods?.[g.id]?.locked) && g.sulkingDays <= 0 && !(g.id === 'moli' && g.locked));
            if (og.length) {
                const rg = og[Math.floor(Math.random() * og.length)];
                const meetProb = getMeetProbability(rg);
                if (Math.random() < meetProb) {
                    addAffectionAndObsession(rg, 2);
                    const interactionText = generateMeetInteraction(rg, place, action);
                    logParts.push(`没想到${rg.name}也在这里。` + interactionText);
                    addLog(`偶遇了${rg.name}。`, place.name, 'guy');
                    triggerGuyStoryEventWithPhase(rg, place.name);
                }
            }
        }

        const presentGuys = state.guys.filter(g => !g.locked && !g.banished && g.sulkingDays <= 0 && (g.id === (place.guy || '') || (Math.random() < 0.12 + stats.charm / 200)) && !(g.id === 'moli' && g.locked));
        const highAffGuys = presentGuys.filter(g => g.affection >= 70);
        if (highAffGuys.length >= 2 && Math.random() < 0.3) {
            const logText = logParts.join('<br>');
            addLog(logText, place.name, 'guy');
            triggerMultiGuyConflict(highAffGuys, place);
            return null;
        }

        if (state.npcs.length < MAX_NPC && Math.random() < 0.4) {
            const newNPC = generateRandomNPC(place.name);
            if (!state.npcs.some(n => n.name === newNPC.name && n.race === newNPC.race)) {
                addNPC(newNPC);
                const pronoun = newNPC.gender === '女' ? '她' : '他';
                const meetMsg = `你遇到了 ${newNPC.emoji} ${newNPC.name}（${newNPC.identity}）。${newNPC.appearance} ${pronoun}看起来${newNPC.personality}。`;
                logParts.push(meetMsg);
                addLog(meetMsg, place.name, 'npc');
            }
        }
        if (state.npcs.length > 0 && Math.random() < 0.5) {
            const known = state.npcs.filter(n => n.favorability < 100);
            if (known.length > 0) {
                const npc = known[Math.floor(Math.random() * known.length)];
                const gain = 1 + Math.floor(Math.random() * 3);
                npc.favorability = Math.min(100, npc.favorability + gain);
                const dialog = `${npc.emoji} ${npc.name}向你打招呼，你们聊了几句，友好值+${gain}`;
                logParts.push(dialog);
                addLog(dialog, place.name, 'npc');
                showToast(`与${npc.name}相遇，友好值+${gain}`);
                // ★ 触发NPC剧情
                triggerNPCStoryEvent(npc, place.name);
            }
        }
    }

    if (Math.random() < 0.03) {
        const cand = state.guys.filter(g => !g.locked && !g.injured && !g.banished && g.id !== 'moli' && !events.some(ev => ev.effects?.guyMods?.[g.id]?.locked) && g.sulkingDays <= 0);
        if (cand.length) {
            const u = cand[Math.floor(Math.random() * cand.length)];
            u.injured = true;
            u.injuredDays = 3 + Math.floor(Math.random() * 3);
            addLog(`听说${u.name}受伤了！`, place.name, 'guy');
        }
    }

    if (state.player.day >= 3 && state.places.find(pl => pl.name === '温泉').locked && Math.random() < 0.3) {
        state.places.find(pl => pl.name === '温泉').locked = false;
        addLog('可以使用温泉了。', null, 'system');
    }

    state.guys.forEach(g => {
        if (!g.locked && !g.banished && g.affection >= 30) {
            const home = state.places.find(pl => pl.guy === g.id && pl.type === 'guyhome');
            if (home && home.locked) {
                home.locked = false;
                addLog(`${g.name}邀请你去他家做客。`, home.name, 'guy');
            }
        }
    });

    if (place.type === 'public' && !place.locked) {
        tryCollectCollectible(place);
    }

    checkQuestProgress(place, action);

    if (place.type === 'public' && !place.locked && Math.random() < 0.05) {
        triggerNPCmatchmaking();
    }

    const logText = logParts.join('<br>');
    checkAchievements();
    if (!state.gameActive) return logText;
    checkHESoulOath();
    return logText;
}

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
    } else if (placeName === '湖边') {
        meetPool.push(`湖边波光粼粼，${shortName}正静静地看着湖面，听到你的脚步声，他转过头来，眼中映着水光。`);
    } else if (placeName === '果园') {
        meetPool.push(`果园里果实累累，${shortName}正踮脚摘果子，看到你来了，他笑着递给你一个。`);
    } else if (placeName === '观星台') {
        meetPool.push(`观星台上夜风轻拂，${shortName}正仰头看着星空，听到你的脚步声，他轻轻拍了拍身边的位置。`);
    } else meetPool.push(`你在${placeName}遇见了${shortName}，他正在忙碌，看到你后微微一笑。`, `${shortName}出现在${placeName}，你们简单交谈了几句。`);
    let interactionText = meetPool[Math.floor(Math.random() * meetPool.length)];
    if (aff >= 70 && !guy.dating) interactionText += ' ' + [`${shortName}的目光在你身上停留得比往常更久，似乎想多和你待一会儿。`, `他说话时，眼神不自觉地追随着你，带着一丝不易察觉的温柔。`, `${shortName}在你转身时，悄悄地又看了你一眼，尾巴不自觉地轻轻摆动。`][Math.floor(Math.random() * 3)];
    return interactionText;
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
    modal.querySelector('#ignoreFight').addEventListener('click', () => { modal.remove(); if (all100) { guyList.forEach(g => { g.injured = true; g.injuredDays = 4 + Math.floor(Math.random() * 3); }); addLog(`${guyList.map(g => g.name).join('和')}打了起来，两人都受伤了！`, place.name, 'guy'); } else addLog(`你没有插手，${guyList.map(g => g.name).join('和')}不欢而散。`, place.name, 'guy'); checkHealthStatus(); advanceTime(); updateTopBar(); renderPlaces(); });
    modal.querySelectorAll('[data-id]').forEach(btn => btn.addEventListener('click', () => { modal.remove(); const favoredId = btn.dataset.id; const favored = guyList.find(g => g.id === favoredId); const other = guyList.find(g => g.id !== favoredId); if (favored) addAffectionAndObsession(favored, 5); if (other) { other.affection = Math.max(0, other.affection - 5); other.sulkingDays = 3 + Math.floor(Math.random() * 2); other.sulkingTarget = favoredId; addLog(`你偏袒了${favored.name}，${other.name}心碎地离开了，暂时不愿见你。`, place.name, 'guy'); unlockAchievement('peacemaker'); checkAchievements(); } checkHealthStatus(); advanceTime(); updateTopBar(); renderPlaces(); }));
}

export function openPlaceActions(placeName) {
    const place = state.places.find(p => p.name === placeName);
    if (!place || place.locked) return;
    if (getTodayEvents(state.player.day).some(ev => ev.effects?.lockedPlaces?.includes(placeName))) return;

    const isHome = placeName === '我家' || (place.type === 'guyhome' && place.isMovedIn);
    if (!canGoOut() && !isHome) {
        showCantGoOutModal();
        return;
    }

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
    
    const active = getActiveQuest();
    let questHint = '';
    if (active) {
        const questData = GUY_QUESTS[active.guyId]?.find(q => q.id === active.questId);
        if (questData) {
            const step = questData.steps[active.stepIndex];
            if (step && step.action === place.name) {
                questHint = `<div style="color:var(--accent);font-size:0.8em;margin-bottom:6px;background:#fff0f5;padding:6px 10px;border-radius:8px;">📋 当前任务：${questData.name}<br>📍 ${step.text}</div>`;
            } else if (step && step.action !== place.name) {
                questHint = `<div style="color:var(--text2);font-size:0.7em;margin-bottom:6px;">💡 当前任务需要在「${step.action}」进行</div>`;
            }
        }
    }
    
    // ★ 每个地点最多6个动作（含事件动作）
    if (place.type === 'home') {
        acts = ['🛏️休息恢复', '🎁制作礼物', '📝写日记', '🍳 烹饪料理', '🌸 编织花环', '📖 学习兽语'];
    } else if (place.name === '部落广场') {
        acts = ['🤝帮忙杂务', '💬与居民聊天', '📋查看公告', '💼打工赚钱', '🔥 篝火故事', '🎵 学唱兽歌'];
    } else if (place.name === '训练场') {
        acts = ['💪锻炼身体', '🥊观看训练', '💼打工赚钱', '🏹 学习射箭', '🤸 攀爬训练', '💕 依偎取暖'];
    } else if (place.name === '铁匠铺') {
        acts = ['🔨帮忙锻造', '🛠️学习技艺', '💼打工赚钱', '⚒️ 熔炼矿石', '🔧 武器保养', '🎁 打造饰品'];
    } else if (place.name === '河边') {
        acts = ['🎣抓鱼', '🧺洗衣服', '🌸采花探索', '🏮 放河灯', '🍳 烹饪料理', '🌊 戏水'];
    } else if (place.name === '市场') {
        acts = ['🛒闲逛购物', '🎁购买礼物', '🗣️打听消息', '💊出售草药', '💰 以物易物', '🎭 观看表演'];
    } else if (place.name === '月崖') {
        acts = ['🌙静坐赏月', '🌿采集草药', '🌠 星语心愿', '💕 依偎取暖', '💋 亲吻额头', '📝 写日记'];
    } else if (place.name === '萨满祭坛') {
        acts = ['📚学习知识', '🌟观星占卜', '🙏 祈祷祝福', '🔮 占卜未来', '🕯️ 点燃祭灯', '📖 阅读古籍'];
    } else if (place.name === '哨塔') {
        acts = ['🗼登高望远', '☁️观察天象', '🔭 望远镜观星', '📝 记录星图', '🌠 星语心愿', '🦅 与鹰对话'];
    } else if (place.name === '密林小径') {
        acts = ['🍄采集药草', '👣追踪兽迹', '🔍 探索深处', '🌿 寻找灵草', '🍎 采集野果', '🌸 编织花环'];
    } else if (place.name === '温泉') {
        acts = ['♨️泡温泉', '🧘放松冥想', '💕 依偎取暖', '🌊 戏水', '🍳 烹饪料理', '📝 写日记'];
    } else if (place.name === '密林') {
        acts = ['🔍深入探索', '🍀寻找草药', '📦搜寻宝藏', '🍎 采集野果', '🔥 生火取暖', '🌿 采集灵草'];
    } else if (place.name === '花田') {
        acts = ['🌸赏花采蜜', '🦋追逐蝴蝶', '🌸 编织花环', '📝 写日记', '💕 依偎取暖', '🎵 哼唱小调'];
    } else if (place.name === '山涧瀑布') {
        acts = ['💧戏水', '🧘‍♀️瀑布冥想', '🏮 放河灯', '🍳 烹饪料理', '🔍 探索深处', '🌊 感受水雾'];
    } else if (place.name === '古树广场') {
        acts = ['🌳树下阅读', '🎵聆听鸟鸣', '📝 写日记', '🌸 编织花环', '🔥 生火取暖', '💕 依偎取暖'];
    } else if (place.name === '湖边') {
        acts = ['🚣 划独木舟', '🎣 垂钓', '🏮 放河灯', '🌊 戏水', '💕 依偎取暖', '📝 写日记'];
    } else if (place.name === '果园') {
        acts = ['🍎 果园采摘', '🍳 烹饪料理', '🌸 编织花环', '🎵 哼唱小调', '📝 写日记', '💕 依偎取暖'];
    } else if (place.name === '观星台') {
        acts = ['🔭 望远镜观星', '🌠 星语心愿', '📝 记录星图', '🌟观星占卜', '💕 依偎取暖', '💋 亲吻额头'];
    } else if (place.type === 'guyhome') {
        const guy = getGuy(place.guy);
        if (!guy || guy.banished) acts = ['🔍探索'];
        else {
            if (place.isMovedIn) {
                acts = ['🛏️休息恢复', '🎁制作礼物', '💬聊天', '🚶邀请出门', '💔分手', '💕 依偎取暖'];
            } else {
                if (guy.injured) acts.push('💊照顾他');
                acts.push('🏠拜访', '🚶邀请出门');
                if (guy.affection >= 30) acts.push('🎁送礼');
                if (guy.affection >= 50) acts.push('💬聊天');
                if (guy.affection >= 70) acts.push('💕 依偎取暖');
            }
        }
    } else {
        acts = ['🔍探索', '🌿采集', '🚶散步', '📝 写日记', '🍎 采集野果', '🔥 生火取暖'];
    }
    // 移除重复动作
    acts = [...new Set(acts)];
    // 确保不超过6个（优先保留eventActions）
    if (eventActions.length > 0) {
        acts = eventActions.slice(0, 6);
    } else if (acts.length > 6) {
        acts = acts.slice(0, 6);
    }
    // 随机添加一个趣味动作
    if (Math.random() < 0.5 && acts.length < 6) {
        const randomPool = [
            { text: '✨ 发现奇怪的东西', exclude: ['home', 'guyhome'] },
            { text: '🐦 与一只小鸟玩耍', exclude: ['home'] },
            { text: '📦 捡到一个小包裹', exclude: ['home', 'guyhome'] },
            { text: '💤 打个盹', exclude: [] },
            { text: '🗣️ 与陌生人搭话', exclude: ['home', 'guyhome'] }
        ];
        const filtered = randomPool.filter(r => !r.exclude.includes(place.type));
        if (filtered.length) {
            const picked = filtered[Math.floor(Math.random() * filtered.length)];
            if (!acts.includes('🎲 ' + picked.text)) {
                acts.push('🎲 ' + picked.text);
            }
        }
    }
    div.innerHTML = questHint + acts.map(a => `<button class="btn" style="width:100%;margin:2px 0;" data-action="${a}">${a}</button>`).join('');
    
    div.querySelectorAll('button').forEach(btn => btn.addEventListener('click', function() {
        const action = this.dataset.action;
        document.getElementById('actionModal').remove();
        
        if (action === '💔分手') {
            const guy = getGuy(place.guy);
            if (!guy) return;
            const confirmHtml = `<div class="global-overlay" id="breakupModal"><div class="modal-box" style="max-width:400px;text-align:center;"><p style="font-size:1.2em;">你真的要跟 <b>${guy.emoji} ${guy.name}</b> 分手吗？</p><p style="font-size:0.9em;color:var(--text2);">好感度和占有欲将降低25点，且有概率被挽留。</p><div class="actions"><button class="btn" id="breakupYes" style="background:#ff4d6d;">💔 确定分手</button><button class="btn" id="breakupNo">💕 再想想</button></div></div></div>`;
            const modal = showGlobalModal(confirmHtml, 'breakupModal');
            modal.querySelector('#breakupYes').addEventListener('click', () => {
                modal.remove();
                if (!guy) return;
                if (state.player.heEndings.includes(guy.id)) {
                    guy.dating = false;
                    state.player.movedIn = null;
                    reorderPlaces();
                    addLog(`你和${guy.name}分手了（魂契仍在），他依然会出现。`, null, 'guy');
                    showToast(`与${guy.name}分手，但魂契未断。`);
                } else {
                    guy.affection = Math.max(0, guy.affection - 25);
                    guy.obsession = Math.max(0, guy.obsession - 25);
                    if (Math.random() < 0.3) {
                        guy.affection = Math.min(100, guy.affection + 5);
                        addLog(`${guy.name}不同意分手，他哀求你不要离开。`, null, 'guy');
                        showToast(`${guy.name}不同意分手！`);
                        const rejectHtml = `<div class="global-overlay" id="rejectBreakupModal"><div class="modal-box" style="text-align:center;"><div style="font-size:3em;">💔</div><p>${guy.emoji} ${guy.name} 紧紧抓住你的手，眼中含着泪光："求求你，不要走……"</p><p style="color:var(--accent);">好感度恢复了5点，你们暂时和好了。</p><button class="btn" id="closeRejectBreakup" style="width:100%;margin-top:10px;">继续</button></div></div>`;
                        const rModal = showGlobalModal(rejectHtml, 'rejectBreakupModal');
                        rModal.querySelector('#closeRejectBreakup').addEventListener('click', () => rModal.remove());
                        updateTopBar();
                        renderHome();
                        return;
                    }
                    guy.dating = false;
                    state.player.movedIn = null;
                    addLog(`你和${guy.name}分手了，搬回了自己的家。`, null, 'guy');
                    showToast(`已与${guy.name}分手`);
                }
                reorderPlaces();
                updateTopBar();
                renderHome();
            });
            modal.querySelector('#breakupNo').addEventListener('click', () => modal.remove());
            return;
        }
        
        if (place.type === 'guyhome' && action === '🏠拜访') { handleGuyHomeVisit(place); return; }
        
        const isSellHerb = action === '💊 出售草药';
        
        const logText = resolveExplore(place, action);
        if (logText === null) return;
        if (!state.gameActive) return;
        
        if (isSellHerb) {
            updateTopBar();
            showActionResult(logText, place);
            return;
        }
        
        checkHealthStatus();
        advanceTime();
        updateTopBar();
        
        if (place.type === 'public' && Math.random() < 0.05) {
            triggerRandomEvent(place, logText);
        } else if (place.type === 'guyhome' && action.includes('拜访') && Math.random() < 0.3) {
            const guy = getGuy(place.guy);
            if (guy && !guy.locked && !guy.banished && guy.affection >= 50) {
                triggerHeartEvent(place, guy, logText);
            } else {
                showActionResult(logText, place);
            }
        } else {
            showActionResult(logText, place);
        }
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
        addLog(`墨漓为你治疗，生命恢复了${heal}点。`, place.name, 'guy');
        healMsg = `<p style="color:var(--accent);">🌿 墨漓为你调理了身体，生命恢复了${heal}点。</p>`;
    }
    if (guy.sulkingDays > 0) {
        const logText = `${guy.name}还在生闷气，不愿见你。`;
        addLog(logText, place.name, 'guy');
        checkHealthStatus();
        advanceTime();
        updateTopBar();
        showActionResult(logText, place);
        return;
    }
    const isHome = guy.affection >= 70 ? Math.random() < 0.8 : Math.random() < 0.3;
    if (!isHome) {
        const logText = `${guy.name}不在家。`;
        addLog(logText, place.name, 'guy');
        checkHealthStatus();
        advanceTime();
        updateTopBar();
        showActionResult(logText, place);
        return;
    }
    const html = `<div class="modal-overlay" id="visitSubModal"><div class="modal-box"><div style="font-weight:700;color:var(--accent);">拜访${guy.name}</div>${healMsg}<div style="margin:12px 0;">他在家，你想做什么？</div><div style="display:flex;flex-direction:column;gap:8px;"><button class="btn" id="visitGiftBtn">🎁送礼</button><button class="btn" id="visitChatBtn">💬聊天</button><button class="btn" id="visitCuddleBtn">💕 依偎</button></div></div></div>`;
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
        if (state.player.actionCounts['gift'] === 1) unlockAchievement('first_gift');
        checkAchievements();
        const logText = `送给${guy.name}${gift}，他很喜欢。${bonus > 0 ? '魅力加成额外+2好感！' : ''}${isGuyBirthday(guy, state.player.day) ? ' 🎂生日加成30%！' : ''}`;
        addLog(logText, place.name, 'guy');
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
        addLog(logText, place.name, 'guy');
        checkHealthStatus();
        advanceTime();
        updateTopBar();
        showActionResult(logText, place);
    });
    document.getElementById('visitCuddleBtn').addEventListener('click', () => {
        document.getElementById('visitSubModal').remove();
        state.player.stats.health = Math.min(state.player.maxHealth, state.player.stats.health + 10);
        state.player.stats.charm = Math.min(100, state.player.stats.charm + 1);
        addAffectionAndObsession(guy, 3);
        addLog(`你依偎在${guy.name}的怀中，感受到了前所未有的安心。`, place.name, 'player');
        showToast('💕 生命+10，好感+3');
        if (!state.player._firstCuddle) {
            state.player._firstCuddle = true;
            unlockAchievement('first_kiss');
        }
        checkAchievements();
        checkHealthStatus();
        advanceTime();
        updateTopBar();
        showActionResult('你依偎在他温暖的怀抱中，时间仿佛静止了。', place);
    });
}

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
    const p = state.player;
    
    // 探索类
    if ((ac['explore'] || 0) >= 1) unlockAchievement('first_explore');
    if ((ac['explore'] || 0) >= 10) unlockAchievement('explore_10');
    if ((ac['explore'] || 0) >= 50) unlockAchievement('explore_50');
    if ((ac['explore'] || 0) >= 100) unlockAchievement('explore_100');
    if (state.places.every(p => !p.locked)) unlockAchievement('all_places');
    
    // 社交类
    if ((ac['chat'] || 0) >= 15) unlockAchievement('social_butterfly');
    if ((ac['chat'] || 0) >= 50) unlockAchievement('social_50');
    if (state.npcs.length >= 10) unlockAchievement('npc_10');
    if (state.npcs.length >= 20) unlockAchievement('npc_20');
    
    // 男主类
    if (state.guys.filter(g => !g.hidden).every(g => !g.locked)) unlockAchievement('collector');
    if (state.guys.some(g => g.affection >= 50)) unlockAchievement('guy_50');
    if (state.guys.some(g => g.affection >= 100)) unlockAchievement('guy_100');
    if (state.guys.filter(g => !g.banished).every(g => g.affection >= 100)) unlockAchievement('all_guy_100');
    
    // 礼物类
    if ((ac['gift'] || 0) >= 15) unlockAchievement('gift_master');
    if ((ac['gift'] || 0) >= 50) unlockAchievement('gift_50');
    
    // 训练类
    if ((ac['exercise'] || 0) >= 20) unlockAchievement('exercise_fan');
    if ((ac['exercise'] || 0) >= 50) unlockAchievement('exercise_50');
    
    // 购物类
    if ((ac['buy_gift'] || 0) >= 15) unlockAchievement('shopaholic');
    if ((ac['buy_gift'] || 0) >= 50) unlockAchievement('shopaholic_50');
    
    // 采集类
    if ((ac['herb'] || 0) >= 10) unlockAchievement('herb_expert');
    if ((ac['herb'] || 0) >= 50) unlockAchievement('herb_50');
    
    // 钓鱼类
    if ((ac['fish'] || 0) >= 10) unlockAchievement('fisherman');
    if ((ac['fish'] || 0) >= 50) unlockAchievement('fisherman_50');
    
    // 制作类
    if ((ac['craft'] || 0) >= 20) unlockAchievement('craft_master');
    if ((ac['craft'] || 0) >= 50) unlockAchievement('craft_50');
    
    // 地点常客类
    if ((ac['moon_cliff'] || 0) >= 10) unlockAchievement('moon_cliff_regular');
    if ((ac['hotspring'] || 0) >= 10) unlockAchievement('hotspring_lover');
    if ((ac['forest'] || 0) >= 10) unlockAchievement('forest_explorer');
    if ((ac['tower'] || 0) >= 10) unlockAchievement('tower_watcher');
    if ((ac['square'] || 0) >= 10) unlockAchievement('square_regular');
    
    // 属性类
    if (p.maxHealth >= 100) unlockAchievement('survival_expert');
    if (p.stats.endurance >= 100) unlockAchievement('iron_body');
    if (p.stats.charm >= 100) unlockAchievement('popular');
    if (p.stats.intuition >= 100) unlockAchievement('prophet');
    if (p.stats.talent >= 100) unlockAchievement('artist');
    if (p.stats.affinity >= 100) unlockAchievement('diplomat');
    if (p.maxHealth >= 100 && Object.values(p.stats).every(v => v >= 100)) unlockAchievement('max_all');
    
    // 时间类
    if (p.day >= 100) unlockAchievement('long_lasting');
    if (p.day >= 180) unlockAchievement('half_year');
    if (p.day >= 360) unlockAchievement('one_year');
    
    // 日记类
    if ((ac['diary'] || 0) >= 20) unlockAchievement('diary_writer');
    if ((ac['diary'] || 0) >= 50) unlockAchievement('diary_50');
    
    // 情报类
    if ((ac['bulletin'] || 0) >= 15) unlockAchievement('bulletin_reader');
    if ((ac['rumor'] || 0) >= 15) unlockAchievement('rumor_monger');
    
    // 占卜类
    if ((ac['astrology'] || 0) >= 10) unlockAchievement('astrologer');
    if ((ac['sky_watch'] || 0) >= 10) unlockAchievement('sky_watcher');
    
    // 收藏类
    if (p.collectedItems && p.collectedItems.length >= 20) unlockAchievement('collector_master');
    if (p.collectedItems && p.collectedItems.length >= 30) unlockAchievement('collector_30');
    if (p.collectedItems && p.collectedItems.length >= 50) unlockAchievement('collector_all');
    
    // 任务类
    if (p.completedQuests && p.completedQuests.length >= 5) unlockAchievement('quest_master');
    if (p.completedQuests && p.completedQuests.length >= 10) unlockAchievement('quest_10');
    
    // 打工类
    if ((ac['work'] || 0) >= 10) unlockAchievement('work_10');
    if ((ac['work'] || 0) >= 50) unlockAchievement('work_50');
    
    // 特殊类
    if ((ac['learn'] || 0) >= 10) unlockAchievement('scholar');
    if ((ac['learn'] || 0) >= 50) unlockAchievement('scholar_50');
    
    // ★ 新增成就检测
    if (p.completedQuests && p.completedQuests.length >= 1) unlockAchievement('first_confession');
    if (p.dateHistory && p.dateHistory.length >= 1) unlockAchievement('first_date');
    if (state.player.heEndings && state.player.heEndings.length === state.guys.filter(g => !g.banished).length) unlockAchievement('all_he');
    
    // 触发NPC剧情线成就
    const npcStories = state.player.triggeredStories?.filter(s => s.startsWith('elder_') || s.startsWith('xiaoman_') || s.startsWith('aluo_') || s.startsWith('xiaomei_')) || [];
    if (npcStories.length >= 1) unlockAchievement('npc_story_1');
    if (npcStories.length >= 10) unlockAchievement('npc_story_all');
    
    // 触发男主剧情事件成就
    const guyStories = state.player.triggeredStories?.filter(s => s.includes('_story_') || s.includes('_intro_') || s.includes('_friend_') || s.includes('_love_') || s.includes('_bond_')) || [];
    if (guyStories.length >= 10) unlockAchievement('guy_story_10');
    if (guyStories.length >= 30) unlockAchievement('guy_story_30');
    
    // 金币成就
    if (p.gold >= 100) unlockAchievement('money_100');
    if (p.gold >= 500) unlockAchievement('money_500');
    if (p.gold >= 1000) unlockAchievement('money_1000');
}

function getInjuryProb() { const e = state.player.stats.endurance; if (e >= 90) return 0; if (e >= 70) return 0.03; if (e >= 50) return 0.08; return 0.15; }
function getDeepForestInjuryProb() { const e = state.player.stats.endurance; if (e >= 90) return 0; if (e >= 70) return 0.1; if (e >= 50) return 0.3; return 0.6; }