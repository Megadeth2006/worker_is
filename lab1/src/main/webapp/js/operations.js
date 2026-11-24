async function loadWorkersForOps() {
    try {
        const data = await apiFetch('/workers?page=0&size=100&sortBy=id&sortDir=asc');
        fillSelect('opMoveWorkerId', data.content, w => `#${w.id}: ${w.name} (Орг #${w.organization.id}: ${w.organization.fullName || w.organization.type})`);
        fillSelect('opIndexWorkerId', data.content, w => `#${w.id}: ${w.name} (ЗП: ${w.salary})`);
    } catch (e) {
        console.error(e);
    }
}

async function loadRatingGroups() {
    try {
        const rows = await apiFetch('/operations/rating-groups');
        const tbody = document.getElementById('ratingGroupsBody');
        tbody.innerHTML = rows.length
            ? rows.map(r => `<tr><td>${r.rating}</td><td>${r.count}</td></tr>`).join('')
            : '<tr><td colspan="2" class="text-muted text-center">Нет данных</td></tr>';
    } catch (e) {
        showToast(e.message, 'danger');
    }
}

async function runCountByRating() {
    try {
        const r = validateNumber(document.getElementById('opCountRatingInput').value, 'Рейтинг', { positive: true, integer: true });
        const data = await apiFetch('/operations/count-by-rating?rating=' + r);
        document.getElementById('opCountResult').textContent = `Количество сотрудников с rating = ${r}: ${data.count}`;
    } catch (e) {
        showToast(e.message, 'danger');
    }
}

async function runUniqueRatings() {
    try {
        const arr = await apiFetch('/operations/unique-ratings');
        document.getElementById('opUniqueResult').innerHTML = `Уникальные значения rating: <code>[${arr.join(', ')}]</code>`;
    } catch (e) {
        showToast(e.message, 'danger');
    }
}

async function runMoveWorker() {
    const out = document.getElementById('opMoveResult');
    try {
        const wId = validateNumber(document.getElementById('opMoveWorkerId').value, 'Сотрудник', { integer: true });
        const oId = validateNumber(document.getElementById('opMoveOrgId').value, 'Организация', { integer: true });
        const res = await apiFetch(`/operations/move?workerId=${wId}&newOrgId=${oId}`, { method: 'POST' });
        out.innerHTML = `<div class="alert alert-success py-1 mb-0">${escapeHtml(res.message)}</div>`;
        await loadWorkers();
        await loadWorkersForOps();
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
        await loadWorkers();
        await loadWorkersForOps();
    } catch (e) {
        out.innerHTML = `<div class="alert alert-danger py-1 mb-0">${escapeHtml(e.message)}</div>`;
    }
}