// tutorial.js - 强制引导型新手教程（无遮罩，仅高亮目标，底部提示）
import { state, addLog, updateTopBar } from './state.js';
import { showToast, showGlobalModal } from './ui.js';
import { renderHome, renderPlaces, renderGuyList, renderNPCList, renderSettings } from './render.js';
import { showFirstMeetModal } from './actions.js';

// ========== 引导步骤定义 ==========
const TUTORIAL_STEPS = {
    WELCOME: 1,
    CLICK_PLACES: 2,
    PLACES_INTRO: 3,
    CLICK_TRAINING: 4,
    TRAINING_INTRO: 5,
    CLICK_GUYS: 6,
    CLICK_LIEYANG: 7,
    GUY_DETAIL_INTRO: 8,
    CLICK_NPCS: 9,
    NPC_INTRO: 10,
    CLICK_SETTINGS: 11,
    COMPLETE: -1
};

// ========== 检查是否需要引导 ==========
export function needsTutorial() {
    return state.player.tutorialStep >= 0 && !state.player.tutorialSkipped;
}

// ========== 跳过引导 ==========
export function skipTutorial() {
    state.player.tutorialSkipped = true;
    state.player.tutorialStep = -1;
    // 🔥 确保烈阳首次相遇标记重置为 false，保证下次进入训练场必遇
    state.player._lieyangFirstMeetDone = false;
    addLog('你跳过了新手指导。');
    showToast('已跳过新手指导');
    cleanupGuidedStep();
    state.currentTab = 'home';
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const homeNav = document.querySelector('.nav-item[data-tab="home"]');
    if (homeNav) homeNav.classList.add('active');
    renderHome();
}

// ========== 开始引导 ==========
export function startTutorial() {
    state.player.tutorialStep = TUTORIAL_STEPS.WELCOME;
    showWelcomeStep();
}

// ========== 通用引导步骤 ==========
let _guidedCleanup = null;

function cleanupGuidedStep() {
    if (_guidedCleanup) {
        _guidedCleanup();
        _guidedCleanup = null;
    }
}

function showGuidedStep(targetSelector, guideText, onSuccess, skipCallback, targetName) {
    cleanupGuidedStep();

    const target = document.querySelector(targetSelector);
    if (!target) {
        console.warn('引导目标不存在:', targetSelector);
        if (onSuccess) onSuccess();
        return;
    }

    // 高亮目标（不遮罩背景）
    target.classList.add('tutorial-highlight');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 创建底部引导文字（不遮挡目标）
    const tip = document.createElement('div');
    tip.className = 'tutorial-tip';
    tip.textContent = guideText;
    document.body.appendChild(tip);

    // 捕获阶段拦截点击（无遮罩，但点击其他地方会被拦截并提示）
    const handler = function(e) {
        const clicked = e.target;
        if (target.contains(clicked) || clicked === target) {
            cleanup();
            if (onSuccess) onSuccess();
        } else {
            e.stopPropagation();
            e.preventDefault();
            const name = targetName || '目标元素';
            showWarningModal(`请先点击「${name}」才能继续教程。`, skipCallback || skipTutorial);
        }
    };
    document.addEventListener('click', handler, true);

    function cleanup() {
        document.removeEventListener('click', handler, true);
        if (tip.parentNode) tip.remove();
        if (target) {
            target.classList.remove('tutorial-highlight');
        }
        _guidedCleanup = null;
    }

    _guidedCleanup = cleanup;
}

