const CLIENT_ID = '593809674207-4lt599vh22f5si9hufbh9bku0odn3g2e.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive';
let accessToken = localStorage.getItem('quality_access_token') || null;

// 1. 랜딩 화면 버튼 상태 제어
function updateLandingUI() {
    const isLogin = !!accessToken;
    const gBtn = document.getElementById('landingGoogleBtn');
    const statusMsg = document.getElementById('loginStatusMsg');
    const importBtn = document.getElementById('landingImportBtn');
    const syncBtn = document.getElementById('landingSyncBtn');
    const enterBtn = document.getElementById('landingEnterBtn');

    if (gBtn) gBtn.style.display = isLogin ? 'none' : 'flex';
    if (statusMsg) statusMsg.style.display = isLogin ? 'block' : 'none';
    if (importBtn) importBtn.style.display = isLogin ? 'flex' : 'none';
    if (syncBtn) syncBtn.style.display = isLogin ? 'flex' : 'none';
    if (enterBtn) enterBtn.style.display = isLogin ? 'flex' : 'none';
}

// 2. 구글 로그인 실행
function triggerGoogleLogin() {
    const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
                accessToken = tokenResponse.access_token;
                localStorage.setItem('quality_access_token', accessToken);
                alert("구글 드라이브와 연동되었습니다!");
                enterPortal();
            }
        },
    });
    tokenClient.requestAccessToken({ prompt: 'consent' });
}

// 3. 포털 입장 및 랜딩 복귀
function enterPortal() {
    if (!accessToken) return alert("먼저 구글 로그인을 진행해주세요.");
    document.getElementById('landingScreen').style.display = 'none';
    document.getElementById('portalContent').style.display = 'block';
    updateLandingUI();
    if(typeof refreshAllWidths === 'function') setTimeout(refreshAllWidths, 50);
}

function goToLandingScreen() {
    document.getElementById('portalContent').style.display = 'none';
    document.getElementById('landingScreen').style.display = 'flex';
    updateLandingUI();
}

function logoutToLanding() {
    accessToken = null;
    localStorage.removeItem('quality_access_token');
    document.getElementById('portalContent').style.display = 'none';
    document.getElementById('landingScreen').style.display = 'flex';
    updateLandingUI();
    location.reload();
}

// [동기화 로직]
async function syncAllToDrive() {
    if (!accessToken) return alert("먼저 구글 로그인을 진행해주세요.");
    const data = {
        schedule: localStorage.getItem('quality_schedule_data'),
        contacts: localStorage.getItem('quality_contacts_data_v6'),
        board: localStorage.getItem('quality_board_data'),
        nonconformity: localStorage.getItem('quality_nonconformity_data'),
        autocad: localStorage.getItem('quality_autocad_data'),
        docs: localStorage.getItem('quality_docs_data'),
        memo: localStorage.getItem('quality_memo_data'),
        visited_pages: localStorage.getItem('quality_visited_pages'),
        contacts_lock: localStorage.getItem('quality_contacts_lock')
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const fileName = 'quality_portal_backup.json';

    try {
        const query = `name = '${fileName}' and trashed = false`;
        const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        const searchData = await searchRes.json();

        let method = 'POST', url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        const metadata = { name: fileName, mimeType: 'application/json' };

        if (searchData.files && searchData.files.length > 0) {
            method = 'PATCH';
            url = `https://www.googleapis.com/upload/drive/v3/files/${searchData.files[0].id}?uploadType=multipart`;
        }

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);

        const response = await fetch(url, { method, headers: { 'Authorization': 'Bearer ' + accessToken }, body: form });
        if (response.ok) alert("✅ 드라이브 백업 완료!");
        else alert("동기화 중 오류가 발생했습니다.");
    } catch (e) { alert("동기화 실패: " + e.message); }
}

