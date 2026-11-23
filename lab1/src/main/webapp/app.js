// Базовый путь (автоматически учитывает /lab1)
const BASE_PATH = window.location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
const API = BASE_PATH + '/api';

// Состояние таблицы Worker
const state = {
    page: 0,
    size: 10,
    sortBy: 'id',
    sortDir: 'asc',
    filters: {}
};

// Кэш справочников
const aux = {
    locations: [],
    coordinates: [],
    addresses: [],
    persons: [],
    organizations: [],
    workersAll: []
};

// Экземпляры Bootstrap-модалок
const modals = {};

document.addEventListener('DOMContentLoaded', () => {
    ['workerModal', 'workerDetailsModal', 'locationModal', 'coordinatesModal',
        'addressModal', 'personModal', 'organizationModal'].forEach(id => {
        modals[id] = new bootstrap.Modal(document.getElementById(id));
    });

    // Дебаунс на фильтры таблицы
    let filterTimer;
    document.querySelectorAll('.filter-input').forEach(inp => {
        inp.addEventListener('input', () => {
            clearTimeout(filterTimer);
            filterTimer = setTimeout(() => {
                state.filters[inp.dataset.filter] = inp.value;
                state.page = 0;
                loadWorkers();
            }, 300);
        });
    });

    updateSortIcons();
    loadAllAux();
    loadWorkers();
    connectWebSocket();
});

// ==================== НАВИГАЦИЯ ====================
function switchSection(name) {
    ['workers', 'aux', 'operations'].forEach(sec => {
        document.getElementById('view-' + sec).classList.toggle('d-none', sec !== name);
        document.getElementById('nav-' + sec).classList.toggle('active', sec === name);
    });
    if (name === 'operations') {
        loadRatingGroups();
        loadWorkersForOps();
    }
}

// ==================== WEBSOCKET ====================
function connectWebSocket() {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}${BASE_PATH}/ws/updates`;
    const badge = document.getElementById('wsStatusBadge');

    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
        badge.className = 'badge bg-success';
        badge.textContent = 'WS: подключено';
    };
    ws.onmessage = (event) => {
        loadAllAux();
        loadWorkers();
        if (!document.getElementById('view-operations').classList.contains('d-none')) {
            loadRatingGroups();
            loadWorkersForOps();
        }
        showToast('Данные обновлены (' + event.data + ')', 'info');
    };
    ws.onclose = () => {
        badge.className = 'badge bg-danger';
        badge.textContent = 'WS: переподключение...';
        setTimeout(connectWebSocket, 3000);
    };
    ws.onerror = () => ws.close();
}

// ==================== ХЕЛПЕРЫ ====================
async function apiFetch(url, options = {}) {
    const res = await fetch(API + url, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
    });
    if (res.status === 204) return null;
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { error: text }; }
    if (!res.ok) {
        const msg = (data && data.error) ? data.error : `Ошибка HTTP ${res.status}`;
        throw new Error(msg);
    }
    return data;
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDate(val) {
    if (!val) return '—';
    const cleaned = typeof val === 'string' ? val.replace(/\[.*\]$/, '') : val;
    const d = new Date(cleaned);
    return isNaN(d.getTime()) ? escapeHtml(val) : d.toLocaleString('ru-RU');
}

function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    const bg = type === 'danger' ? 'text-bg-danger' : (type === 'info' ? 'text-bg-primary' : 'text-bg-success');
    const el = document.createElement('div');
    el.className = `toast align-items-center ${bg} border-0 mb-2`;
    el.innerHTML = `<div class="d-flex"><div class="toast-body">${escapeHtml(msg)}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
    container.appendChild(el);
    const t = new bootstrap.Toast(el, { delay: 3500 });
    t.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
}

function showFormError(errDivId, msg) {
    const div = document.getElementById(errDivId);
    div.textContent = msg;
    div.classList.remove('d-none');
}
function hideFormError(errDivId) {
    document.getElementById(errDivId).classList.add('d-none');
}

