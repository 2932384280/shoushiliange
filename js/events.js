import { state, getGuy, addLog, updateTopBar, advanceTime, autoSave } from './state.js';
import { showGlobalModal, showToast } from './ui.js';
import { renderHome, renderPlaces, showActionResult } from './render.js';
import { checkHealthStatus } from './actions.js'; // 注意，这里可能会循环，但 actions.js 中 checkHealthStatus 已定义，此处导入不会有问题，因为 checkHealthStatus 不依赖 events

export function triggerDisaster() {
    const disasters = [
        { name:'暴雨', desc:'突如其来的暴雨淹没了部落低洼处。', dmg:()=>10+Math.floor(Math.random()*15) },
        { name:'野兽袭击', desc:'夜间有野兽闯入部落边缘。', dmg:()=>8+Math.floor(Math.random()*18) },
        { name:'瘟疫', desc:'部落里出现了轻微的传染病。', dmg:()=>5+Math.floor(Math.random()*20) },
        { name:'山火', desc:'远处的山林起火，部落全员扑救。', dmg:()=>15+Math.floor(Math.random()*10) }
    ];
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