// ========== 警告弹窗 ==========
function showWarningModal(message, skipCallback) {
    if (document.getElementById('warningModal')) return;
    const html = `<div class="global-overlay" id="warningModal">
        <div class="modal-box" style="text-align:center; max-width:400px;">
            <div style="font-size:2em;">👆</div>
            <p style="font-weight:600; margin:10px 0;">${message}</p>
            <div style="display:flex;gap:10px;margin-top:15px;">
                <button class="btn" id="warningSkipBtn" style="background:#ccc;color:#666;flex:1;">跳过引导</button>
                <button class="btn" id="warningOkBtn" style="background:var(--accent);flex:1;">知道了</button>
            </div>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'warningModal');
    modal.querySelector('#warningSkipBtn').addEventListener('click', function() {
        modal.remove();
        cleanupGuidedStep();
        if (skipCallback) skipCallback();
        else skipTutorial();
    });
    modal.querySelector('#warningOkBtn').addEventListener('click', function() {
        modal.remove();
    });
}

// ========== 欢迎步骤 ==========
function showWelcomeStep() {
    const html = `
        <div class="modal-overlay" id="tutorialModal">
            <div class="modal-box" style="max-width:500px;">
                <div style="text-align:center;font-size:3em;margin-bottom:10px;">🌸</div>
                <h2 style="text-align:center;color:var(--accent);">欢迎来到兽世大陆</h2>
                <div style="line-height:2;font-size:0.95em;">
                    <p>你——<b>${state.player.name}</b>，原本是一名21世纪的普通大学生。</p>
                    <p>在一次意外中，你穿越到了这个由<b>肉食兽人</b>统治的原始世界。</p>
                    <hr style="border-color:var(--border);margin:12px 0;">
                    <p>📖 这个世界被称为<b>"兽世大陆"</b>，强大的肉食兽人占据着统治地位，<b>弱肉强食</b>是这里的生存法则。</p>
                    <p style="font-size:0.9em;color:var(--text2);">🐺 霜月狼族 · 🐯 赤金虎族 · 🦊 九尾玄狐<br>🐻 大地熊族 · 🦅 苍羽鹰族 · 🐍 碧鳞蛇族</p>
                    <p style="font-size:0.8em;color:var(--text2);">—— 六大肉食兽人族群共同统治着这片大陆</p>
                    <hr style="border-color:var(--border);margin:12px 0;">
                    <p>❤️ <b>你的目标</b>：在这个弱肉强食的世界中生存下去，<br>并与兽人建立羁绊，书写属于你的恋歌。</p>
                    <p style="font-size:0.8em;color:var(--text2);">📊 <b>数值说明</b>：生命值归零会生病，魅力影响偶遇概率，直觉影响解锁概率，体质影响受伤概率。</p>
                </div>
                <div style="display:flex;gap:10px;margin-top:15px;justify-content:center;">
                    <button class="btn" id="tutorialSkipBtn" style="flex:1;background:#ccc;color:#666;">跳过指导</button>
                    <button class="btn" id="tutorialNextBtn" style="flex:2;background:var(--accent);">下一步 →</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    const modal = document.getElementById('tutorialModal');
    modal.querySelector('#tutorialNextBtn').addEventListener('click', () => {
        modal.remove();
        state.player.tutorialStep = TUTORIAL_STEPS.CLICK_PLACES;
        showClickPlacesStep();
    });
    modal.querySelector('#tutorialSkipBtn').addEventListener('click', () => {
        modal.remove();
        skipTutorial();
    });
}

// ========== 步骤2：强制点击地点标签 ==========
function showClickPlacesStep() {
    const targetSelector = '.nav-item[data-tab="places"]';
    const guideText = '👆 请点击底部导航栏的「📍地点」标签';
    const targetName = '「📍地点」标签';
    const onSuccess = () => {
        state.currentTab = 'places';
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const nav = document.querySelector(targetSelector);
        if (nav) nav.classList.add('active');
        renderPlaces();
        state.player.tutorialStep = TUTORIAL_STEPS.PLACES_INTRO;
        showPlacesIntroStep();
    };
    showGuidedStep(targetSelector, guideText, onSuccess, null, targetName);
}