function validateNumber(raw, fieldName, { required = true, positive = false, integer = false } = {}) {
    if (raw === '' || raw === null || raw === undefined) {
        if (required) throw new Error(`Поле "${fieldName}" обязательно`);
        return null;
    }
    const num = Number(raw);
    if (!Number.isFinite(num)) throw new Error(`Поле "${fieldName}" должно быть числом`);
    if (integer && !Number.isInteger(num)) throw new Error(`Поле "${fieldName}" должно быть целым числом`);
    if (positive && num <= 0) throw new Error(`Поле "${fieldName}" должно быть больше 0`);
    return num;
}

// ==================== ТАБЛИЦА WORKER ====================
async function loadWorkers() {
    const params = new URLSearchParams({
        page: state.page,
        size: state.size,
        sortBy: state.sortBy,
        sortDir: state.sortDir
    });
    Object.entries(state.filters).forEach(([k, v]) => {
        if (v && v.trim()) params.set(k, v.trim());
    });

    try {
        const data = await apiFetch('/workers?' + params.toString());
        renderWorkersTable(data.content);
        renderPagination(data);
    } catch (e) {
        showToast(e.message, 'danger');
    }
}

function renderWorkersTable(workers) {
    const tbody = document.getElementById('workersTableBody');
    if (!workers || workers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="17" class="text-center py-3 text-muted">Объекты не найдены</td></tr>';
        return;
    }
    tbody.innerHTML = workers.map(w => `
        <tr>
            <td>${w.id}</td>
            <td class="fw-semibold">${escapeHtml(w.name)}</td>
            <td>(${w.coordinates.x}; ${w.coordinates.y})</td>
            <td class="small">${formatDate(w.creationDate)}</td>
            <td>${w.organization.fullName ? escapeHtml(w.organization.fullName) : '<span class="text-muted">null</span>'}</td>
            <td>${escapeHtml(w.organization.type)}</td>
            <td>${escapeHtml(w.organization.officialAddress.zipCode)}</td>
            <td>${escapeHtml(w.organization.officialAddress.town.name)}</td>
            <td>${w.salary}</td>
            <td>${w.rating}</td>
            <td>${escapeHtml(w.position)}</td>
            <td>${w.status ? escapeHtml(w.status) : '<span class="text-muted">null</span>'}</td>
            <td>${escapeHtml(w.person.eyeColor)}</td>
            <td>${w.person.hairColor ? escapeHtml(w.person.hairColor) : '<span class="text-muted">null</span>'}</td>
            <td>${w.person.nationality ? escapeHtml(w.person.nationality) : '<span class="text-muted">null</span>'}</td>
            <td>${escapeHtml(w.person.location.name)}</td>
            <td class="text-nowrap">
                <button class="btn btn-sm btn-outline-info py-0 px-1" onclick="showWorkerDetails(${w.id})">Инфо</button>
                <button class="btn btn-sm btn-outline-warning py-0 px-1" onclick="openEditWorkerModal(${w.id})">Изм.</button>
                <button class="btn btn-sm btn-outline-danger py-0 px-1" onclick="deleteWorker(${w.id})">Удал.</button>
            </td>
        </tr>
    `).join('');
}

function renderPagination(pageData) {
    document.getElementById('paginationInfo').textContent =
        `Всего записей: ${pageData.totalElements} | Страница ${pageData.page + 1} из ${Math.max(1, pageData.totalPages)}`;

    const ul = document.getElementById('paginationContainer');
    const total = pageData.totalPages || 1;
    const cur = pageData.page;

    let html = `<li class="page-item ${cur === 0 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="goPage(${cur - 1}); return false;">«</a></li>`;
    for (let i = 0; i < total; i++) {
        html += `<li class="page-item ${i === cur ? 'active' : ''}">
            <a class="page-link" href="#" onclick="goPage(${i}); return false;">${i + 1}</a></li>`;
    }
    html += `<li class="page-item ${cur >= total - 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="goPage(${cur + 1}); return false;">»</a></li>`;
    ul.innerHTML = html;
}

