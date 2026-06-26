// events.js - 完整版（适配兽历，新增男主互动剧情）
import { state, getGuy, addLog, updateTopBar, getDateInfo, getSeason, getTodayEvents } from './state.js';
import { showGlobalModal, showToast } from './ui.js';
import { renderHome, renderPlaces, showActionResult } from './render.js';
import { checkHealthStatus, addAffectionAndObsession } from './actions.js';

export function triggerDisaster() {
    const { month } = getDateInfo(state.player.day);
    const season = getSeason(month);
    
    let disasters = [];
    if (season === '夏季') {
        disasters = [
            { name:'干旱', desc:'连续多日无雨，田地干裂。', dmg:()=>10+Math.floor(Math.random()*15) },
            { name:'山火', desc:'烈日引发山林大火，部落组织灭火。', dmg:()=>15+Math.floor(Math.random()*10) }
        ];
    } else if (season === '雨季') {
        disasters = [
            { name:'洪水', desc:'持续暴雨导致河水暴涨，低洼处被淹。', dmg:()=>12+Math.floor(Math.random()*15) },
            { name:'泥石流', desc:'山体滑坡，堵塞了通往密林的路。', dmg:()=>8+Math.floor(Math.random()*18) }
        ];
    } else if (season === '冬季') {
        disasters = [
            { name:'暴风雪', desc:'大雪封山，气温骤降。', dmg:()=>10+Math.floor(Math.random()*10) },
            { name:'雪崩', desc:'远处传来雪崩的轰鸣声。', dmg:()=>5+Math.floor(Math.random()*20) }
        ];
    } else {
        disasters = [
            { name:'倒春寒', desc:'突如其来的寒流冻坏了新芽。', dmg:()=>5+Math.floor(Math.random()*10) },
            { name:'兽潮', desc:'大批野兽迁徙经过部落附近。', dmg:()=>10+Math.floor(Math.random()*15) }
        ];
    }
    
    const disaster = disasters[Math.floor(Math.random() * disasters.length)];
    const loss = disaster.dmg();
    const p = state.player;
    p.stats.health = Math.max(1, p.stats.health - loss);
    addLog(`【天灾】${disaster.name}：${disaster.desc} 生命值减少了${loss}点。`);
    
    const criticalThreshold = Math.min(p.maxHealth * 0.4, 50);
    let caregiverGuy = null;
    if (p.stats.health <= criticalThreshold && p.stats.endurance < 90 && Math.random() < (p.stats.endurance < 50 ? 0.7 : p.stats.endurance < 70 ? 0.4 : 0.15)) {
        const tg = getTopGuy();
        if (tg && Math.random() < 0.6) {
            p.stats.health = Math.min(p.maxHealth, p.stats.health + 15);
            addAffectionAndObsession(tg, 3);
            addLog(`${tg.name}得知你受伤，急忙赶来照顾你，你的生命恢复了15点。`);
            caregiverGuy = tg;
        }
    }
    showDisasterModal(disaster, loss, caregiverGuy);
    checkHealthStatus();
}

function showDisasterModal(disaster, loss, caregiverGuy) {
    const text = caregiverGuy ? `<p style="color:var(--accent);">💕 你受伤很重，${caregiverGuy.name}听闻后焦急地赶来照顾你，为你处理伤口，你的生命值恢复了15点，好感度也提高了。</p>` : '';
    const html = `<div class="global-overlay" id="disasterModal"><div class="modal-box"><div style="font-size:2em;text-align:center;">⚠️</div><b>${disaster.name}</b><p>${disaster.desc}</p><p>生命值减少了 <b>${loss}</b> 点。</p>${text}<button class="btn" id="closeDisaster" style="width:100%;margin-top:10px;">继续</button></div></div>`;
    const modal = showGlobalModal(html, 'disasterModal');
    modal.querySelector('#closeDisaster').addEventListener('click', () => modal.remove());
}

