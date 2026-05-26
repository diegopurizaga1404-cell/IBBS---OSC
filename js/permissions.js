/**
 * permissions.js – Sistema de Permisos Granular
 * IBBS Gestión de Incidencias
 *
 * Centraliza toda la lógica de permisos de visibilidad y edición.
 * Debe cargarse ANTES de auth.js en index.html.
 */

const Permissions = (() => {

    let _perms = null; // Objeto de permisos cargados

    // ── Presets de rol ────────────────────────────────────────────
    const ROLE_PRESETS = {
        admin: {
            perm_dashboard: true,
            perm_entidades_crear: true,
            perm_entidades_tickets: true,
            perm_biblioteca: true,
            region_todas: true,
            region_ar: true,
            region_an: true,
            region_ll: true,
            region_sm: true,
            edit_clasificacion: true,
            edit_notas_tecnicas: true,
            edit_tickets_seguimiento: true,
            edit_datos_om: true,
            view_cronograma_evento: true,
            view_cronograma_actividades: true
        },
        editor: {
            perm_dashboard: true,
            perm_entidades_crear: true,
            perm_entidades_tickets: true,
            perm_biblioteca: true,
            region_todas: true,
            region_ar: true,
            region_an: true,
            region_ll: true,
            region_sm: true,
            edit_clasificacion: true,
            edit_notas_tecnicas: true,
            edit_tickets_seguimiento: true,
            edit_datos_om: false,
            view_cronograma_evento: true,
            view_cronograma_actividades: true
        },
        viewer: {
            perm_dashboard: true,
            perm_entidades_crear: false,
            perm_entidades_tickets: true,
            perm_biblioteca: true,
            region_todas: true,
            region_ar: true,
            region_an: true,
            region_ll: true,
            region_sm: true,
            edit_clasificacion: false,
            edit_notas_tecnicas: false,
            edit_tickets_seguimiento: false,
            edit_datos_om: false,
            view_cronograma_evento: true,
            view_cronograma_actividades: true
        },
        tecnico: {
            perm_dashboard: false,
            perm_entidades_crear: true,
            perm_entidades_tickets: true,
            perm_biblioteca: false,
            region_todas: true,
            region_ar: true,
            region_an: true,
            region_ll: true,
            region_sm: true,
            edit_clasificacion: true,
            edit_notas_tecnicas: false,
            edit_tickets_seguimiento: true,
            edit_datos_om: true,
            view_cronograma_evento: true,
            view_cronograma_actividades: true
        }
    };

    // ── Cargar permisos del usuario actual desde Supabase ─────────
    async function load() {
        const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
        if (!user) return;

        // Los admins tienen todos los permisos siempre: no consultar BD
        if (typeof Auth !== 'undefined' && Auth.isAdmin()) {
            _perms = { ...ROLE_PRESETS.admin };
            return;
        }

        console.log('[Permissions] Cargando permisos para:', user.email);

        try {
            const { data, error } = await window.supabaseDb
                .from('user_permissions')
                .select('*')
                .eq('user_email', user.email)
                .maybeSingle();

            if (error) {
                console.warn('[Permissions] Error RLS/BD:', error.message, error.code);
                throw error;
            }

            if (data) {
                _perms = data;
                console.log('[Permissions] ✅ Permisos cargados desde BD:', _perms);
            } else {
                // Sin entrada en tabla → usar preset del rol asignado
                const role = user.user_metadata?.role || 'editor';
                _perms = { ...( ROLE_PRESETS[role] || ROLE_PRESETS.editor) };
                console.log('[Permissions] ⚠️ Sin fila en BD para este email. Usando preset:', role, _perms);
            }
        } catch (err) {
            console.warn('[Permissions] ❌ Excepción – usando preset del rol.', err);
            const role = user.user_metadata?.role || 'editor';
            _perms = { ...(ROLE_PRESETS[role] || ROLE_PRESETS.editor) };
        }
    }

    // ── canView: ¿puede el usuario ver esta sección del menú? ─────
    function canView(permKey) {
        if (typeof Auth !== 'undefined' && Auth.isAdmin()) return true;
        if (!_perms) return true; // Permisivo mientras carga
        return _perms[permKey] !== false;
    }

    // ── canEdit: ¿puede el usuario editar este bloque? ────────────
    function canEdit(blockKey) {
        if (typeof Auth !== 'undefined' && Auth.isAdmin()) return true;
        if (!_perms) return false; // Restrictivo mientras carga
        return _perms[blockKey] === true;
    }

    // ── Helper: Validar Región ─────────────────────────────────────
    function canViewRegion(regionName) {
        if (!regionName) return true; // Si el ticket no tiene región, permitir ver o delegar en otro filtro
        if (typeof Auth !== 'undefined' && Auth.isAdmin()) return true;
        if (!_perms) return true; // Permisivo mientras carga
        if (_perms.region_todas !== false) return true; // Si tiene 'Todas' o no está definido

        let normalized = regionName.toUpperCase().trim();
        normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const regionMap = {
            'AREQUIPA': 'region_ar',
            'ANCASH': 'region_an',
            'LA LIBERTAD': 'region_ll',
            'SAN MARTIN': 'region_sm'
        };
        const key = regionMap[normalized];
        if (!key) return true; // Si es una región no contemplada, la mostramos
        return _perms[key] === true;
    }

    // ── Getters auxiliares ────────────────────────────────────────
    function getAll() { return _perms ? { ..._perms } : null; }
    function getPresets() { return ROLE_PRESETS; }
    function getPreset(name) { return ROLE_PRESETS[name] || null; }

    return { load, canView, canEdit, canViewRegion, getAll, getPresets, getPreset };
})();
