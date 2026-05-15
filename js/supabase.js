/**
 * supabase.js – Supabase client initialization
 * IBBS Gestión de Incidencias
 *
 * Requires the Supabase CDN script to be loaded before this file in index.html:
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
 */

const SUPABASE_URL = 'https://nxvgyredtsktgrqkfczg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_RluZvox2aeRiDZyRU8RXbQ_51fs6eST';

// The UMD build exposes the library as window.supabase = { createClient, ... }
if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('IBBS: La librería Supabase no se cargó correctamente desde el CDN.');
}
const { createClient } = window.supabase;

// Assign the instantiated client to a distinct global variable 
// to explicitly avoid shadowing or confusing it with the library namespace (window.supabase)
window.supabaseDb = createClient(SUPABASE_URL, SUPABASE_KEY);
