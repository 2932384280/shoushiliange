// tutorial.js - 新手引导系统（交互式：玩家主动点击，增加等待时间，结束回到主页高亮）
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
    // 切换到主页
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

// ========== 步骤2：引导进入地点页（等待玩家点击） ==========
function showClickPlacesStep() {
    const html = `<div class="global-overlay" id="tutorialModal">
        <div class="modal-box" style="max-width:500px;text-align:center;">
            <div style="font-size:3em;">📍</div>
            <h2 style="color:var(--accent);">第一步：进入地点页</h2>
            <p>请点击底部导航栏的 <b>「📍地点」</b> 标签。</p>
            <p style="font-size:0.8em;color:var(--text2);">等待您点击后继续...</p>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'tutorialModal');
    // 高亮地点标签
    const navItem = document.querySelector('.nav-item[data-tab="places"]');
    if (navItem) {
        navItem.style.border = '3px solid var(--accent)';
        navItem.style.boxShadow = '0 0 20px rgba(255,105,180,0.5)';
        navItem.style.animation = 'pulse 1s ease-in-out infinite';
    }

    // 监听点击事件
    const listener = function(e) {
        const target = e.target.closest('.nav-item[data-tab="places"]');
        if (target) {
            modal.remove();
            document.removeEventListener('click', listener);
            // 移除高亮
            if (navItem) {
                navItem.style.border = '';
                navItem.style.boxShadow = '';
                navItem.style.animation = '';
            }
            // 切换到地点页
            state.currentTab = 'places';
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            target.classList.add('active');
            renderPlaces();
            // 进入下一步
            state.player.tutorialStep = TUTORIAL_STEPS.PLACES_INTRO;
            showPlacesIntroStep();
        }
    };
    document.addEventListener('click', listener);

    // 超时兜底：10秒后若未点击，显示“手动下一步”按钮
    setTimeout(() => {
        const modalEl = document.getElementById('tutorialModal');
        if (modalEl) {
            const btnContainer = modalEl.querySelector('.modal-box');
            if (!btnContainer.querySelector('.timeout-btn')) {
                const btn = document.createElement('button');
                btn.className = 'btn timeout-btn';
                btn.textContent = '我找不到，请帮我切换';
                btn.style.marginTop = '15px';
                btn.style.width = '100%';
                btn.addEventListener('click', function() {
                    modal.remove();
                    document.removeEventListener('click', listener);
                    // 强制切换
                    if (navItem) navItem.click();
                    state.player.tutorialStep = TUTORIAL_STEPS.PLACES_INTRO;
                    showPlacesIntroStep();
                });
                btnContainer.appendChild(btn);
            }
        }
    }, 10000);
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

// ========== 步骤4：引导去训练场（高亮并等待点击） ==========
function guideToTraining() {
    const html = `<div class="global-overlay" id="tutorialModal">
        <div class="modal-box" style="max-width:500px;text-align:center;">
            <div style="font-size:3em;">💪</div>
            <h2 style="color:var(--accent);">前往训练场</h2>
            <p>现在，请在地点页中点击 <b>「训练场」</b> 进入。</p>
            <p style="font-size:0.8em;color:var(--text2);">点击训练场图标即可开始锻炼。</p>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'tutorialModal');
    // 高亮训练场
    const items = document.querySelectorAll('.place-item');
    let targetItem = null;
    items.forEach(item => {
        if (item.dataset.place === '训练场') {
            targetItem = item;
            item.style.border = '3px solid var(--accent)';
            item.style.boxShadow = '0 0 20px rgba(255,105,180,0.5)';
            item.style.animation = 'pulse 1s ease-in-out infinite';
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });

    const clickHandler = function(e) {
        const clicked = e.target.closest('.place-item');
        if (clicked && clicked.dataset.place === '训练场') {
            modal.remove();
            document.removeEventListener('click', clickHandler);
            // 清除高亮
            if (targetItem) {
                targetItem.style.border = '';
                targetItem.style.boxShadow = '';
                targetItem.style.animation = '';
            }
            // 进入训练场（此处需要模拟点击打开行动，但教程中由玩家实际点击后，我们监听事件）
            // 实际上点击训练场会触发 openPlaceActions，但我们直接进入下一步
            // 但为了确保玩家真正进入了训练场，我们检查状态或等待
            // 这里我们直接触发相遇（因为教程中会模拟首次相遇）
            setTimeout(() => {
                state.player.tutorialStep = TUTORIAL_STEPS.MEET_LIEYANG;
                showTrainingFirstMeet();
            }, 500);
        }
    };
    document.addEventListener('click', clickHandler);

    // 超时兜底
    setTimeout(() => {
        const modalEl = document.getElementById('tutorialModal');
        if (modalEl) {
            const btn = document.createElement('button');
            btn.className = 'btn timeout-btn';
            btn.textContent = '我找不到，帮我进入训练场';
            btn.style.marginTop = '15px';
            btn.style.width = '100%';
            btn.addEventListener('click', function() {
                modal.remove();
                document.removeEventListener('click', clickHandler);
                if (targetItem) {
                    targetItem.style.border = '';
                    targetItem.style.boxShadow = '';
                    targetItem.style.animation = '';
                }
                // 强制触发训练场点击
                if (targetItem) targetItem.click();
                // 直接进入下一步
                setTimeout(() => {
                    state.player.tutorialStep = TUTORIAL_STEPS.MEET_LIEYANG;
                    showTrainingFirstMeet();
                }, 500);
            });
            modalEl.querySelector('.modal-box').appendChild(btn);
        }
    }, 10000);
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

// ========== 步骤6：引导查看男主页（等待点击） ==========
function guideToGuyList() {
    const html = `<div class="global-overlay" id="tutorialModal">
        <div class="modal-box" style="max-width:500px;text-align:center;">
            <div style="font-size:3em;">❤️</div>
            <h2 style="color:var(--accent);">查看男主</h2>
            <p>请点击底部导航栏的 <b>「❤️男主」</b> 标签。</p>
            <p style="font-size:0.8em;color:var(--text2);">点击后可以查看已解锁的男主信息。</p>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'tutorialModal');
    const navItem = document.querySelector('.nav-item[data-tab="guys"]');
    if (navItem) {
        navItem.style.border = '3px solid var(--accent)';
        navItem.style.boxShadow = '0 0 20px rgba(255,105,180,0.5)';
        navItem.style.animation = 'pulse 1s ease-in-out infinite';
    }

    const listener = function(e) {
        const target = e.target.closest('.nav-item[data-tab="guys"]');
        if (target) {
            modal.remove();
            document.removeEventListener('click', listener);
            if (navItem) {
                navItem.style.border = '';
                navItem.style.boxShadow = '';
                navItem.style.animation = '';
            }
            state.currentTab = 'guys';
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            target.classList.add('active');
            renderGuyList();
            // 高亮烈阳卡片并等待点击
            setTimeout(() => {
                state.player.tutorialStep = TUTORIAL_STEPS.GUY_LIST;
                highlightGuyCard('lieyang');
            }, 300);
        }
    };
    document.addEventListener('click', listener);

    setTimeout(() => {
        const modalEl = document.getElementById('tutorialModal');
        if (modalEl) {
            const btn = document.createElement('button');
            btn.className = 'btn timeout-btn';
            btn.textContent = '我找不到，帮我切换';
            btn.style.marginTop = '15px';
            btn.style.width = '100%';
            btn.addEventListener('click', function() {
                modal.remove();
                document.removeEventListener('click', listener);
                if (navItem) {
                    navItem.style.border = '';
                    navItem.style.boxShadow = '';
                    navItem.style.animation = '';
                    navItem.click();
                }
                setTimeout(() => {
                    state.player.tutorialStep = TUTORIAL_STEPS.GUY_LIST;
                    highlightGuyCard('lieyang');
                }, 300);
            });
            modalEl.querySelector('.modal-box').appendChild(btn);
        }
    }, 10000);
}

function highlightGuyCard(guyId) {
    const cards = document.querySelectorAll('.guy-card');
    let targetCard = null;
    cards.forEach(card => {
        if (card.dataset.guyId === guyId) {
            targetCard = card;
            card.style.border = '3px solid var(--accent)';
            card.style.boxShadow = '0 0 20px rgba(255,105,180,0.5)';
            card.style.animation = 'pulse 1s ease-in-out infinite';
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });

    const html = `<div class="global-overlay" id="tutorialModal">
        <div class="modal-box" style="max-width:500px;text-align:center;">
            <div style="font-size:2em;">👆</div>
            <p>请点击高亮的 <b>烈阳</b> 卡片查看详情。</p>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'tutorialModal');
    const clickHandler = function(e) {
        const clicked = e.target.closest('.guy-card');
        if (clicked && clicked.dataset.guyId === 'lieyang') {
            modal.remove();
            document.removeEventListener('click', clickHandler);
            if (targetCard) {
                targetCard.style.border = '';
                targetCard.style.boxShadow = '';
                targetCard.style.animation = '';
            }
            // 进入详情页（由原点击事件触发，我们只需进入下一步）
            setTimeout(() => {
                state.player.tutorialStep = TUTORIAL_STEPS.NPC_LIST;
                showGuyDetailGuide();
            }, 800);
        }
    };
    document.addEventListener('click', clickHandler);
    setTimeout(() => {
        const modalEl = document.getElementById('tutorialModal');
        if (modalEl) {
            const btn = document.createElement('button');
            btn.className = 'btn timeout-btn';
            btn.textContent = '我找不到，帮我进入';
            btn.style.marginTop = '15px';
            btn.style.width = '100%';
            btn.addEventListener('click', function() {
                modal.remove();
                document.removeEventListener('click', clickHandler);
                if (targetCard) {
                    targetCard.style.border = '';
                    targetCard.style.boxShadow = '';
                    targetCard.style.animation = '';
                    targetCard.click();
                }
                setTimeout(() => {
                    state.player.tutorialStep = TUTORIAL_STEPS.NPC_LIST;
                    showGuyDetailGuide();
                }, 800);
            });
            modalEl.querySelector('.modal-box').appendChild(btn);
        }
    }, 10000);
}

