/**
 * 紬 TSUMUGI — Admin Dashboard
 * 後臺管理：登入、查看諮詢提交記錄
 */

(function () {
  'use strict';

  // ============================================
  // Supabase 設定
  // ============================================
  var SUPABASE_URL = 'https://krwupvagjjfsrqxcfjsn.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtyd3VwdmFnampmc3JxeGNmanNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDE5NjgsImV4cCI6MjEwMTIxNzk2OH0.X0_QQT9ZTdxVm_qCBeqHueSwzUjVASFpWkW9UJoBoiQ';

  var supabase = null;

  // ============================================
  // DOM 元素
  // ============================================
  var loginSection, dashboardSection;
  var loginForm, loginError;
  var submissionsBody, btnLogout;
  var statTotal, statToday;
  var modalOverlay, btnCloseModal;

  // ============================================
  // 初始化
  // ============================================
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.error('Supabase JS SDK 未載入');
      return;
    }

    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    loginSection = document.getElementById('loginSection');
    dashboardSection = document.getElementById('dashboardSection');
    loginForm = document.getElementById('loginForm');
    loginError = document.getElementById('loginError');
    submissionsBody = document.getElementById('submissionsBody');
    btnLogout = document.getElementById('btnLogout');
    statTotal = document.getElementById('statTotal');
    statToday = document.getElementById('statToday');
    modalOverlay = document.getElementById('modalOverlay');
    btnCloseModal = document.getElementById('btnCloseModal');

    loginForm.addEventListener('submit', handleLogin);
    btnLogout.addEventListener('click', handleLogout);
    btnCloseModal.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeModal();
    });

    checkSession();
  });

  // ============================================
  // 檢查登入狀態
  // ============================================
  async function checkSession() {
    var { data: { session } } = await supabase.auth.getSession();
    if (session) {
      showDashboard();
    }
  }

  // ============================================
  // 登入處理
  // ============================================
  async function handleLogin(e) {
    e.preventDefault();

    var email = document.getElementById('login-email').value.trim();
    var password = document.getElementById('login-password').value;
    var submitBtn = loginForm.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.textContent = '登入中...';
    loginError.style.display = 'none';

    var { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    submitBtn.disabled = false;
    submitBtn.textContent = '登入';

    if (error) {
      loginError.textContent = '登入失敗：' + error.message;
      loginError.style.display = 'block';
    } else {
      showDashboard();
    }
  }

  // ============================================
  // 登出處理
  // ============================================
  async function handleLogout() {
    await supabase.auth.signOut();
    dashboardSection.style.display = 'none';
    loginSection.style.display = '';
    loginForm.reset();
  }

  // ============================================
  // 顯示管理面板
  // ============================================
  async function showDashboard() {
    loginSection.style.display = 'none';
    dashboardSection.style.display = '';
    await loadSubmissions();
  }

  // ============================================
  // 載入提交記錄
  // ============================================
  async function loadSubmissions() {
    submissionsBody.innerHTML = '<tr><td colspan="5" class="admin-loading">載入中...</td></tr>';

    var { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      submissionsBody.innerHTML = '<tr><td colspan="5" class="admin-loading">載入失敗：' + error.message + '</td></tr>';
      return;
    }

    if (!data || data.length === 0) {
      submissionsBody.innerHTML = '<tr><td colspan="5" class="empty-state"><p>目前沒有提交記錄</p></td></tr>';
      statTotal.textContent = '0';
      statToday.textContent = '0';
      return;
    }

    // 統計
    statTotal.textContent = data.length;

    var today = new Date().toISOString().split('T')[0];
    var todayCount = data.filter(function (item) {
      return item.created_at && item.created_at.startsWith(today);
    }).length;
    statToday.textContent = todayCount;

    // 主題對照
    var subjectMap = {
      product: '商品諮詢',
      order: '訂單查詢',
      custom: '客製服務',
      collab: '合作洽詢',
      other: '其他',
    };

    // 渲染表格
    var html = data.map(function (item) {
      var date = item.created_at
        ? new Date(item.created_at).toLocaleString('zh-TW')
        : '-';
      var subject = subjectMap[item.subject] || item.subject || '-';
      var messagePreview = item.message
        ? item.message.substring(0, 40) + (item.message.length > 40 ? '...' : '')
        : '-';

      return '<tr data-id="' + item.id + '" style="cursor:pointer;">' +
        '<td class="col-name">' + escapeHtml(item.name) + '</td>' +
        '<td class="col-email">' + escapeHtml(item.email) + '</td>' +
        '<td><span class="col-subject">' + escapeHtml(subject) + '</span></td>' +
        '<td class="col-message">' + escapeHtml(messagePreview) + '</td>' +
        '<td class="col-date">' + date + '</td>' +
        '</tr>';
    }).join('');

    submissionsBody.innerHTML = html;

    // 點擊開啟詳情
    var rows = submissionsBody.querySelectorAll('tr[data-id]');
    rows.forEach(function (row) {
      row.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        var item = data.find(function (d) { return d.id === id; });
        if (item) openModal(item, subjectMap);
      });
    });
  }

  // ============================================
  // 開啟詳情 Modal
  // ============================================
  function openModal(item, subjectMap) {
    document.getElementById('detailName').textContent = item.name || '-';
    document.getElementById('detailEmail').textContent = item.email || '-';
    document.getElementById('detailPhone').textContent = item.phone || '未提供';
    document.getElementById('detailSubject').textContent = subjectMap[item.subject] || item.subject || '-';
    document.getElementById('detailDate').textContent = item.created_at
      ? new Date(item.created_at).toLocaleString('zh-TW')
      : '-';
    document.getElementById('detailMessage').textContent = item.message || '-';
    modalOverlay.classList.add('active');
  }

  // ============================================
  // 關閉 Modal
  // ============================================
  function closeModal() {
    modalOverlay.classList.remove('active');
  }

  // ============================================
  // 工具函數
  // ============================================
  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }
})();
