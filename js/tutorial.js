// tutorial.js - 新手引导系统（交互式高亮引导，不强制弹窗，错误点击弹出警告）
import { state, addLog, updateTopBar, getGuy, reorderPlaces } from './state.js';
import { showToast, showGlobalModal } from './ui.js';
import { renderHome, renderPlaces, renderGuyList, renderNPCList, renderSettings } from './render.js';

// ========== 引导步骤定义 ==========
const TUTORIAL_STEPS = {
    WELCOME: 1,
    CLICK_PLACES: 2,
    PLACES_INTRO: 3,
    TRAINING: 4,
    MEET_LIEYANG: 5,
    GUY_LIST: 6,
    NPC_LIST: 7,
    SETTINGS: 8,
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
    addLog('你选择跳过新手指导，直接开始了冒险。');
    showToast('已跳过新手指导');
    // 移除所有教程样式
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.style.border = '';
        el.style.boxShadow = '';
        el.style.animation = '';
        el.classList.remove('tutorial-highlight');
    });
    document.querySelectorAll('.tutorial-overlay').forEach(el => el.remove());
    state.currentTab = 'home';
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const homeNav = document.querySelector('.nav-item[data-tab="home"]');
    if (homeNav) homeNav.classList.add('active');
    renderHome();
}

// ========== 显示警告弹窗（引导错误） ==========
function showWarningModal(message, skipCallback) {
    // 防止重复弹窗
    if (document.getElementById('warningModal')) return;
    const html = `<div class="global-overlay" id="warningModal">
        <div class="modal-box" style="text-align:center;">
            <div style="font-size:2em;">👆</div>
            <p>${message}</p>
            <div style="display:flex;gap:10px;margin-top:15px;">
                <button class="btn" id="warningSkipBtn" style="background:#ccc;color:#666;">跳过引导</button>
                <button class="btn" id="warningOkBtn" style="background:var(--accent);">知道了</button>
            </div>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'warningModal');
    modal.querySelector('#warningSkipBtn').addEventListener('click', () => {
        modal.remove();
        if (skipCallback) skipCallback();
        else skipTutorial();
    });
    modal.querySelector('#warningOkBtn').addEventListener('click', () => {
        modal.remove();
    });
}

// ========== 通用引导步骤（高亮目标，等待点击） ==========
function showGuidedStep(targetSelector, guideText, onSuccess, skipCallback, targetName) {
    // 创建半透明引导遮罩（不阻挡点击）
    const overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay';
    overlay.id = 'tutorialGuidedOverlay';
    overlay.innerHTML = `
        <div class="modal-box" style="text-align:center; pointer-events: auto; max-width: 400px;">
            <div style="font-size:1.5em; margin-bottom:8px;">👆</div>
            <p style="font-size:1.1em; font-weight:600; color:var(--accent);">${guideText}</p>
            <p style="font-size:0.8em; color:var(--text2); margin-top:4px;">点击错误区域会有提示</p>
        </div>
    `;
    document.body.appendChild(overlay);

    // 高亮目标元素
    const target = document.querySelector(targetSelector);
    if (target) {
        target.classList.add('tutorial-highlight');
        target.style.border = '3px solid var(--accent)';
        target.style.boxShadow = '0 0 20px rgba(255,105,180,0.7)';
        target.style.animation = 'pulse 1s ease-in-out infinite';
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // 监听点击事件（捕获阶段，以便提前拦截）
    const handler = function(e) {
        const clicked = e.target;
        // 判断点击是否在目标元素内部（或目标元素本身）
        const isTarget = clicked.closest && clicked.closest(targetSelector);
        if (isTarget) {
            // 正确点击目标
            e.stopPropagation();
            e.preventDefault();
            // 移除引导
            overlay.remove();
            if (target) {
                target.style.border = '';
                target.style.boxShadow = '';
                target.style.animation = '';
                target.classList.remove('tutorial-highlight');
            }
            document.removeEventListener('click', handler, true);
            // 执行成功回调
            if (onSuccess) onSuccess();
        } else {
            // 点击了其他地方，阻止默认行为（避免触发其他操作）
            e.stopPropagation();
            e.preventDefault();
            // 弹出警告
            const name = targetName || '目标元素';
            showWarningModal(`请先点击「${name}」才能继续教程。<br>或者点击「跳过引导」跳过整个教程。`, skipCallback);
        }
    };
    // 使用捕获阶段确保我们优先处理
    document.addEventListener('click', handler, true);

    // 存储清理函数以便在跳过时移除
    window._guidedCleanup = function() {
        document.removeEventListener('click', handler, true);
        overlay.remove();
        if (target) {
            target.style.border = '';
            target.style.boxShadow = '';
            target.style.animation = '';
            target.classList.remove('tutorial-highlight');
        }
    };
}

// ========== 开始引导 ==========
export function startTutorial() {
    state.player.tutorialStep = TUTORIAL_STEPS.WELCOME;
    showWelcomeStep();
}

// ========== 步骤1：欢迎与背景介绍 ==========
function showWelcomeStep() {
    const html = `<div class="global-overlay" id="tutorialModal">
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
            <div style="display:flex;gap:10px;margin-top:15px;">
                <button class="btn" id="skipTutorialBtn" style="flex:1;background:#ccc;">跳过指导</button>
                <button class="btn" id="nextTutorialBtn" style="flex:2;background:var(--accent);">下一步：前往地点页 →</button>
            </div>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'tutorialModal');
    modal.querySelector('#nextTutorialBtn').addEventListener('click', () => {
        modal.remove();
        state.player.tutorialStep = TUTORIAL_STEPS.CLICK_PLACES;
        showClickPlacesStep();
    });
    modal.querySelector('#skipTutorialBtn').addEventListener('click', () => {
        modal.remove();
        skipTutorial();
    });
}