// ========== 步骤7：引导查看角色页 ==========
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
        // 直接进入下一步
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

// ========== 步骤9：引导查看设置页 ==========
function guideToSettings() {
    const html = `<div class="global-overlay" id="tutorialModal">
        <div class="modal-box" style="max-width:500px;text-align:center;">
            <div style="font-size:3em;">⚙️</div>
            <h2 style="color:var(--accent);">设置与存档</h2>
            <p>请点击底部导航栏的 <b>「⚙️设置」</b> 标签。</p>
            <p style="font-size:0.8em;color:var(--text2);">在设置页你可以存档、换主题、换头像等。</p>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'tutorialModal');
    const navItem = document.querySelector('.nav-item[data-tab="settings"]');
    if (navItem) {
        navItem.style.border = '3px solid var(--accent)';
        navItem.style.boxShadow = '0 0 20px rgba(255,105,180,0.5)';
        navItem.style.animation = 'pulse 1s ease-in-out infinite';
    }

    const listener = function(e) {
        const target = e.target.closest('.nav-item[data-tab="settings"]');
        if (target) {
            modal.remove();
            document.removeEventListener('click', listener);
            if (navItem) {
                navItem.style.border = '';
                navItem.style.boxShadow = '';
                navItem.style.animation = '';
            }
            state.currentTab = 'settings';
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            target.classList.add('active');
            renderSettings();
            // 完成教程
            setTimeout(() => {
                completeTutorial();
            }, 500);
        }
    };
    document.addEventListener('click', listener);

    setTimeout(() => {
        const modalEl = document.getElementById('tutorialModal');
        if (modalEl) {
            const btn = document.createElement('button');
            btn.className = 'btn timeout-btn';
            btn.textContent = '我找不到，帮我切换';
            btn.style.marginTop = '15px';
            btn.style.width = '100%';
            btn.addEventListener('click', function() {
                modal.remove();
                document.removeEventListener('click', listener);
                if (navItem) {
                    navItem.style.border = '';
                    navItem.style.boxShadow = '';
                    navItem.style.animation = '';
                    navItem.click();
                }
                setTimeout(() => {
                    completeTutorial();
                }, 500);
            });
            modalEl.querySelector('.modal-box').appendChild(btn);
        }
    }, 10000);
}

// ========== 完成引导 ==========
function completeTutorial() {
    state.player.tutorialStep = -1;
    addLog('🎉 新手指导已完成！你现在可以自由探索兽世大陆了。');
    
    // 切换到主页并高亮主页标签
    state.currentTab = 'home';
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const homeNav = document.querySelector('.nav-item[data-tab="home"]');
    if (homeNav) homeNav.classList.add('active');
    renderHome();
    updateTopBar();
    
    // 显示完成弹窗
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
        // 确保主页渲染
        renderHome();
        showToast('🌸 祝你好运，冒险者！');
    });
}

// ========== 导出 ==========
export { TUTORIAL_STEPS };