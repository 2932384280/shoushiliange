// tutorial.js - 极简新手引导（纯弹窗，不强制点击，不遮挡底栏）
import { state, addLog, updateTopBar } from './state.js';
import { showToast } from './ui.js';
import { renderHome, renderPlaces, renderGuyList, renderNPCList, renderSettings } from './render.js';

// ========== 引导步骤定义 ==========
const TUTORIAL_STEPS = {
    WELCOME: 1,
    PLACES: 2,
    TRAINING: 3,
    GUYS: 4,
    NPCS: 5,
    SETTINGS: 6,
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
    addLog('你跳过了新手指导。');
    showToast('已跳过新手指导');
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

// ========== 通用弹窗创建函数（在内容区域内，不遮底栏） ==========
function showTutorialModal(html, onNext, onSkip) {
    // 移除旧弹窗
    const old = document.getElementById('tutorialModal');
    if (old) old.remove();
    const modalHtml = `<div class="modal-overlay" id="tutorialModal">
        <div class="modal-box" style="max-width:500px;">
            ${html}
            <div style="display:flex;gap:10px;margin-top:15px;justify-content:center;">
                <button class="btn" id="tutorialSkipBtn" style="flex:1;background:#ccc;color:#666;">跳过指导</button>
                <button class="btn" id="tutorialNextBtn" style="flex:2;background:var(--accent);">下一步 →</button>
            </div>
        </div>
    </div>`;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', modalHtml);
    const modal = document.getElementById('tutorialModal');
    modal.querySelector('#tutorialNextBtn').addEventListener('click', () => {
        modal.remove();
        if (onNext) onNext();
    });
    modal.querySelector('#tutorialSkipBtn').addEventListener('click', () => {
        modal.remove();
        if (onSkip) onSkip();
        else skipTutorial();
    });
}

// ========== 步骤1：欢迎 ==========
function showWelcomeStep() {
    const html = `
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
    `;
    showTutorialModal(html, () => {
        state.player.tutorialStep = TUTORIAL_STEPS.PLACES;
        showPlacesStep();
    });
}

// ========== 步骤2：地点介绍 ==========
function showPlacesStep() {
    const html = `
        <div style="text-align:center;font-size:3em;margin-bottom:10px;">📍</div>
        <h2 style="text-align:center;color:var(--accent);">探索地点</h2>
        <div style="line-height:2;font-size:0.95em;">
            <p>点击底部导航栏的「<b>📍地点</b>」标签，可以查看所有可探索的区域。</p>
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
    `;
    showTutorialModal(html, () => {
        state.player.tutorialStep = TUTORIAL_STEPS.TRAINING;
        showTrainingStep();
    });
}

// ========== 步骤3：训练场 ==========
function showTrainingStep() {
    const html = `
        <div style="text-align:center;font-size:3em;margin-bottom:10px;">💪</div>
        <h2 style="text-align:center;color:var(--accent);">训练场</h2>
        <div style="line-height:2;font-size:0.95em;">
            <p>在「<b>训练场</b>」你可以锻炼身体，提升生命上限。</p>
            <p>同时，这里也是邂逅 <b>烈阳</b> 的地方！</p>
            <hr style="border-color:var(--border);margin:12px 0;">
            <p>🐯 烈阳：赤金虎族，部落最强战士，热情直率。</p>
            <p>💡 多去训练场逛逛，说不定能遇到他哦！</p>
        </div>
    `;
    showTutorialModal(html, () => {
        state.player.tutorialStep = TUTORIAL_STEPS.GUYS;
        showGuysStep();
    });
}

// ========== 步骤4：男主系统 ==========
function showGuysStep() {
    const html = `
        <div style="text-align:center;font-size:3em;margin-bottom:10px;">❤️</div>
        <h2 style="text-align:center;color:var(--accent);">男主系统</h2>
        <div style="line-height:2;font-size:0.95em;">
            <p>点击底部导航栏的「<b>❤️男主</b>」标签，可以查看所有可攻略角色。</p>
            <hr style="border-color:var(--border);margin:12px 0;">
            <p>每个男主都有自己的性格、背景和故事线。</p>
            <p>通过探索、送礼、约会等方式提升好感度，<br>好感度达到一定数值可能会触发告白或特殊剧情。</p>
            <p style="color:var(--accent);">💡 注意：占有欲过高可能导致囚禁结局哦！</p>
        </div>
    `;
    showTutorialModal(html, () => {
        state.player.tutorialStep = TUTORIAL_STEPS.NPCS;
        showNPCsStep();
    });
}

// ========== 步骤5：角色系统 ==========
function showNPCsStep() {
    const html = `
        <div style="text-align:center;font-size:3em;margin-bottom:10px;">👥</div>
        <h2 style="text-align:center;color:var(--accent);">角色系统</h2>
        <div style="line-height:2;font-size:0.95em;">
            <p>点击底部导航栏的「<b>👥角色</b>」标签，可以查看你遇到的所有兽人居民。</p>
            <hr style="border-color:var(--border);margin:12px 0;">
            <p>与他们互动可以提升友好值，友好值越高，他们越愿意帮助你。</p>
            <p>🎁 送礼或拜访可以增加友好度，生日当天送礼效果加倍！</p>
        </div>
    `;
    showTutorialModal(html, () => {
        state.player.tutorialStep = TUTORIAL_STEPS.SETTINGS;
        showSettingsStep();
    });
}

// ========== 步骤6：设置与存档 ==========
function showSettingsStep() {
    const html = `
        <div style="text-align:center;font-size:3em;margin-bottom:10px;">⚙️</div>
        <h2 style="text-align:center;color:var(--accent);">设置与存档</h2>
        <div style="line-height:2;font-size:0.95em;">
            <p>点击底部导航栏的「<b>⚙️设置</b>」标签，你可以：</p>
            <ul style="text-align:left;list-style:none;padding:0;">
                <li>💾 存档 / 读档（5个存档位）</li>
                <li>🎨 更换UI主题颜色</li>
                <li>🎵 控制背景音乐</li>
                <li>🎂 设置你的生日（男主会在生日当天送礼）</li>
                <li>👤 更换头像</li>
                <li>🏆 查看成就和结局图鉴</li>
            </ul>
            <hr style="border-color:var(--border);margin:12px 0;">
            <p style="color:var(--accent);">💡 建议经常存档，以防不测！</p>
        </div>
    `;
    showTutorialModal(html, () => {
        completeTutorial();
    });
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

    // 显示完成弹窗
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