async function importAllFromDrive() {
    if (!accessToken) return alert("먼저 구글 로그인을 진행해주세요.");
    try {
        const query = `name = 'quality_portal_backup.json' and trashed = false`;
        const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        const searchData = await searchRes.json();
        if (!searchData.files || searchData.files.length === 0) return alert("백업 파일이 없습니다.");

        const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${searchData.files[0].id}?alt=media`, {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        const data = await downloadRes.json();

        Object.keys(data).forEach(key => localStorage.setItem('quality_' + key.replace('contacts_data_v6', 'contacts_data_v6'), data[key]));
        
        alert("📥 최신 데이터를 불러왔습니다!");
        location.reload(); 
    } catch (e) { alert("불러오기 실패: " + e.message); }
}

// [초기 로드] - 💡 올바른 화면 분기 처리
window.onload = function() {
    updateLandingUI();
    
    // 1. 데이터들을 먼저 화면에 싹 그려줍니다.
    try {
        (JSON.parse(localStorage.getItem('quality_schedule_data')) || initialScheduleData).forEach(item => addRow(item));
        (JSON.parse(localStorage.getItem('quality_contacts_data_v6')) || initialContactsData).forEach(item => addContactRow(item));
        if (localStorage.getItem('quality_contacts_lock') === 'true') {
            isGlobalLocked = true;
            const lockBtn = document.getElementById('globalLockBtn');
            if (lockBtn) { lockBtn.textContent = '수정'; lockBtn.classList.add('active'); }
            document.querySelectorAll('#contactsTableBody tr input[type="text"]').forEach(input => input.disabled = true);
        }
        (JSON.parse(localStorage.getItem('quality_board_data')) || initialBoardData).forEach(item => addBoardPost(item));
        (JSON.parse(localStorage.getItem('quality_nonconformity_data')) || initialNonConformData).forEach(item => addNonConformPost(item));
        (JSON.parse(localStorage.getItem('quality_autocad_data')) || initialAutocadData).forEach(item => addAutocadPost(item));
        renderDocs(JSON.parse(localStorage.getItem('quality_docs_data')) || initialDocsData);
        
        const savedMemo = localStorage.getItem('quality_memo_data');
        if (savedMemo) document.getElementById('memoArea').value = savedMemo;
        
        if (typeof resetIdleTimer === 'function') resetIdleTimer();
        if (typeof updateDashboardUpcomingSummary === 'function') updateDashboardUpcomingSummary();
        if (typeof renderRecentVisitedPages === 'function') renderRecentVisitedPages();
    } catch (e) {
        console.error("데이터 로드 중 오류 발생:", e);
    }

    // 2. 데이터가 다 그려진 후, 로그인 상태에 따라 화면을 보여줍니다.
    if (accessToken) {
        // 로그인이 되어 있다면 사용자가 직접 HOME 버튼을 누르거나 할 때까지 
        // 혹은 원하실 때 랜딩에 머물 수 있도록 랜딩을 기본으로 두고 
        // 자동 전환을 원치 않으시면 아래 줄을 조절할 수 있습니다.
        // 현재는 로그인 상태면 바로 본문이 보이되, 데이터가 채워진 상태로 뜹니다.
        document.getElementById('landingScreen').style.display = 'none';
        document.getElementById('portalContent').style.display = 'block';
    } else {
        document.getElementById('landingScreen').style.display = 'flex';
        document.getElementById('portalContent').style.display = 'none';
    }

    if (typeof refreshAllWidths === 'function') refreshAllWidths();
};
function getDayOfWeek(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isNaN(date.getDay()) ? '-' : DAYS[date.getDay()];
}

function createSelectHTML(options, selectedValue, className = '') {
    let html = `<select class="${className} clean-select" onchange="updateStyle(this)">`;
    options.forEach(opt => { html += `<option value="${opt}" ${opt === selectedValue ? 'selected' : ''}>${opt}</option>`; });
    return html + `</select>`;
}

function addRow(data = {}) {
    const tbody = document.getElementById('tableBody');
    const tr = document.createElement('tr');
    const completed = data.completed || false;
    const date = data.date || new Date().toISOString().substring(0, 10);
    if (completed) tr.classList.add('completed');
    tr.innerHTML = `
        <td style="text-align: center;"><input type="checkbox" ${completed ? 'checked' : ''} onchange="toggleComplete(this)"></td>
        <td><input type="date" value="${date}" onchange="updateDay(this)" style="width: 120px; min-width: 120px;"></td>
        <td class="day-cell">${getDayOfWeek(date)}</td>
        <td style="text-align: center;"><div style="display:inline-block; width:110px; min-width:110px;">${createSelectHTML(CONFIG.categoryOptions, data.category || CONFIG.categoryOptions[0])}</div></td>
        <td style="text-align: center;"><div style="display:inline-block; width:100px; min-width:100px;">${createSelectHTML(CONFIG.personOptions, data.person || CONFIG.personOptions[0])}</div></td>
        <td style="text-align: center;"><div style="display:inline-block; width:90px; min-width:90px;">${createSelectHTML(CONFIG.statusOptions, data.status || CONFIG.statusOptions[0], 'status-select')}</div></td>
        <td><input type="text" value="${data.content || ''}" placeholder="업무 내용을 입력하세요" style="width: 280px; min-width: 280px;" oninput="refreshAllWidths()"></td>
        <td><input type="text" value="${data.note || ''}" placeholder="비고" style="width: 140px; min-width: 140px;" oninput="refreshAllWidths()"></td>
        <td style="text-align: center;"><button class="btn-delete" onclick="openDeleteModal(this, 'standard')">삭제</button></td>
    `;
    tbody.appendChild(tr);
    updateStyle(tr.querySelector('.status-select'));
    if (typeof refreshAllWidths === 'function') refreshAllWidths();
}

function toggleComplete(checkbox) {
    checkbox.closest('tr').classList.toggle('completed', checkbox.checked);
    if (typeof updateDashboardUpcomingSummary === 'function') updateDashboardUpcomingSummary();
}

function updateDay(dateInput) {
    dateInput.closest('tr').querySelector('.day-cell').textContent = getDayOfWeek(dateInput.value);
    if (typeof updateDashboardUpcomingSummary === 'function') updateDashboardUpcomingSummary();
}

function updateStyle(selectElem) {
    if (!selectElem.classList.contains('status-select')) return;
    selectElem.className = 'status-select clean-select';
    const val = selectElem.value;
    if (val === '대기') selectElem.classList.add('pending');
    else if (val === '진행중') selectElem.classList.add('progress');
    else if (val === '검토중') selectElem.classList.add('review');
    else if (val === '승인중') selectElem.classList.add('approving');
    else if (val === '완료') selectElem.classList.add('done');
    else if (val === '보류') selectElem.classList.add('hold');
}

function saveData() {
    const dataList = [];
    document.querySelectorAll('#tableBody tr').forEach(row => {
        dataList.push({
            completed: row.querySelector('input[type="checkbox"]').checked,
            date: row.querySelector('input[type="date"]').value,
            category: row.querySelectorAll('select')[0].value,
            person: row.querySelectorAll('select')[1].value,
            status: row.querySelectorAll('select')[2].value,
            content: row.querySelectorAll('input[type="text"]')[0].value,
            note: row.querySelectorAll('input[type="text"]')[1].value
        });
    });
    localStorage.setItem('quality_schedule_data', JSON.stringify(dataList));
    if (typeof updateDashboardUpcomingSummary === 'function') updateDashboardUpcomingSummary();
    alert('스케줄 데이터가 성공적으로 저장되었다.');
}

function toggleBoardBody(btn) {
    const body = btn.closest('.board-card').querySelector('.board-body');
    const arrow = btn.querySelector('.toggle-arrow');
    const isHidden = body.style.display === 'none';
    body.style.display = isHidden ? 'block' : 'none';
    arrow.textContent = isHidden ? '▼' : '▶';
}

function updateBoardTitle(input) {
    input.closest('.board-card').querySelector('.board-card-title-text').textContent = input.value.trim() || '새 게시글';
}

function toggleEditBoardCard(btn) {
    const card = btn.closest('.board-card');
    const isEditing = card.classList.toggle('is-editing');
    if (!isEditing) {
        card.querySelector('.board-content-view').textContent = card.querySelector('.board-content').value || '내용이 없습니다.';
        btn.textContent = '수정';
        btn.style.background = '#0284c7';
        saveAutocadPosts();
    } else {
        btn.textContent = '완료';
        btn.style.background = '#059669';
        const ta = card.querySelector('.board-content');
        if (ta) autoResizeTextarea(ta);
    }
}

function copyTipContent(btn) {
    const card = btn.closest('.board-card');
    const title = (card.querySelector('.board-title') || {}).value || card.querySelector('.board-card-title-text').textContent;
    const content = (card.querySelector('.board-content') || {}).value || card.querySelector('.board-content-view').textContent;
    navigator.clipboard.writeText(`[제목] ${title.trim()}\n[내용]\n${content.trim()}`).then(() => alert('클립보드에 복사되었다.'));
}

function addAutocadPost(data = {}) {
    const container = document.getElementById('autocadContainer');
    const card = document.createElement('div');
    card.className = 'board-card';
    card.innerHTML = `
        <div class="board-header">
            <button class="toggle-title-btn" onclick="toggleBoardBody(this)" style="flex: 1;"><span class="toggle-arrow">▼</span> <span class="board-card-title-text">${data.title || '새 TIP'}</span></button>
        </div>
        <div class="board-body">
            <div class="edit-mode-only" style="margin-top: 6px; margin-bottom: 6px;"><input type="text" class="board-title-input board-title" value="${data.title || ''}" placeholder="제목 입력" oninput="updateBoardTitle(this);" style="width: 100%;"></div>
            <div class="board-content-view" style="font-size: 13px; color: #475569; padding: 6px 0; white-space: pre-wrap; line-height: 1.5;">${data.content || '내용이 없습니다.'}</div>
            <textarea class="board-content-textarea board-content edit-mode-only" placeholder="상세 내용 작성..." oninput="autoResizeTextarea(this)">${data.content || ''}</textarea>
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #e2e8f0;">
                <button class="btn-copy" onclick="copyTipContent(this)">복사</button>
                <button class="action-btn btn-board-edit" onclick="toggleEditBoardCard(this)" style="background: #0284c7; color: white; padding: 5px 10px; font-size: 11px;">수정</button>
                <button class="btn-delete" onclick="openDeleteModal(this, 'autocad')">삭제</button>
            </div>
        </div>
    `;
    container.prepend(card);
    setTimeout(() => { const ta = card.querySelector('.board-content-textarea'); if (ta) autoResizeTextarea(ta); }, 10);
}

function saveAutocadPosts() {
    const list = [];
    document.querySelectorAll('#autocadContainer .board-card').forEach(card => {
        list.push({
            title: (card.querySelector('.board-title') || {}).value || card.querySelector('.board-card-title-text').textContent,
            content: (card.querySelector('.board-content') || {}).value || card.querySelector('.board-content-view').textContent
        });
    });
    localStorage.setItem('quality_autocad_data', JSON.stringify(list));
    alert('TIP 목록이 저장되었다.');
}

function addBoardPost(data = {}) {
    const container = document.getElementById('boardContainer');
    const card = document.createElement('div');
    card.className = 'board-card';
    card.innerHTML = `
        <div class="board-header">
            <button class="toggle-title-btn" onclick="toggleBoardBody(this)" style="flex: 1;"><span class="toggle-arrow">▼</span> <span class="board-card-title-text">${data.title || '새 게시글'}</span></button>
        </div>
        <div class="board-body">
            <div class="edit-mode-only" style="margin-top: 6px; margin-bottom: 6px;"><input type="text" class="board-title-input board-title" value="${data.title || ''}" placeholder="제목 입력" oninput="updateBoardTitle(this); filterBoard();" style="width: 100%;"></div>
            <div class="board-content-view" style="font-size: 13px; color: #475569; padding: 6px 0; white-space: pre-wrap; line-height: 1.5;">${data.content || '내용이 없습니다.'}</div>
            <textarea class="board-content-textarea board-content edit-mode-only" placeholder="상세 내용 작성..." oninput="autoResizeTextarea(this); filterBoard()">${data.content || ''}</textarea>
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #e2e8f0;">
                <button class="action-btn btn-board-edit" onclick="toggleEditBoardCard(this)" style="background: #0284c7; color: white; padding: 5px 10px; font-size: 11px;">수정</button>
                <button class="btn-delete" onclick="openDeleteModal(this, 'standard')">삭제</button>
            </div>
        </div>
    `;
    container.prepend(card);
    setTimeout(() => { const ta = card.querySelector('.board-content-textarea'); if (ta) autoResizeTextarea(ta); }, 10);
}

function saveBoardPosts() {
    const list = [];
    document.querySelectorAll('#boardContainer .board-card').forEach(card => {
        list.push({
            title: (card.querySelector('.board-title') || {}).value || card.querySelector('.board-card-title-text').textContent,
            content: (card.querySelector('.board-content') || {}).value || card.querySelector('.board-content-view').textContent
        });
    });
    localStorage.setItem('quality_board_data', JSON.stringify(list));
    alert('게시판 데이터가 저장되었다.');
}

function addNonConformPost(data = {}) {
    const container = document.getElementById('nonConformContainer');
    const card = document.createElement('div');
    card.className = 'non-conform-card';

    let alphaOpts1 = '', alphaOpts2 = '', numOpts1 = '', numOpts2 = '';
    for (let i = 65; i <= 90; i++) {
        const char = String.fromCharCode(i);
        alphaOpts1 += `<option value="${char}" ${data.alpha1 === char ? 'selected' : ''}>${char}</option>`;
        alphaOpts2 += `<option value="${char}" ${data.alpha2 === char ? 'selected' : ''}>${char}</option>`;
    }
    for (let i = 1; i <= 99; i++) {
        const numStr = i < 10 ? '0' + i : '' + i;
        numOpts1 += `<option value="${numStr}" ${data.num1 === numStr || data.num1 == i ? 'selected' : ''}>${numStr}</option>`;
        numOpts2 += `<option value="${numStr}" ${data.num2 === numStr || data.num2 == i ? 'selected' : ''}>${numStr}</option>`;
    }

    const isCompleted = data.completed ? 'checked' : '';
    const imageSrc = data.image || '';

    card.innerHTML = `
        <div class="non-conform-header">
            <div style="display: flex; align-items: center; gap: 6px; flex: 1;">
                <button class="toggle-title-btn" onclick="toggleNonConformBody(this)" style="flex: 1;"><span class="toggle-arrow">▼</span> <span class="card-title-text ${data.completed ? 'completed-text' : ''}">${data.title || '새 부적합 사항'}</span></button>
                <input type="checkbox" class="non-complete-chk" ${isCompleted} onchange="toggleNonConformComplete(this)" style="margin-left: auto;">
            </div>
        </div>
        <div class="non-conform-body">
            <div class="edit-mode-only" style="margin-top: 6px; margin-bottom: 6px;"><input type="text" class="board-title-input non-title" value="${data.title || ''}" placeholder="제목 입력" oninput="updateCardTitle(this); filterNonConformity();" style="width: 100%;"></div>
            <div class="non-conform-sub">
                <div style="display: flex; gap: 4px; align-items: center;">
                    <select class="non-alpha1 center-select green-select" style="width: 45px; font-weight: bold;" disabled>${alphaOpts1}</select>
                    <select class="non-num1 center-select green-select" style="width: 45px; font-weight: bold;" disabled>${numOpts1}</select>
                    <span style="font-weight: bold; color: #475569; padding: 0 2px;">~</span>
                    <select class="non-alpha2 center-select green-select" style="width: 45px; font-weight: bold;" disabled>${alphaOpts2}</select>
                    <select class="non-num2 center-select green-select" style="width: 45px; font-weight: bold;" disabled>${numOpts2}</select>
                </div>
            </div>
            <div class="non-content-view" style="font-size: 13px; color: #475569; padding: 6px 0; white-space: pre-wrap; line-height: 1.5;">${data.content || '내용이 없습니다.'}</div>
            <textarea class="board-content-textarea non-content edit-mode-only" placeholder="상세 내용 작성..." oninput="autoResizeTextarea(this); filterNonConformity()">${data.content || ''}</textarea>
            <div class="image-preview-container" style="${imageSrc ? 'display: block;' : 'display: none;'}"><img src="${imageSrc}" class="non-img-preview"><button class="img-delete-btn edit-mode-only" onclick="removeCardImage(this)">X</button></div>
            <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #e2e8f0;">
                <div class="image-upload-section edit-mode-only" style="margin-right: auto;"><label class="vertical-upload-btn"><span>📷 이미지</span><input type="file" accept="image/*" style="display:none;" onchange="handleImageUpload(event, this)"></label></div>
                <button class="action-btn non-edit-btn" onclick="toggleEditCard(this)" style="background: #1e3a8a; color: white; padding: 5px 10px; font-size: 11px;">수정</button>
                <button class="action-btn btn-save" onclick="saveSingleCard(this)" style="padding: 5px 10px; font-size: 11px;">저장</button>
                <button class="btn-delete" onclick="openDeleteModal(this, 'standard')">삭제</button>
            </div>
        </div>
    `;
    container.prepend(card);
}

function toggleEditCard(btn) {
    const card = btn.closest('.non-conform-card');
    const isEditing = card.classList.toggle('is-editing');
    card.querySelectorAll('.non-conform-sub select').forEach(sel => sel.disabled = !isEditing);
    if (!isEditing) {
        card.querySelector('.non-content-view').textContent = card.querySelector('.non-content').value || '내용이 없습니다.';
        btn.textContent = '수정';
        btn.style.background = '#1e3a8a';
        btn.style.color = '#ffffff';
        btn.style.border = 'none';
        saveNonConformPosts();
    } else {
        btn.textContent = '완료';
        btn.style.background = '#ffffff';
        btn.style.color = '#000000';
        btn.style.border = '1px solid #cbd5e1';
        const ta = card.querySelector('.non-content');
        if (ta) autoResizeTextarea(ta);
    }
}

function toggleNonConformBody(btn) {
    const card = btn.closest('.non-conform-card');
    const body = card.querySelector('.non-conform-body');
    const arrow = btn.querySelector('.toggle-arrow');
    const isCollapsed = body.classList.toggle('collapsed');
    arrow.textContent = isCollapsed ? '▶' : '▼';
}

function updateCardTitle(input) {
    input.closest('.non-conform-card').querySelector('.card-title-text').textContent = input.value.trim() || '새 부적합 사항';
}

function handleImageUpload(event, input) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const card = input.closest('.non-conform-card');
        card.querySelector('.non-img-preview').src = e.target.result;
        card.querySelector('.image-preview-container').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function removeCardImage(btn) {
    const card = btn.closest('.non-conform-card');
    card.querySelector('.non-img-preview').src = '';
    card.querySelector('.image-preview-container').style.display = 'none';
}

function saveSingleCard() {
    saveNonConformPosts();
    alert('해당 부적합 항목이 저장되었다.');
}

function filterNonConformity() {
    const val = document.getElementById('nonConformFilterInput').value.toLowerCase();
    document.querySelectorAll('#nonConformContainer .non-conform-card').forEach(card => {
        const title = card.querySelector('.non-title').value.toLowerCase();
        const content = card.querySelector('.non-content').value.toLowerCase();
        card.style.display = (title.includes(val) || content.includes(val)) ? '' : 'none';
    });
}

function toggleNonConformComplete(chk) {
    chk.closest('.non-conform-card').querySelector('.card-title-text').classList.toggle('completed-text', chk.checked);
    saveNonConformPosts();
}

function saveNonConformPosts() {
    const list = [];
    document.querySelectorAll('#nonConformContainer .non-conform-card').forEach(card => {
        const img = card.querySelector('.non-img-preview');
        list.push({
            title: card.querySelector('.non-title').value,
            alpha1: card.querySelector('.non-alpha1').value,
            num1: card.querySelector('.non-num1').value,
            alpha2: card.querySelector('.non-alpha2').value,
            num2: card.querySelector('.non-num2').value,
            content: card.querySelector('.non-content').value,
            image: (img && img.src.startsWith('data:')) ? img.src : '',
            completed: card.querySelector('.non-complete-chk').checked
        });
    });
    localStorage.setItem('quality_nonconformity_data', JSON.stringify(list));
}

function addContactRow(data = {}) {
    const tbody = document.getElementById('contactsTableBody');
    const tr = document.createElement('tr');
    const disabledAttr = (typeof isGlobalLocked !== 'undefined' && isGlobalLocked) ? 'disabled' : '';
    tr.innerHTML = `
        <td style="text-align: center;"><input type="text" class="contact-name" value="${data.name || ''}" placeholder="이름" style="width: 50px; min-width: 30px; text-align: center;" ${disabledAttr}></td>
        <td style="text-align: center;"><input type="text" class="contact-role" value="${data.role || ''}" placeholder="직책" style="width: 50px; min-width: 30px; text-align: center;" ${disabledAttr}></td>
        <td style="text-align: center;"><input type="text" class="contact-phone" value="${typeof formatPhoneNumber === 'function' ? formatPhoneNumber(data.phone || '') : (data.phone || '')}" placeholder="연락처" style="width: 100px; min-width: 100px; text-align: center;" onchange="this.value = typeof formatPhoneNumber === 'function' ? formatPhoneNumber(this.value) : this.value" ${disabledAttr}></td>
        <td style="text-align: center;"><button class="btn-call" onclick="callContact(this)" style="background-color: #10b981; color: white; padding: 5px 8px; font-size: 11px; border: none; border-radius: 4px; cursor: pointer;">통화</button></td>
        <td><input type="text" class="contact-memo" value="${data.memo || ''}" placeholder="메모" style="width: 100%; min-width: 200px;" ${disabledAttr}></td>
        <td style="text-align: center;"><button class="btn-copy" onclick="copyContactInfo(this)">복사</button></td>
        <td style="text-align: center;"><button class="btn-delete" onclick="openDeleteModal(this, 'standard')">삭제</button></td>
    `;
    tbody.appendChild(tr);
}

function callContact(btn) {
    const phone = btn.closest('tr').querySelector('.contact-phone').value.trim();
    if (!phone) return alert('전화번호가 입력되지 않았다.');
    window.location.href = 'tel:' + phone;
}

function toggleGlobalLock(btn) {
    isGlobalLocked = !isGlobalLocked;
    localStorage.setItem('quality_contacts_lock', isGlobalLocked);
    document.querySelectorAll('#contactsTableBody tr input[type="text"]').forEach(input => input.disabled = isGlobalLocked);
    btn.textContent = isGlobalLocked ? '수정' : '완료';
    btn.classList.toggle('active', isGlobalLocked);
}

function filterContacts() {
    const val = document.getElementById('contactFilterInput').value.toLowerCase();
    document.querySelectorAll('#contactsTableBody tr').forEach(row => {
        row.style.display = row.querySelector('.contact-name').value.toLowerCase().includes(val) ? '' : 'none';
    });
}

function copyContactInfo(btn) {
    const tr = btn.closest('tr');
    const text = `${tr.querySelector('.contact-name').value.trim()} ${tr.querySelector('.contact-phone').value.trim()}`.trim();
    if (!text) return alert('복사할 정보가 없다.');
    navigator.clipboard.writeText(text).then(() => alert(`클립보드에 복사되었다: "${text}"`));
}

function saveContacts() {
    const list = [];
    document.querySelectorAll('#contactsTableBody tr').forEach(row => {
        const phoneInput = row.querySelector('.contact-phone');
        const formatted = typeof formatPhoneNumber === 'function' ? formatPhoneNumber(phoneInput.value) : phoneInput.value;
        phoneInput.value = formatted;
        list.push({
            name: row.querySelector('.contact-name').value,
            role: row.querySelector('.contact-role').value,
            phone: formatted,
            memo: row.querySelector('.contact-memo').value
        });
    });
    localStorage.setItem('quality_contacts_data_v6', JSON.stringify(list));
    alert('연락처 목록이 저장되었다.');
}

function openDeleteModal(btn, type = 'standard') {
    targetElementToDelete = btn.closest('tr') || btn.closest('.board-card') || btn.closest('.non-conform-card');
    document.getElementById('modalText').textContent = type === 'autocad' ? "아직 다 못 외웠는데 삭제하려고?" : "정말로 삭제하시겠습니까?";
    document.getElementById('deleteModal').classList.add('show');
}

function closeDeleteModal() {
    targetElementToDelete = null;
    document.getElementById('deleteModal').classList.remove('show');
}

function confirmDelete() {
    if (targetElementToDelete) {
        targetElementToDelete.remove();
        if (typeof updateDashboardUpcomingSummary === 'function') updateDashboardUpcomingSummary();
    }
    closeDeleteModal();
}

function uploadFile(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const fileList = JSON.parse(localStorage.getItem('quality_docs_data') || JSON.stringify(initialDocsData));
        fileList.unshift({ name: file.name, size: (file.size / (1024 * 1024)).toFixed(2), date: new Date().toISOString().substring(0, 10) });
        localStorage.setItem('quality_docs_data', JSON.stringify(fileList));
        renderDocs(fileList);
        alert(`'${file.name}' 파일이 추가되었다. 저장하기를 눌러 확정하라.`);
    }
}

function renderDocs(fileList) {
    const docList = document.getElementById('docList');
    docList.innerHTML = '';
    fileList.forEach(item => {
        const li = document.createElement('li');
        li.className = 'doc-item';
        li.innerHTML = `<div class="doc-info"><span>📄</span><a href="#" class="doc-link" onclick="alert('서버 연동 시 파일이 내려받아집니다.')">${item.name}</a><span style="font-size: 11px; color: #94a3b8;">(${item.size} MB)</span></div><span style="font-size: 11px; color: #64748b;">${item.date} 등록</span>`;
        docList.appendChild(li);
    });
}

function saveSpecifications() { alert('파일이 성공적으로 저장되었다.'); }
function saveMemo() {
    localStorage.setItem('quality_memo_data', document.getElementById('memoArea').value);
    alert('메모가 성공적으로 저장되었다.');
}

function calcAppend(val) { document.getElementById('calcScreen').value += val; }
function calcClear() { document.getElementById('calcScreen').value = ''; }
function calcBack() { const s = document.getElementById('calcScreen'); s.value = s.value.slice(0, -1); }
function calcResult() {
    const s = document.getElementById('calcScreen');
    try { s.value = eval(s.value); } catch (e) { s.value = '오류'; }
}

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

function filterBoard() {
    const keyword = document.getElementById('boardFilterInput').value.toLowerCase();
    document.querySelectorAll('#boardContainer .board-card').forEach(card => {
        const title = card.querySelector('.board-title').value.toLowerCase();
        const content = card.querySelector('.board-content').value.toLowerCase();
        card.style.display = (title.includes(keyword) || content.includes(keyword)) ? 'block' : 'none';
    });
}
