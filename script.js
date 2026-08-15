const CLIENT_ID = '593809674207-4lt599vh22f5si9hufbh9bku0odn3g2e.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
let accessToken = null;

function triggerGoogleLogin() {
    const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
                accessToken = tokenResponse.access_token;
                document.getElementById('landingGoogleBtn').style.display = 'none';
                document.getElementById('loginStatusMsg').style.display = 'block';
                document.getElementById('landingSyncBtn').style.display = 'flex';
                document.getElementById('landingEnterBtn').style.display = 'flex';
                alert("구글 드라이브와 연동되었습니다!");
            }
        },
    });
    tokenClient.requestAccessToken({ prompt: 'consent' });
}

function enterPortal() {
    if (!accessToken) return alert("먼저 구글 로그인을 진행해주세요.");
    document.getElementById('landingScreen').style.display = 'none';
    document.getElementById('portalContent').style.display = 'block';
    setTimeout(refreshAllWidths, 50);
}

function logoutToLanding() {
    accessToken = null;
    document.getElementById('portalContent').style.display = 'none';
    document.getElementById('landingScreen').style.display = 'flex';
    location.reload();
}

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
    const FOLDER_ID = '1UwPqBfs2QqLtS1jS-jw2_jeiij51FGfH'; 
    const metadata = { name: 'quality_portal_backup.json', mimeType: 'application/json', parents: [FOLDER_ID] };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    try {
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + accessToken },
            body: form,
        });
        if (response.ok) alert("Jason_Data 폴더에 데이터가 성공적으로 동기화되었습니다!");
        else alert("동기화 중 오류가 발생했습니다.");
    } catch (e) { alert("동기화 실패: " + e.message); }
}

const CONFIG = {
    categoryOptions: ['입고검사', '핏업검사', '용접검사', '공장검사', '자재승인', '시공검측', '완공검사'],
    personOptions: ['김학선', '이장훈', '김다훈'],
    statusOptions: ['대기', '진행중', '검토중', '승인중', '완료', '보류']
};
const initialScheduleData = [
    { completed: false, date: '2026-08-12', category: '입고검사', person: '김학선', status: '진행중', content: 'DW-300A 입고 검사 진행', note: '긴급' },
    { completed: true, date: '2026-08-10', category: '공장검사', person: '이장훈', status: '완료', content: '창고 시설 정기 점검', note: '' },
    { completed: false, date: '2026-08-15', category: '완공검사', person: '김다훈', status: '승인중', content: '융착파이프 샘플 최종 검수', note: '승인 대기중' }
];
const initialContactsData = [
    { name: '강범석', role: '팀장', phone: '010-5435-4950', memo: '' },
    { name: '김다훈', role: '부장', phone: '010-9512-9501', memo: '' },
    { name: '김소영', role: '대리', phone: '010-3132-7986', memo: '' },
    { name: '김영진', role: '과장', phone: '010-5106-3277', memo: '' },
    { name: '김재원', role: '차장', phone: '010-4617-7442', memo: '' },
    { name: '김학선', role: '상무', phone: '010-2391-2812', memo: '' },
    { name: '김형기', role: '차장', phone: '010-9907-8286', memo: '' },
    { name: '박기범', role: '차장', phone: '010-3709-1761', memo: '' },
    { name: '박상근', role: '소장', phone: '010-4843-0369', memo: '' },
    { name: '박찬웅', role: '과장', phone: '010-4281-8287', memo: '' },
    { name: '이강현', role: '차장', phone: '010-8139-6849', memo: '' },
    { name: '이장훈', role: '상무', phone: '010-6353-1482', memo: '' },
    { name: '정영권', role: '팀장', phone: '010-8688-0201', memo: '' },
    { name: '진영훈', role: '과장', phone: '010-5781-0064', memo: '' },
    { name: '최준혁', role: '대리', phone: '0109916-1052', memo: '' }
];
const initialBoardData = [
    { title: '중요: DW-300A 품질 승인 서류 보완 요청', content: '삼성 측 전달 용품 품질 검사 증명서 작성 시 트루컬러 표기 항목 다시 점검할 것.' }
];
const initialNonConformData = [
    { title: '철골 용접 부위 미달 검토', alpha1: 'A', num1: '47', alpha2: 'A', num2: '48', content: '현장 3층 B구역 용접 비드 두께 기준 미달로 인한 보완 조치 필요.', completed: false }
];
const initialAutocadData = [
    { title: '오토캐드 고화질 PDF 다운로드 방법 (Ctrl+P)', content: '플롯터 세팅 시 AutoCAD PDF (High Quality Print).pc3 선택 후 백터 품질 2400 DPI 상향 설정.' },
    { title: '객체 결합(J) 및 분해(X) 사용 방법', content: 'J(Join)는 끝점이 맞아떨어져야 폴리선으로 합쳐짐.\nX(Explode)는 블록이나 폴리선을 낱개 선으로 분해함.' },
    { title: '그리기 순서 변경 (DR / TEXTTOFRONT)', content: 'DR 입력 후 Front/Back 선택.\n텍스트 가려짐 해제는 TEXTTOFRONT, 해치 내리기는 HATCHTOBACK 활용.' }
];
const initialDocsData = [
    { name: '품질관리_시방서_최신판.pdf', size: '2.4', date: '2026-08-10' }
];

