/**
 * data.js – Data loading and cascade filter utilities
 * IBBS Gestión de Incidencias
 */

const DataManager = (() => {
  let _entidades = null;
  let _nodos = null; // Combined AX + TX
  let _colegios = null;

  // ── Load all data files ──────────────────────────────────────
  async function loadAll() {
    const [ent, ax, tx, col] = await Promise.all([
      fetch('data/ENTIDADES.json').then(r => r.json()),
      fetch('data/ax.json').then(r => r.json()),
      fetch('data/tx.json').then(r => r.json()),
      fetch('data/COLEGIOS.json').then(r => r.json()).catch(() => ({})),
    ]);
    
    // Clean up Excel-converted date strings/serials in Localidad field
    const dateToName = {
      // ISO string format (from older exports)
      '2025-10-09 00:00:00': '9 DE OCTUBRE',
      '2025-06-24 00:00:00': '24 DE JUNIO',
      '2025-05-03 00:00:00': '3 DE MAYO',
      '2025-05-02 00:00:00': '2 DE MAYO',
      // Numeric serial format (from newer COM exports)
      '45939': '9 DE OCTUBRE',
      '45832': '24 DE JUNIO',
      '45780': '3 DE MAYO',
      '45779': '2 DE MAYO',
      // 2026 Excel exports (serial + 365)
      '46304': '9 DE OCTUBRE',
      '46197': '24 DE JUNIO',
      '46145': '3 DE MAYO',
      '46144': '2 DE MAYO'
    };
    ent.forEach(r => {
      if (r.Localidad && dateToName[String(r.Localidad)]) {
        r.Localidad = dateToName[String(r.Localidad)];
      }
      // Normalize any broken encoding of CAMPAÑA
      if (r.Localidad && typeof r.Localidad === 'string') {
        r.Localidad = r.Localidad.replace(/CAMPI[^\s"]*/g, 'CAMPA\u00d1A');
      }
    });

    _entidades = ent;
    _colegios = col;
    // Normalize Region to uppercase so "La Libertad" and "LA LIBERTAD" merge correctly
    _nodos = [...ax, ...tx].map(n => ({ ...n, Region: n.Region.toUpperCase().trim() }));
    return { entidades: _entidades, nodos: _nodos, colegios: _colegios };
  }

  // ── ENTIDADES cascade helpers ────────────────────────────────
  function getRegiones() {
    if (!_entidades) return [];
    return [...new Set(_entidades.map(r => r.Region))].sort();
  }

  function getProvincias(region) {
    if (!_entidades || !region) return [];
    return [...new Set(_entidades.filter(r => r.Region === region).map(r => r.Provincia))].sort();
  }

  function getLocalidades(region, provincia) {
    if (!_entidades || !region || !provincia) return [];
    return [...new Set(_entidades.filter(r => r.Region === region && r.Provincia === provincia).map(r => r.Localidad))].sort();
  }

  function getLocalidadesByRegion(region) {
    if (!_entidades || !region) return [];
    return [...new Set(_entidades.filter(r => r.Region === region).map(r => r.Localidad))].sort();
  }

  function getEntityByCode(code) {
    if (!_entidades || !code) return null;
    const cleanCode = code.trim().toUpperCase();
    return _entidades.find(r => r.Institucion.toUpperCase() === cleanCode || r.Institucion.toUpperCase().includes(cleanCode));
  }

  function getProvinciaByLocalidad(region, localidad) {
    if (!_entidades || !region || !localidad) return null;
    const item = _entidades.find(r => r.Region === region && r.Localidad === localidad);
    return item ? item.Provincia : null;
  }

  // Returns ALL provinces (within a region) that have an entry for the given localidad
  function getProvinciasByLocalidad(region, localidad) {
    if (!_entidades || !region || !localidad) return [];
    return [...new Set(
      _entidades
        .filter(r => r.Region === region && r.Localidad === localidad)
        .map(r => r.Provincia)
    )].sort();
  }

  function getTipos(region, provincia, localidad) {
    if (!_entidades || !region || !provincia || !localidad) return [];
    return [...new Set(_entidades.filter(r => r.Region === region && r.Provincia === provincia && r.Localidad === localidad).map(r => r.Tipo))].sort();
  }

  function getInstituciones(region, provincia, localidad, tipo) {
    if (!_entidades || !region || !provincia || !localidad || !tipo) return [];
    return _entidades.filter(r =>
      r.Region === region && r.Provincia === provincia && r.Localidad === localidad && r.Tipo === tipo
    ).map(r => r.Institucion).sort();
  }

  // ── SOC NODOS cascade helpers ────────────────────────────────
  function getNodoRegiones() {
    if (!_nodos) return [];
    return [...new Set(_nodos.map(n => n.Region))].sort();
  }

  function getTiposNodo(region) {
    if (!_nodos || !region) return [];
    return [...new Set(_nodos.filter(n => n.Region === region).map(n => n.TipoNodo))].sort();
  }

  function getCodigos(region, tipoNodo) {
    if (!_nodos || !region || !tipoNodo) return [];
    return _nodos.filter(n => n.Region === region && n.TipoNodo === tipoNodo)
      .map(n => n.Codigo).sort();
  }

  function getNombreNodo(region, tipoNodo, codigo) {
    if (!_nodos || !region || !tipoNodo || !codigo) return '';
    const found = _nodos.find(n => n.Region === region && n.TipoNodo === tipoNodo && n.Codigo === codigo);
    return found ? found.NombreNodo : '';
  }

  function getAllNodoRegiones() {
    return getNodoRegiones();
  }

  function getColegioInfo(id) {
    if (!_colegios || !id) return null;
    return _colegios[id.trim()] || null;
  }

  function findByInstitucion(query) {
    if (!_entidades || !query || query.length < 2) return [];
    const q = query.trim().toLowerCase();
    return _entidades
      .filter(r => r.Institucion && r.Institucion.toLowerCase().includes(q))
      .slice(0, 10);
  }

  return {
    loadAll,
    // Entidades
    getRegiones, getProvincias, getLocalidades, getLocalidadesByRegion, getProvinciaByLocalidad, getProvinciasByLocalidad, getTipos, getInstituciones, getColegioInfo,
    findByInstitucion, getEntityByCode,
    // Nodos
    getNodoRegiones: getAllNodoRegiones, getTiposNodo, getCodigos, getNombreNodo,
  };
})();
