/**
 * tabDashboard.js – SOC Control Center V3
 */

const TabDashboard = (() => {
    let _regionChart = null;
    let _areaChart = null;
    let _allTickets = [];
    let _activeRange = null; // '7d', '15d', '30d'

    function init() { 
        _bindFilterEvents();
        window.addEventListener('langChanged', () => {
            if (document.getElementById('tab-dashboard').classList.contains('active')) {
                render();
            }
        });
        window.addEventListener('themeChanged', () => {
            if (document.getElementById('tab-dashboard').classList.contains('active')) {
                _applyFilters();
            }
        });
    }

    async function render() {
        _allTickets = await Store.getTickets('entidades');
        _populateRegionFilter(_allTickets);
        
        // Initial defaults if empty
        const startInput = document.getElementById('db-start-date');
        const endInput = document.getElementById('db-end-date');
        // No default range - show all records initially
        // if (startInput && !startInput.value) {
        //     _setQuickRange(7, false); 
        // }

        _applyFilters();
    }

    function _bindFilterEvents() {
        const btnQuery = document.getElementById('db-btn-query');
        const btn7d = document.getElementById('db-btn-7d');
        const btn15d = document.getElementById('db-btn-15d');
        const btn30d = document.getElementById('db-btn-30d');
        const btnToday = document.getElementById('db-btn-today');
        const selRegion = document.getElementById('db-filter-region');

        if (btnQuery) btnQuery.addEventListener('click', () => { _activeRange = null; _updateRangeButtons(); _applyFilters(); });
        if (btnToday) btnToday.addEventListener('click', () => _setQuickRange(0, true, 'today'));
        if (btn7d) btn7d.addEventListener('click', () => _setQuickRange(7));
        if (btn15d) btn15d.addEventListener('click', () => _setQuickRange(15));
        if (btn30d) btn30d.addEventListener('click', () => _setQuickRange(30));
        
        if (selRegion) selRegion.addEventListener('change', () => _applyFilters());
    }

    function _setQuickRange(days, autoRender = true, rangeId = null) {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);

        _activeRange = rangeId || `${days}d`;
        _updateRangeButtons();

        const startInput = document.getElementById('db-start-date');
        const endInput = document.getElementById('db-end-date');
        
        if (startInput) startInput.value = _formatForInput(start);
        if (endInput) endInput.value = _formatForInput(end);

        if (autoRender) _applyFilters();
    }

    function _updateRangeButtons() {
        ['today', '7d', '15d', '30d'].forEach(r => {
            const btn = document.getElementById(`db-btn-${r}`);
            if (btn) btn.classList.toggle('active', _activeRange === r);
        });
    }

    function _formatForInput(date) {
        const pad = (n) => String(n).padStart(2, '0');
        const y = date.getFullYear();
        const m = pad(date.getMonth() + 1);
        const d = pad(date.getDate());
        return `${y}-${m}-${d}`;
    }

    function _applyFilters() {
        const startVal = document.getElementById('db-start-date')?.value;
        const endVal = document.getElementById('db-end-date')?.value;
        const regionVal = document.getElementById('db-filter-region')?.value;

        let filtered = [..._allTickets];

        if (regionVal) {
            filtered = filtered.filter(t => t.region === regionVal);
        }

        if (startVal) {
            // Normalize to start of local day
            const startDate = new Date(startVal + 'T00:00:00');
            filtered = filtered.filter(t => new Date(t.createdAt) >= startDate);
        }
        if (endVal) {
            // Normalize to end of local day
            const endDate = new Date(endVal + 'T23:59:59');
            filtered = filtered.filter(t => new Date(t.createdAt) <= endDate);
        }

        _renderTopKPIs(filtered);
        _renderRegions(filtered);
        _renderCharts(filtered);
        _renderLiveTable(filtered);
    }

    function _animateValue(id, start, end, duration) {
        const obj = document.getElementById(id);
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }

    function _renderTopKPIs(tickets) {
        const container = document.getElementById('db-kpi-container');
        if (!container) return;

        let abierto = 0, enCurso = 0, cerrado = 0;
        tickets.forEach(t => {
            const st = t.estado || 'Abierto';
            if (st === 'Abierto') abierto++;
            else if (st === 'En curso') enCurso++;
            else if (st === 'Cerrado') cerrado++;
        });
        
        const kpis = [
            { id: 'soc-total', label: I18n.translate('DB_TOTAL_RECORDS'), val: tickets.length, color: 'soc-blue', icon: '📊' },
            { id: 'soc-abierto', label: I18n.translate('T6_KPI_OPEN'), val: abierto, color: 'soc-red', icon: '🔴' },
            { id: 'soc-curso', label: I18n.translate('T6_KPI_PROGRESS'), val: enCurso, color: 'soc-amber', icon: '🟡' },
            { id: 'soc-cerrado', label: I18n.translate('T6_KPI_CLOSED'), val: cerrado, color: 'soc-green', icon: '🟢' }
        ];

        container.innerHTML = kpis.map(k => `
            <div class="kpi-card ${k.color}">
                <div class="kpi-label">${k.label}</div>
                <div class="kpi-value" id="${k.id}">0</div>
                <div class="kpi-icon-abs">${k.icon}</div>
            </div>
        `).join('');

        setTimeout(() => {
            kpis.forEach(k => _animateValue(k.id, 0, k.val, 1000));
        }, 100);
    }

    function _renderRegions(tickets) {
        const container = document.getElementById('db-region-grid');
        if (!container) return;

        const counts = {};
        tickets.forEach(t => { if(t.region) counts[t.region] = (counts[t.region] || 0) + 1; });

        // Get top 4 regions for the image style
        const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 4);

        container.innerHTML = sorted.map(([name, count], idx) => {
            const color = _getRegionPillColor(name);
            return `
                <div class="region-card" style="background: ${color}; color: white;">
                    <div class="region-info">
                        <span class="name">${name}</span>
                    </div>
                    <span class="region-card-value" id="reg-c-${idx}">0</span>
                </div>
            `;
        }).join('');

        setTimeout(() => {
            sorted.forEach(([, count], idx) => _animateValue(`reg-c-${idx}`, 0, count, 1000));
        }, 200);
    }

    function _renderCharts(tickets) {
        const ctxBar = document.getElementById('db-region-chart');
        const ctxDonut = document.getElementById('db-area-chart');
        if (!ctxBar || !ctxDonut) return;

        // Data for Bar Chart
        const regCounts = {};
        tickets.forEach(t => { if(t.region) regCounts[t.region] = (regCounts[t.region] || 0) + 1; });
        const regLabels = Object.keys(regCounts);
        const regData = Object.values(regCounts);
        
        // Hide skeletons
        const skBar = document.getElementById('skeleton-bar');
        const skDonut = document.getElementById('skeleton-donut');
        if (skBar) skBar.style.display = 'none';
        if (skDonut) skDonut.style.display = 'none';

        if (_regionChart) _regionChart.destroy();
        _regionChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: regLabels,
                datasets: [{
                    data: regData,
                    backgroundColor: regLabels.map(l => _getRegionPillColor(l)),
                    borderRadius: 5,
                    barPercentage: 0.5
                }]
            },
            options: _getChartOptions(false)
        });

        // Data for Donut Chart (Mapping 'tipo' as Area)
        const areaCounts = {};
        tickets.forEach(t => { 
            let label = t.tipo || 'Otros';
            const up = label.toUpperCase();
            
            if (up.includes('EDUCATIVA') || up.includes('IE')) label = I18n.translate('TYPE_IE');
            else if (up.includes('COMISARIA') || up.includes('POLICIA')) label = I18n.translate('TYPE_COMISARIA');
            else if (up.includes('HOSPITAL') || up.includes('SALUD')) label = I18n.translate('TYPE_HOSPITAL');
            else if (up.includes('PLAZA')) label = I18n.translate('TYPE_PLAZA');
            else if (up.includes('CAD')) label = I18n.translate('TYPE_CAD');
            else label = I18n.translate('TYPE_OTHER');
            
            areaCounts[label] = (areaCounts[label] || 0) + 1; 
        });

        const areaLabels = Object.keys(areaCounts);
        const areaData = Object.values(areaCounts);

        if (_areaChart) _areaChart.destroy();
        _areaChart = new Chart(ctxDonut, {
            type: 'doughnut',
            data: {
                labels: areaLabels,
                datasets: [{
                    data: areaData,
                    backgroundColor: ['#3b82f6', '#a855f7', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: _getChartOptions(true)
        });
    }

    function _renderLiveTable(tickets) {
        const tbody = document.getElementById('db-latest-table-body');
        if (!tbody) return;

        const latest = [...tickets].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);

        tbody.innerHTML = latest.map(t => {
            const date = t.fechaInc ? t.fechaInc.split('-').reverse().join('/') : '—';
            const st = t.estado || 'Abierto';
            
            let dotClass = 'offline';
            let statusText = 'Abierto';
            let textColor = '#ef4444';

            if (st === 'En curso') {
                dotClass = 'pulse-amber';
                statusText = I18n.translate('T6_KPI_PROGRESS');
                textColor = '#f59e0b';
            } else if (st === 'Cerrado') {
                dotClass = 'online';
                statusText = I18n.translate('T6_KPI_CLOSED');
                textColor = '#10b981';
            } else {
                statusText = I18n.translate('T6_KPI_OPEN');
            }

            return `
                <tr>
                    <td>${date}</td>
                    <td><span class="region-pill-soc" style="background: ${_getRegionPillColor(t.region)}">${t.region}</span></td>
                    <td>${t.provincia || '—'}</td>
                    <td>${t.localidad || '—'}</td>
                    <td style="color: #3b82f6; font-weight: 700;">${t.institucion || '—'}</td>
                    <td>${t.nombre}</td>
                    <td>${t.dni || '—'}</td>
                    <td>
                        <div class="status-cell">
                            <span class="status-dot ${dotClass}"></span>
                            <span style="color: ${textColor}; font-weight:600;">${statusText}</span>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function _getChartOptions(isDonut) {
        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#cbd5e1' : '#475569';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: isDonut,
                    position: 'bottom',
                    labels: { 
                        color: textColor, 
                        font: { family: 'Montserrat', size: 10, weight: '600' }, 
                        padding: 15, 
                        usePointStyle: true 
                    }
                }
            },
            scales: isDonut ? {} : {
                y: { 
                    grid: { color: gridColor }, 
                    ticks: { color: textColor, font: { family: 'Montserrat', size: 10, weight: '600' } } 
                },
                x: { 
                    grid: { display: false }, 
                    ticks: { color: textColor, font: { family: 'Montserrat', size: 10, weight: '600' } } 
                }
            }
        };
    }

    function _getRegionPillColor(region) {
        const colors = {
            "ANCASH": "#a855f7", "SAN MARTIN": "#4f46e5", "LA LIBERTAD": "#0ea5e9", "AREQUIPA": "#334155",
            "LIMA": "#ec4899", "PIURA": "#06b6d4"
        };
        return colors[region] || "#6366f1";
    }

    function _populateRegionFilter(tickets) {
        const sel = document.getElementById('db-filter-region');
        if (!sel) return;
        const currentVal = sel.value;
        const regions = [...new Set(tickets.map(t => t.region).filter(Boolean))].sort();
        sel.innerHTML = `<option value="">${I18n.translate('T2_ALL_REGIONS')}</option>`;
        regions.forEach(r => {
            const opt = document.createElement('option');
            opt.value = opt.textContent = r;
            if (r === currentVal) opt.selected = true;
            sel.appendChild(opt);
        });
    }

    return { init, render };
})();