const TAB_NAMES = {
    'schedule': '📅 스케줄', 'board': '📌 게시판', 'nonconformity': '⚠️ 부적합',
    'contacts': '📞 연락처', 'specifications': '📁 파일관리', 'autocad': '💡 TIP',
    'memo': '📝 메모장', 'calculator': '🧮 계산기'
};
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
let targetElementToDelete = null;
let scheduleSortAsc = true;
let contactSortAsc = true;
let isGlobalLocked = false;
let idleTimer = null;
const IDLE_TIMEOUT = 1800000;
const PASSWORD_CORRECT = "000000";

function toggleMenu() {
    document.getElementById('navMenu').classList.toggle('show');
}

function updateColumnWidths(tableId, isContact = false) {
    const table = document.getElementById(tableId);
    if (!table) return;
    table.querySelectorAll('input[type="text"]').forEach(input => {
        if (isContact && input.classList.contains('contact-memo')) {
            input.style.width = '100%';
            input.style.minWidth = '250px';
        } else if (!isContact) {
            input.style.width = '100%';
        }
    });
}

function refreshAllWidths() {
    updateColumnWidths('scheduleTable', false);
    updateColumnWidths('contactsTable', true);
}

window.addEventListener('resize', refreshAllWidths);

function resetIdleTimer() {
    if (document.getElementById('lockModal').classList.contains('show')) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(lockScreen, IDLE_TIMEOUT);
}

function lockScreen() {
    document.getElementById('lockPasswordInput').value = '';
    document.getElementById('lockErrorMsg').style.display = 'none';
    document.getElementById('lockModal').classList.add('show');
    document.getElementById('lockPasswordInput').focus();
}

function unlockScreen() {
    if (document.getElementById('lockPasswordInput').value === PASSWORD_CORRECT) {
        document.getElementById('lockModal').classList.remove('show');
        resetIdleTimer();
    } else {
        document.getElementById('lockErrorMsg').style.display = 'block';
        document.getElementById('lockPasswordInput').value = '';
        document.getElementById('lockPasswordInput').focus();
    }
}

['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
    window.addEventListener(evt, resetIdleTimer);
});

function formatPhoneNumber(value) {
    if (!value) return value;
    const cleaned = ('' + value).replace(/\D/g, '');
    if (cleaned.length === 11) return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    if (cleaned.length === 10) {
        if (cleaned.startsWith('02')) return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    if (cleaned.length === 9 && cleaned.startsWith('02')) return cleaned.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
    return value;
}

function switchTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    btn.classList.add('active');
    document.getElementById('navMenu').classList.remove('show');

    if (tabId !== 'home') recordVisitedPage(tabId);
    else {
        updateDashboardUpcomingSummary();
        renderRecentVisitedPages();
    }
    setTimeout(refreshAllWidths, 50);
}

function navigateToTab(tabId) {
    const btnMap = {
        'schedule': 'btn-schedule', 'board': 'btn-board', 'nonconformity': 'btn-nonconformity',
        'contacts': 'btn-contacts', 'specifications': 'btn-specifications', 'autocad': 'btn-autocad',
        'memo': 'btn-memo', 'calculator': 'btn-calculator'
    };
    const targetBtn = document.querySelector('.' + btnMap[tabId]);
    if (targetBtn) switchTab(tabId, targetBtn);
}

function recordVisitedPage(tabId) {
    let history = JSON.parse(localStorage.getItem('quality_visited_pages') || '[]');
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    history = history.filter(item => item.tabId !== tabId);
    history.unshift({ tabId, name: TAB_NAMES[tabId], time: timeStr });
    if (history.length > 5) history = history.slice(0, 5);
    localStorage.setItem('quality_visited_pages', JSON.stringify(history));
}

function renderRecentVisitedPages() {
    const container = document.getElementById('homeRecentPagesSummary');
    const history = JSON.parse(localStorage.getItem('quality_visited_pages') || '[]');
    container.innerHTML = '';
    if (history.length === 0) {
        container.innerHTML = '<li class="stat-item" style="color:#94a3b8;">최근 열람한 페이지가 없다.</li>';
        return;
    }
    history.forEach(item => {
        const li = document.createElement('li');
        li.className = 'stat-item';
        li.innerHTML = `<span class="stat-item-link" onclick="navigateToTab('${item.tabId}')">${item.name}</span><span style="font-size:11px; color:#64748b;">${item.time} 열람</span>`;
        container.appendChild(li);
    });
}

