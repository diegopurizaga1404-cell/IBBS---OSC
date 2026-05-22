const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nxvgyredtsktgrqkfczg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_RluZvox2aeRiDZyRU8RXbQ_51fs6eST';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testInsert() {
    const ticket = {
        id: 'TEST-RLS-' + Date.now(),
        tipo_tab: 'entidad',
        nombre: 'Prueba RLS',
        dni: '12345678',
        cel: '999999999',
        email: 'test@test.com',
        fecha_inc: '2026-05-19',
        hora_inc: '12:00',
        descripcion: 'Test',
        region: 'TEST',
        provincia: 'TEST',
        localidad: 'TEST',
        tipo: 'TEST',
        institucion: 'TEST',
        generado_cc: false,
        resuelto: 'pendiente',
        created_at: new Date().toISOString(),
        created_by: 'Test Externo'
    };

    const { data, error } = await supabase.from('tickets_entidades').insert([ticket]);
    if (error) {
        console.error('RLS ERROR:', error.message);
    } else {
        console.log('SUCCESS! Anonymous insert allowed.');
        // Cleanup
        await supabase.from('tickets_entidades').delete().eq('id', ticket.id);
    }
}

testInsert();
