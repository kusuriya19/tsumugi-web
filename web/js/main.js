/**
 * 紬 TSUMUGI — Brand Experience Website
 * Main JavaScript
 */

(function () {
  'use strict';

  // ============================================
  // DOM Ready
  // ============================================
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initHeader();
    initSearch();
    initMobileNav();
    initTabs();
    initScrollAnimations();
    initSmoothScroll();
    updateCartCount();
  }

  // ============================================
  // Header — Scroll Effect
  // ============================================
  function initHeader() {
    var header = document.getElementById('header');
    if (!header) return;

    var lastScroll = 0;
    var scrollThreshold = 50;

    function onScroll() {
      var currentScroll = window.pageYOffset || document.documentElement.scrollTop;

      if (currentScroll > scrollThreshold) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      lastScroll = currentScroll;
    }

    window.addEventListener('scroll', debounce(onScroll, 10), { passive: true });
    onScroll();
  }

  // ============================================
  // Search Bar Toggle
  // ============================================
  function initSearch() {
    var toggleBtn = document.getElementById('searchToggle');
    var searchBar = document.getElementById('searchBar');
    var closeBtn = document.getElementById('searchClose');
    var searchInput = searchBar ? searchBar.querySelector('input[type="search"]') : null;

    if (!toggleBtn || !searchBar) return;

    toggleBtn.addEventListener('click', function () {
      var isActive = searchBar.classList.contains('active');

      if (isActive) {
        searchBar.classList.remove('active');
      } else {
        searchBar.classList.add('active');
        if (searchInput) {
          setTimeout(function () {
            searchInput.focus();
          }, 300);
        }
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        searchBar.classList.remove('active');
      });
    }

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && searchBar.classList.contains('active')) {
        searchBar.classList.remove('active');
      }
    });
  }

  // ============================================
  // Mobile Navigation
  // ============================================
  function initMobileNav() {
    var menuToggle = document.getElementById('menuToggle');
    var overlay = document.getElementById('mobileNavOverlay');
    var mobileLinks = overlay ? overlay.querySelectorAll('a') : [];

    if (!menuToggle || !overlay) return;

    menuToggle.addEventListener('click', function () {
      var isActive = overlay.classList.contains('active');

      if (isActive) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      } else {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });

    // Close on link click
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // ============================================
  // Tabs (Brand Features)
  // ============================================
  function initTabs() {
    var tabBtns = document.querySelectorAll('.tab-btn');
    var panels = document.querySelectorAll('.tab-panel');

    if (!tabBtns.length || !panels.length) return;

    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetId = this.getAttribute('data-tab');
        var targetPanel = document.getElementById('panel-' + targetId);

        // Remove active from all
        tabBtns.forEach(function (b) {
          b.classList.remove('active');
        });
        panels.forEach(function (p) {
          p.classList.remove('active');
        });

        // Add active to clicked
        this.classList.add('active');
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  }

  // ============================================
  // Filters (Journal & Collections)
  // ============================================
  function initFilters() {
    // Journal filters (.filter-btn + .article-card)
    initJournalFilters();
    // Collections filters (.filter-tab + .product-card)
    initCollectionFilters();
  }

  function initJournalFilters() {
    var filterBtns = document.querySelectorAll('.filter-btn');
    var articles = document.querySelectorAll('.article-card');

    if (!filterBtns.length || !articles.length) return;

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var category = this.getAttribute('data-category');

        filterBtns.forEach(function (b) {
          b.classList.remove('active');
        });
        this.classList.add('active');

        articles.forEach(function (article) {
          var articleCategory = article.getAttribute('data-category');
          if (category === 'all' || articleCategory === category) {
            article.style.display = '';
          } else {
            article.style.display = 'none';
          }
        });
      });
    });
  }

  function initCollectionFilters() {
    var filterTabs = document.querySelectorAll('.filter-tab');
    var products = document.querySelectorAll('.product-card[data-category]');
    var noResults = document.getElementById('noResults');

    if (!filterTabs.length || !products.length) return;

    filterTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var filter = this.getAttribute('data-filter');

        filterTabs.forEach(function (t) {
          t.classList.remove('active');
        });
        this.classList.add('active');

        var visibleCount = 0;
        products.forEach(function (product) {
          var category = product.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            product.style.display = '';
            visibleCount++;
          } else {
            product.style.display = 'none';
          }
        });

        if (noResults) {
          noResults.style.display = visibleCount === 0 ? '' : 'none';
        }
      });
    });
  }

  // ============================================
  // Scroll Animations (Fade In)
  // ============================================
  function initScrollAnimations() {
    var elements = document.querySelectorAll(
      '.section-header, .feature-text, .feature-card, ' +
      '.collection-card, .gift-text, .gift-visual, ' +
      '.story-card, .cta-card, .story-header, ' +
      '.about-hero-content, .about-text, .about-visual, ' +
      '.about-cta-content, .about-feature-grid, ' +
      '.category-card, .product-card, .process-step, ' +
      '.article-card, .page-hero, .filter-bar, ' +
      '.product-grid-section, .pagination-section, ' +
      '.contact-form-wrap, .contact-info-wrap, ' +
      '.contact-social-section, .map-section, ' +
      '.product-gallery, .product-info, ' +
      '.page-title-section, .order-summary, ' +
      '.related-products, .product-tabs-section'
    );

    if (!elements.length) return;

    elements.forEach(function (el) {
      el.classList.add('fade-in');
    });

    function showIfVisible() {
      elements.forEach(function(el) {
        if (el.classList.contains('visible')) return;
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 80) {
          el.classList.add('visible');
        }
      });
    }

    showIfVisible();
    window.addEventListener('scroll', showIfVisible, { passive: true });
    setTimeout(showIfVisible, 200);
    setTimeout(showIfVisible, 500);
  }

  // ============================================
  // Smooth Scroll for Anchor Links
  // ============================================
  function initSmoothScroll() {
    var anchors = document.querySelectorAll('a[href^="#"]');

    anchors.forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var href = this.getAttribute('href');
        if (href === '#' || href === '#member' || href === '#wishlist' || href === '#cart') return;

        var target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        var headerHeight = document.querySelector('.site-header').offsetHeight || 72;
        var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      });
    });
  }

  // ============================================
  // Cart Count Update
  // ============================================
  function updateCartCount() {
    var cart = JSON.parse(localStorage.getItem('tsumugi_cart') || '[]');
    var totalItems = cart.reduce(function(sum, item) {
      return sum + item.quantity;
    }, 0);
    
    var cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) {
      cartCountEl.textContent = totalItems;
      cartCountEl.style.display = totalItems > 0 ? 'flex' : 'none';
    }
  }

  // Expose updateCartCount globally for use in other scripts
  window.TSUMUGI = window.TSUMUGI || {};
  window.TSUMUGI.updateCartCount = updateCartCount;

  // ============================================
  // Utilities
  // ============================================
  function debounce(func, wait) {
    var timeout;
    return function () {
      var context = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        func.apply(context, args);
      }, wait);
    };
  }

})();