function goPage(p) {
    if (p < 0) return;
    state.page = p;
    loadWorkers();
}

function changePageSize() {
    state.size = Number(document.getElementById('pageSizeSelect').value);
    state.page = 0;
    loadWorkers();
}

function toggleSort(field) {
    if (state.sortBy === field) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
        state.sortBy = field;
        state.sortDir = 'asc';
    }
    updateSortIcons();
    loadWorkers();
}

function updateSortIcons() {
    document.querySelectorAll('th.sortable').forEach(th => {
        const icon = th.querySelector('.sort-icon');
        if (th.dataset.sort === state.sortBy) {
            icon.textContent = state.sortDir === 'asc' ? '▲' : '▼';
        } else {
            icon.textContent = '';
        }
    });
}

function resetFilters() {
    state.filters = {};
    state.page = 0;
    document.querySelectorAll('.filter-input').forEach(inp => inp.value = '');
    loadWorkers();
}

// ==================== CRUD WORKER ====================
function openCreateWorkerModal() {
    hideFormError('workerFormError');
    document.getElementById('workerModalTitle').textContent = 'Создать нового сотрудника';
    document.getElementById('workerEditId').value = '';
    document.getElementById('wName').value = '';
    document.getElementById('wSalary').value = '';
    document.getElementById('wRating').value = '';
    document.getElementById('wPosition').value = 'MANAGER';
    document.getElementById('wStatus').value = '';
    if (!aux.coordinates.length || !aux.organizations.length || !aux.persons.length) {
        showFormError('workerFormError', 'Сначала создайте хотя бы по одной записи в Справочниках (Координаты, Организация, Персона)');
    }
    modals.workerModal.show();
}

async function openEditWorkerModal(id) {
    hideFormError('workerFormError');
    try {
        const w = await apiFetch('/workers/' + id);
        document.getElementById('workerModalTitle').textContent = 'Редактировать сотрудника #' + id;
        document.getElementById('workerEditId').value = w.id;
        document.getElementById('wName').value = w.name;
        document.getElementById('wSalary').value = w.salary;
        document.getElementById('wRating').value = w.rating;
        document.getElementById('wPosition').value = w.position;
        document.getElementById('wStatus').value = w.status || '';
        document.getElementById('wCoordinatesId').value = w.coordinates.id;
        document.getElementById('wOrganizationId').value = w.organization.id;
        document.getElementById('wPersonId').value = w.person.id;
        modals.workerModal.show();
    } catch (e) {
        showToast(e.message, 'danger');
    }
}

async function saveWorker() {
    hideFormError('workerFormError');
    try {
        const id = document.getElementById('workerEditId').value;
        const name = document.getElementById('wName').value;
        if (!name || !name.trim()) throw new Error('Имя сотрудника не может быть пустым');

        const payload = {
            name: name.trim(),
            salary: validateNumber(document.getElementById('wSalary').value, 'Зарплата', { positive: true }),
            rating: validateNumber(document.getElementById('wRating').value, 'Рейтинг', { positive: true, integer: true }),
            position: document.getElementById('wPosition').value,
            status: document.getElementById('wStatus').value || null,
            coordinatesId: validateNumber(document.getElementById('wCoordinatesId').value, 'Координаты', { integer: true }),
            organizationId: validateNumber(document.getElementById('wOrganizationId').value, 'Организация', { integer: true }),
            personId: validateNumber(document.getElementById('wPersonId').value, 'Персона', { integer: true })
        };

        await apiFetch(id ? '/workers/' + id : '/workers', {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
        });
        modals.workerModal.hide();
        showToast(id ? 'Сотрудник обновлён' : 'Сотрудник создан');
        await loadWorkers();
    } catch (e) {
        showFormError('workerFormError', e.message);
    }
}

