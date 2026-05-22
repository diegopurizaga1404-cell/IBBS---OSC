/**
 * store.js – Supabase persistence layer
 * IBBS Gestión de Incidencias
 *
 * All public methods are async and mirror the previous localStorage API.
 * Requires supabase.js (the global `supabase` client) to be loaded first.
 */

const Store = (() => {

    // ── Table name map ───────────────────────────────────────
    const TABLE = {
        entidades: 'tickets_entidades',
        soc: 'tickets_soc',
    };

    // ── camelCase → snake_case converter (for partial updates) ─
    function _cs(key) {
        return key
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
            .replace(/([a-z\d])([A-Z])/g, '$1_$2')
            .toLowerCase();
    }

    function _toSnake(obj) {
        const r = {};
        for (const [k, v] of Object.entries(obj)) r[_cs(k)] = v;
        return r;
    }

    // ── Entidades mappers ────────────────────────────────────
    function _fromDbEnt(row) {
        return {
            id: row.id,
            tipo_tab: row.tipo_tab,
            nombre: row.nombre,
            dni: row.dni,
            cel: row.cel,
            email: row.email,
            fechaInc: row.fecha_inc,
            horaInc: row.hora_inc,
            descripcion: row.descripcion,
            socDetalles: row.soc_detalles,
            region: row.region,
            provincia: row.provincia,
            localidad: (() => {
                const dateToName = {
                    '2025-10-09 00:00:00': '9 DE OCTUBRE',
                    '2025-06-24 00:00:00': '24 DE JUNIO',
                    '2025-05-03 00:00:00': '3 DE MAYO',
                    '2025-05-02 00:00:00': '2 DE MAYO'
                };
                return (row.localidad && dateToName[row.localidad]) ? dateToName[row.localidad] : row.localidad;
            })(),
            tipo: row.tipo,
            institucion: row.institucion,
            generadoCC: row.generado_cc,
            resuelto: row.resuelto,
            finalizado: row.finalizado,
            ccNumber: row.cc_number,
            ttNumber: row.tt_number,
            woNumber: row.wo_number || null,
            estado: row.estado || 'Abierto',
            causaIncidencia: row.causa_incidencia || null,
            mensajePredeterminado: row.mensaje_predeterminado || null,
            resueltoRemotoSoc: row.resuelto_remoto_soc || null,
            equipoRegistro: row.equipo_registro || null,
            equipoResolutor: row.equipo_resolutor || null,
            cerradoPor: row.cerrado_por || null,
            fechaCierre: row.fecha_cierre || null,
            actividades: row.actividades || null,
            omHoraContacto: row.om_hora_contacto || null,
            omDiaVisita: row.om_dia_visita || null,
            causaTs: row.causa_ts || null,
            ccTs: row.cc_ts || null,
            ttTs: row.tt_ts || null,
            woTs: row.wo_ts || null,
            omHoraTs: row.om_hora_ts || null,
            omVisitaTs: row.om_visita_ts || null,
            createdAt: row.created_at,
            createdBy: row.created_by || null,
        };
    }

    function _toDbEnt(t) {
        return {
            id: t.id,
            tipo_tab: t.tipo_tab,
            nombre: t.nombre,
            dni: t.dni,
            cel: t.cel,
            email: t.email,
            fecha_inc: t.fechaInc,
            hora_inc: t.horaInc,
            descripcion: t.descripcion,
            region: t.region,
            provincia: t.provincia,
            localidad: t.localidad,
            tipo: t.tipo,
            institucion: t.institucion,
            generado_cc: t.generadoCC,
            resuelto: t.resuelto,
            finalizado: t.finalizado || false,
            created_at: t.createdAt,
            created_by: t.createdBy || null,
        };
    }

    // ── SOC mappers ──────────────────────────────────────────
    function _fromDbSoc(row) {
        return {
            id: row.id,
            tipo_tab: row.tipo_tab,
            region: row.region,
            tipoNodo: row.tipo_nodo,
            codigo: row.codigo,
            nombreNodo: row.nombre_nodo,
            fechaInc: row.fecha_inc,
            horaInc: row.hora_inc,
            fechaRep: row.fecha_rep,
            horaRep: row.hora_rep,
            detectadoPor: row.detectado_por,
            hayGrabacion: row.hay_grabacion,
            tiposIncidente: row.tipos_incidente || [],
            descripcion: row.descripcion,
            resuelto: row.resuelto,
            createdAt: row.created_at,
            createdBy: row.created_by || null,
        };
    }

    function _toDbSoc(t) {
        return {
            id: t.id,
            tipo_tab: t.tipo_tab,
            region: t.region,
            tipo_nodo: t.tipoNodo,
            codigo: t.codigo,
            nombre_nodo: t.nombreNodo,
            fecha_inc: t.fechaInc,
            hora_inc: t.horaInc,
            fecha_rep: t.fechaRep,
            hora_rep: t.horaRep,
            detectado_por: t.detectadoPor,
            hay_grabacion: t.hayGrabacion,
            tipos_incidente: t.tiposIncidente,
            descripcion: t.descripcion,
            resuelto: t.resuelto,
            created_at: t.createdAt,
            created_by: t.createdBy || null,
        };
    }

    // ── Enlaces mappers ──────────────────────────────────────
    function _fromDbEnl(row) {
        return {
            id: row.id,
            titulo: row.titulo,
            descripcion: row.descripcion,
            createdAt: row.created_at,
        };
    }

    function _toDbEnl(e) {
        return {
            id: e.id,
            titulo: e.titulo,
            descripcion: e.descripcion,
            created_at: e.createdAt,
        };
    }

    // ── Tickets (Entidades & SOC) ────────────────────────────
    async function getTickets(type) {
        const table = TABLE[type];
        const mapper = type === 'entidades' ? _fromDbEnt : _fromDbSoc;
        const { data, error } = await supabaseDb
            .from(table)
            .select('*')
            .order('created_at', { ascending: false });
        if (error) { console.error('Store.getTickets error:', error); return []; }
        return (data || []).map(mapper);
    }

    async function addTicket(type, ticket) {
        const table = TABLE[type];
        const row = type === 'entidades' ? _toDbEnt(ticket) : _toDbSoc(ticket);
        const { error } = await supabaseDb.from(table).insert([row]);
        if (error) {
            console.error('Store.addTicket error:', error);
            throw error;
        }
    }

    async function updateTicket(type, id, updates) {
        const table = TABLE[type];
        const { error } = await supabaseDb
            .from(table)
            .update(_toSnake(updates))
            .eq('id', id);
        if (error) {
            console.error('Store.updateTicket error:', error);
            throw error;
        }
    }

    async function deleteTicket(type, id) {
        const table = TABLE[type];
        const { error } = await supabaseDb.from(table).delete().eq('id', id);
        if (error) console.error('Store.deleteTicket error:', error);
    }

    // ── Enlaces ──────────────────────────────────────────────
    async function getEnlaces() {
        const { data, error } = await supabaseDb
            .from('enlaces')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) { console.error('Store.getEnlaces error:', error); return []; }
        return (data || []).map(_fromDbEnl);
    }

    async function addEnlace(enlace) {
        const { error } = await supabaseDb.from('enlaces').insert([_toDbEnl(enlace)]);
        if (error) console.error('Store.addEnlace error:', error);
    }

    async function deleteEnlace(id) {
        const { error } = await supabaseDb.from('enlaces').delete().eq('id', id);
        if (error) console.error('Store.deleteEnlace error:', error);
    }

    // ── Gestión de Usuarios ─────────────────────────────────────
    async function getSolicitudes() {
        const { data, error } = await supabaseDb
            .from('solicitudes_registro')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) { console.error('Store.getSolicitudes error:', error); return []; }
        return data || [];
    }

    async function addSolicitud(solicitud) {
        const { error } = await supabaseDb
            .from('solicitudes_registro')
            .insert([solicitud]);
        if (error) { console.error('Store.addSolicitud error:', error); throw error; }
    }

    async function updateSolicitud(id, updates) {
        const { error } = await supabaseDb
            .from('solicitudes_registro')
            .update(updates)
            .eq('id', id);
        if (error) { console.error('Store.updateSolicitud error:', error); throw error; }
    }

    async function deleteSolicitud(id) {
        const { error } = await supabaseDb
            .from('solicitudes_registro')
            .delete()
            .eq('id', id);
        if (error) console.error('Store.deleteSolicitud error:', error);
    }

    return {
        getTickets, addTicket, updateTicket, deleteTicket,
        getEnlaces, addEnlace, deleteEnlace,
        getSolicitudes, addSolicitud, updateSolicitud, deleteSolicitud,
    };
})();
