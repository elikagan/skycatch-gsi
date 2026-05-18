/* ===================================================================
   Skycatch GSI — Prototype runtime
   See DESIGN.md §15 for the extensibility contract.
   =================================================================== */

(function () {
  'use strict';

  // ----- State (single source of truth) -----
  const state = {
    scene: 'default',
    theme: localStorage.getItem('skycatch-theme') || 'dark',
    captureDate: '04.12.26',
    timelineMinimized: localStorage.getItem('skycatch-timeline-min') === '1'
  };

  const root = document.documentElement;
  const app  = document.querySelector('.app');

  // ----- Data: layers (single source for the right panel) -----
  // Each carries a capture date — time is a first-class dimension (§4.1).
  // Layers tree. Names match the layers in Skycatch_GSI_wLayers.psd
  // so the prototype mirrors what a real DataHub user would see.
  // Capture date 02.27.26 comes from the source dataset (ASARCO_PPK).
  const LAYERS = [
    {
      id: 'live-assets', name: 'Live Assets', live: true,
      isGroup: true, expanded: false,
      children: [
        { id: 'drone-1', name: 'Drone DJI-M300-04', date: 'Live', visible: false, color: '#2ea3ff', live: true },
        { id: 'truck-1', name: 'Truck HT-093',      date: 'Live', visible: false, color: '#eab308', live: true }
      ]
    },
    { id: 'west-road-centerline', name: 'West Road Centerline', date: '02.27.26', visible: true,  color: '#2ea3ff' },
    { id: 'road-slope-analysis',  name: 'Road Slope Analysis',  date: '02.27.26', visible: false, color: '#ef4444' },
    {
      id: 'east-road-width', name: 'East Road Width',
      isGroup: true, expanded: false,
      children: [
        { id: 'east-road-width-l-r-analysis',  name: 'L + R Lanes',   date: '02.27.26', visible: false, color: '#22c55e' },
        { id: 'east-road-width-left-analysis', name: 'Left Lane',     date: '02.27.26', visible: false, color: '#22c55e' }
      ]
    },
    {
      id: 'dump-sites', name: 'Dump Sites',
      isGroup: true, expanded: false,
      children: [
        { id: 'north-dump', name: 'North Dump', date: '02.27.26', visible: true,  color: '#3b82f6' },
        { id: 'south-dump', name: 'South Dump', date: '02.27.26', visible: true,  color: '#eab308' }
      ]
    },
    { id: 'orthophoto',  name: 'Orthophoto', date: '02.27.26', visible: true,  color: null },
    { id: 'terrain',     name: 'Terrain',    date: '02.27.26', visible: false, color: null },
    { id: 'basemap',     name: 'Basemap',    date: '—',        visible: true,  color: null }
  ];

  // Helpers for the tree
  function eachLeaf(fn) {
    LAYERS.forEach(L => {
      if (L.isGroup) L.children.forEach(fn);
      else fn(L);
    });
  }
  function findLayer(id) {
    for (const L of LAYERS) {
      if (L.id === id) return L;
      if (L.isGroup) {
        const c = L.children.find(c => c.id === id);
        if (c) return c;
      }
    }
    return null;
  }
  function findGroupOf(id) {
    return LAYERS.find(L => L.isGroup && L.children.some(c => c.id === id)) || null;
  }
  // A group's visibility = any child visible
  function groupVisibility(group) {
    const on = group.children.filter(c => c.visible).length;
    if (on === 0) return 'off';
    if (on === group.children.length) return 'all';
    return 'some';
  }

  // ----- Data: timeline markers -----
  // The timeline is a CAPTURE HISTORY — data that exists. Scheduled
  // captures live in the Mission Config flow, not here, so we don't
  // conflate "happened" with "planned" on the same axis.
  //
  // Spacing reflects REAL elapsed time between captures. Routine cadence
  // is weekly but weather holds, maintenance, and opportunistic drops
  // break the pattern — exactly what a mining ops timeline should show.
  const CAPTURES = [
    { date: '02.18.26', kind: 'past',    payload: 'LiDAR' },
    { date: '02.25.26', kind: 'past',    payload: 'Photo' },
    { date: '03.04.26', kind: 'past',    payload: 'LiDAR' },
    { date: '03.18.26', kind: 'past',    payload: 'Photo' }, // 14-day gap (weather)
    { date: '03.25.26', kind: 'past',    payload: 'LiDAR' },
    { date: '04.08.26', kind: 'past',    payload: 'Photo' }, // 14-day gap
    { date: '04.12.26', kind: 'current', payload: 'LiDAR' }  // 4-day opportunistic
  ];

  const KIND_LABEL = { past: 'Event', current: 'Now' };

  // ----- Date helpers -----
  function parseCaptureDate(d) {
    const [m, day, y] = d.split('.').map(Number);
    return new Date(2000 + y, m - 1, day);
  }
  function daysBetween(a, b) {
    return Math.round((b - a) / (1000 * 60 * 60 * 24));
  }
  // 0..1 position of a date within the capture range
  function dateToFraction(date, start, totalDays) {
    return daysBetween(start, date) / totalDays;
  }

  // ----- Actions registry (delegated click handlers) -----
  // Add a new click target: drop `data-action="..."` on any element.
  // Add a new action: register it here.
  const actions = {
    'toggle-theme': toggleTheme,
    'go-default':   () => setScene('default'),
    'open-mission': () => setScene('mission'),
    'open-slope':   () => {
      // Make sure the slope overlay is on so users see the analysis
      const slope = findLayer('road-slope-analysis');
      if (slope && !slope.visible) {
        slope.visible = true;
        renderLayers();
        syncMapLayerVisibility();
      }
      setScene('slope');
    },
    'open-drone':   () => setScene('drone'),
    'open-truck':   () => setScene('truck'),
    'close-panel':  () => setScene('default'),
    'toggle-layer': (el) => {
      const id = el.getAttribute('data-layer');
      const layer = findLayer(id);
      if (!layer) return;
      layer.visible = !layer.visible;
      renderLayers();
      syncMapLayerVisibility();
    },
    'toggle-group-eye': (el) => {
      const id = el.getAttribute('data-group');
      const group = LAYERS.find(g => g.id === id && g.isGroup);
      if (!group) return;
      const vis = groupVisibility(group);
      const next = vis === 'off' ? true : false; // any-on -> all off; all off -> all on
      group.children.forEach(c => { c.visible = next; });
      renderLayers();
      syncMapLayerVisibility();
    },
    'toggle-group-expand': (el) => {
      const id = el.getAttribute('data-group');
      const group = LAYERS.find(g => g.id === id && g.isGroup);
      if (!group) return;
      group.expanded = !group.expanded;
      renderLayers();
    },
    'toggle-timeline': () => {
      state.timelineMinimized = !state.timelineMinimized;
      localStorage.setItem('skycatch-timeline-min', state.timelineMinimized ? '1' : '0');
      applyTimelineState();
    },
    'new': () => {}
  };

  // ----- Theme -----
  function applyTheme() {
    root.setAttribute('data-theme', state.theme);
  }
  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('skycatch-theme', state.theme);
    applyTheme();
  }

  // ----- Scene -----
  function setScene(name) {
    state.scene = name;
    app.setAttribute('data-scene', name);
    syncAssets();
  }

  // ----- Live assets (drone, truck) -----
  function syncAssets() {
    const drone = document.getElementById('asset-drone');
    const truck = document.getElementById('asset-truck');
    if (drone) drone.classList.toggle('is-open', state.scene === 'drone');
    if (truck) truck.classList.toggle('is-open', state.scene === 'truck');
  }

  // ----- Layer visibility -----
  // Walks LEAF layers only. Map-overlay layers (boundary-N, slope-N,
  // etc.) get a class on .map. Canvas-level layers (drone-1, truck-1)
  // float above the tilted map, so they get a class on .app.
  function syncMapLayerVisibility() {
    const mapEl = document.getElementById('map');
    if (!mapEl || !app) return;
    eachLeaf(L => {
      mapEl.classList.toggle(`show-${L.id}`, L.visible);
      app.classList.toggle(`show-${L.id}`, L.visible);
    });

    // If the drone or truck layer is turned off while its callout is
    // open, snap back to default so the callout isn't orphaned.
    const drone = findLayer('drone-1');
    const truck = findLayer('truck-1');
    if (drone && !drone.visible && state.scene === 'drone') setScene('default');
    if (truck && !truck.visible && state.scene === 'truck') setScene('default');
  }

  // ----- Layers rendering -----
  // Layers that open a detail scene when their row is clicked.
  const LAYER_OPEN_ACTION = {
    'road-slope-analysis': 'open-slope'
  };

  function renderLeafRow(L, isChild) {
    const openAction = LAYER_OPEN_ACTION[L.id];
    const dateClass  = L.live ? 'layer-date is-live' : 'layer-date';
    const dateInner  = L.live
      ? `<span class="layer-live-dot"></span>${L.date}`
      : L.date;
    return `
      <li class="layer-row ${L.visible ? 'is-visible' : ''} ${isChild ? 'is-child' : ''}">
        <button class="layer-trigger" type="button" ${openAction ? `data-action="${openAction}"` : ''}>
          ${L.color
            ? `<span class="layer-swatch" style="--swatch:${L.color}"></span>`
            : `<span class="layer-swatch is-blank"></span>`}
          <span class="layer-meta">
            <span class="layer-name">${L.name}</span>
            <span class="${dateClass}">${dateInner}</span>
          </span>
        </button>
        <button class="layer-eye"
                type="button"
                data-action="toggle-layer"
                data-layer="${L.id}"
                aria-label="${L.visible ? 'Hide' : 'Show'} ${L.name}">
          <span class="material-symbols-outlined">${L.visible ? 'visibility' : 'visibility_off'}</span>
        </button>
      </li>
    `;
  }

  function renderGroupRow(G) {
    const vis = groupVisibility(G); // 'off' | 'some' | 'all'
    const onCount = G.children.filter(c => c.visible).length;
    const eyeIcon = vis === 'all' ? 'visibility'
                  : vis === 'some' ? 'visibility' // shown but marked partial via class
                  : 'visibility_off';
    const dateInner = G.live
      ? `<span class="layer-live-dot"></span>Live`
      : `${onCount}/${G.children.length} visible`;
    const dateClass = G.live ? 'layer-date is-live' : 'layer-date';

    return `
      <li class="layer-row layer-group is-vis-${vis} ${G.expanded ? 'is-expanded' : ''}">
        <button class="layer-trigger" type="button"
                data-action="toggle-group-expand" data-group="${G.id}">
          <span class="layer-chevron material-symbols-outlined">chevron_right</span>
          <span class="layer-meta">
            <span class="layer-name">${G.name}</span>
            <span class="${dateClass}">${dateInner}</span>
          </span>
        </button>
        <button class="layer-eye"
                type="button"
                data-action="toggle-group-eye"
                data-group="${G.id}"
                aria-label="Toggle all ${G.name}">
          <span class="material-symbols-outlined">${eyeIcon}</span>
        </button>
      </li>
      ${G.expanded ? G.children.map(c => renderLeafRow(c, true)).join('') : ''}
    `;
  }

  function renderLayers() {
    const list = document.getElementById('layers-list');
    if (!list) return;
    list.innerHTML = LAYERS.map(L => L.isGroup ? renderGroupRow(L) : renderLeafRow(L, false)).join('');
  }

  // ----- Timeline rendering -----
  function renderTimeline() {
    const el = document.getElementById('timeline');
    if (!el) return;

    // Real date positioning — gaps reflect actual elapsed time
    const startDate = parseCaptureDate(CAPTURES[0].date);
    const endDate   = parseCaptureDate(CAPTURES[CAPTURES.length - 1].date);
    const totalDays = daysBetween(startDate, endDate);

    // Month-start axis labels that fall within the date range
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const axisTicks = [];
    const startMonth = startDate.getMonth();
    const endMonth   = endDate.getMonth();
    for (let m = startMonth; m <= endMonth; m++) {
      const d = new Date(startDate.getFullYear(), m, 1);
      const t = m === startMonth ? 0 : dateToFraction(d, startDate, totalDays);
      axisTicks.push({ label: MONTHS[m], t });
    }

    el.innerHTML = `
      <header class="timeline-header">
        <span class="timeline-title">
          <span class="material-symbols-outlined">timeline</span>
          Timeline
        </span>
        <span class="timeline-summary">
          <button class="timeline-toggle icon-btn icon-btn-sm"
                  type="button"
                  data-action="toggle-timeline"
                  aria-label="Toggle timeline">
            <span class="material-symbols-outlined timeline-toggle-icon">expand_more</span>
          </button>
        </span>
      </header>

      <div class="timeline-track">
        <span class="timeline-baseline"></span>
        ${CAPTURES.map(c => {
          const t = dateToFraction(parseCaptureDate(c.date), startDate, totalDays);
          return `
            <button class="timeline-marker is-${c.kind}"
                    type="button"
                    aria-label="${KIND_LABEL[c.kind]} on ${c.date}"
                    style="--t:${t}">
              <span class="timeline-marker-dot"></span>
              <span class="timeline-tooltip" role="tooltip">
                <span class="timeline-tooltip-kind is-${c.kind}">${KIND_LABEL[c.kind]}</span>
                <span class="timeline-tooltip-date">${c.date}</span>
              </span>
            </button>
          `;
        }).join('')}
      </div>

      <div class="timeline-axis">
        ${axisTicks.map(tick => `
          <span style="--t:${tick.t}">${tick.label}</span>
        `).join('')}
      </div>
    `;
  }

  // ----- Event delegation -----
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.getAttribute('data-action');
    const handler = actions[action];
    if (handler) {
      e.preventDefault();
      handler(el);
    }
  });

  // ----- Timeline min/expand state -----
  function applyTimelineState() {
    const el = document.getElementById('timeline');
    if (!el) return;
    el.classList.toggle('is-minimized', state.timelineMinimized);
  }

  // ----- Init -----
  applyTheme();
  renderLayers();
  renderTimeline();
  applyTimelineState();
  syncMapLayerVisibility();
})();