async function deleteWorker(id) {
    if (!confirm(`Удалить сотрудника #${id}?`)) return;
    try {
        await apiFetch('/workers/' + id, { method: 'DELETE' });
        showToast('Сотрудник удалён');
        loadWorkers();
    } catch (e) {
        showToast(e.message, 'danger');
    }
}

async function searchWorkerById() {
    const id = document.getElementById('searchWorkerIdInput').value;
    if (!id || Number(id) <= 0) {
        showToast('Введите корректный положительный ID', 'danger');
        return;
    }
    await showWorkerDetails(id);
}

async function showWorkerDetails(id) {
    try {
        const w = await apiFetch('/workers/' + id);
        const o = w.organization;
        const p = w.person;
        const postalHtml = o.postalAddress
            ? `${escapeHtml(o.postalAddress.zipCode)}, г. ${escapeHtml(o.postalAddress.town.name)} (${o.postalAddress.town.x}; ${o.postalAddress.town.y}; ${o.postalAddress.town.z})`
            : 'null';

        document.getElementById('workerDetailsBody').innerHTML = `
            <h6>Основная информация (Worker #${w.id})</h6>
            <ul class="list-group mb-3">
                <li class="list-group-item"><strong>Имя:</strong> ${escapeHtml(w.name)}</li>
                <li class="list-group-item"><strong>Дата создания:</strong> ${formatDate(w.creationDate)}</li>
                <li class="list-group-item"><strong>Зарплата:</strong> ${w.salary} | <strong>Рейтинг:</strong> ${w.rating}</li>
                <li class="list-group-item"><strong>Должность:</strong> ${escapeHtml(w.position)} | <strong>Статус:</strong> ${w.status ? escapeHtml(w.status) : 'null'}</li>
            </ul>
            <h6>Координаты (#${w.coordinates.id})</h6>
            <p class="ms-2">X = ${w.coordinates.x}, Y = ${w.coordinates.y}</p>
            <h6>Организация (#${o.id})</h6>
            <ul class="list-group mb-3">
                <li class="list-group-item"><strong>Название:</strong> ${o.fullName ? escapeHtml(o.fullName) : 'null'} (${escapeHtml(o.type)})</li>
                <li class="list-group-item"><strong>Годовой оборот:</strong> ${o.annualTurnover} | <strong>Сотрудников:</strong> ${o.employeesCount}</li>
                <li class="list-group-item"><strong>Официальный адрес:</strong> ${escapeHtml(o.officialAddress.zipCode)}, г. ${escapeHtml(o.officialAddress.town.name)} (${o.officialAddress.town.x}; ${o.officialAddress.town.y}; ${o.officialAddress.town.z})</li>
                <li class="list-group-item"><strong>Почтовый адрес:</strong> ${postalHtml}</li>
            </ul>
            <h6>Персона (#${p.id})</h6>
            <ul class="list-group">
                <li class="list-group-item"><strong>Цвет глаз:</strong> ${escapeHtml(p.eyeColor)} | <strong>Цвет волос:</strong> ${p.hairColor ? escapeHtml(p.hairColor) : 'null'}</li>
                <li class="list-group-item"><strong>Вес:</strong> ${p.weight} | <strong>Национальность:</strong> ${p.nationality ? escapeHtml(p.nationality) : 'null'}</li>
                <li class="list-group-item"><strong>Локация:</strong> ${escapeHtml(p.location.name)} (${p.location.x}; ${p.location.y}; ${p.location.z})</li>
            </ul>
        `;
        document.getElementById('btnEditFromDetails').onclick = () => {
            modals.workerDetailsModal.hide();
            openEditWorkerModal(w.id);
        };
        modals.workerDetailsModal.show();
    } catch (e) {
        showToast(e.message, 'danger');
    }
}