export function triggerRandomEvent(place, originalLog) {
    const events = [
        { desc:'一位兽人拦住你，请你帮忙寻找丢失的幼崽。', choices:[{ text:'热心帮忙', effect:()=>{ state.player.stats.affinity = Math.min(100, state.player.stats.affinity + 2); return'你成功找到了幼崽。'; } },{ text:'婉拒', effect:()=>{ state.player.stats.intuition = Math.min(100, state.player.stats.intuition + 1); return'你选择不多管闲事。'; } }] },
        { desc:'地上出现一个宝箱。', choices:[{ text:'打开', effect:()=>{ if(Math.random()<0.5){ state.player.inventory.push('💎宝石'); return'获得宝石！'; } else { state.player.stats.health = Math.min(state.player.maxHealth, state.player.stats.health + 20); return'获得回复药水。'; } } },{ text:'无视', effect:()=>{ return'你决定不碰未知的东西。'; } }] },
        { desc:'你听到神秘的歌声。', choices:[{ text:'循声而去', effect:()=>{ state.player.stats.endurance = Math.min(100, state.player.stats.endurance + 1); return'体质提升了。'; } },{ text:'留在原地', effect:()=>{ state.player.stats.intuition = Math.min(100, state.player.stats.intuition + 1); return'直觉变得更敏锐。'; } }] }
    ];
    const event = events[Math.floor(Math.random() * events.length)];
    const html = `<div class="modal-overlay" id="eventModal"><div class="modal-box"><div style="font-weight:700;color:var(--accent);">⚡ 突发事件</div><p>${event.desc}</p><div>${event.choices.map((c,i)=>`<button class="btn" style="width:100%;margin:4px 0;" data-choice="${i}">${c.text}</button>`).join('')}</div></div></div>`;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    document.querySelectorAll('#eventModal button').forEach(btn => btn.addEventListener('click', function() {
        const result = event.choices[parseInt(this.dataset.choice)].effect();
        document.getElementById('eventModal').remove();
        showEventResult(result, place, originalLog);
    }));
}

export function triggerHeartEvent(place, guy, originalLog) {
    const events = [
        { desc:`野兽冲了出来！${guy.name}瞬间护在你面前。`, effect:()=>{ addAffectionAndObsession(guy, 5); guy.obsession = Math.min(100, guy.obsession + 2); } },
        { desc:`你差点摔倒，${guy.name}扶住了你。`, effect:()=>{ addAffectionAndObsession(guy, 4); guy.obsession = Math.min(100, guy.obsession + 1); } },
        { desc:`${guy.name}邀请你一起锻炼。`, effect:()=>{ state.player.stats.health = Math.min(state.player.maxHealth, state.player.stats.health + 10); addAffectionAndObsession(guy, 3); } }
    ];
    const event = events[Math.floor(Math.random() * events.length)];
    const html = `<div class="modal-overlay" id="heartModal"><div class="modal-box"><div style="font-weight:700;color:var(--accent);">💕 心动时刻</div><p>${event.desc}</p><button class="btn" id="closeHeart" style="width:100%;margin-top:10px;">继续</button></div></div>`;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    document.getElementById('closeHeart').addEventListener('click', () => {
        event.effect();
        document.getElementById('heartModal').remove();
        showActionResult(originalLog, place);
    });
}

