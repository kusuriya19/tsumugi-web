/**
 * 紬 TSUMUGI — Admin Dashboard
 * 後臺管理：登入、查看諮詢提交記錄、狀態管理
 */

(function () {
  'use strict';

  // ============================================
  // Supabase 設定
  // ============================================
  var SUPABASE_URL = 'https://krwupvagjjfsrqxcfjsn.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtyd3VwdmFnampmc3JxeGNmanNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDE5NjgsImV4cCI6MjEwMTIxNzk2OH0.X0_QQT9ZTdxVm_qCBeqHueSwzUjVASFpWkW9UJoBoiQ';

  var supabase = null;
  var allData = [];
  var currentFilter = 'all';
  var currentDetailId = null;

  // 狀態對照
  var statusMap = {
    pending: '待處理',
    processing: '處理中',
    replied: '已回覆',
    closed: '已結案',
  };

  var subjectMap = {
    product: '商品諮詢',
    order: '訂單查詢',
    custom: '客製服務',
    collab: '合作洽詢',
    other: '其他',
  };

  // ============================================
  // DOM 元素
  // ============================================
  var loginSection, dashboardSection;
  var loginForm, loginError;
  var submissionsBody, btnLogout;
  var statTotal, statToday, statPending, statProcessing;
  var modalOverlay, btnCloseModal, btnSaveDetail;

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
    statPending = document.getElementById('statPending');
    statProcessing = document.getElementById('statProcessing');
    modalOverlay = document.getElementById('modalOverlay');
    btnCloseModal = document.getElementById('btnCloseModal');
    btnSaveDetail = document.getElementById('btnSaveDetail');

    loginForm.addEventListener('submit', handleLogin);
    btnLogout.addEventListener('click', handleLogout);
    btnCloseModal.addEventListener('click', closeModal);
    btnSaveDetail.addEventListener('click', handleSaveDetail);
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeModal();
    });

    // 篩選按鈕
    var filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-status');
        renderTable();
      });
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
    submissionsBody.innerHTML = '<tr><td colspan="7" class="admin-loading">載入中...</td></tr>';

    var { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      submissionsBody.innerHTML = '<tr><td colspan="7" class="admin-loading">載入失敗：' + error.message + '</td></tr>';
      return;
    }

    allData = data || [];
    updateStats();
    renderTable();
  }

  // ============================================
  // 更新統計
  // ============================================
  function updateStats() {
    statTotal.textContent = allData.length;

    var today = new Date().toISOString().split('T')[0];
    var todayCount = allData.filter(function (item) {
      return item.created_at && item.created_at.startsWith(today);
    }).length;
    statToday.textContent = todayCount;

    statPending.textContent = allData.filter(function (item) {
      return item.status === 'pending' || !item.status;
    }).length;

    statProcessing.textContent = allData.filter(function (item) {
      return item.status === 'processing';
    }).length;
  }

  // ============================================
  // 渲染表格
  // ============================================
  function renderTable() {
    var filtered = currentFilter === 'all'
      ? allData
      : allData.filter(function (item) {
          return (item.status || 'pending') === currentFilter;
        });

    if (filtered.length === 0) {
      submissionsBody.innerHTML = '<tr><td colspan="7" class="empty-state"><p>目前沒有提交記錄</p></td></tr>';
      return;
    }

    var html = filtered.map(function (item) {
      var date = item.created_at
        ? new Date(item.created_at).toLocaleString('zh-TW')
        : '-';
      var subject = subjectMap[item.subject] || item.subject || '-';
      var messagePreview = item.message
        ? item.message.substring(0, 30) + (item.message.length > 30 ? '...' : '')
        : '-';
      var status = item.status || 'pending';
      var statusText = statusMap[status] || status;

      return '<tr>' +
        '<td class="col-name">' + escapeHtml(item.name) + '</td>' +
        '<td class="col-email">' + escapeHtml(item.email) + '</td>' +
        '<td><span class="col-subject">' + escapeHtml(subject) + '</span></td>' +
        '<td><span class="status-badge status-' + status + '" data-id="' + item.id + '" onclick="window.ADMIN.changeStatus(event, \'' + item.id + '\', \'' + status + '\')">' + statusText + '</span></td>' +
        '<td class="col-message">' + escapeHtml(messagePreview) + '</td>' +
        '<td class="col-date">' + date + '</td>' +
        '<td>' +
          '<button class="action-btn" onclick="window.ADMIN.openDetail(\'' + item.id + '\')">詳情</button>' +
          '<button class="action-btn delete" onclick="window.ADMIN.deleteItem(\'' + item.id + '\')">刪除</button>' +
        '</td>' +
        '</tr>';
    }).join('');

    submissionsBody.innerHTML = html;
  }

  // ============================================
  // 快速切換狀態
  // ============================================
  async function changeStatus(e, id, currentStatus) {
    e.stopPropagation();
    var statuses = ['pending', 'processing', 'replied', 'closed'];
    var currentIndex = statuses.indexOf(currentStatus);
    var nextStatus = statuses[(currentIndex + 1) % statuses.length];

    var { error } = await supabase
      .from('contact_submissions')
      .update({ status: nextStatus })
      .eq('id', id);

    if (error) {
      alert('更新失敗：' + error.message);
      return;
    }

    // 更新本地資料
    var item = allData.find(function (d) { return d.id === id; });
    if (item) item.status = nextStatus;

    updateStats();
    renderTable();
  }

  // ============================================
  // 開啟詳情 Modal
  // ============================================
  function openDetail(id) {
    currentDetailId = id;
    var item = allData.find(function (d) { return d.id === id; });
    if (!item) return;

    document.getElementById('detailName').textContent = item.name || '-';
    document.getElementById('detailEmail').textContent = item.email || '-';
    document.getElementById('detailPhone').textContent = item.phone || '未提供';
    document.getElementById('detailSubject').textContent = subjectMap[item.subject] || item.subject || '-';
    document.getElementById('detailDate').textContent = item.created_at
      ? new Date(item.created_at).toLocaleString('zh-TW')
      : '-';
    document.getElementById('detailMessage').textContent = item.message || '-';
    document.getElementById('detailStatus').value = item.status || 'pending';
    document.getElementById('detailNote').value = item.note || '';

    modalOverlay.classList.add('active');
  }

  // ============================================
  // 儲存詳情
  // ============================================
  async function handleSaveDetail() {
    if (!currentDetailId) return;

    var status = document.getElementById('detailStatus').value;
    var note = document.getElementById('detailNote').value.trim();

    var submitBtn = btnSaveDetail;
    submitBtn.disabled = true;
    submitBtn.textContent = '儲存中...';

    var { error } = await supabase
      .from('contact_submissions')
      .update({ status: status, note: note })
      .eq('id', currentDetailId);

    submitBtn.disabled = false;
    submitBtn.textContent = '儲存';

    if (error) {
      alert('儲存失敗：' + error.message);
      return;
    }

    // 更新本地資料
    var item = allData.find(function (d) { return d.id === currentDetailId; });
    if (item) {
      item.status = status;
      item.note = note;
    }

    updateStats();
    renderTable();
    closeModal();
  }

  // ============================================
  // 刪除記錄
  // ============================================
  async function deleteItem(id) {
    if (!confirm('確定要刪除此筆記錄嗎？')) return;

    var { error } = await supabase
      .from('contact_submissions')
      .delete()
      .eq('id', id);

    if (error) {
      alert('刪除失敗：' + error.message);
      return;
    }

    allData = allData.filter(function (d) { return d.id !== id; });
    updateStats();
    renderTable();
  }

  // ============================================
  // 關閉 Modal
  // ============================================
  function closeModal() {
    modalOverlay.classList.remove('active');
    currentDetailId = null;
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

  // 暴露給 HTML onclick 使用
  window.ADMIN = {
    changeStatus: changeStatus,
    openDetail: openDetail,
    deleteItem: deleteItem,
  };
})();