// ==================== СПРАВОЧНИКИ (ВСПОМОГАТЕЛЬНЫЕ ОБЪЕКТЫ) ====================
async function loadAllAux() {
    const tasks = [
        apiFetch('/locations').then(d => { aux.locations = d || []; }),
        apiFetch('/coordinates').then(d => { aux.coordinates = d || []; }),
        apiFetch('/addresses').then(d => { aux.addresses = d || []; }),
        apiFetch('/persons').then(d => { aux.persons = d || []; }),
        apiFetch('/organizations').then(d => { aux.organizations = d || []; })
    ];

    const names = ['locations', 'coordinates', 'addresses', 'persons', 'organizations'];
    const results = await Promise.allSettled(tasks);
    results.forEach((r, idx) => {
        if (r.status === 'rejected') {
            console.error('Ошибка загрузки ' + names[idx], r.reason);
            showToast(`Ошибка загрузки ${names[idx]}: ${r.reason.message}`, 'danger');
        }
    });

    renderAuxTables();
    populateSelects();
}

function populateSelects() {
    fillSelect('wCoordinatesId', aux.coordinates, c => `#${c.id}: (${c.x}; ${c.y})`);
    fillSelect('wOrganizationId', aux.organizations, o => `#${o.id}: ${o.fullName || o.type} (оборот: ${o.annualTurnover})`);
    fillSelect('wPersonId', aux.persons, p => `#${p.id}: глаза=${p.eyeColor}, вес=${p.weight}, ${p.location.name}`);

    fillSelect('addrTownId', aux.locations, l => `#${l.id}: ${l.name} (${l.x}; ${l.y}; ${l.z})`);
    fillSelect('persLocationId', aux.locations, l => `#${l.id}: ${l.name} (${l.x}; ${l.y}; ${l.z})`);
    fillSelect('orgOfficialAddrId', aux.addresses, a => `#${a.id}: ${a.zipCode}, ${a.town.name}`);
    fillSelect('orgPostalAddrId', aux.addresses, a => `#${a.id}: ${a.zipCode}, ${a.town.name}`, true);
    fillSelect('opMoveOrgId', aux.organizations, o => `#${o.id}: ${o.fullName || o.type}`);
}

function fillSelect(id, items, labelFn, allowNull = false) {
    const sel = document.getElementById(id);
    if (!sel) return;
    const prev = sel.value;
    let html = allowNull ? '<option value="">-- Не задан (null) --</option>' : '';
    html += items.map(it => `<option value="${it.id}">${escapeHtml(labelFn(it))}</option>`).join('');
    sel.innerHTML = html;
    if (prev && Array.from(sel.options).some(o => o.value === prev)) sel.value = prev;
}

