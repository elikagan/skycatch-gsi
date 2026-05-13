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
    captureDate: '04.12.26'
  };

  const root = document.documentElement;
  const app  = document.querySelector('.app');

  // ----- Data: layers (single source for the right panel) -----
  // Each carries a capture date — time is a first-class dimension (§4.1).
  const LAYERS = [
    { id: 'toes-crests',  name: 'Toes & Crests',  date: '04.12.26', visible: true,  color: '#22c55e' },
    { id: 'ahs-design',   name: 'AHS Design',     date: '03.30.26', visible: false, color: '#3b82f6' },
    { id: 'dig-face',     name: 'Dig Face',       date: '04.12.26', visible: false, color: '#a855f7' },
    { id: 'width-1',      name: 'Width Analysis', date: '04.12.26', visible: false, color: '#eab308' },
    { id: 'slope-1',      name: 'Slope Analysis 1', date: '04.12.26', visible: true,  color: '#ef4444' },
    { id: 'boundary-1',   name: 'Boundary 1',     date: '04.12.26', visible: true,  color: '#2ea3ff' },
    { id: 'boundary-2',   name: 'Boundary 2',     date: '04.12.26', visible: false, color: '#eab308' },
    { id: 'orthophoto',   name: 'Orthophoto',     date: '04.12.26', visible: true,  color: null },
    { id: 'terrain',      name: 'Terrain',        date: '04.12.26', visible: false, color: null },
    { id: 'basemap',      name: 'Basemap',        date: '—',        visible: true,  color: null }
  ];

  // ----- Data: timeline markers -----
  // The timeline is a CAPTURE HISTORY — data that exists. Scheduled
  // captures live in the Mission Config flow, not here, so we don't
  // conflate "happened" with "planned" on the same axis.
  const CAPTURES = [
    { date: '02.18.26', kind: 'past',    payload: 'LiDAR' },
    { date: '02.25.26', kind: 'past',    payload: 'Photo' },
    { date: '03.04.26', kind: 'past',    payload: 'LiDAR' },
    { date: '03.11.26', kind: 'past',    payload: 'LiDAR' },
    { date: '03.18.26', kind: 'past',    payload: 'Photo' },
    { date: '03.25.26', kind: 'past',    payload: 'LiDAR' },
    { date: '04.01.26', kind: 'past',    payload: 'LiDAR' },
    { date: '04.08.26', kind: 'past',    payload: 'Photo' },
    { date: '04.12.26', kind: 'current', payload: 'LiDAR' }
  ];

  const CAPTURE_AXIS_LABELS = ['Feb', 'Mar', 'Apr'];
  const KIND_LABEL = { past: 'Past capture', current: 'Current view' };

  // ----- Actions registry (delegated click handlers) -----
  // Add a new click target: drop `data-action="..."` on any element.
  // Add a new action: register it here.
  const actions = {
    'toggle-theme': toggleTheme,
    'go-default':   () => setScene('default'),
    'open-mission': () => setScene('mission'),
    'open-slope':   () => {
      // Make sure the slope layer is on so users see the colored haul road
      const slope = LAYERS.find(l => l.id === 'slope-1');
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
      const layer = LAYERS.find(l => l.id === id);
      if (!layer) return;
      layer.visible = !layer.visible;
      renderLayers();
      syncMapLayerVisibility();
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

  // ----- Layer visibility on the map -----
  // Driven by CSS class toggle on .map: `show-<layer-id>`.
  function syncMapLayerVisibility() {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;
    LAYERS.forEach(L => {
      mapEl.classList.toggle(`show-${L.id}`, L.visible);
    });
  }

  // ----- Layers rendering -----
  // Layers that open a detail scene when their row is clicked.
  const LAYER_OPEN_ACTION = {
    'slope-1': 'open-slope'
  };

  function renderLayers() {
    const list = document.getElementById('layers-list');
    if (!list) return;
    list.innerHTML = LAYERS.map(L => {
      const openAction = LAYER_OPEN_ACTION[L.id];
      return `
        <li class="layer-row ${L.visible ? 'is-visible' : ''}">
          <button class="layer-trigger" type="button" ${openAction ? `data-action="${openAction}"` : ''}>
            ${L.color
              ? `<span class="layer-swatch" style="--swatch:${L.color}"></span>`
              : `<span class="layer-swatch is-blank"></span>`}
            <span class="layer-meta">
              <span class="layer-name">${L.name}</span>
              <span class="layer-date">${L.date}</span>
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
    }).join('');
  }

  // ----- Timeline rendering -----
  function renderTimeline() {
    const el = document.getElementById('timeline');
    if (!el) return;

    const counts = CAPTURES.reduce((acc, c) => (acc[c.kind] = (acc[c.kind] || 0) + 1, acc), {});
    const n = CAPTURES.length - 1;

    const legendKinds = [
      { kind: 'past',    label: 'past'    },
      { kind: 'current', label: 'current' }
    ].filter(k => counts[k.kind]);

    el.innerHTML = `
      <header class="timeline-header">
        <span class="timeline-title">
          <span class="material-symbols-outlined">history</span>
          Capture history
        </span>
        <span class="timeline-summary">
          ${legendKinds.map(k => `
            <span class="timeline-summary-item">
              <span class="timeline-legend-dot is-${k.kind}"></span>
              ${counts[k.kind]} ${k.label}
            </span>
          `).join('')}
        </span>
      </header>

      <div class="timeline-track">
        <span class="timeline-baseline"></span>
        ${CAPTURES.map((c, i) => `
          <button class="timeline-marker is-${c.kind}"
                  type="button"
                  aria-label="${KIND_LABEL[c.kind]} on ${c.date}"
                  style="--i:${i}; --n:${n}">
            <span class="timeline-marker-dot"></span>
            ${c.kind === 'current' ? '<span class="timeline-now-line"></span>' : ''}
            <span class="timeline-tooltip" role="tooltip">
              <span class="timeline-tooltip-kind is-${c.kind}">${KIND_LABEL[c.kind]}</span>
              <span class="timeline-tooltip-date">${c.date}</span>
              <span class="timeline-tooltip-meta">${c.payload} mission</span>
            </span>
          </button>
        `).join('')}
      </div>

      <div class="timeline-axis">
        ${CAPTURE_AXIS_LABELS.map((l, i) => `
          <span style="--i:${i}; --n:${CAPTURE_AXIS_LABELS.length - 1}">${l}</span>
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

  // ----- Init -----
  applyTheme();
  renderLayers();
  renderTimeline();
  syncMapLayerVisibility();
})();
