const BASE_PATH = window.location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
const API = BASE_PATH + '/api';

const modals = {};

async function apiFetch(url, options = {}) {
    const res = await fetch(API + url, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
    });
    if (res.status === 204) return null;

    const text = await res.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = { error: text };
    }

    if (!res.ok) {
        const msg = (data && data.error) ? data.error : `Ошибка HTTP ${res.status}`;
        throw new Error(msg);
    }
    return data;
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatDate(val) {
    if (!val) return '—';
    // Убираем суффикс [UTC], который иногда добавляет JSON-B (Yasson)
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
    const toast = new bootstrap.Toast(el, { delay: 3500 });
    toast.show();
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

function fillSelect(id, items, labelFn, allowNull = false) {
    const sel = document.getElementById(id);
    if (!sel) return;
    const prev = sel.value;
    let html = allowNull ? '<option value="">-- Не задан (null) --</option>' : '';
    html += items.map(it => `<option value="${it.id}">${escapeHtml(labelFn(it))}</option>`).join('');
    sel.innerHTML = html;
    if (prev && Array.from(sel.options).some(o => o.value === prev)) {
        sel.value = prev;
    }
}