function updateDashboardUpcomingSummary() {
    const rows = document.querySelectorAll('#tableBody tr');
    const scheduleList = [];
    const todayDate = new Date(new Date().toISOString().substring(0, 10));
    rows.forEach(row => {
        if (!row.querySelector('input[type="checkbox"]').checked) {
            const dateVal = row.querySelector('input[type="date"]').value;
            const statusVal = row.querySelectorAll('select')[2].value;
            const contentVal = row.querySelectorAll('input[type="text"]')[0].value || '내용 없음';
            if (dateVal) {
                const diffDays = Math.ceil((new Date(dateVal) - todayDate) / (1000 * 60 * 60 * 24));
                scheduleList.push({ date: dateVal, content: contentVal, status: statusVal, diffDays });
            }
        }
    });
    scheduleList.sort((a, b) => (a.diffDays >= 0 && b.diffDays < 0 ? -1 : a.diffDays < 0 && b.diffDays >= 0 ? 1 : a.diffDays - b.diffDays));
    const summaryContainer = document.getElementById('homeScheduleSummary');
    summaryContainer.innerHTML = '';
    if (scheduleList.length === 0) {
        summaryContainer.innerHTML = '<li class="stat-item" style="color:#94a3b8;">임박한 미완료 스케줄이 없다.</li>';
        return;
    }
    scheduleList.slice(0, 4).forEach(item => {
        let dDayClass = 'd-day-upcoming', dDayText = `D-${item.diffDays}`;
        if (item.diffDays === 0) { dDayText = 'D-DAY'; dDayClass = 'd-day-today'; }
        else if (item.diffDays < 0) { dDayText = `D+${Math.abs(item.diffDays)}`; dDayClass = 'd-day-past'; }
        const li = document.createElement('li');
        li.className = 'stat-item';
        li.innerHTML = `<div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; flex: 1 1 auto; min-width: 180px;"><span class="d-day-badge ${dDayClass}" style="flex-shrink: 0;">${dDayText}</span><span style="font-weight:600; color:#1e293b; word-break: break-all;">${item.content}</span><span style="font-size:11px; color:#64748b; white-space: nowrap;">(${item.date})</span></div><div style="flex-shrink: 0;"><span style="font-weight: bold; font-size:12px;" class="status-select ${getStatusClass(item.status)}">${item.status}</span></div>`;
        summaryContainer.appendChild(li);
    });
}

function getStatusClass(val) {
    if (val === '대기') return 'pending';
    if (val === '진행중') return 'progress';
    if (val === '검토중') return 'review';
    if (val === '승인중') return 'approving';
    if (val === '완료') return 'done';
    if (val === '보류') return 'hold';
    return '';
}

window.onload = function() {
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
    resetIdleTimer();
    updateDashboardUpcomingSummary();
    renderRecentVisitedPages();
    refreshAllWidths();
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
    refreshAllWidths();
}

function toggleComplete(checkbox) {
    checkbox.closest('tr').classList.toggle('completed', checkbox.checked);
    updateDashboardUpcomingSummary();
}

function updateDay(dateInput) {
    dateInput.closest('tr').querySelector('.day-cell').textContent = getDayOfWeek(dateInput.value);
    updateDashboardUpcomingSummary();
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
    updateDashboardUpcomingSummary();
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
    const disabledAttr = isGlobalLocked ? 'disabled' : '';
    tr.innerHTML = `
        <td><input type="text" class="contact-name" value="${data.name || ''}" placeholder="이름" style="width: 90px; min-width: 90px;" ${disabledAttr}></td>
        <td><input type="text" class="contact-role" value="${data.role || ''}" placeholder="직책" style="width: 60px; min-width: 60px;" ${disabledAttr}></td>
        <td><input type="text" class="contact-phone" value="${formatPhoneNumber(data.phone || '')}" placeholder="연락처" style="width: 105px; min-width: 105px;" onchange="this.value = formatPhoneNumber(this.value)" ${disabledAttr}></td>
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

function sortContacts() {
    const tbody = document.getElementById('contactsTableBody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    rows.sort((a, b) => {
        const vA = a.querySelector('.contact-name').value.trim(), vB = b.querySelector('.contact-name').value.trim();
        return contactSortAsc ? vA.localeCompare(vB, 'ko') : vB.localeCompare(vA, 'ko');
    });
    contactSortAsc = !contactSortAsc;
    rows.forEach(row => tbody.appendChild(row));
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
        const formatted = formatPhoneNumber(phoneInput.value);
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
        updateDashboardUpcomingSummary();
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