// ========== 步骤3：地点介绍 ==========
function showPlacesIntroStep() {
    const html = `
        <div class="modal-overlay" id="tutorialModal">
            <div class="modal-box" style="max-width:500px;">
                <div style="text-align:center;font-size:3em;margin-bottom:10px;">📍</div>
                <h2 style="text-align:center;color:var(--accent);">探索地点</h2>
                <div style="line-height:2;font-size:0.95em;">
                    <p>这是<b>地点页</b>，你可以在这里探索兽世大陆的各个角落。</p>
                    <hr style="border-color:var(--border);margin:12px 0;">
                    <p>🏠 <b>我家</b>：休息恢复生命，制作礼物，写日记</p>
                    <p>🏛️ <b>部落广场</b>：帮忙杂务、与居民聊天、查看公告</p>
                    <p>💪 <b>训练场</b>：锻炼身体，提升生命上限 ⭐</p>
                    <p>🔨 <b>铁匠铺</b>：帮忙锻造，学习技艺</p>
                    <p>🌊 <b>河边</b>：抓鱼、洗衣服、采花探索</p>
                    <p>🛒 <b>市场</b>：闲逛购物、购买礼物、打听消息</p>
                    <hr style="border-color:var(--border);margin:12px 0;">
                    <p>💡 不断探索新地点，可能会发现隐藏区域和邂逅兽人哦！</p>
                </div>
                <div style="display:flex;gap:10px;margin-top:15px;justify-content:center;">
                    <button class="btn" id="tutorialSkipBtn" style="flex:1;background:#ccc;color:#666;">跳过指导</button>
                    <button class="btn" id="tutorialNextBtn" style="flex:2;background:var(--accent);">下一步：去训练场 →</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    const modal = document.getElementById('tutorialModal');
    modal.querySelector('#tutorialNextBtn').addEventListener('click', () => {
        modal.remove();
        state.player.tutorialStep = TUTORIAL_STEPS.CLICK_TRAINING;
        showClickTrainingStep();
    });
    modal.querySelector('#tutorialSkipBtn').addEventListener('click', () => {
        modal.remove();
        skipTutorial();
    });
}

// ========== 步骤4：强制点击训练场 ==========
function showClickTrainingStep() {
    const targetSelector = '.place-item[data-place="训练场"]';
    const guideText = '👆 请点击地点页中的「训练场」图标';
    const targetName = '「训练场」';
    const onSuccess = () => {
        const actionModal = document.getElementById('actionModal');
        if (actionModal) actionModal.remove();
        state.player._lieyangFirstMeetDone = true;
        const lieyang = state.guys.find(g => g.id === 'lieyang');
        if (lieyang) lieyang.locked = false;
        state.player.tutorialStep = TUTORIAL_STEPS.TRAINING_INTRO;
        showTrainingIntroStep();
    };
    showGuidedStep(targetSelector, guideText, onSuccess, null, targetName);
}

// ========== 步骤5：训练场相遇介绍 ==========
function showTrainingIntroStep() {
    const html = `
        <div class="modal-overlay" id="tutorialModal">
            <div class="modal-box" style="max-width:500px;">
                <div style="text-align:center;font-size:3em;margin-bottom:10px;">🐯</div>
                <h2 style="text-align:center;color:var(--accent);">邂逅烈阳</h2>
                <div style="line-height:2;font-size:0.95em;">
                    <p>你在训练场遇到了 <b>烈阳</b>！</p>
                    <p style="font-size:1.2em;color:#e08a3a;">🐯 赤金虎族 · 部落最强战士</p>
                    <hr style="border-color:var(--border);margin:12px 0;">
                    <p>"嘿！你就是部落新来的那个女孩？要不要一起练练？"</p>
                    <p style="color:var(--text2);">—— 烈阳热情地向你打招呼</p>
                    <hr style="border-color:var(--border);margin:12px 0;">
                    <p>💡 <b>男主系统</b>：兽世中有多位可攻略男主，<br>你需要在各地探索，与他们相遇并建立羁绊。</p>
                    <p>💡 每个男主都有独特的性格、背景和故事线。</p>
                </div>
                <div style="display:flex;gap:10px;margin-top:15px;justify-content:center;">
                    <button class="btn" id="tutorialSkipBtn" style="flex:1;background:#ccc;color:#666;">跳过指导</button>
                    <button class="btn" id="tutorialNextBtn" style="flex:2;background:var(--accent);">下一步 →</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    const modal = document.getElementById('tutorialModal');
    modal.querySelector('#tutorialNextBtn').addEventListener('click', () => {
        modal.remove();
        state.player.tutorialStep = TUTORIAL_STEPS.CLICK_GUYS;
        showClickGuysStep();
    });
    modal.querySelector('#tutorialSkipBtn').addEventListener('click', () => {
        modal.remove();
        skipTutorial();
    });
}

