/**
 * auth.js - Guard for protecting index.html and handling logout
 */

const Auth = (() => {
  let _role = 'user'; // Default role
  let _user = null;
  
  async function checkSession() {
    const { data: { session }, error } = await window.supabaseDb.auth.getSession();
    
    if (!session || error) {
      // If not logged in, redirect to login page immediately
      window.location.replace('login.html');
      return false;
    }
    
    // Store user data and role mapping
    _user = session.user;
    _role = _user?.user_metadata?.role || 'user';

    // Cargar permisos granulares para este usuario
    await Permissions.load();

    return true;
  }

  function isAdmin() {
    return _role === 'admin';
  }

  function getRole() {
    return _role;
  }

  function getUser() {
    return _user;
  }

  async function logout() {
    try {
      await window.supabaseDb.auth.signOut();
      window.location.href = 'login.html';
    } catch (err) {
      console.error('Error logging out:', err);
      // Force redirect anyway
      window.location.href = 'login.html';
    }
  }

  function initLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Disable button visually
        const originalText = logoutBtn.innerHTML;
        logoutBtn.innerHTML = '<span style="font-size: .85rem; font-weight: 600;">Saliendo...</span><span class="nav-icon">⏳</span>';
        logoutBtn.classList.add('disabled');
        
        await logout();
      });
    }
  }

  return { checkSession, logout, initLogout, isAdmin, getRole, getUser };
})();
