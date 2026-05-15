/**
 * data.js – Data loading and cascade filter utilities
 * IBBS Gestión de Incidencias
 */

const DataManager = (() => {
  let _entidades = null;
  let _nodos = null; // Combined AX + TX

  // ── Load all data files ──────────────────────────────────────
  async function loadAll() {
    const [ent, ax, tx] = await Promise.all([
      fetch('data/ENTIDADES.json').then(r => r.json()),
      fetch('data/ax.json').then(r => r.json()),
      fetch('data/tx.json').then(r => r.json()),
    ]);
    _entidades = ent;
    // Normalize Region to uppercase so "La Libertad" and "LA LIBERTAD" merge correctly
    _nodos = [...ax, ...tx].map(n => ({ ...n, Region: n.Region.toUpperCase().trim() }));
    return { entidades: _entidades, nodos: _nodos };
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

  return {
    loadAll,
    // Entidades
    getRegiones, getProvincias, getLocalidades, getLocalidadesByRegion, getProvinciaByLocalidad, getProvinciasByLocalidad, getTipos, getInstituciones,
    // Nodos
    getNodoRegiones: getAllNodoRegiones, getTiposNodo, getCodigos, getNombreNodo,
  };
})();