// ========== 步骤6：强制点击男主标签 ==========
function showClickGuysStep() {
    const targetSelector = '.nav-item[data-tab="guys"]';
    const guideText = '👆 请点击底部导航栏的「❤️男主」标签';
    const targetName = '「❤️男主」标签';
    const onSuccess = () => {
        state.currentTab = 'guys';
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const nav = document.querySelector(targetSelector);
        if (nav) nav.classList.add('active');
        renderGuyList();
        state.player.tutorialStep = TUTORIAL_STEPS.CLICK_LIEYANG;
        setTimeout(() => {
            showClickLieyangCard();
        }, 300);
    };
    showGuidedStep(targetSelector, guideText, onSuccess, null, targetName);
}

// ========== 步骤7：强制点击烈阳卡片 ==========
function showClickLieyangCard() {
    const targetSelector = '.guy-card[data-guy-id="lieyang"]';
    const guideText = '👆 请点击高亮的「烈阳」卡片查看详情';
    const targetName = '「烈阳」卡片';
    const onSuccess = () => {
        const card = document.querySelector(targetSelector);
        if (card) {
            card.classList.remove('tutorial-highlight');
            card.click();
        }
        state.player.tutorialStep = TUTORIAL_STEPS.GUY_DETAIL_INTRO;
        setTimeout(() => {
            showGuyDetailIntroStep();
        }, 500);
    };
    setTimeout(() => {
        showGuidedStep(targetSelector, guideText, onSuccess, null, targetName);
    }, 100);
}

// ========== 步骤8：男主详情介绍 ==========
function showGuyDetailIntroStep() {
    const html = `
        <div class="modal-overlay" id="tutorialModal">
            <div class="modal-box" style="max-width:500px;">
                <div style="text-align:center;font-size:3em;margin-bottom:10px;">📖</div>
                <h2 style="text-align:center;color:var(--accent);">男主详情</h2>
                <div style="line-height:2;font-size:0.95em;">
                    <p>这是男主的详情页，你可以看到：</p>
                    <p>• <b>基本信息</b>：种族、性格、年龄</p>
                    <p>• <b>背景故事</b>：了解他的过去</p>
                    <p>• <b>好感度</b>：❤️ 影响你们的关系发展</p>
                    <p>• <b>占有欲</b>：🔒 过高可能导致特殊剧情</p>
                    <hr style="border-color:var(--border);margin:12px 0;">
                    <p>💡 现在请点击返回，然后查看 <b>「👥角色」</b> 页。</p>
                </div>
                <div style="display:flex;gap:10px;margin-top:15px;justify-content:center;">
                    <button class="btn" id="tutorialSkipBtn" style="flex:1;background:#ccc;color:#666;">跳过指导</button>
                    <button class="btn" id="tutorialNextBtn" style="flex:2;background:var(--accent);">返回并查看角色页 →</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    const modal = document.getElementById('tutorialModal');
    modal.querySelector('#tutorialNextBtn').addEventListener('click', () => {
        modal.remove();
        state.currentTab = 'npcs';
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const nav = document.querySelector('.nav-item[data-tab="npcs"]');
        if (nav) nav.classList.add('active');
        renderNPCList();
        state.player.tutorialStep = TUTORIAL_STEPS.CLICK_NPCS;
        setTimeout(() => {
            showClickNPCsStep();
        }, 300);
    });
    modal.querySelector('#tutorialSkipBtn').addEventListener('click', () => {
        modal.remove();
        skipTutorial();
    });
}

// ========== 步骤9：角色页介绍 ==========
function showClickNPCsStep() {
    state.player.tutorialStep = TUTORIAL_STEPS.NPC_INTRO;
    showNPCIntroStep();
}

// ========== 步骤10：角色页介绍 ==========
function showNPCIntroStep() {
    const html = `
        <div class="modal-overlay" id="tutorialModal">
            <div class="modal-box" style="max-width:500px;">
                <div style="text-align:center;font-size:3em;margin-bottom:10px;">👥</div>
                <h2 style="text-align:center;color:var(--accent);">角色系统</h2>
                <div style="line-height:2;font-size:0.95em;">
                    <p>这是 <b>角色页</b>，记录了你遇到的所有兽人。</p>
                    <hr style="border-color:var(--border);margin:12px 0;">
                    <p>👤 包括：<b>部落居民、商人、医女</b>等各色兽人</p>
                    <p>💕 与他们互动可以提升 <b>友好值</b></p>
                    <p>🎁 送礼或拜访可以增加友好度，生日当天送礼效果加倍！</p>
                    <hr style="border-color:var(--border);margin:12px 0;">
                    <p style="color:var(--accent);">💡 友好值越高，他们越愿意帮助你哦！</p>
                </div>
                <div style="display:flex;gap:10px;margin-top:15px;justify-content:center;">
                    <button class="btn" id="tutorialSkipBtn" style="flex:1;background:#ccc;color:#666;">跳过指导</button>
                    <button class="btn" id="tutorialNextBtn" style="flex:2;background:var(--accent);">下一步：查看设置 →</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    const modal = document.getElementById('tutorialModal');
    modal.querySelector('#tutorialNextBtn').addEventListener('click', () => {
        modal.remove();
        state.player.tutorialStep = TUTORIAL_STEPS.CLICK_SETTINGS;
        showClickSettingsStep();
    });
    modal.querySelector('#tutorialSkipBtn').addEventListener('click', () => {
        modal.remove();
        skipTutorial();
    });
}