// ========== ★ 新增：男主互动剧情 ==========
export function triggerGuyInteraction(guy1, guy2) {
    if (!guy1 || !guy2) return;
    if (guy1.locked || guy2.locked || guy1.banished || guy2.banished) return;
    if (guy1.affection < 50 || guy2.affection < 50) return;
    
    const interactionId = `${guy1.id}_${guy2.id}`;
    if (state.player.guyInteractions.includes(interactionId)) return;
    
    const interactionPool = [
        {
            condition: () => guy1.affection >= 60 && guy2.affection >= 60,
            text: `${guy1.name}和${guy2.name}在月崖碰上了。两人互相瞪了一眼，${guy1.name}说："你怎么也在这里？"${guy2.name}冷哼一声："该问这句话的是我。"`,
            choices: [
                { text: `拉走${guy1.name}`, effect: () => { addAffectionAndObsession(guy1, 3); guy2.affection = Math.max(0, guy2.affection - 2); addLog(`你拉走了${guy1.name}，${guy2.name}露出不满的表情。`); } },
                { text: `拉走${guy2.name}`, effect: () => { addAffectionAndObsession(guy2, 3); guy1.affection = Math.max(0, guy1.affection - 2); addLog(`你拉走了${guy2.name}，${guy1.name}露出不满的表情。`); } },
                { text: '让他们自己解决', effect: () => { addLog(`${guy1.name}和${guy2.name}不欢而散。`); } }
            ]
        },
        {
            condition: () => guy1.affection >= 70 && guy2.affection >= 70,
            text: `${guy1.name}和${guy2.name}在部落广场相遇。${guy1.name}递了一杯酒给${guy2.name}："喝吗？"${guy2.name}愣了一下，接过了酒杯。两人第一次没有吵架。`,
            choices: [
                { text: '加入他们一起喝', effect: () => { addAffectionAndObsession(guy1, 2); addAffectionAndObsession(guy2, 2); addLog('你加入他们一起喝酒，气氛变得融洽了。'); } },
                { text: '静静看着他们', effect: () => { addAffectionAndObsession(guy1, 1); addAffectionAndObsession(guy2, 1); addLog('你看着他们喝酒，两个兽人难得安静地坐着。'); } }
            ]
        },
        {
            condition: () => guy1.affection >= 80 && guy2.affection >= 80,
            text: `深夜，${guy1.name}和${guy2.name}同时出现在你家门口。两人对视一眼，同时开口："你也来了？"`,
            choices: [
                { text: '邀请他们一起进来', effect: () => { addAffectionAndObsession(guy1, 3); addAffectionAndObsession(guy2, 3); addLog('你邀请两个兽人一起进屋喝茶，他们难得相处融洽。'); } },
                { text: `单独和${guy1.name}说话`, effect: () => { addAffectionAndObsession(guy1, 5); guy2.affection = Math.max(0, guy2.affection - 3); addLog(`${guy2.name}默默离开了。`); } },
                { text: `单独和${guy2.name}说话`, effect: () => { addAffectionAndObsession(guy2, 5); guy1.affection = Math.max(0, guy1.affection - 3); addLog(`${guy1.name}默默离开了。`); } }
            ]
        }
    ];
    
    const available = interactionPool.filter(e => e.condition());
    if (available.length === 0) return;
    
    const selected = available[Math.floor(Math.random() * available.length)];
    state.player.guyInteractions.push(interactionId);
    
    const html = `<div class="global-overlay" id="guyInteractionModal">
        <div class="modal-box">
            <div style="font-weight:700;color:var(--accent);font-size:1.1em;margin-bottom:10px;">⚡ 男主互动事件</div>
            <p style="line-height:1.8;">${selected.text}</p>
            <div class="actions">
                ${selected.choices.map((c, i) => `<button class="btn" data-choice="${i}">${c.text}</button>`).join('')}
            </div>
        </div>
    </div>`;
    const modal = showGlobalModal(html, 'guyInteractionModal');
    modal.querySelectorAll('[data-choice]').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.choice);
            selected.choices[idx].effect();
            modal.remove();
            updateTopBar();
            renderPlaces();
        });
    });
}

function showEventResult(eventText, place, originalLog) {
    const pn = place.name;
    const rl = state.logs.filter(l => l.place === pn).slice(0, 3);
    const hh = rl.length ? rl.map(l => `<div style="text-align:left;font-size:0.75em;border-bottom:1px dotted #ffd6e7;padding:2px 0;"><span style="color:var(--accent);">${l.time}</span> ${l.text}</div>`).join('') : '<div style="color:var(--text2);">暂无近期记录</div>';
    const html = `<div class="modal-overlay" id="eventResultModal"><div class="modal-box"><div style="font-weight:700;color:var(--accent);">⚡ 事件结果</div><div style="margin:15px 0;">${eventText}</div><hr><div style="font-weight:700;color:var(--accent);">📍 ${pn}</div><div style="margin:10px 0;">${originalLog}</div><div style="text-align:left;margin-top:12px;"><div style="font-weight:700;color:var(--accent);margin-bottom:4px;">📜 近期记录</div>${hh}</div><button class="btn" id="closeEventResult" style="width:100%;margin-top:12px;">继续</button></div></div>`;
    document.getElementById('contentArea').insertAdjacentHTML('beforeend', html);
    document.getElementById('closeEventResult').addEventListener('click', () => {
        document.getElementById('eventResultModal').remove();
        renderPlaces();
        checkAndShowPendingDailyEvents();
    });
}

export function checkAndShowPendingDailyEvents() {
    if (state._pendingDailyEvents && state._pendingDailyEvents.length) {
        const events = state._pendingDailyEvents;
        state._pendingDailyEvents = [];
        showCombinedEventModal(events);
    }
}

export function showCombinedEventModal(eventsList) {
    const items = eventsList.map(ev => `<div style="margin-bottom:12px;"><b>${ev.name}</b><br>${ev.desc}<br><span style="color:var(--accent);">📍 ${ev.locations.join('、')}</span></div>`).join('');
    const html = `<div class="global-overlay" id="combinedEventModal"><div class="modal-box"><div style="font-size:1.8em;text-align:center;">🎊 今日活动</div>${items}<button class="btn" id="closeCombinedEvent" style="width:100%;margin-top:10px;">知道了</button></div></div>`;
    const modal = showGlobalModal(html, 'combinedEventModal');
    modal.querySelector('#closeCombinedEvent').addEventListener('click', () => modal.remove());
}