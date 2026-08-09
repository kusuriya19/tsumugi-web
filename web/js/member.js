/**
 * 紬 TSUMUGI — Member System
 * 會員中心：註冊、登入、登出、個人資料管理
 */

(function () {
  'use strict';

  // ============================================
  // Supabase 設定
  // ============================================
  var SUPABASE_URL = 'https://krwupvagjjfsrqxcfjsn.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtyd3VwdmFnampmc3JxeGNmanNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDE5NjgsImV4cCI6MjEwMTIxNzk2OH0.X0_QQT9ZTdxVm_qCBeqHueSwzUjVASFpWkW9UJoBoiQ';

  var supabase = null;
  var currentUser = null;
  var currentMember = null;

  // ============================================
  // DOM 元素
  // ============================================
  var authSection, dashboardSection;
  var loginForm, registerForm;
  var forgotPasswordModal;

  // ============================================
  // 初始化
  // ============================================
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.error('Supabase JS SDK 未載入');
      return;
    }

    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    authSection = document.getElementById('auth');
    loginForm = document.getElementById('loginForm');
    registerForm = document.getElementById('registerForm');
    forgotPasswordModal = document.getElementById('forgotPasswordModal');

    // 綁定事件
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    document.getElementById('forgotPasswordLink').addEventListener('click', showForgotPassword);
    document.getElementById('modalClose').addEventListener('click', hideForgotPassword);
    document.getElementById('forgotPasswordModal').addEventListener('click', function (e) {
      if (e.target === this) hideForgotPassword();
    });
    document.getElementById('forgotPasswordForm').addEventListener('submit', handleForgotPassword);

    // Tab 切換
    document.querySelectorAll('.auth-tabs .tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tab = this.getAttribute('data-tab');
        document.querySelectorAll('.auth-tabs .tab-btn').forEach(function (b) {
          b.classList.remove('active');
        });
        this.classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(function (panel) {
          panel.classList.remove('active');
        });
        document.getElementById('panel-' + tab).classList.add('active');
      });
    });

    // 即時驗證
    setupRealtimeValidation();

    // 檢查登入狀態
    checkSession();
  });

  // ============================================
  // 檢查登入狀態
  // ============================================
  async function checkSession() {
    var { data: { session } } = await supabase.auth.getSession();
    if (session) {
      currentUser = session.user;
      await loadMemberProfile();
      showDashboard();
    }
  }

  // ============================================
  // 載入會員資料
  // ============================================
  async function loadMemberProfile() {
    if (!currentUser) return;

    var { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // 會員資料不存在，自動建立
      await createMemberProfile();
    } else if (!error) {
      currentMember = data;
    }
  }

  // ============================================
  // 建立會員資料
  // ============================================
  async function createMemberProfile() {
    if (!currentUser) return;

    var { error } = await supabase
      .from('members')
      .insert({
        id: currentUser.id,
        name: currentUser.user_metadata?.name || currentUser.email.split('@')[0],
        email: currentUser.email,
      });

    if (!error) {
      await loadMemberProfile();
    }
  }

  // ============================================
  // 註冊處理
  // ============================================
  async function handleRegister(e) {
    e.preventDefault();

    var name = document.getElementById('register-name').value.trim();
    var email = document.getElementById('register-email').value.trim();
    var password = document.getElementById('register-password').value;
    var confirm = document.getElementById('register-confirm').value;
    var terms = document.querySelector('#registerForm input[name="terms"]');

    // 驗證
    var isValid = true;

    if (!name) {
      showError('register-name', 'register-name-error', '請輸入姓名');
      isValid = false;
    }

    if (!email || !email.includes('@')) {
      showError('register-email', 'register-email-error', '請輸入有效的電子郵件');
      isValid = false;
    }

    if (!password || password.length < 6) {
      showError('register-password', 'register-password-error', '密碼至少需要6個字元');
      isValid = false;
    }

    if (password !== confirm) {
      showError('register-confirm', 'confirm-error', '兩次輸入的密碼不一致');
      isValid = false;
    }

    if (!terms.checked) {
      document.querySelector('.form-terms').style.color = '#e74c3c';
      isValid = false;
    } else {
      document.querySelector('.form-terms').style.color = '';
    }

    if (!isValid) return;

    var submitBtn = registerForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '註冊中...';

    // Supabase Auth 註冊
    var { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: name,
        },
      },
    });

    submitBtn.disabled = false;
    submitBtn.textContent = '註冊';

    if (error) {
      alert('註冊失敗：' + error.message);
      return;
    }

    // 建立會員資料
    if (data.user) {
      currentUser = data.user;
      await createMemberProfile();
    }

    alert('註冊成功！請檢查您的電子郵件以完成驗證。');
    registerForm.reset();
    // 切換到登入頁
    document.querySelector('.auth-tabs .tab-btn[data-tab="login"]').click();
  }

  // ============================================
  // 登入處理
  // ============================================
  async function handleLogin(e) {
    e.preventDefault();

    var email = document.getElementById('login-email').value.trim();
    var password = document.getElementById('login-password').value;

    var isValid = true;

    if (!email || !email.includes('@')) {
      showError('login-email', 'login-email-error', '請輸入有效的電子郵件');
      isValid = false;
    }

    if (!password) {
      showError('login-password', 'login-password-error', '請輸入密碼');
      isValid = false;
    }

    if (!isValid) return;

    var submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '登入中...';

    var { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    submitBtn.disabled = false;
    submitBtn.textContent = '登入';

    if (error) {
      alert('登入失敗：' + error.message);
      return;
    }

    currentUser = data.user;
    await loadMemberProfile();
    showDashboard();
  }

  // ============================================
  // 忘記密碼
  // ============================================
  function showForgotPassword() {
    forgotPasswordModal.classList.add('active');
  }

  function hideForgotPassword() {
    forgotPasswordModal.classList.remove('active');
  }

  async function handleForgotPassword(e) {
    e.preventDefault();

    var email = document.getElementById('forgot-email').value.trim();

    if (!email || !email.includes('@')) {
      showError('forgot-email', 'forgot-email-error', '請輸入有效的電子郵件');
      return;
    }

    var { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/member.html',
    });

    if (error) {
      alert('發送失敗：' + error.message);
      return;
    }

    alert('密碼重設連結已發送至您的電子郵件，請查收！');
    hideForgotPassword();
    document.getElementById('forgotPasswordForm').reset();
  }

  // ============================================
  // 顯示會員面板
  // ============================================
  function showDashboard() {
    var name = currentMember?.name || currentUser?.user_metadata?.name || '會員';
    var email = currentMember?.email || currentUser?.email || '';

    authSection.innerHTML =
      '<div class="container">' +
        '<div class="success-box">' +
          '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>' +
            '<circle cx="12" cy="7" r="4"/>' +
          '</svg>' +
          '<h3>歡迎回來，' + escapeHtml(name) + '！</h3>' +
          '<p>' + escapeHtml(email) + '</p>' +
          '<div style="display:flex;gap:12px;justify-content:center;margin-top:24px;">' +
            '<a href="index.html" class="btn btn-primary">返回首頁</a>' +
            '<button class="btn btn-primary" style="background:var(--color-gray);border-color:var(--color-gray);" onclick="window.MEMBER.logout()">登出</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ============================================
  // 登出處理
  // ============================================
  async function handleLogout() {
    await supabase.auth.signOut();
    currentUser = null;
    currentMember = null;
    window.location.reload();
  }

  // ============================================
  // 即時驗證
  // ============================================
  function setupRealtimeValidation() {
    document.getElementById('register-name')?.addEventListener('input', function () {
      if (this.value) clearError('register-name', 'register-name-error');
    });

    document.getElementById('register-email')?.addEventListener('input', function () {
      if (this.value && this.value.includes('@')) clearError('register-email', 'register-email-error');
    });

    document.getElementById('register-password')?.addEventListener('input', function () {
      if (this.value && this.value.length >= 6) clearError('register-password', 'register-password-error');
    });

    document.getElementById('register-confirm')?.addEventListener('input', function () {
      var password = document.getElementById('register-password').value;
      if (this.value && this.value === password) clearError('register-confirm', 'confirm-error');
    });

    document.getElementById('login-email')?.addEventListener('input', function () {
      if (this.value && this.value.includes('@')) clearError('login-email', 'login-email-error');
    });

    document.getElementById('login-password')?.addEventListener('input', function () {
      if (this.value) clearError('login-password', 'login-password-error');
    });
  }

  // ============================================
  // 工具函數
  // ============================================
  function showError(inputId, errorId, message) {
    var input = document.getElementById(inputId);
    var error = document.getElementById(errorId);
    if (input) input.style.borderColor = '#e74c3c';
    if (error) {
      error.textContent = message;
      error.style.display = 'block';
    }
  }

  function clearError(inputId, errorId) {
    var input = document.getElementById(inputId);
    var error = document.getElementById(errorId);
    if (input) input.style.borderColor = '';
    if (error) error.style.display = 'none';
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // 暴露給 HTML onclick 使用
  window.MEMBER = {
    logout: handleLogout,
  };
})();
