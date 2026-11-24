const state = {
    page: 0,
    size: 10,
    sortBy: 'id',
    sortDir: 'asc',
    filters: {}
};

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
        icon.textContent = th.dataset.sort === state.sortBy ? (state.sortDir === 'asc' ? '▲' : '▼') : '';
    });
}

function resetFilters() {
    state.filters = {};
    state.page = 0;
    document.querySelectorAll('.filter-input').forEach(inp => inp.value = '');
    loadWorkers();
}

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
        await loadWorkers();
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