function renderAuxTables() {
    document.getElementById('tbl-locations').innerHTML = aux.locations.map(l => `
        <tr><td>${l.id}</td><td>${escapeHtml(l.name)}</td><td>${l.x}</td><td>${l.y}</td><td>${l.z}</td>
        <td>
            <button class="btn btn-sm btn-outline-warning py-0" onclick="openLocationModal(${l.id})">Изм.</button>
            <button class="btn btn-sm btn-outline-danger py-0" onclick="deleteAux('/locations', ${l.id})">Удал.</button>
        </td></tr>`).join('');

    document.getElementById('tbl-coordinates').innerHTML = aux.coordinates.map(c => `
        <tr><td>${c.id}</td><td>${c.x}</td><td>${c.y}</td>
        <td>
            <button class="btn btn-sm btn-outline-warning py-0" onclick="openCoordinatesModal(${c.id})">Изм.</button>
            <button class="btn btn-sm btn-outline-danger py-0" onclick="deleteAux('/coordinates', ${c.id})">Удал.</button>
        </td></tr>`).join('');

    document.getElementById('tbl-addresses').innerHTML = aux.addresses.map(a => `
        <tr><td>${a.id}</td><td>${escapeHtml(a.zipCode)}</td><td>#${a.town.id} ${escapeHtml(a.town.name)}</td>
        <td>
            <button class="btn btn-sm btn-outline-warning py-0" onclick="openAddressModal(${a.id})">Изм.</button>
            <button class="btn btn-sm btn-outline-danger py-0" onclick="deleteAux('/addresses', ${a.id})">Удал.</button>
        </td></tr>`).join('');

    document.getElementById('tbl-persons').innerHTML = aux.persons.map(p => `
        <tr><td>${p.id}</td><td>${escapeHtml(p.eyeColor)}</td><td>${p.hairColor || 'null'}</td>
        <td>${p.weight}</td><td>${p.nationality || 'null'}</td><td>#${p.location.id} ${escapeHtml(p.location.name)}</td>
        <td>
            <button class="btn btn-sm btn-outline-warning py-0" onclick="openPersonModal(${p.id})">Изм.</button>
            <button class="btn btn-sm btn-outline-danger py-0" onclick="deleteAux('/persons', ${p.id})">Удал.</button>
        </td></tr>`).join('');

    document.getElementById('tbl-organizations').innerHTML = aux.organizations.map(o => `
        <tr><td>${o.id}</td><td>${o.fullName ? escapeHtml(o.fullName) : 'null'}</td><td>${escapeHtml(o.type)}</td>
        <td>${o.annualTurnover}</td><td>${o.employeesCount}</td>
        <td>#${o.officialAddress.id} ${escapeHtml(o.officialAddress.zipCode)}</td>
        <td>${o.postalAddress ? '#' + o.postalAddress.id + ' ' + escapeHtml(o.postalAddress.zipCode) : 'null'}</td>
        <td>
            <button class="btn btn-sm btn-outline-warning py-0" onclick="openOrgModal(${o.id})">Изм.</button>
            <button class="btn btn-sm btn-outline-danger py-0" onclick="deleteAux('/organizations', ${o.id})">Удал.</button>
        </td></tr>`).join('');
}

async function deleteAux(path, id) {
    if (!confirm(`Удалить объект #${id}?`)) return;
    try {
        await apiFetch(`${path}/${id}`, { method: 'DELETE' });
        showToast('Объект удалён');
        loadAllAux();
    } catch (e) {
        showToast(e.message, 'danger');
    }
}

