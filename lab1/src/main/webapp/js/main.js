document.addEventListener('DOMContentLoaded', () => {
    ['workerModal', 'workerDetailsModal', 'locationModal', 'coordinatesModal',
        'addressModal', 'personModal', 'organizationModal'].forEach(id => {
        modals[id] = new bootstrap.Modal(document.getElementById(id));
    });

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