// ========== 步骤2：引导点击地点标签 ==========
function showClickPlacesStep() {
    const targetSelector = '.nav-item[data-tab="places"]';
    const guideText = '请点击底部导航栏的「📍地点」标签';
    const targetName = '「📍地点」标签';
    const onSuccess = () => {
        state.currentTab = 'places';
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const navItem = document.querySelector(targetSelector);
        if (navItem) navItem.classList.add('active');
        renderPlaces();
        state.player.tutorialStep = TUTORIAL_STEPS.PLACES_INTRO;
        showPlacesIntroStep();
    };
    showGuidedStep(targetSelector, guideText, onSuccess, null, targetName);
}

// ========== 步骤3：地点介绍 ==========
function showPlacesIntroStep() {
    const html = `<div class="global-overlay" id="tutorialModal">
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
                <p>💡 <b>提示</b>：不断探索新地点，可能会发现隐藏区域和邂逅兽人哦！</p>
            </div>
            <div style="display:flex;gap:10px;margin-top:15px;">
                <button class="btn" id="skipTutorialBtn" style="flex:1;background:#ccc;">跳过指导</button>
                <button class="btn" id="nextTutorialBtn" style="flex:2;background:var(--accent);">下一步：去训练场 →</button>
            </div>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'tutorialModal');
    modal.querySelector('#nextTutorialBtn').addEventListener('click', () => {
        modal.remove();
        state.player.tutorialStep = TUTORIAL_STEPS.TRAINING;
        guideToTraining();
    });
    modal.querySelector('#skipTutorialBtn').addEventListener('click', () => {
        modal.remove();
        skipTutorial();
    });
}

// ========== 步骤4：引导点击训练场（特殊处理：阻止默认行动弹窗） ==========
function guideToTraining() {
    const targetSelector = '.place-item[data-place="训练场"]';
    const guideText = '请点击地点页中的「训练场」图标';
    const targetName = '「训练场」';
    // 成功回调：进入相遇剧情
    const onSuccess = () => {
        // 由于训练场点击原本会打开行动模态，我们在这里拦截后直接触发相遇
        state.player.tutorialStep = TUTORIAL_STEPS.MEET_LIEYANG;
        // 移除可能存在的行动模态
        const actionModal = document.getElementById('actionModal');
        if (actionModal) actionModal.remove();
        showTrainingFirstMeet();
    };
    // 由于需要阻止默认行为，我们在 showGuidedStep 中已经使用了 preventDefault 和 stopPropagation
    // 所以不需要额外处理
    showGuidedStep(targetSelector, guideText, onSuccess, null, targetName);
}

// ========== 步骤5：训练场第一次遇到烈阳 ==========
function showTrainingFirstMeet() {
    state.player.firstTrainingDone = true;
    state.player._lieyangFirstMeetDone = true;
    
    const lieyang = getGuy('lieyang');
    if (lieyang) {
        lieyang.locked = false;
        lieyang.affection = 5;
    }

    const html = `<div class="global-overlay" id="tutorialModal">
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
            <button class="btn" id="closeTutorialBtn" style="width:100%;background:var(--accent);">继续</button>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'tutorialModal');
    modal.querySelector('#closeTutorialBtn').addEventListener('click', () => {
        modal.remove();
        state.player.tutorialStep = TUTORIAL_STEPS.GUY_LIST;
        guideToGuyList();
    });
}

// ========== 步骤6：引导点击男主标签 ==========
function guideToGuyList() {
    const targetSelector = '.nav-item[data-tab="guys"]';
    const guideText = '请点击底部导航栏的「❤️男主」标签';
    const targetName = '「❤️男主」标签';
    const onSuccess = () => {
        state.currentTab = 'guys';
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const navItem = document.querySelector(targetSelector);
        if (navItem) navItem.classList.add('active');
        renderGuyList();
        // 进入下一步：高亮烈阳卡片
        setTimeout(() => {
            state.player.tutorialStep = TUTORIAL_STEPS.GUY_LIST; // 复用步骤6
            highlightGuyCard('lieyang');
        }, 300);
    };
    showGuidedStep(targetSelector, guideText, onSuccess, null, targetName);
}