// --- Локации ---
function openLocationModal(id = null) {
    hideFormError('locError');
    const l = id ? aux.locations.find(x => x.id === id) : null;
    document.getElementById('locEditId').value = l ? l.id : '';
    document.getElementById('locName').value = l ? l.name : '';
    document.getElementById('locX').value = l ? l.x : '';
    document.getElementById('locY').value = l ? l.y : '';
    document.getElementById('locZ').value = l ? l.z : '';
    modals.locationModal.show();
}
async function saveLocation() {
    hideFormError('locError');
    try {
        const id = document.getElementById('locEditId').value;
        const name = document.getElementById('locName').value;
        if (!name || !name.trim()) throw new Error('Название локации не может быть пустым');
        const payload = {
            name: name.trim(),
            x: validateNumber(document.getElementById('locX').value, 'X', { integer: true }),
            y: validateNumber(document.getElementById('locY').value, 'Y'),
            z: validateNumber(document.getElementById('locZ').value, 'Z')
        };
        await apiFetch(id ? `/locations/${id}` : '/locations', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
        modals.locationModal.hide();
        showToast('Локация сохранена');
        await loadAllAux();
    } catch (e) { showFormError('locError', e.message); }
}

// --- Координаты ---
function openCoordinatesModal(id = null) {
    hideFormError('coordError');
    const c = id ? aux.coordinates.find(x => x.id === id) : null;
    document.getElementById('coordEditId').value = c ? c.id : '';
    document.getElementById('coordX').value = c ? c.x : '';
    document.getElementById('coordY').value = c ? c.y : '';
    modals.coordinatesModal.show();
}
async function saveCoordinates() {
    hideFormError('coordError');
    try {
        const id = document.getElementById('coordEditId').value;
        const payload = {
            x: validateNumber(document.getElementById('coordX').value, 'X'),
            y: validateNumber(document.getElementById('coordY').value, 'Y')
        };
        await apiFetch(id ? `/coordinates/${id}` : '/coordinates', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
        modals.coordinatesModal.hide();
        showToast('Координаты сохранены');
        await loadAllAux();
    } catch (e) { showFormError('coordError', e.message); }
}

// --- Адреса ---
function openAddressModal(id = null) {
    hideFormError('addrError');
    const a = id ? aux.addresses.find(x => x.id === id) : null;
    document.getElementById('addrEditId').value = a ? a.id : '';
    document.getElementById('addrZipCode').value = a ? a.zipCode : '';
    if (a) document.getElementById('addrTownId').value = a.town.id;
    modals.addressModal.show();
}
async function saveAddress() {
    hideFormError('addrError');
    try {
        const id = document.getElementById('addrEditId').value;
        const zip = document.getElementById('addrZipCode').value;
        if (zip === null || zip === undefined || zip === '') throw new Error('Индекс обязателен');
        const payload = {
            zipCode: zip,
            townId: validateNumber(document.getElementById('addrTownId').value, 'Город', { integer: true })
        };
        await apiFetch(id ? `/addresses/${id}` : '/addresses', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
        modals.addressModal.hide();
        showToast('Адрес сохранён');
        await loadAllAux();
    } catch (e) { showFormError('addrError', e.message); }
}

// --- Персоны ---
function openPersonModal(id = null) {
    hideFormError('persError');
    const p = id ? aux.persons.find(x => x.id === id) : null;
    document.getElementById('persEditId').value = p ? p.id : '';
    document.getElementById('persEyeColor').value = p ? p.eyeColor : 'BLUE';
    document.getElementById('persHairColor').value = p && p.hairColor ? p.hairColor : '';
    document.getElementById('persWeight').value = p ? p.weight : '';
    document.getElementById('persNationality').value = p && p.nationality ? p.nationality : '';
    if (p) document.getElementById('persLocationId').value = p.location.id;
    modals.personModal.show();
}
async function savePerson() {
    hideFormError('persError');
    try {
        const id = document.getElementById('persEditId').value;
        const payload = {
            eyeColor: document.getElementById('persEyeColor').value,
            hairColor: document.getElementById('persHairColor').value || null,
            weight: validateNumber(document.getElementById('persWeight').value, 'Вес', { positive: true }),
            nationality: document.getElementById('persNationality').value || null,
            locationId: validateNumber(document.getElementById('persLocationId').value, 'Локация', { integer: true })
        };
        await apiFetch(id ? `/persons/${id}` : '/persons', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
        modals.personModal.hide();
        showToast('Персона сохранена');
        await loadAllAux();
    } catch (e) { showFormError('persError', e.message); }
}

// --- Организации ---
function openOrgModal(id = null) {
    hideFormError('orgError');
    const o = id ? aux.organizations.find(x => x.id === id) : null;
    document.getElementById('orgEditId').value = o ? o.id : '';
    document.getElementById('orgFullName').value = o && o.fullName ? o.fullName : '';
    document.getElementById('orgType').value = o ? o.type : 'COMMERCIAL';
    document.getElementById('orgTurnover').value = o ? o.annualTurnover : '';
    document.getElementById('orgEmployees').value = o ? o.employeesCount : '';
    if (o) {
        document.getElementById('orgOfficialAddrId').value = o.officialAddress.id;
        document.getElementById('orgPostalAddrId').value = o.postalAddress ? o.postalAddress.id : '';
    }
    modals.organizationModal.show();
}
async function saveOrganization() {
    hideFormError('orgError');
    try {
        const id = document.getElementById('orgEditId').value;
        const fn = document.getElementById('orgFullName').value;
        const postAddr = document.getElementById('orgPostalAddrId').value;
        const payload = {
            fullName: fn && fn.trim() ? fn.trim() : null,
            type: document.getElementById('orgType').value,
            annualTurnover: validateNumber(document.getElementById('orgTurnover').value, 'Годовой оборот', { positive: true }),
            employeesCount: validateNumber(document.getElementById('orgEmployees').value, 'Сотрудников', { positive: true, integer: true }),
            officialAddressId: validateNumber(document.getElementById('orgOfficialAddrId').value, 'Офиц. адрес', { integer: true }),
            postalAddressId: postAddr ? Number(postAddr) : null
        };
        await apiFetch(id ? `/organizations/${id}` : '/organizations', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
        modals.organizationModal.hide();
        showToast('Организация сохранена');
        await loadAllAux();
    } catch (e) { showFormError('orgError', e.message); }
}

// ==================== СПЕЦИАЛЬНЫЕ ОПЕРАЦИИ ====================
async function loadWorkersForOps() {
    try {
        const data = await apiFetch('/workers?page=0&size=100&sortBy=id&sortDir=asc');
        fillSelect('opMoveWorkerId', data.content, w => `#${w.id}: ${w.name} (Орг #${w.organization.id}: ${w.organization.fullName || w.organization.type})`);
        fillSelect('opIndexWorkerId', data.content, w => `#${w.id}: ${w.name} (ЗП: ${w.salary})`);
    } catch (e) { console.error(e); }
}

async function loadRatingGroups() {
    try {
        const rows = await apiFetch('/operations/rating-groups');
        const tbody = document.getElementById('ratingGroupsBody');
        tbody.innerHTML = rows.length
            ? rows.map(r => `<tr><td>${r.rating}</td><td>${r.count}</td></tr>`).join('')
            : '<tr><td colspan="2" class="text-muted text-center">Нет данных</td></tr>';
    } catch (e) { showToast(e.message, 'danger'); }
}

async function runCountByRating() {
    try {
        const r = validateNumber(document.getElementById('opCountRatingInput').value, 'Рейтинг', { positive: true, integer: true });
        const data = await apiFetch('/operations/count-by-rating?rating=' + r);
        document.getElementById('opCountResult').textContent = `Количество сотрудников с rating = ${r}: ${data.count}`;
    } catch (e) { showToast(e.message, 'danger'); }
}

async function runUniqueRatings() {
    try {
        const arr = await apiFetch('/operations/unique-ratings');
        document.getElementById('opUniqueResult').innerHTML = `Уникальные значения rating: <code>[${arr.join(', ')}]</code>`;
    } catch (e) { showToast(e.message, 'danger'); }
}

async function runMoveWorker() {
    const out = document.getElementById('opMoveResult');
    try {
        const wId = validateNumber(document.getElementById('opMoveWorkerId').value, 'Сотрудник', { integer: true });
        const oId = validateNumber(document.getElementById('opMoveOrgId').value, 'Организация', { integer: true });
        const res = await apiFetch(`/operations/move?workerId=${wId}&newOrgId=${oId}`, { method: 'POST' });
        out.innerHTML = `<div class="alert alert-success py-1 mb-0">${escapeHtml(res.message)}</div>`;
        loadWorkers();
        loadWorkersForOps();
    } catch (e) {
        out.innerHTML = `<div class="alert alert-danger py-1 mb-0">${escapeHtml(e.message)}</div>`;
    }
}

async function runIndexSalary() {
    const out = document.getElementById('opIndexResult');
    try {
        const wId = validateNumber(document.getElementById('opIndexWorkerId').value, 'Сотрудник', { integer: true });
        const coeff = validateNumber(document.getElementById('opIndexCoeff').value, 'Коэффициент', { positive: true });
        const res = await apiFetch(`/operations/index-salary?workerId=${wId}&coeff=${coeff}`, { method: 'POST' });
        out.innerHTML = `<div class="alert alert-success py-1 mb-0">${escapeHtml(res.message)}. Новая зарплата: <strong>${res.newSalary}</strong></div>`;
        loadWorkers();
        loadWorkersForOps();
    } catch (e) {
        out.innerHTML = `<div class="alert alert-danger py-1 mb-0">${escapeHtml(e.message)}</div>`;
    }
}