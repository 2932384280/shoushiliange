// cloud.js - 修改：所有 tap 访问增加安全判断
import { state, saveToSlot, loadFromSlot, formatSlotInfo, updateTopBar } from './state.js';
import { showToast, showGlobalModal } from './ui.js';
import { renderHome, render, renderSettings } from './render.js';

let cloudSaveManager = null;
let isCloudSupported = false;

// ========== 初始化（增加 try-catch） ==========
export function initCloudSave() {
    try {
        if (typeof tap === 'undefined') {
            console.warn('⚠️ 不在 TapTap 环境中，云存档不可用');
            isCloudSupported = false;
            return false;
        }
        if (typeof tap.getCloudSaveManager !== 'function') {
            console.warn('⚠️ 当前版本不支持云存档 API');
            isCloudSupported = false;
            return false;
        }
        cloudSaveManager = tap.getCloudSaveManager();
        isCloudSupported = true;
        console.log('✅ 云存档管理器已初始化');
        return true;
    } catch (e) {
        console.error('❌ 初始化云存档失败:', e);
        isCloudSupported = false;
        cloudSaveManager = null;
        return false;
    }
}

export function isCloudSaveSupported() {
    try {
        return isCloudSupported && cloudSaveManager !== null;
    } catch (e) {
        return false;
    }
}

// ========== 上传 ==========
export function uploadArchiveToCloud(slotIndex, archiveName, summary) {
    return new Promise((resolve, reject) => {
        if (!isCloudSaveSupported()) {
            reject(new Error('云存档不可用，请检查网络或登录状态'));
            return;
        }
        const slotKey = `beastLove_slot_${slotIndex}`;
        const localData = localStorage.getItem(slotKey);
        if (!localData) {
            reject(new Error(`本地存档 ${slotIndex} 不存在`));
            return;
        }
        try {
            const fs = tap.getFileSystemManager();
            if (!fs || typeof fs.writeFileSync !== 'function') {
                reject(new Error('文件系统不可用'));
                return;
            }
            const fileName = `save_${Date.now()}.json`;
            const filePath = `${tap.env.USER_DATA_PATH}/${fileName}`;
            fs.writeFileSync(filePath, localData, 'utf8');

            const parsed = JSON.parse(localData);
            const player = parsed.player || {};
            const day = player.day || 0;
            const gold = player.gold || 0;
            const affection = parsed.guys ? parsed.guys.reduce((sum, g) => sum + (g.affection || 0), 0) : 0;
            const name = archiveName || `第${day}天存档`;
            const summaryText = summary || `金币:${gold} 总好感:${affection}`;

            const metaData = {
                name: name,
                summary: summaryText,
                extra: JSON.stringify({
                    version: '1.0',
                    slot: slotIndex,
                    day: day,
                    gold: gold,
                    totalAffection: affection
                }),
                playtime: player.day * 60
            };

            cloudSaveManager.createArchive({
                archiveMetaData: metaData,
                archiveFilePath: filePath,
                success: (res) => {
                    console.log('✅ 云存档上传成功, UUID:', res.uuid);
                    const uploaded = JSON.parse(localStorage.getItem('beastLove_cloud_uploads') || '[]');
                    uploaded.push({
                        uuid: res.uuid,
                        slot: slotIndex,
                        name: metaData.name,
                        summary: summaryText,
                        time: Date.now()
                    });
                    localStorage.setItem('beastLove_cloud_uploads', JSON.stringify(uploaded));
                    showToast('✅ 云存档上传成功！');
                    resolve(res);
                },
                fail: (err) => {
                    console.error('❌ 云存档上传失败:', err);
                    showToast('❌ 上传失败，请检查网络');
                    reject(err);
                }
            });
        } catch (err) {
            console.error('❌ 上传过程异常:', err);
            showToast('❌ 上传异常，请重试');
            reject(err);
        }
    });
}

