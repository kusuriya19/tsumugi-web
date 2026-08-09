/**
 * 紬 TSUMUGI — Shared Templates
 * Header, Footer, and utility functions
 */

var TSUMUGI = TSUMUGI || {};

TSUMUGI.Templates = {
  /**
   * Get the current page filename for active nav state
   */
  getCurrentPage: function () {
    var path = window.location.pathname;
    var filename = path.split('/').pop() || 'index.html';
    return filename;
  },

  /**
   * Generate the Header HTML
   * @param {string} activePage - current page filename
   */
  header: function (activePage) {
    var navItems = [
      { href: 'index.html', label: '首頁' },
      { href: 'about.html', label: '關於紬' },
      { href: 'collections.html', label: '系列商品' },
      { href: 'gift.html', label: '祝福指南' },
      { href: 'journal.html', label: '工藝日誌' },
      { href: 'custom.html', label: '客製服務' }
    ];

    var navHTML = navItems.map(function (item) {
      var activeClass = activePage === item.href ? ' class="active"' : '';
      return '<li><a href="' + item.href + '"' + activeClass + '>' + item.label + '</a></li>';
    }).join('\n          ');

    var mobileNavItems = [
      { href: 'index.html', label: '首頁' },
      { href: 'about.html', label: '關於紬' },
      { href: 'collections.html', label: '系列商品' },
      { href: 'gift.html', label: '祝福指南' },
      { href: 'journal.html', label: '工藝日誌' },
      { href: 'custom.html', label: '客製服務' },
      { href: 'member.html', label: '會員中心' },
      { href: 'contact.html', label: '聯絡我們' }
    ];

    var mobileNavHTML = mobileNavItems.map(function (item) {
      return '<li><a href="' + item.href + '">' + item.label + '</a></li>';
    }).join('\n        ');

    var I = TSUMUGI.Icons;

    return '  <!-- Header -->\n' +
      '  <header class="site-header" id="header">\n' +
      '    <div class="header-inner">\n' +
      '      <a href="index.html" class="logo">\n' +
      '        <img src="asset/LOGO.png" alt="紬 TSUMUGI" class="logo-img">\n' +
      '      </a>\n' +
      '      <nav class="main-nav" id="mainNav" aria-label="主導覽">\n' +
      '        <ul class="nav-list">\n' +
      '          ' + navHTML + '\n' +
      '        </ul>\n' +
      '      </nav>\n' +
      '      <div class="header-actions">\n' +
      '        <button class="icon-btn" aria-label="搜尋" id="searchToggle">' + I.search + '</button>\n' +
      '        <a href="member.html" class="icon-btn" aria-label="會員">' + I.member + '</a>\n' +
      '        <a href="#" class="icon-btn" aria-label="收藏">' + I.heart + '</a>\n' +
      '        <a href="cart.html" class="icon-btn cart-link" aria-label="購物車">' + I.cart + '<span class="cart-count" id="cartCount">0</span></a>\n' +
      '        <button class="icon-btn mobile-menu-toggle" aria-label="選單" id="menuToggle">' + I.menu + '</button>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '    <div class="search-bar" id="searchBar">\n' +
      '      <div class="search-bar-inner">\n' +
      '        <input type="search" placeholder="搜尋商品、系列或關鍵字..." aria-label="搜尋">\n' +
      '        <button class="search-close" id="searchClose" aria-label="關閉搜尋">' + I.close + '</button>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  </header>\n\n' +
      '  <!-- Mobile Nav Overlay -->\n' +
      '  <div class="mobile-nav-overlay" id="mobileNavOverlay">\n' +
      '    <nav class="mobile-nav" aria-label="行動版導覽">\n' +
      '      <ul class="mobile-nav-list">\n' +
      '        ' + mobileNavHTML + '\n' +
      '      </ul>\n' +
      '    </nav>\n' +
      '  </div>\n';
  },

  /**
   * Generate the Footer HTML
   */
  footer: function () {
    var I = TSUMUGI.Icons;

    return '  <!-- Footer -->\n' +
      '  <footer class="site-footer">\n' +
      '    <div class="footer-top">\n' +
      '      <div class="container">\n' +
      '        <div class="footer-grid">\n' +
      '          <div class="footer-brand">\n' +
      '            <a href="index.html" class="footer-logo-link">\n' +
      '              <img src="asset/LOGO.png" alt="紬 TSUMUGI" class="footer-logo">\n' +
      '            </a>\n' +
      '            <p class="footer-tagline">把祝福，編織成日常。</p>\n' +
      '            <p class="footer-subtitle">日本水引文化 × 職人工藝 × 日常美學</p>\n' +
      '            <div class="footer-social">\n' +
      '              <a href="#" aria-label="Instagram">' + I.instagram + '</a>\n' +
      '              <a href="#" aria-label="LINE">' + I.line + '</a>\n' +
      '              <a href="#" aria-label="Facebook">' + I.facebook + '</a>\n' +
      '              <a href="#" aria-label="YouTube">' + I.youtube + '</a>\n' +
      '            </div>\n' +
      '          </div>\n' +
      '          <div class="footer-links">\n' +
      '            <div class="footer-col">\n' +
      '              <h4>關於紬</h4>\n' +
      '              <ul>\n' +
      '                <li><a href="about.html">品牌故事</a></li>\n' +
      '                <li><a href="about.html#craft">工藝介紹</a></li>\n' +
      '                <li><a href="about.html#culture">水引文化</a></li>\n' +
      '                <li><a href="journal.html">品牌誌</a></li>\n' +
      '              </ul>\n' +
      '            </div>\n' +
      '            <div class="footer-col">\n' +
      '              <h4>客戶服務</h4>\n' +
      '              <ul>\n' +
      '                <li><a href="faq.html">常見問題</a></li>\n' +
      '                <li><a href="faq.html#shipping">配送說明</a></li>\n' +
      '                <li><a href="faq.html#return">退換政策</a></li>\n' +
      '                <li><a href="contact.html">聯絡我們</a></li>\n' +
      '              </ul>\n' +
      '            </div>\n' +
      '            <div class="footer-col">\n' +
      '              <h4>會員專區</h4>\n' +
      '              <ul>\n' +
      '                <li><a href="member.html">我的帳戶</a></li>\n' +
      '                <li><a href="member.html#orders">訂單查詢</a></li>\n' +
      '                <li><a href="#">收藏清單</a></li>\n' +
      '                <li><a href="member.html#benefits">會員優惠</a></li>\n' +
      '              </ul>\n' +
      '            </div>\n' +
      '          </div>\n' +
      '        </div>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '    <div class="footer-bottom">\n' +
      '      <div class="container">\n' +
      '        <p>&copy; 2024 紬 TSUMUGI. All rights reserved.</p>\n' +
      '        <div class="footer-legal">\n' +
      '          <a href="#">隱私權政策</a>\n' +
      '          <a href="#">服務條款</a>\n' +
      '        </div>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  </footer>\n';
  },

  /**
   * Initialize templates on the current page
   * Call this at the bottom of each page
   */
  init: function (pageName) {
    var headerSlot = document.getElementById('template-header');
    if (headerSlot) {
      headerSlot.innerHTML = this.header(pageName);
    }

    var footerSlot = document.getElementById('template-footer');
    if (footerSlot) {
      footerSlot.innerHTML = this.footer();
    }

    // Add back to top button
    this.addBackToTop();
  },

  /**
   * Add back to top button
   */
  addBackToTop: function () {
    var backToTopHTML = 
      '<button class="back-to-top" id="backToTop" aria-label="回到頂端">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<polyline points="18 15 12 9 6 15"></polyline>' +
        '</svg>' +
      '</button>';
    
    document.body.insertAdjacentHTML('beforeend', backToTopHTML);
    
    var backToTopBtn = document.getElementById('backToTop');
    
    window.addEventListener('scroll', function () {
      if (window.pageYOffset > 300) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });
    
    backToTopBtn.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
};