// ========== 步骤11：强制点击设置标签 ==========
function showClickSettingsStep() {
    const targetSelector = '.nav-item[data-tab="settings"]';
    const guideText = '👆 请点击底部导航栏的「⚙️设置」标签';
    const targetName = '「⚙️设置」标签';
    const onSuccess = () => {
        state.currentTab = 'settings';
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const nav = document.querySelector(targetSelector);
        if (nav) nav.classList.add('active');
        renderSettings();
        setTimeout(() => {
            completeTutorial();
        }, 500);
    };
    showGuidedStep(targetSelector, guideText, onSuccess, null, targetName);
}

// ========== 完成引导 ==========
function completeTutorial() {
    state.player.tutorialStep = -1;
    addLog('🎉 新手指导已完成！你现在可以自由探索兽世大陆了。');
    state.currentTab = 'home';
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const homeNav = document.querySelector('.nav-item[data-tab="home"]');
    if (homeNav) homeNav.classList.add('active');
    renderHome();
    updateTopBar();
    showToast('🌸 祝你好运，冒险者！');

    const html = `
        <div class="modal-overlay" id="tutorialCompleteModal">
            <div class="modal-box" style="max-width:500px;text-align:center;">
                <div style="font-size:4em;margin-bottom:10px;">🎉</div>
                <h2 style="color:var(--accent);">新手指导完成！</h2>
                <div style="line-height:2;font-size:0.95em;">
                    <p>你已经了解了兽世大陆的基本玩法。</p>
                    <hr style="border-color:var(--border);margin:12px 0;">
                    <p>📌 快速回顾：</p>
                    <p>📍 探索地点 → 邂逅兽人 → 提升好感</p>
                    <p>💕 建立羁绊 → 解锁剧情 → 达成结局</p>
                    <hr style="border-color:var(--border);margin:12px 0;">
                    <p style="color:var(--accent);">愿你在兽世找到属于自己的幸福！🌸</p>
                </div>
                <button class="btn" id="closeCompleteBtn" style="width:100%;background:var(--accent);">开始冒险！</button>
            </div>
        </div>
    `;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    document.getElementById('closeCompleteBtn').addEventListener('click', () => {
        document.getElementById('tutorialCompleteModal').remove();
        renderHome();
    });
}