// ========== 获取列表 ==========
export function getCloudArchiveList() {
    return new Promise((resolve, reject) => {
        if (!isCloudSaveSupported()) {
            reject(new Error('云存档不可用'));
            return;
        }
        cloudSaveManager.getArchiveList({
            success: (res) => {
                const saves = res.saves || [];
                console.log(`✅ 获取到 ${saves.length} 个云存档`);
                resolve(saves);
            },
            fail: (err) => {
                console.error('❌ 获取云存档列表失败:', err);
                reject(err);
            }
        });
    });
}

// ========== 下载并加载 ==========
export function downloadAndRestoreArchive(archiveUUID, archiveFileId, targetSlot) {
    return new Promise((resolve, reject) => {
        if (!isCloudSaveSupported()) {
            reject(new Error('云存档不可用'));
            return;
        }
        try {
            const fs = tap.getFileSystemManager();
            if (!fs || typeof fs.writeFileSync !== 'function') {
                reject(new Error('文件系统不可用'));
                return;
            }
            const targetPath = `${tap.env.USER_DATA_PATH}/downloaded_${Date.now()}.json`;

            cloudSaveManager.getArchiveData({
                archiveUUID: archiveUUID,
                archiveFileId: archiveFileId,
                targetFilePath: targetPath,
                success: (res) => {
                    console.log('✅ 云存档下载成功:', res.filePath);
                    try {
                        const dataStr = fs.readFileSync(res.filePath, 'utf8');
                        const data = JSON.parse(dataStr);
                        localStorage.setItem(`beastLove_slot_${targetSlot}`, JSON.stringify(data));
                        showToast(`✅ 云存档已恢复到存档 ${targetSlot+1}`);
                        if (loadFromSlot(targetSlot)) {
                            document.getElementById('topBar').style.display = 'flex';
                            document.getElementById('navBar').style.display = 'flex';
                            state.gameStarted = true;
                            updateTopBar();
                            renderHome();
                            showToast(`✅ 已加载存档 ${targetSlot+1}`);
                        } else {
                            showToast('⚠️ 存档加载失败，请手动读档');
                        }
                        resolve(data);
                    } catch (err) {
                        reject(new Error(`读取或解析存档失败: ${err.message}`));
                    }
                },
                fail: (err) => {
                    console.error('❌ 下载云存档失败:', err);
                    reject(err);
                }
            });
        } catch (err) {
            console.error('❌ 下载过程异常:', err);
            reject(err);
        }
    });
}

// ========== 删除（仅本地记录） ==========
export function deleteCloudArchive(archiveUUID) {
    return new Promise((resolve) => {
        let uploaded = JSON.parse(localStorage.getItem('beastLove_cloud_uploads') || '[]');
        uploaded = uploaded.filter(item => item.uuid !== archiveUUID);
        localStorage.setItem('beastLove_cloud_uploads', JSON.stringify(uploaded));
        showToast('✅ 已从本地记录中移除');
        resolve();
    });
}

// ========== 显示云存档管理界面 ==========
export function showCloudSaveManagerUI() {
    if (!isCloudSaveSupported()) {
        showToast('⚠️ 云存档不可用，请检查网络或登录状态');
        return;
    }
    const html = `
        <div class="global-overlay" id="cloudManagerModal">
            <div class="modal-box" style="max-width:600px;">
                <div style="font-weight:700;color:var(--accent);font-size:1.2em;margin-bottom:10px;">☁️ 云存档管理</div>
                <div id="cloudArchiveList" style="max-height:50vh;overflow-y:auto;">
                    <p style="text-align:center;color:var(--text2);">加载中...</p>
                </div>
                <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;justify-content:center;">
                    <button class="btn" id="cloudUploadBtn" style="background:var(--accent);">📤 上传当前存档</button>
                    <button class="btn" id="cloudRefreshBtn">🔄 刷新列表</button>
                    <button class="btn" id="cloudCloseBtn" style="background:#ccc;color:#666;">关闭</button>
                </div>
            </div>
        </div>
    `;
    const modal = showGlobalModal(html, 'cloudManagerModal');
    if (!modal) {
        showToast('⚠️ 无法打开云存档管理界面');
        return;
    }
    refreshCloudList(modal);

    modal.querySelector('#cloudUploadBtn').addEventListener('click', () => {
        if (!localStorage.getItem('beastLove_slot_0')) {
            showToast('⚠️ 没有本地存档可上传');
            return;
        }
        const nameInput = prompt('请输入云存档名称（可选）', `第${state.player.day}天存档`);
        const summaryInput = prompt('请输入简要描述（可选）', `金币:${state.player.gold}`);
        uploadArchiveToCloud(0, nameInput || undefined, summaryInput || undefined)
            .then(() => refreshCloudList(modal))
            .catch(err => {
                console.warn(err);
                showToast('⚠️ 上传失败，请重试');
            });
    });

    modal.querySelector('#cloudRefreshBtn').addEventListener('click', () => {
        refreshCloudList(modal);
    });

    modal.querySelector('#cloudCloseBtn').addEventListener('click', () => {
        modal.remove();
    });
}

