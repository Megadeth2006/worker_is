const aux = {
    locations: [],
    coordinates: [],
    addresses: [],
    persons: [],
    organizations: []
};

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
        await loadAllAux();
    } catch (e) {
        showToast(e.message, 'danger');
    }
}

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
    } catch (e) {
        showFormError('locError', e.message);
    }
}

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
    } catch (e) {
        showFormError('coordError', e.message);
    }
}

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
    } catch (e) {
        showFormError('addrError', e.message);
    }
}

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
    } catch (e) {
        showFormError('persError', e.message);
    }
}

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
    } catch (e) {
        showFormError('orgError', e.message);
    }
}