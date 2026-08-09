/**
 * 紬 TSUMUGI — Contact Form Handler
 * 直接透過 Supabase JS SDK 提交表單資料
 */

(function () {
  'use strict';

  // ============================================
  // Supabase 設定
  // ============================================
  const SUPABASE_URL = 'https://krwupvagjjfsrqxcfjsn.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtyd3VwdmFnampmc3JxeGNmanNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDE5NjgsImV4cCI6MjEwMTIxNzk2OH0.X0_QQT9ZTdxVm_qCBeqHueSwzUjVASFpWkW9UJoBoiQ';

  var supabase = null;

  // ============================================
  // 初始化
  // ============================================
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.error('Supabase JS SDK 未載入');
      return;
    }

    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    var form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', handleSubmit);
  });

  // ============================================
  // 表單提交處理
  // ============================================
  async function handleSubmit(e) {
    e.preventDefault();

    var form = e.target;
    var submitBtn = form.querySelector('button[type="submit"]');
    var statusEl = document.getElementById('form-status');

    var name = form.querySelector('#contact-name').value.trim();
    var email = form.querySelector('#contact-email').value.trim();
    var phone = form.querySelector('#contact-phone').value.trim();
    var subject = form.querySelector('#contact-subject').value;
    var message = form.querySelector('#contact-message').value.trim();

    // 前端驗證
    if (!name || !email || !message) {
      showStatus(statusEl, 'error', '請填寫所有必填欄位');
      return;
    }

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showStatus(statusEl, 'error', '電子信箱格式不正確');
      return;
    }

    // UI: 進入載入狀態
    submitBtn.disabled = true;
    submitBtn.textContent = '送出中...';
    showStatus(statusEl, '', '');

    try {
      var { data, error } = await supabase
        .from('contact_submissions')
        .insert({
          name: name,
          email: email,
          phone: phone || null,
          subject: subject || null,
          message: message,
        });

      if (error) {
        console.error('Supabase error:', error);
        showStatus(statusEl, 'error', '送出失敗：' + error.message);
      } else {
        showStatus(statusEl, 'success', '訊息已成功送出，我們將盡快與您聯繫！');
        form.reset();
      }
    } catch (err) {
      console.error('Submit error:', err);
      showStatus(statusEl, 'error', '網路連線失敗，請檢查網路後再試');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '送出訊息';
    }
  }

  // ============================================
  // 狀態訊息顯示
  // ============================================
  function showStatus(el, type, message) {
    if (!el) return;

    el.textContent = message;
    el.className = 'form-status';

    if (type === 'success') {
      el.classList.add('form-status--success');
      el.style.display = 'block';
    } else if (type === 'error') {
      el.classList.add('form-status--error');
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  }
})();
