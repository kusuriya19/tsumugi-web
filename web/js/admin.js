/**
 * 紬 TSUMUGI — Admin Dashboard
 * 後臺管理：登入、諮詢管理、會員管理
 */

(function () {
  'use strict';

  // ============================================
  // Supabase 設定
  // ============================================
  var SUPABASE_URL = 'https://krwupvagjjfsrqxcfjsn.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtyd3VwdmFnampmc3JxeGNmanNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDE5NjgsImV4cCI6MjEwMTIxNzk2OH0.X0_QQT9ZTdxVm_qCBeqHueSwzUjVASFpWkW9UJoBoiQ';

  var supabase = null;

  // 諮詢資料
  var allSubmissions = [];
  var currentFilter = 'all';
  var currentDetailId = null;

  // 會員資料
  var allMembers = [];

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
  var submissionsBody, membersBody, btnLogout;
  var statTotal, statToday, statPending, statProcessing;
  var statMemberTotal, statMemberToday;
  var modalOverlay, btnCloseModal, btnSaveDetail;
  var memberModalOverlay, btnCloseMemberModal;

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
    membersBody = document.getElementById('membersBody');
    btnLogout = document.getElementById('btnLogout');
    statTotal = document.getElementById('statTotal');
    statToday = document.getElementById('statToday');
    statPending = document.getElementById('statPending');
    statProcessing = document.getElementById('statProcessing');
    statMemberTotal = document.getElementById('statMemberTotal');
    statMemberToday = document.getElementById('statMemberToday');
    modalOverlay = document.getElementById('modalOverlay');
    btnCloseModal = document.getElementById('btnCloseModal');
    btnSaveDetail = document.getElementById('btnSaveDetail');
    memberModalOverlay = document.getElementById('memberModalOverlay');
    btnCloseMemberModal = document.getElementById('btnCloseMemberModal');

    loginForm.addEventListener('submit', handleLogin);
    btnLogout.addEventListener('click', handleLogout);
    btnCloseModal.addEventListener('click', closeModal);
    btnSaveDetail.addEventListener('click', handleSaveDetail);
    btnCloseMemberModal.addEventListener('click', closeMemberModal);
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeModal();
    });
    memberModalOverlay.addEventListener('click', function (e) {
      if (e.target === memberModalOverlay) closeMemberModal();
    });

    // Tab 切換
    document.querySelectorAll('.admin-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.admin-tab').forEach(function (t) {
          t.classList.remove('active');
        });
        tab.classList.add('active');

        var tabName = tab.getAttribute('data-tab');
        document.querySelectorAll('.tab-content').forEach(function (content) {
          content.classList.remove('active');
        });
        document.getElementById('tab-' + tabName).classList.add('active');
      });
    });

    // 篩選按鈕
    var filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-status');
        renderSubmissions();
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
    await Promise.all([loadSubmissions(), loadMembers()]);
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

    allSubmissions = data || [];
    updateSubmissionStats();
    renderSubmissions();
  }

  // ============================================
  // 更新諮詢統計
  // ============================================
  function updateSubmissionStats() {
    statTotal.textContent = allSubmissions.length;

    var today = new Date().toISOString().split('T')[0];
    var todayCount = allSubmissions.filter(function (item) {
      return item.created_at && item.created_at.startsWith(today);
    }).length;
    statToday.textContent = todayCount;

    statPending.textContent = allSubmissions.filter(function (item) {
      return item.status === 'pending' || !item.status;
    }).length;

    statProcessing.textContent = allSubmissions.filter(function (item) {
      return item.status === 'processing';
    }).length;
  }

  // ============================================
  // 渲染諮詢表格
  // ============================================
  function renderSubmissions() {
    var filtered = currentFilter === 'all'
      ? allSubmissions
      : allSubmissions.filter(function (item) {
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

    var item = allSubmissions.find(function (d) { return d.id === id; });
    if (item) item.status = nextStatus;

    updateSubmissionStats();
    renderSubmissions();
  }

  // ============================================
  // 開啟諮詢詳情 Modal
  // ============================================
  function openDetail(id) {
    currentDetailId = id;
    var item = allSubmissions.find(function (d) { return d.id === id; });
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
  // 儲存諮詢詳情
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

    var item = allSubmissions.find(function (d) { return d.id === currentDetailId; });
    if (item) {
      item.status = status;
      item.note = note;
    }

    updateSubmissionStats();
    renderSubmissions();
    closeModal();
  }

  // ============================================
  // 刪除諮詢記錄
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

    allSubmissions = allSubmissions.filter(function (d) { return d.id !== id; });
    updateSubmissionStats();
    renderSubmissions();
  }

  // ============================================
  // 關閉諮詢 Modal
  // ============================================
  function closeModal() {
    modalOverlay.classList.remove('active');
    currentDetailId = null;
  }

  // ============================================
  // 載入會員資料
  // ============================================
  async function loadMembers() {
    membersBody.innerHTML = '<tr><td colspan="6" class="admin-loading">載入中...</td></tr>';

    var { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      membersBody.innerHTML = '<tr><td colspan="6" class="admin-loading">載入失敗：' + error.message + '</td></tr>';
      return;
    }

    allMembers = data || [];
    updateMemberStats();
    renderMembers();
  }

  // ============================================
  // 更新會員統計
  // ============================================
  function updateMemberStats() {
    statMemberTotal.textContent = allMembers.length;

    var today = new Date().toISOString().split('T')[0];
    var todayCount = allMembers.filter(function (item) {
      return item.created_at && item.created_at.startsWith(today);
    }).length;
    statMemberToday.textContent = todayCount;
  }

  // ============================================
  // 渲染會員表格
  // ============================================
  function renderMembers() {
    if (allMembers.length === 0) {
      membersBody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>目前沒有會員資料</p></td></tr>';
      return;
    }

    var html = allMembers.map(function (item) {
      var date = item.created_at
        ? new Date(item.created_at).toLocaleString('zh-TW')
        : '-';
      var birthday = item.birthday || '-';
      var phone = item.phone || '未提供';
      var initial = (item.name || '?').charAt(0).toUpperCase();

      return '<tr>' +
        '<td>' +
          '<div class="member-info">' +
            '<div class="member-avatar">' + escapeHtml(initial) + '</div>' +
            '<span class="member-name">' + escapeHtml(item.name) + '</span>' +
          '</div>' +
        '</td>' +
        '<td class="col-email">' + escapeHtml(item.email) + '</td>' +
        '<td>' + escapeHtml(phone) + '</td>' +
        '<td>' + birthday + '</td>' +
        '<td class="col-date">' + date + '</td>' +
        '<td>' +
          '<button class="action-btn" onclick="window.ADMIN.openMemberDetail(\'' + item.id + '\')">詳情</button>' +
        '</td>' +
        '</tr>';
    }).join('');

    membersBody.innerHTML = html;
  }

  // ============================================
  // 開啟會員詳情 Modal
  // ============================================
  function openMemberDetail(id) {
    var item = allMembers.find(function (d) { return d.id === id; });
    if (!item) return;

    document.getElementById('memberDetailName').textContent = item.name || '-';
    document.getElementById('memberDetailEmail').textContent = item.email || '-';
    document.getElementById('memberDetailPhone').textContent = item.phone || '未提供';
    document.getElementById('memberDetailBirthday').textContent = item.birthday || '未設定';
    document.getElementById('memberDetailDate').textContent = item.created_at
      ? new Date(item.created_at).toLocaleString('zh-TW')
      : '-';

    memberModalOverlay.classList.add('active');
  }

  // ============================================
  // 關閉會員 Modal
  // ============================================
  function closeMemberModal() {
    memberModalOverlay.classList.remove('active');
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
    openMemberDetail: openMemberDetail,
  };
})();