async function refreshCloudList(modal) {
    const listEl = modal.querySelector('#cloudArchiveList');
    if (!listEl) return;
    try {
        const saves = await getCloudArchiveList();
        if (saves.length === 0) {
            listEl.innerHTML = '<p style="text-align:center;color:var(--text2);">暂无云存档，上传一个吧 ☁️</p>';
            return;
        }
        let html = '';
        saves.forEach((save) => {
            const meta = save.archiveMetaData || {};
            const name = meta.name || '未命名存档';
            const summary = meta.summary || '无描述';
            const extra = meta.extra ? JSON.parse(meta.extra) : {};
            const day = extra.day || '?';
            const time = new Date(save.updatedAt || save.createdAt).toLocaleString();
            html += `
                <div style="background:#fff;border-radius:12px;padding:10px;margin:6px 0;border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;">
                    <div>
                        <div style="font-weight:700;">${name}</div>
                        <div style="font-size:0.8em;color:var(--text2);">${summary}</div>
                        <div style="font-size:0.7em;color:var(--text2);">第${day}天 · ${time}</div>
                    </div>
                    <div style="display:flex;gap:6px;">
                        <button class="btn cloud-download-btn" data-uuid="${save.uuid}" data-fileid="${save.archiveFileId}" style="font-size:0.8rem;padding:6px 12px;background:#2ecc71;">📥 下载并加载</button>
                        <button class="btn cloud-delete-btn" data-uuid="${save.uuid}" style="font-size:0.8rem;padding:6px 12px;background:#e74c3c;">🗑️</button>
                    </div>
                </div>
            `;
        });
        listEl.innerHTML = html;

        listEl.querySelectorAll('.cloud-download-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const uuid = this.dataset.uuid;
                const fileId = this.dataset.fileid;
                const targetSlot = parseInt(prompt('请输入要覆盖的本地存档位 (0-4)：', '0'));
                if (isNaN(targetSlot) || targetSlot < 0 || targetSlot > 4) {
                    showToast('⚠️ 请输入0-4的数字');
                    return;
                }
                if (!confirm(`确定将云存档恢复到存档 ${targetSlot+1} 吗？\n下载后将自动加载游戏。`)) return;
                downloadAndRestoreArchive(uuid, fileId, targetSlot)
                    .then(() => {
                        const modalEl = document.getElementById('cloudManagerModal');
                        if (modalEl) modalEl.remove();
                        showToast('✅ 云存档加载成功！');
                    })
                    .catch(err => showToast('❌ 下载失败: ' + err.message));
            });
        });

        listEl.querySelectorAll('.cloud-delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const uuid = this.dataset.uuid;
                if (!confirm(`确定从本地记录移除该云存档吗？`)) return;
                deleteCloudArchive(uuid).then(() => refreshCloudList(modal));
            });
        });

    } catch (err) {
        listEl.innerHTML = `<p style="text-align:center;color:#e74c3c;">加载失败: ${err.message}</p>`;
    }
}