// ========== 子步骤：引导点击烈阳卡片 ==========
function highlightGuyCard(guyId) {
    const targetSelector = `.guy-card[data-guy-id="${guyId}"]`;
    const guideText = '请点击高亮的「烈阳」卡片查看详情';
    const targetName = '「烈阳」卡片';
    const onSuccess = () => {
        // 移除高亮
        const card = document.querySelector(targetSelector);
        if (card) {
            card.style.border = '';
            card.style.boxShadow = '';
            card.style.animation = '';
            card.classList.remove('tutorial-highlight');
        }
        // 进入详情页（由卡片原有点击事件触发，但我们这里手动触发）
        // 由于我们阻止了默认点击，需要手动调用渲染详情
        // 但也可以直接触发卡片点击事件
        if (card) {
            card.click(); // 触发原有的点击事件（由 renderGuyList 绑定的）
        }
        // 进入下一步：介绍详情
        setTimeout(() => {
            state.player.tutorialStep = TUTORIAL_STEPS.NPC_LIST;
            showGuyDetailGuide();
        }, 500);
    };
    showGuidedStep(targetSelector, guideText, onSuccess, null, targetName);
}

// ========== 步骤7：男主详情介绍 ==========
function showGuyDetailGuide() {
    const html = `<div class="global-overlay" id="tutorialModal">
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
            <button class="btn" id="closeTutorialBtn" style="width:100%;background:var(--accent);">返回并查看角色页</button>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'tutorialModal');
    modal.querySelector('#closeTutorialBtn').addEventListener('click', () => {
        modal.remove();
        state.currentTab = 'npcs';
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelector('.nav-item[data-tab="npcs"]')?.classList.add('active');
        renderNPCList();
        setTimeout(() => {
            state.player.tutorialStep = TUTORIAL_STEPS.NPC_LIST;
            showNPCListGuide();
        }, 500);
    });
}

// ========== 步骤8：角色页介绍 ==========
function showNPCListGuide() {
    const html = `<div class="global-overlay" id="tutorialModal">
        <div class="modal-box" style="max-width:500px;">
            <div style="text-align:center;font-size:3em;margin-bottom:10px;">👥</div>
            <h2 style="text-align:center;color:var(--accent);">角色系统</h2>
            <div style="line-height:2;font-size:0.95em;">
                <p>这是 <b>角色页</b>，记录了你遇到的所有兽人。</p>
                <hr style="border-color:var(--border);margin:12px 0;">
                <p>👤 包括：<b>部落居民、商人、医女</b>等各色兽人</p>
                <p>💕 与他们互动可以提升 <b>友好值</b></p>
                <p>🎁 送礼或拜访可以增加友好度</p>
                <p>🎂 生日当天送礼效果加倍！</p>
                <hr style="border-color:var(--border);margin:12px 0;">
                <p style="color:var(--accent);">💡 友好值越高，他们越愿意帮助你哦！</p>
            </div>
            <button class="btn" id="closeTutorialBtn" style="width:100%;background:var(--accent);">继续：查看设置</button>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'tutorialModal');
    modal.querySelector('#closeTutorialBtn').addEventListener('click', () => {
        modal.remove();
        state.player.tutorialStep = TUTORIAL_STEPS.SETTINGS;
        guideToSettings();
    });
}

// ========== 步骤9：引导点击设置标签 ==========
function guideToSettings() {
    const targetSelector = '.nav-item[data-tab="settings"]';
    const guideText = '请点击底部导航栏的「⚙️设置」标签';
    const targetName = '「⚙️设置」标签';
    const onSuccess = () => {
        state.currentTab = 'settings';
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const navItem = document.querySelector(targetSelector);
        if (navItem) navItem.classList.add('active');
        renderSettings();
        // 完成教程
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
    
    const html = `<div class="global-overlay" id="tutorialCompleteModal">
        <div class="modal-box" style="max-width:500px;text-align:center;">
            <div style="font-size:4em;margin-bottom:10px;">🎉</div>
            <h2 style="color:var(--accent);">新手指导完成！</h2>
            <div style="line-height:2;font-size:0.95em;">
                <p>你已经掌握了兽世大陆的基本玩法。</p>
                <hr style="border-color:var(--border);margin:12px 0;">
                <p>📌 <b>快速回顾</b>：</p>
                <p>📍 探索地点 → 邂逅兽人 → 提升好感</p>
                <p>💕 建立羁绊 → 解锁剧情 → 达成结局</p>
                <hr style="border-color:var(--border);margin:12px 0;">
                <p style="color:var(--accent);">愿你在兽世找到属于自己的幸福！🌸</p>
            </div>
            <button class="btn" id="closeCompleteBtn" style="width:100%;background:var(--accent);">开始冒险！</button>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'tutorialCompleteModal');
    modal.querySelector('#closeCompleteBtn').addEventListener('click', () => {
        modal.remove();
        renderHome();
        showToast('🌸 祝你好运，冒险者！');
    });
}

// ========== 导出 ==========
export { TUTORIAL_STEPS };