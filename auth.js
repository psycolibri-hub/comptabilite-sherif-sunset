// === AUTH GLOBALE PARTAGEE ===
// Ce fichier gère la connexion pour TOUT le site.
// A inclure sur chaque page : <script src="auth.js"></script>

(function() {
  const SUPABASE_URL = 'https://dzdnhnmwluznrxijkkzc.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6ZG5obm13bHV6bnJ4aWpra3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMjU5MDIsImV4cCI6MjEwMTYwMTkwMn0.CCyPCwp881OZl0RAYhefYUV4cBUPA6j_hKdSqVnec74';

  window.isAdmin = false;
  window.supabaseClient = null;

  // === STYLES DE LA MODALE (injectés dynamiquement) ===
  if (!document.getElementById('auth-global-styles')) {
    const style = document.createElement('style');
    style.id = 'auth-global-styles';
    style.textContent = `
      .auth-modal-overlay {
        position: fixed; inset: 0;
        background: rgba(42, 26, 15, 0.6);
        z-index: 10000;
        display: none;
        align-items: center; justify-content: center;
        padding: 20px;
      }
      .auth-modal-overlay.active { display: flex; }
      .auth-modal-box {
        background: #faf3e0;
        border: 2px solid #8b5e3c;
        border-radius: 4px;
        padding: 40px 32px;
        max-width: 420px;
        width: 100%;
        box-shadow: 0 8px 32px rgba(42,26,15,0.35);
        text-align: center;
        position: relative;
        font-family: 'Playfair Display', Georgia, serif;
      }
      .auth-modal-close {
        position: absolute; top: 12px; right: 16px;
        background: none; border: none;
        font-size: 24px; color: #5a3d2a;
        cursor: pointer; line-height: 1;
      }
      .auth-modal-box h2 {
        font-family: 'Rye', 'Cinzel', serif;
        font-size: 22px; color: #3d2b1f;
        letter-spacing: 2px; text-transform: uppercase;
        margin-bottom: 8px;
      }
      .auth-modal-sub {
        font-family: 'Cinzel', serif;
        font-size: 12px; color: #5a3d2a;
        letter-spacing: 2px; text-transform: uppercase;
        margin-bottom: 28px;
      }
      .auth-modal-box .form-group {
        text-align: left; margin-bottom: 16px;
      }
      .auth-modal-box label {
        font-family: 'Cinzel', serif;
        font-size: 11px; color: #5a3d2a;
        letter-spacing: 1.5px; text-transform: uppercase;
        margin-bottom: 6px; display: block; font-weight: 600;
      }
      .auth-modal-box input {
        font-family: 'Playfair Display', serif;
        font-size: 14px; padding: 10px 12px;
        border: 1px solid #8b5e3c; border-radius: 4px;
        background: #f4e4bc; color: #2a1a0f;
        outline: none; width: 100%;
      }
      .auth-modal-box input:focus {
        border-color: #c9a227;
        box-shadow: 0 0 0 2px rgba(201,162,39,0.15);
      }
      .auth-modal-btn {
        font-family: 'Cinzel', serif;
        font-size: 14px; font-weight: 700;
        letter-spacing: 2px; text-transform: uppercase;
        padding: 14px; width: 100%;
        background: #3d2b1f; color: #e8c84b;
        border: none; border-radius: 4px;
        cursor: pointer; margin-top: 8px;
      }
      .auth-modal-btn:hover {
        background: #5c3d2e; color: #c9a227;
      }
      .auth-modal-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .auth-modal-error {
        font-family: 'Cinzel', serif;
        font-size: 12px; color: #8b3a1a;
        background: #ffebee; padding: 10px;
        border-radius: 4px; margin-bottom: 16px;
        display: none; letter-spacing: 0.5px;
      }
      .auth-global-btn {
        position: absolute; right: 20px; top: 50%;
        transform: translateY(-50%);
        font-family: 'Cinzel', serif;
        font-size: 11px; background: transparent;
        border: 1px solid #8b5e3c; color: #5c3d2e;
        padding: 6px 14px; border-radius: 2px;
        cursor: pointer; letter-spacing: 1px;
        text-transform: uppercase; z-index: 5;
        transition: all 0.2s;
      }
      .auth-global-btn:hover {
        background: #5c3d2e; color: #faf3e0;
      }
      .auth-global-btn.logout {
        border-color: #8b3a1a; color: #8b3a1a;
      }
      .auth-global-btn.logout:hover {
        background: #8b3a1a; color: #faf3e0;
      }
      .auth-spinner {
        display: inline-block; width: 14px; height: 14px;
        border: 2px solid #e8c84b; border-top-color: transparent;
        border-radius: 50%; animation: auth-spin 0.8s linear infinite;
        margin-right: 8px; vertical-align: middle;
      }
      @keyframes auth-spin { to { transform: rotate(360deg); } }
      @media (max-width: 600px) {
        .auth-global-btn {
          position: static; display: block;
          margin: 12px auto 0; transform: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // === AJOUTER LE BOUTON DANS LE HEADER ===
  function injectAuthButton() {
    const header = document.querySelector('header');
    if (!header) return;
    if (document.getElementById('auth-global-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'auth-global-btn';
    btn.className = 'auth-global-btn';
    btn.textContent = 'Connexion admin';
    btn.onclick = openAuthModal;
    header.appendChild(btn);
  }

  // === AJOUTER LA MODALE DANS LE BODY ===
  function injectAuthModal() {
    if (document.getElementById('auth-global-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'auth-global-modal';
    modal.className = 'auth-modal-overlay';
    modal.innerHTML = `
      <div class="auth-modal-box">
        <button class="auth-modal-close" onclick="closeAuthModal()">&times;</button>
        <h2>Connexion Admin</h2>
        <p class="auth-modal-sub">Bureau du Shérif — Accès réservé</p>
        <div class="auth-modal-error" id="auth-global-error"></div>
        <div class="form-group">
          <label>Adresse e-mail</label>
          <input type="email" id="auth-global-email" placeholder="admin@sunset.sh">
        </div>
        <div class="form-group">
          <label>Mot de passe</label>
          <input type="password" id="auth-global-password" placeholder="••••••••">
        </div>
        <button type="button" class="auth-modal-btn" id="auth-global-submit" onclick="handleGlobalLogin()">Se connecter</button>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeAuthModal();
    });

    document.getElementById('auth-global-password').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') handleGlobalLogin();
    });
  }

  // === INIT SUPABASE ===
  function initSupabase() {
    if (typeof window.supabase === 'undefined') {
      console.error('[Auth] SDK Supabase non chargé');
      return false;
    }
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return true;
  }

  // === VÉRIFIER LA SESSION ===
  async function checkSession() {
    if (!window.supabaseClient) return;
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    setAdminMode(!!session);
  }

  function setAdminMode(admin) {
    window.isAdmin = admin;
    const btn = document.getElementById('auth-global-btn');
    if (!btn) return;

    if (admin) {
      btn.textContent = 'Déconnexion';
      btn.classList.add('logout');
      btn.onclick = handleGlobalLogout;
    } else {
      btn.textContent = 'Connexion admin';
      btn.classList.remove('logout');
      btn.onclick = openAuthModal;
    }

    window.dispatchEvent(new CustomEvent('authchange', { detail: { isAdmin: admin } }));
  }

  // === FONCTIONS GLOBALES ===
  window.openAuthModal = function() {
    const modal = document.getElementById('auth-global-modal');
    if (modal) {
      modal.classList.add('active');
      document.getElementById('auth-global-email').focus();
    }
  };

  window.closeAuthModal = function() {
    const modal = document.getElementById('auth-global-modal');
    if (modal) modal.classList.remove('active');
    const err = document.getElementById('auth-global-error');
    if (err) err.style.display = 'none';
    const email = document.getElementById('auth-global-email');
    const pass = document.getElementById('auth-global-password');
    if (email) email.value = '';
    if (pass) pass.value = '';
  };

  window.handleGlobalLogin = async function() {
    const email = document.getElementById('auth-global-email').value.trim();
    const password = document.getElementById('auth-global-password').value;
    const errorDiv = document.getElementById('auth-global-error');
    const btn = document.getElementById('auth-global-submit');

    if (!email || !password) {
      errorDiv.textContent = 'Veuillez remplir tous les champs.';
      errorDiv.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="auth-spinner"></span> Connexion...';
    errorDiv.style.display = 'none';

    try {
      const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        errorDiv.textContent = 'Connexion refusée. Vérifie tes identifiants.';
        errorDiv.style.display = 'block';
        console.error(error);
        return;
      }
      closeAuthModal();
      setAdminMode(true);
    } catch (err) {
      errorDiv.textContent = 'Erreur : ' + err.message;
      errorDiv.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Se connecter';
    }
  };

  window.handleGlobalLogout = async function() {
    if (!window.supabaseClient) return;
    await window.supabaseClient.auth.signOut();
    setAdminMode(false);
  };

  // === DÉMARRAGE ===
  function start() {
    injectAuthButton();
    injectAuthModal();
    if (initSupabase()) {
      checkSession();
      window.supabaseClient.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') setAdminMode(true);
        if (event === 'SIGNED_OUT') setAdminMode(false);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();