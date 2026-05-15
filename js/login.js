/**
 * login.js - Authentication handler for login.html
 */

document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const btnLogin = document.getElementById('btn-login');
  const spinner = document.getElementById('login-spinner');
  const btnText = document.getElementById('login-btn-text');
  const errorMsg = document.getElementById('login-error');

  // Check if already logged in
  const { data: { session } } = await window.supabaseDb.auth.getSession();
  if (session) {
    window.location.href = 'index.html';
    return;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Reset state
    errorMsg.style.display = 'none';
    errorMsg.textContent = '';
    btnLogin.disabled = true;
    spinner.style.display = 'block';
    btnText.textContent = 'Verificando...';

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
      const { data, error } = await window.supabaseDb.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        throw error;
      }

      // Success! Redirect to app
      window.location.href = 'index.html';
    } catch (err) {
      console.error('Login error:', err.message);
      errorMsg.textContent = 'Error: Credenciales inválidas o problema de conexión.';
      errorMsg.style.display = 'block';
      
      // Reset button
      btnLogin.disabled = false;
      spinner.style.display = 'none';
      btnText.textContent = 'Iniciar Sesión';
    }
  });
});
