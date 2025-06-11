// PDF Viewer class with mobile and desktop support
// Handles PDF navigation, zoom, theme management, and touch gestures

import { PDFCache } from './pdf-cache.js';
import { ProgressTracker } from './progress-tracker.js';
import { PDFOperatorRenderer } from './pdf-renderer.js';
import { ReadingSession } from './reading-session.js';
import { PDFTableOfContents } from './pdf-toc.js';
import { PDFSearch } from './pdf-search.js';
import { ReadingPreferences } from './reading-preferences.js';
import { AdaptiveLayout } from './adaptive-layout.js';

export class PDFViewer {
  constructor() {
    this.pdfDoc = null;
    this.pageNum = 1;
    this.pageCount = 0;
    this.scale = 1.2;
    this.canvas = document.getElementById('pdfCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.pageRendering = false;
    this.pageNumPending = null;
    this.currentPDFId = null;
    this.currentPDFUrl = null;
    
    // Enhanced reading controls
    this.viewMode = 'page'; // 'page' or 'continuous'
    this.preferredViewMode = null; // Store preferred view mode from preferences
    this.fitMode = 'custom'; // 'width', 'height', 'page', 'custom'
    this.isSwitchingModes = false; // Track mode switching for smooth transitions
    
    // Touch gesture properties
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.initialDistance = 0;
    this.initialScale = 1.2;
    this.lastTap = 0;
    this.isZooming = false;
    this.isSwiping = false;
    
    // Theme management
    this.currentTheme = localStorage.getItem('pdf-reader-theme') || 'light';
    this.isFullscreen = false;
    
    // Initialize components
    this.cache = new PDFCache();
    this.textRenderer = new PDFOperatorRenderer();
    this.readingSession = null;
    this.tableOfContents = null;
    this.pdfSearch = null;
    this.preferences = null; // Will be initialized when PDF loads
    this.adaptiveLayout = null; // Adaptive layout system
    
    // UI elements
    this.loadingEl = document.getElementById('pdfLoading');
    this.errorEl = document.getElementById('pdfError');
    this.controlsEl = document.getElementById('readerControls');
    this.containerEl = document.getElementById('pdfContainer');
    this.pageInfoEl = document.getElementById('pageInfo');
    this.zoomLevelEl = document.getElementById('zoomLevel');
    // Legacy progress elements removed - using ReadingSession instead
    
    // Mobile UI elements
    this.mobileControlsEl = document.getElementById('mobileControls');
    this.mobilePageInfoEl = document.getElementById('mobilePageInfo');
    this.mobileZoomLevelEl = document.getElementById('mobileZoomLevel');
    this.mobileSettingsPanelEl = document.getElementById('mobileSettingsPanel');
    
    this.setupEventListeners();
    this.initializePreferences(); // Initialize with global preferences first
    this.initializeAdaptiveLayout(); // Initialize adaptive layout system
    this.detectMobile();
  }

  setupEventListeners() {
    // Navigation controls
    document.getElementById('prevPage')?.addEventListener('click', () => this.prevPage());
    document.getElementById('nextPage')?.addEventListener('click', () => this.nextPage());
    
    // Zoom controls
    document.getElementById('zoomIn')?.addEventListener('click', () => this.zoomIn());
    document.getElementById('zoomOut')?.addEventListener('click', () => this.zoomOut());
    document.getElementById('fitWidth')?.addEventListener('click', () => this.fitToWidth());
    
    // Enhanced reading controls
    document.getElementById('fitHeight')?.addEventListener('click', () => this.fitToHeight());
    document.getElementById('toggleViewMode')?.addEventListener('click', () => this.toggleViewMode());
    
    // Desktop theme and fullscreen controls
    const themeToggle = document.getElementById('themeToggle');
    const fullscreenToggle = document.getElementById('fullscreenToggle');
    const searchToggle = document.getElementById('searchToggle');
    
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.cycleTheme());
    }
    
    if (fullscreenToggle) {
      fullscreenToggle.addEventListener('click', () => this.toggleFullscreen());
    }
    
    if (searchToggle) {
      searchToggle.addEventListener('click', () => {
        if (this.pdfSearch) {
          this.pdfSearch.openSearch();
        }
      });
    }
    
    // Mobile controls
    document.getElementById('mobilePrevPage')?.addEventListener('click', () => this.prevPage());
    document.getElementById('mobileNextPage')?.addEventListener('click', () => this.nextPage());
    document.getElementById('mobileSettings')?.addEventListener('click', () => this.toggleMobileSettings());
    document.getElementById('mobileTheme')?.addEventListener('click', () => this.cycleTheme());
    document.getElementById('closeSettings')?.addEventListener('click', () => this.closeMobileSettings());
    document.getElementById('mobileFullscreen')?.addEventListener('click', () => this.toggleFullscreen());
    document.getElementById('mobileSearch')?.addEventListener('click', () => {
      if (this.pdfSearch) {
        this.pdfSearch.openSearch();
        this.closeMobileSettings(); // Close settings panel when opening search
      }
    });
    
    // Mobile zoom controls
    document.getElementById('mobileZoomIn')?.addEventListener('click', () => this.zoomIn());
    document.getElementById('mobileZoomOut')?.addEventListener('click', () => this.zoomOut());
    document.getElementById('mobileFitWidth')?.addEventListener('click', () => this.fitToWidth());
    
    // Mobile enhanced reading controls
    document.getElementById('mobileFitHeight')?.addEventListener('click', () => this.fitToHeight());
    document.getElementById('mobileViewMode')?.addEventListener('click', () => this.toggleViewMode());
    
    // Theme selection buttons
    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        this.setTheme(theme);
        this.updateThemeButtons();
      });
    });
    
    // Touch events for PDF canvas
    if (this.canvas) {
      this.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handleTouchStart(e);
      }, { passive: false });
      
      this.canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        this.handleTouchMove(e);
      }, { passive: false });
      
      this.canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.handleTouchEnd(e);
      }, { passive: false });
      
      // Double-tap to fit width
      this.canvas.addEventListener('click', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - this.lastTap;
        if (tapLength < 500 && tapLength > 0) {
          this.fitToWidth();
        }
        this.lastTap = currentTime;
      });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          this.prevPage();
          break;
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          this.nextPage();
          break;
        case '+':
        case '=':
          e.preventDefault();
          this.zoomIn();
          break;
        case '-':
          e.preventDefault();
          this.zoomOut();
          break;
        case '0':
          e.preventDefault();
          this.fitToWidth();
          break;
        case 'h':
          e.preventDefault();
          this.fitToHeight();
          break;
        case 'c':
          e.preventDefault();
          this.toggleViewMode();
          break;
        case 'f':
        case 'F11':
          e.preventDefault();
          this.toggleFullscreen();
          break;
        case 't':
          e.preventDefault();
          this.cycleTheme();
          break;
        case 'Escape':
          if (this.isFullscreen) {
            this.toggleFullscreen();
          }
          if (this.mobileSettingsPanelEl?.classList.contains('show')) {
            this.closeMobileSettings();
          }
          break;
      }
    });
    
    // Orientation change handler
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleOrientationChange();
      }, 100);
    });
    
    // Resize handler
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  // Touch gesture methods
  handleTouchStart(e) {
    if (e.touches.length === 2) {
      this.isZooming = true;
      this.initialDistance = this.calculateDistance(e.touches[0], e.touches[1]);
      this.initialScale = this.scale;
    } else if (e.touches.length === 1) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.isSwiping = false;
    }
  }

  handleTouchMove(e) {
    if (this.isZooming && e.touches.length === 2) {
      const currentDistance = this.calculateDistance(e.touches[0], e.touches[1]);
      const scaleChange = currentDistance / this.initialDistance;
      const newScale = this.initialScale * scaleChange;
      
      this.scale = Math.min(Math.max(newScale, 0.25), 5.0);
      this.fitMode = 'custom';
      
      // Use appropriate rendering method based on view mode
      if (this.viewMode === 'continuous') {
        this.updateViewAfterZoom();
      } else {
        this.renderPage(this.pageNum);
        this.updateZoomDisplay();
      }
      
    } else if (e.touches.length === 1 && !this.isZooming) {
      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = Math.abs(touchX - this.touchStartX);
      const deltaY = Math.abs(touchY - this.touchStartY);
      
      if (deltaX > 20 && deltaX > deltaY * 2) {
        this.isSwiping = true;
        this.touchEndX = touchX;
        this.touchEndY = touchY;
      }
    }
  }

  handleTouchEnd(e) {
    if (this.isZooming) {
      this.isZooming = false;
      this.initialDistance = 0;
      this.initialScale = this.scale;
    } else if (this.isSwiping) {
      const deltaX = this.touchEndX - this.touchStartX;
      const threshold = 50;
      
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          this.prevPage();
        } else {
          this.nextPage();
        }
      }
      
      this.isSwiping = false;
    }
    
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
  }

  calculateDistance(touch1, touch2) {
    const deltaX = touch1.clientX - touch2.clientX;
    const deltaY = touch1.clientY - touch2.clientY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  // Enhanced Preferences and theme management with system awareness
  initializePreferences(bookId = 'global') {
    this.preferences = new ReadingPreferences(bookId);
    
    // Load all preferences with smart defaults
    const prefs = this.preferences.loadPreferences();
    
    // Use context-aware theme if auto theme is enabled
    if (prefs.autoTheme) {
      const contextTheme = this.preferences.getContextAwareTheme();
      if (contextTheme !== prefs.theme) {
        prefs.theme = contextTheme;
        this.preferences.savePreference('theme', contextTheme);
        console.log('Applied context-aware theme:', contextTheme);
      }
    }
    
    // Apply loaded preferences
    this.applyPreferences(prefs);
    
    // Setup enhanced system theme listener with context awareness
    this.systemThemeCleanup = this.preferences.setupSystemThemeListener((newTheme) => {
      console.log('System theme change detected:', newTheme);
      this.setTheme(newTheme);
      this.updateThemeButtons();
    });
    
    // Setup time-based theme switching if enabled
    if (prefs.timeBasedTheme && prefs.autoTheme) {
      this.setupTimeBasedThemeWatcher();
    }
    
    console.log('Enhanced reading preferences initialized for book:', bookId, prefs);
  }

  /**
   * Setup time-based theme watching for enhanced auto theme switching
   */
  setupTimeBasedThemeWatcher() {
    // Check for theme changes every 5 minutes
    this.timeBasedThemeInterval = setInterval(() => {
      const currentPrefs = this.preferences.loadPreferences();
      if (currentPrefs.autoTheme && currentPrefs.timeBasedTheme) {
        const contextTheme = this.preferences.getContextAwareTheme();
        const currentTheme = this.getTheme();
        
        if (contextTheme !== currentTheme) {
          console.log('Time-based theme switching to:', contextTheme);
          this.setTheme(contextTheme);
          this.updateThemeButtons();
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Get current theme
   */
  getTheme() {
    return this.currentTheme || 'light';
  }

  // Adaptive Layout System
  initializeAdaptiveLayout() {
    this.adaptiveLayout = new AdaptiveLayout();
    
    // Subscribe to layout changes
    this.adaptiveLayout.onBreakpointChange((oldBreakpoint, newBreakpoint) => {
      console.log('PDF Viewer - Breakpoint changed:', oldBreakpoint, '->', newBreakpoint);
      this.handleBreakpointChange(newBreakpoint);
    });
    
    this.adaptiveLayout.onOrientationChange((oldOrientation, newOrientation) => {
      console.log('PDF Viewer - Orientation changed:', oldOrientation, '->', newOrientation);
      this.handleOrientationChange(newOrientation);
    });
    
    this.adaptiveLayout.onResize((state) => {
      // Re-render current page if PDF is loaded
      if (this.pdfDoc && this.pageNum) {
        this.renderPage(this.pageNum);
      }
    });
    
    console.log('Adaptive layout initialized');
  }
  
  handleBreakpointChange(newBreakpoint) {
    // Update mobile detection
    this.isMobile = this.adaptiveLayout.isMobile();
    
    // Apply breakpoint-specific optimizations
    if (this.adaptiveLayout.isMobile()) {
      this.showMobileControls();
      this.hidePDFControls();
    } else {
      this.hideMobileControls();
      this.showPDFControls();
    }
    
    // Re-render current page to adapt to new layout
    if (this.pdfDoc && this.pageNum) {
      setTimeout(() => {
        this.renderPage(this.pageNum);
      }, 300); // Wait for layout transition to complete
    }
  }
  
  handleOrientationChange(newOrientation) {
    // Apply orientation-specific optimizations
    if (this.adaptiveLayout.isMobile() || this.adaptiveLayout.isTablet()) {
      // Adjust zoom for better readability in different orientations
      if (newOrientation === 'landscape') {
        // In landscape, fit to height might be better
        if (this.fitMode === 'width') {
          this.fitToHeight();
        }
      } else {
        // In portrait, fit to width is usually better
        if (this.fitMode === 'height') {
          this.fitToWidth();
        }
      }
    }
    
    // Re-render current page
    if (this.pdfDoc && this.pageNum) {
      setTimeout(() => {
        this.renderPage(this.pageNum);
      }, 300);
    }
  }
  
  showPDFControls() {
    const controls = document.querySelector('.reader-controls');
    if (controls) {
      controls.style.display = 'flex';
    }
  }
  
  hidePDFControls() {
    const controls = document.querySelector('.reader-controls');
    if (controls) {
      controls.style.display = 'none';
    }
  }

  applyPreferences(prefs) {
    try {
      // Apply theme
      this.setTheme(prefs.theme || 'light');
      
      // Apply zoom and fit preferences
      this.scale = prefs.zoom || 1.2;
      this.fitMode = prefs.fitMode || 'custom';
      
      // Store the preferred view mode but don't apply it yet
      this.preferredViewMode = prefs.viewMode || 'page';
      
      // Update UI to reflect loaded preferences
      this.updateThemeButtons();
      this.updateZoomDisplay();
      
      console.log('Applied reading preferences:', prefs);
    } catch (e) {
      console.warn('Could not apply all preferences:', e);
    }
  }

  setTheme(theme) {
    const validThemes = ['light', 'dark'];
    if (!validThemes.includes(theme)) {
      theme = 'light';
    }
    
    const previousTheme = this.currentTheme;
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    
    // Save to preferences system if available
    if (this.preferences) {
      this.preferences.savePreference('theme', theme, true); // Save globally
    } else {
      // Fallback to old localStorage method
      localStorage.setItem('pdf-reader-theme', theme);
    }
    
    this.updateThemeIcons();
  }

  cycleTheme() {
    const themes = ['light', 'dark'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const previousTheme = this.currentTheme;
    
    this.setTheme(themes[nextIndex]);
    this.updateThemeButtons();

    // 💡 Clear cache and re-render pages instantly so the theme change is visible immediately
    if (this.pdfDoc) {
      
      if (this.viewMode === 'page') {
        // Force re-render current page by bypassing cache
        this.renderPage(this.pageNum);
      } else if (this.viewMode === 'continuous' && this.virtualScrolling) {
        // Re-render all visible pages in continuous mode
        this.virtualScrolling.renderedPages.forEach((pageData, pageNum) => {
          if (pageData && pageData.canvas) {
            // Mark as not rendered to force fresh render with new theme
            pageData.rendered = false;
            this.renderPageToVirtualCanvas(pageNum, pageData.canvas);
          }
        });
      }
    }
  }


  updateThemeButtons() {
    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === this.currentTheme);
    });
  }

  updateThemeIcons() {
    const themeToggle = document.getElementById('themeToggle');
    const mobileTheme = document.getElementById('mobileTheme');
    
    let iconSvg = '';
    if (this.currentTheme === 'dark') {
      iconSvg = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    } else {
      iconSvg = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    }
    
    if (themeToggle) {
      const svg = themeToggle.querySelector('svg');
      if (svg) svg.innerHTML = iconSvg;
    }
    
    if (mobileTheme) {
      const svg = mobileTheme.querySelector('svg');
      if (svg) svg.innerHTML = iconSvg;
    }
  }

  // Mobile UI methods
  detectMobile() {
    const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      this.showMobileControls();
    } else {
      this.hideMobileControls();
    }
  }

  showMobileControls() {
    if (this.mobileControlsEl) {
      this.mobileControlsEl.style.display = 'block';
    }
    if (this.controlsEl) {
      this.controlsEl.style.display = 'none';
    }
  }

  hideMobileControls() {
    if (this.mobileControlsEl) {
      this.mobileControlsEl.style.display = 'none';
    }
    if (this.controlsEl) {
      this.controlsEl.style.display = 'flex';
    }
  }

  toggleMobileSettings() {
    if (this.mobileSettingsPanelEl) {
      this.mobileSettingsPanelEl.classList.toggle('show');
    }
  }

  closeMobileSettings() {
    if (this.mobileSettingsPanelEl) {
      this.mobileSettingsPanelEl.classList.remove('show');
    }
  }

  // Fullscreen methods
  toggleFullscreen() {
    if (!this.isFullscreen) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
  }

  enterFullscreen() {
    const element = document.documentElement;
    
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
    
    document.body.classList.add('fullscreen-mode');
    this.isFullscreen = true;
  }

  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    
    document.body.classList.remove('fullscreen-mode');
    this.isFullscreen = false;
  }

  // Orientation and resize handlers
  handleOrientationChange() {
    setTimeout(() => {
      this.detectMobile();
      if (this.pdfDoc) {
        this.renderPage(this.pageNum);
      }
    }, 300);
  }

  handleResize() {
    this.detectMobile();
    if (this.pdfDoc) {
      this.renderPage(this.pageNum);
    }
  }

  // UI update methods
  updateUI() {
    // Check if ReadingSession has transformed the pageInfo element
    const hasProgressBar = document.getElementById('currentPageDisplay');
    
    if (this.pageInfoEl && !hasProgressBar) {
      // Only update if ReadingSession hasn't transformed it
      this.pageInfoEl.textContent = `Página: ${this.pageNum} de ${this.pageCount}`;
    }
    
    if (this.mobilePageInfoEl) {
      this.mobilePageInfoEl.textContent = `${this.pageNum}/${this.pageCount}`;
    }
    
    this.updateZoomDisplay();
    this.updateProgress();
    this.updateNavigationButtons();
    
    // Update TOC current page indicator
    if (this.tableOfContents) {
      this.tableOfContents.updateCurrentPage(this.pageNum);
    }
  }

  updateZoomDisplay() {
    let displayText;
    
    // Determine display text based on fit mode and scale
    switch (this.fitMode) {
      case 'width':
        displayText = 'Ajustar Largura';
        break;
      case 'height':
        displayText = 'Ajustar Altura';
        break;
      default:
        const zoomPercent = Math.round(this.scale * 100);
        displayText = this.scale === 'fit-width' ? 'Ajustar' : `${zoomPercent}%`;
    }
    
    const zoomLevelEl = document.getElementById('zoomLevel');
    const mobileZoomLevelEl = document.getElementById('mobileZoomLevel');
    
    if (zoomLevelEl) zoomLevelEl.textContent = displayText;
    if (mobileZoomLevelEl) mobileZoomLevelEl.textContent = displayText;
    
    // Save zoom preference for this view mode
    this.saveZoomPreference();
  }
  
  // Save and restore zoom preferences per view mode
  saveZoomPreference() {
    try {
      const prefKey = `zoom_${this.viewMode}_${this.extractBookId(this.currentPDFUrl || 'default')}`;
      const zoomData = {
        scale: this.scale,
        fitMode: this.fitMode,
        timestamp: Date.now()
      };
      localStorage.setItem(prefKey, JSON.stringify(zoomData));
    } catch (e) {
      console.log('Could not save zoom preference:', e);
    }
  }
  
  loadZoomPreference() {
    try {
      const prefKey = `zoom_${this.viewMode}_${this.extractBookId(this.currentPDFUrl || 'default')}`;
      const saved = localStorage.getItem(prefKey);
      
      if (saved) {
        const zoomData = JSON.parse(saved);
        
        // Only restore if preference is less than 24 hours old
        if (Date.now() - zoomData.timestamp < 24 * 60 * 60 * 1000) {
          this.scale = zoomData.scale || 1;
          this.fitMode = zoomData.fitMode || 'custom';
          return true;
        }
      }
    } catch (e) {
      console.log('Could not parse zoom preference:', e);
    }
    
    return false;
  }

  updateProgress() {
    if (this.pageCount > 0) {
      // Update reading session progress only
      if (this.readingSession) {
        this.readingSession.updateProgress(this.pageNum, this.pageCount);
      }
    }
  }

  updateNavigationButtons() {
    const prevButtons = [document.getElementById('prevPage'), document.getElementById('mobilePrevPage')];
    const nextButtons = [document.getElementById('nextPage'), document.getElementById('mobileNextPage')];
    
    prevButtons.forEach(btn => {
      if (btn) {
        btn.disabled = this.pageNum <= 1;
      }
    });
    
    nextButtons.forEach(btn => {
      if (btn) {
        btn.disabled = this.pageNum >= this.pageCount;
      }
    });
  }

  async loadPDF(url) {
    try {
      this.showLoading();
      
      const progressTracker = new ProgressTracker(this.loadingEl);
      
      if (!url || typeof url !== 'string') {
        throw new Error(`Invalid PDF URL: ${url}`);
      }
      this.currentPDFUrl = url;
      this.currentPDFId = this.cache.generatePDFId(url);
      
      // Log the PDF URL for debugging/tracking purposes
      console.log('PDF Reader - Currently open book URL:', this.currentPDFUrl);
      
      if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      } else {
        throw new Error('PDF.js library not available');
      }

      // Check cache first
      const cachedPDF = await this.cache.getCachedPDF(url);
      let pdfData;
      
      if (cachedPDF) {
        progressTracker.updateProgress(cachedPDF.size, cachedPDF.size, true);
        pdfData = cachedPDF.data;
        this.showCacheIndicator(true);
      } else {
        // Test if URL is accessible
        const testResponse = await fetch(url, { method: 'HEAD' });
        if (!testResponse.ok) {
          throw new Error(`PDF file not accessible: ${testResponse.status} ${testResponse.statusText}`);
        }

        // Download with progress tracking
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to download PDF: ${response.status}`);
        }

        const contentLength = parseInt(response.headers.get('content-length') || '0');
        const reader = response.body.getReader();
        const chunks = [];
        let receivedLength = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          receivedLength += value.length;
          progressTracker.updateProgress(receivedLength, contentLength || receivedLength);
        }

        const allChunks = new Uint8Array(receivedLength);
        let position = 0;
        for (const chunk of chunks) {
          allChunks.set(chunk, position);
          position += chunk.length;
        }
        
        pdfData = allChunks.buffer;
        
        await this.cache.cachePDF(url, pdfData, {
          title: document.getElementById("tituloLivro")?.textContent,
          author: document.getElementById("autorLivro")?.textContent
        });
        
        this.showCacheIndicator(false, 2000);
      }

      progressTracker.complete();

      const loadingTask = pdfjsLib.getDocument({
        data: pdfData,
        verbosity: 0
      });

      this.pdfDoc = await loadingTask.promise;
      this.pageCount = this.pdfDoc.numPages;
      
      // Handle URL-based page navigation early (from "Continue Reading" buttons)
      // This eliminates the delay by setting the target page before initial render
      if (window.targetPage) {
        console.log('Setting initial page from URL target:', window.targetPage);
        if (window.targetPage >= 1 && window.targetPage <= this.pageCount) {
          this.pageNum = window.targetPage;
        }
        // Clear the target page
        delete window.targetPage;
      }
      
      // Initialize Table of Contents
      this.tableOfContents = new PDFTableOfContents(this.pdfDoc, this);
      
      // Initialize PDFSearch
      this.pdfSearch = new PDFSearch(this.pdfDoc, this);
      
      await this.renderPage(this.pageNum);
      this.updateUI();
      this.showPDF();
      
      // Initialize book-specific preferences
      const bookId = this.extractBookId(url);
      if (bookId) {
        this.initializePreferences(bookId);
        
        // Apply preferred view mode after PDF is loaded
        if (this.preferredViewMode && this.preferredViewMode !== this.viewMode) {
          console.log(`PDF Viewer - Applying preferred view mode: ${this.preferredViewMode}`);
          this.viewMode = this.preferredViewMode;
          
          // Actually switch to the preferred view mode
          if (this.preferredViewMode === 'continuous') {
            this.enableContinuousMode();
          } else {
            this.enablePageMode();
          }
        }
        
        // Update view mode UI to reflect the current state
        this.updateViewModeUI();
      }
      
      // Initialize reading session AFTER showing PDF controls
      const userId = await this.getUserId();
      if (bookId && userId) {
        // Import the database-backed reading session
        const { ReadingSessionDB } = await import('./reading-session-db.js');
        this.readingSession = new ReadingSessionDB(bookId, userId);
        // Update progress immediately after initialization
        await this.readingSession.init();
        this.readingSession.updateProgress(this.pageNum, this.pageCount);
        
        // Note: URL-based navigation now happens earlier in the process
        // No delay as the page is already set before rendering
      }
      
    } catch (error) {
      console.error('Error loading PDF:', error);
      this.showError();
    }
  }

  async renderPage(num) {
    if (this.pageRendering) {
      this.pageNumPending = num;
      return;
    }
    
    this.pageRendering = true;
    
    try {
      // Always use light theme for page 1 to avoid mask reversion issues
      const effectiveTheme = (num === 1) ? 'light' : this.currentTheme;
      
      const cachedImage = this.cache.getCachedPage(this.currentPDFId, num, this.scale, effectiveTheme);
      
      if (cachedImage) {
        this.ctx.putImageData(cachedImage, 0, 0);
        this.pageRendering = false;
        
        if (this.pageNumPending !== null) {
          const pending = this.pageNumPending;
          this.pageNumPending = null;
          await this.renderPage(pending);
        }
        
        this.pageNum = num;
        this.updateUI();
        return;
      }
      
      const page = await this.pdfDoc.getPage(num);
      
      const containerWidth = this.containerEl.clientWidth - 40;
      const viewport = page.getViewport({ scale: 1 });
      
      if (this.scale === 'fit-width') {
        this.scale = containerWidth / viewport.width;
      }
      
      const finalViewport = page.getViewport({ scale: this.scale });
      this.canvas.height = finalViewport.height;
      this.canvas.width = finalViewport.width;
      
      const imageRegions = await this.textRenderer.analyzeAndRenderPage(
        page, 
        this.canvas, 
        finalViewport, 
        effectiveTheme
      );
      
      // Cache the rendered page with theme information
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      this.cache.cacheRenderedPage(this.currentPDFId, num, imageData, this.scale, effectiveTheme);
      
      this.pageRendering = false;
      
      if (this.pageNumPending !== null) {
        const pending = this.pageNumPending;
        this.pageNumPending = null;
        await this.renderPage(pending);
      }
      
      this.pageNum = num;
      this.updateUI();
      
      this.preloadNextPage();
      
    } catch (error) {
      console.error('Error rendering page:', error);
      this.pageRendering = false;
    }
  }

  async preloadNextPage() {
    if (this.pageNum < this.pageCount) {
      const nextPageNum = this.pageNum + 1;
      
      // Use light theme for page 1, otherwise use current theme
      const effectiveTheme = (nextPageNum === 1) ? 'light' : this.currentTheme;
      
      const cachedNext = this.cache.getCachedPage(this.currentPDFId, nextPageNum, this.scale, effectiveTheme);
      if (!cachedNext) {
        setTimeout(async () => {
          try {
            const page = await this.pdfDoc.getPage(nextPageNum);
            const viewport = page.getViewport({ scale: this.scale });
            
            const preloadCanvas = document.createElement('canvas');
            const preloadCtx = preloadCanvas.getContext('2d');
            preloadCanvas.height = viewport.height;
            preloadCanvas.width = viewport.width;
            
            if (effectiveTheme === 'light') {
              // Standard rendering for light theme (including page 1)
              await page.render({
                canvasContext: preloadCtx,
                viewport: viewport
              }).promise;
            } else {
              // Use theme renderer for dark theme (but not page 1)
              await this.textRenderer.analyzeAndRenderPage(
                page, 
                preloadCanvas, 
                viewport, 
                effectiveTheme
              );
            }
            
            const imageData = preloadCtx.getImageData(0, 0, preloadCanvas.width, preloadCanvas.height);
            this.cache.cacheRenderedPage(this.currentPDFId, nextPageNum, imageData, this.scale, effectiveTheme);
          } catch (error) {
            // Silently fail preload
          }
        }, 500);
      }
    }
  }

  showLoading() {
    this.loadingEl.style.display = 'flex';
    this.errorEl.style.display = 'none';
    this.controlsEl.style.display = 'none';
    this.containerEl.style.display = 'none';
  }

  showError() {
    this.loadingEl.style.display = 'none';
    this.errorEl.style.display = 'flex';
    this.controlsEl.style.display = 'none';
    this.containerEl.style.display = 'none';
  }

  showPDF() {
    this.loadingEl.style.display = 'none';
    this.errorEl.style.display = 'none';
    this.containerEl.style.display = 'flex';
    
    this.detectMobile();
  }

  showCacheIndicator(fromCache = false, duration = 3000) {
    const indicator = document.getElementById('cacheIndicator');
    if (!indicator) return;
    
    indicator.textContent = fromCache ? '📁 Carregado do Cache' : '💾 Salvo no Cache';
    indicator.className = `cache-indicator show ${fromCache ? 'from-cache' : ''}`;
    
    setTimeout(() => {
      indicator.classList.remove('show');
    }, duration);
  }

  // Navigation methods
  prevPage() {
    if (this.pageNum <= 1) return;
    
    const targetPage = this.pageNum - 1;
    
    if (this.viewMode === 'continuous') {
      // In continuous mode, scroll to the previous page
      this.scrollToPageInContinuousMode(targetPage);
    } else {
      // In page mode, render the previous page
      this.renderPage(targetPage);
    }
  }

  nextPage() {
    if (this.pageNum >= this.pageCount) return;
    
    const targetPage = this.pageNum + 1;
    
    if (this.viewMode === 'continuous') {
      // In continuous mode, scroll to the next page
      this.scrollToPageInContinuousMode(targetPage);
    } else {
      // In page mode, render the next page
      this.renderPage(targetPage);
    }
  }

  // Zoom methods
  zoomIn() {
    this.scale = Math.min(this.scale * 1.25, 5);
    this.fitMode = 'custom';
    this.updateViewAfterZoom();
  }

  zoomOut() {
    this.scale = Math.max(this.scale * 0.8, 0.25);
    this.fitMode = 'custom';
    this.updateViewAfterZoom();
  }

  fitToWidth() {
    this.fitMode = 'width';
    this.scale = 'fit-width';
    this.updateViewAfterZoom();
  }

  updateViewAfterZoom() {
    // Update zoom display immediately for better responsiveness
    this.updateZoomDisplay();
    
    // Save preferences when zoom changes
    this.savePreferences();
    
    if (this.viewMode === 'continuous' && this.virtualScrolling) {
      // Store current page and scroll information for precise restoration
      const currentPage = this.pageNum;
      const scrollTop = this.containerEl.scrollTop;
      const pageHeight = this.virtualScrolling.pageHeight;
      
      // Calculate the current page's relative scroll position
      const pageStart = (currentPage - 1) * pageHeight;
      const relativePageOffset = scrollTop - pageStart;
      const relativePagePercent = relativePageOffset / pageHeight;
      
      // Re-render continuous view with new scale
      this.renderContinuousView().then(() => {
        // Restore position more precisely based on current page
        setTimeout(() => {
          const newPageHeight = this.virtualScrolling.pageHeight;
          const newPageStart = (currentPage - 1) * newPageHeight;
          const newScrollTop = newPageStart + (relativePagePercent * newPageHeight);
          
          this.containerEl.scrollTop = Math.max(0, newScrollTop);
          
          // Ensure current page is updated
          this.pageNum = currentPage;
          this.updateUI();
        }, 150);
      });
    } else {
      // Standard page mode rendering
      this.renderPage(this.pageNum);
    }
  }

  savePreferences() {
    if (this.preferences) {
      this.preferences.savePreferences({
        zoom: this.scale,
        fitMode: this.fitMode,
        viewMode: this.viewMode
      });
    }
  }

  // Enhanced reading controls
  fitToHeight() {
    if (!this.pdfDoc || !this.containerEl) return;
    
    this.fitMode = 'height';
    
    // Calculate scale to fit page height to container
    this.pdfDoc.getPage(this.pageNum).then(page => {
      const viewport = page.getViewport({ scale: 1 });
      
      // Use different height calculation based on view mode
      let containerHeight;
      if (this.viewMode === 'continuous') {
        // In continuous mode, use full container height
        containerHeight = this.containerEl.clientHeight - 60; // Account for scrollbar and padding
      } else {
        // In page mode, account for controls
        containerHeight = this.containerEl.clientHeight - 40;
      }
      
      const calculatedScale = containerHeight / viewport.height;
      this.scale = Math.min(Math.max(calculatedScale, 0.25), 5);
      this.updateViewAfterZoom();
    });
  }

  toggleViewMode() {
    const previousMode = this.viewMode;
    this.viewMode = this.viewMode === 'page' ? 'continuous' : 'page';
    
    console.log(`PDF Viewer - Switching view mode from ${previousMode} to ${this.viewMode}`);
    
    try {
      if (this.viewMode === 'continuous') {
        this.enableContinuousMode();
      } else {
        this.enablePageMode();
      }
      
      this.updateViewModeUI();
      this.savePreferences(); // Save view mode preference
    } catch (error) {
      console.error('Error switching view mode:', error);
      // Revert to previous mode on error
      this.viewMode = previousMode;
      this.updateViewModeUI();
    }
  }

  enableContinuousMode() {
    console.log('PDF Viewer - Enabling continuous mode');
    
    // Mark that we're switching modes
    this.isSwitchingModes = true;
    
    // Store current page before switching to preserve position
    const currentPageBeforeSwitch = this.pageNum;
    
    // Load zoom preference for continuous mode
    this.loadZoomPreference();
    
    // Set up continuous scrolling container
    this.containerEl.style.overflowY = 'auto';
    this.containerEl.style.overflowX = 'hidden';
    this.containerEl.style.scrollBehavior = 'smooth';
    this.containerEl.classList.add('continuous-mode');
    
    // Store current canvas reference for later restoration
    this.originalCanvas = this.canvas;
    this.originalCtx = this.ctx;
    
    // Render all pages in continuous view and then scroll to current page
    this.renderContinuousView().then(() => {
      // Scroll to the current page position after rendering is complete
      this.scrollToPageInContinuousMode(currentPageBeforeSwitch);
      
      // Reset mode switching flag after a brief delay
      setTimeout(() => {
        this.isSwitchingModes = false;
      }, 300);
    });
  }

  enablePageMode() {
    console.log('PDF Viewer - Enabling page mode');
    
    // Mark that we're switching modes
    this.isSwitchingModes = true;
    
    // Store the current page from continuous mode before cleanup
    const currentPageFromContinuous = this.pageNum;
    
    // Load zoom preference for page mode
    this.loadZoomPreference();
    
    // Clean up virtual scrolling if it exists
    if (this.virtualScrolling && this.virtualScrolling.cleanup) {
      this.virtualScrolling.cleanup();
      this.virtualScrolling = null;
    }
    
    // Disconnect page observer if it exists (legacy)
    if (this.pageObserver) {
      this.pageObserver.disconnect();
      this.pageObserver = null;
    }
    
    // Reset to single page view
    this.containerEl.style.overflowY = 'auto';
    this.containerEl.style.overflowX = 'auto';
    this.containerEl.style.scrollBehavior = 'auto';
    this.containerEl.classList.remove('continuous-mode');
    
    // Clear any existing continuous view and render current page
    this.containerEl.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.id = 'pdfCanvas';
    this.containerEl.appendChild(canvas);
    
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Ensure we render the correct page that was visible in continuous mode
    this.pageNum = currentPageFromContinuous;
    
    console.log(`PDF Viewer - Rendering page ${this.pageNum} in page mode`);
    this.renderPage(this.pageNum).then(() => {
      // Reset mode switching flag after rendering is complete
      setTimeout(() => {
        this.isSwitchingModes = false;
      }, 100);
    });
  }

  async renderContinuousView() {
    if (!this.pdfDoc) return;
    
    console.log('PDF Viewer - Rendering continuous view with virtual scrolling for', this.pageCount, 'pages');
    
    // Clear container
    this.containerEl.innerHTML = '';
    
    // Initialize virtual scrolling properties
    this.virtualScrolling = {
      renderBuffer: 2, // Number of pages to render before/after visible area
      pageHeight: 800, // Estimated page height (will be updated)
      visiblePages: new Set(),
      renderedPages: new Map(),
      totalHeight: 0,
      containerHeight: 0,
      scrollTop: 0
    };
    
    // Calculate effective scale for all pages
    let effectiveScale = this.scale;
    if (this.scale === 'fit-width' || this.fitMode === 'width') {
      const firstPage = await this.pdfDoc.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1 });
      const containerWidth = this.containerEl.clientWidth - 80;
      effectiveScale = Math.min(containerWidth / viewport.width, 3.0);
    }
    
    // Calculate accurate page height based on first page
    const firstPage = await this.pdfDoc.getPage(1);
    const firstViewport = firstPage.getViewport({ scale: effectiveScale });
    this.virtualScrolling.pageHeight = firstViewport.height + 30; // Add gap
    this.virtualScrolling.totalHeight = this.virtualScrolling.pageHeight * this.pageCount;
    
    // Create virtual scroll container
    const virtualContainer = document.createElement('div');
    virtualContainer.className = 'virtual-scroll-container';
    virtualContainer.style.cssText = `
      position: relative;
      width: 100%;
      height: ${this.virtualScrolling.totalHeight}px;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      box-sizing: border-box;
    `;
    
    // Create viewport for rendered pages
    const viewport = document.createElement('div');
    viewport.className = 'virtual-viewport';
    viewport.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      pointer-events: none;
    `;
    
    virtualContainer.appendChild(viewport);
    this.containerEl.appendChild(virtualContainer);
    
    // Store references
    this.virtualScrolling.container = virtualContainer;
    this.virtualScrolling.viewport = viewport;
    this.virtualScrolling.effectiveScale = effectiveScale;
    
    // Set up virtual scroll event listener
    this.setupVirtualScrolling();
    
    // Initial render of visible pages
    this.updateVirtualScrolling();
    
    console.log('PDF Viewer - Virtual continuous view setup complete');
    
    // Return a promise for the zoom restoration
    return Promise.resolve();
  }

  setupVirtualScrolling() {
    // Throttled scroll handler for better performance
    let scrollTimeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.updateVirtualScrolling();
      }, 16); // ~60fps
    };
    
    this.containerEl.addEventListener('scroll', handleScroll);
    
    // Store cleanup function
    this.virtualScrolling.cleanup = () => {
      this.containerEl.removeEventListener('scroll', handleScroll);
    };
  }

  updateVirtualScrolling() {
    if (!this.virtualScrolling || !this.virtualScrolling.container || !this.pdfDoc) return;
    
    const containerRect = this.containerEl.getBoundingClientRect();
    const scrollTop = this.containerEl.scrollTop;
    const containerHeight = this.containerEl.clientHeight;
    
    // Calculate which pages should be visible
    const startPage = Math.max(1, Math.floor(scrollTop / this.virtualScrolling.pageHeight) + 1);
    const endPage = Math.min(this.pageCount, Math.ceil((scrollTop + containerHeight) / this.virtualScrolling.pageHeight) + 1);
    
    // Add buffer pages
    const bufferStart = Math.max(1, startPage - this.virtualScrolling.renderBuffer);
    const bufferEnd = Math.min(this.pageCount, endPage + this.virtualScrolling.renderBuffer);
    
    // Update current page based on most visible page in viewport
    // Use the page that occupies the most space in the top 1/3 of the viewport
    const detectionY = scrollTop + containerHeight * 0.33;
    const detectedPage = Math.min(this.pageCount, Math.max(1, Math.floor(detectionY / this.virtualScrolling.pageHeight) + 1));
    
    if (detectedPage !== this.pageNum) {
      this.pageNum = detectedPage;
      this.updateUI();
      
      // Update reading session if available
      if (this.readingSession) {
        this.readingSession.updateProgress(this.pageNum, this.pageCount);
      }
    }
    
    // Determine which pages need to be rendered or removed
    const newVisiblePages = new Set();
    for (let pageNum = bufferStart; pageNum <= bufferEnd; pageNum++) {
      newVisiblePages.add(pageNum);
    }
    
    // Remove pages that are no longer visible
    for (const pageNum of this.virtualScrolling.visiblePages) {
      if (!newVisiblePages.has(pageNum)) {
        this.removeVirtualPage(pageNum);
      }
    }
    
    // Add new visible pages
    for (const pageNum of newVisiblePages) {
      if (!this.virtualScrolling.visiblePages.has(pageNum)) {
        this.addVirtualPage(pageNum);
      }
    }
    
    this.virtualScrolling.visiblePages = newVisiblePages;
  }

  async addVirtualPage(pageNum) {
    if (!this.virtualScrolling || this.virtualScrolling.renderedPages.has(pageNum)) return;
    
    try {
      // Create page container
      const pageContainer = document.createElement('div');
      pageContainer.className = 'virtual-page-container';
      pageContainer.dataset.page = pageNum;
      
      const yPosition = (pageNum - 1) * this.virtualScrolling.pageHeight;
      pageContainer.style.cssText = `
        position: absolute;
        top: ${yPosition}px;
        left: 50%;
        transform: translateX(-50%);
        pointer-events: auto;
        margin-bottom: 10px;
      `;
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.style.cssText = `
        box-shadow: 0 4px 12px var(--shadow-strong);
        border-radius: 4px;
        background-color: var(--canvas-bg);
        transition: all 0.3s ease;
        max-width: 100%;
        height: auto;
      `;
      
      // Add page number label
      const pageLabel = document.createElement('div');
      pageLabel.style.cssText = `
        position: absolute;
        top: -25px;
        left: 0;
        font-size: 0.85rem;
        color: var(--text-secondary);
        font-weight: 500;
        pointer-events: none;
      `;
      pageLabel.textContent = `Página ${pageNum}`;
      
      pageContainer.appendChild(pageLabel);
      pageContainer.appendChild(canvas);
      this.virtualScrolling.viewport.appendChild(pageContainer);
      
      // Store reference
      this.virtualScrolling.renderedPages.set(pageNum, {
        container: pageContainer,
        canvas: canvas,
        rendered: false
      });
      
      // Render page asynchronously
      await this.renderPageToVirtualCanvas(pageNum, canvas);
      
    } catch (error) {
      console.error(`Error adding virtual page ${pageNum}:`, error);
    }
  }

  removeVirtualPage(pageNum) {
    if (!this.virtualScrolling) return;
    
    const pageData = this.virtualScrolling.renderedPages.get(pageNum);
    if (pageData && pageData.container) {
      pageData.container.remove();
      this.virtualScrolling.renderedPages.delete(pageNum);
    }
  }

  async renderPageToVirtualCanvas(pageNum, canvas) {
    try {
      const pageData = this.virtualScrolling.renderedPages.get(pageNum);
      if (!pageData || pageData.rendered) return;
      
      const page = await this.pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: this.virtualScrolling.effectiveScale });
      
      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Get canvas context
      const ctx = canvas.getContext('2d');
      
      // Use theme-aware rendering (but always light theme for page 1)
      const effectiveTheme = (pageNum === 1) ? 'light' : this.currentTheme;
      
      if (effectiveTheme === 'light') {
        // Standard rendering for light theme
        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise;
      } else {
        // Use theme renderer for dark theme
        await this.textRenderer.analyzeAndRenderPage(
          page, 
          canvas, 
          viewport, 
          effectiveTheme
        );
      }
      
      // Cache the rendered page with theme information
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      this.cache.cacheRenderedPage(this.currentPDFId, pageNum, imageData, this.virtualScrolling.effectiveScale, effectiveTheme);
      
      // Mark as rendered
      pageData.rendered = true;
      
      console.log(`PDF Viewer - Rendered virtual page ${pageNum} with theme ${effectiveTheme}`);
      
    } catch (error) {
      console.error(`Error rendering virtual page ${pageNum}:`, error);
      
      // Show error placeholder
      const ctx = canvas.getContext('2d');
      canvas.width = 400;
      canvas.height = 200;
      
      ctx.fillStyle = 'var(--bg-tertiary)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = 'var(--text-secondary)';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Erro ao carregar página ${pageNum}`, canvas.width / 2, canvas.height / 2);
    }
  }

  updateViewModeUI() {
    const viewModeBtn = document.getElementById('toggleViewMode');
    const mobileViewModeBtn = document.getElementById('mobileViewMode');
    
    const text = this.viewMode === 'continuous' ? '📃 Contínuo' : '📄 Página';
    const title = this.viewMode === 'continuous' ? 'Alternar para modo página' : 'Alternar para modo contínuo';
    
    if (viewModeBtn) {
      viewModeBtn.textContent = text;
      viewModeBtn.title = title;
    }
    if (mobileViewModeBtn) {
      mobileViewModeBtn.textContent = text;
      mobileViewModeBtn.title = title;
    }
    
    console.log(`PDF Viewer - View mode updated to: ${this.viewMode}`);
  }

  // Helper methods for reading session
  extractBookId(url) {
    // Extract book ID from PDF URL or current page
    const urlParams = new URLSearchParams(window.location.search);
    const bookIdFromUrl = urlParams.get('id') || urlParams.get('livro_id');
    
    if (bookIdFromUrl) {
      return bookIdFromUrl;
    }
    
    // Try to extract from URL path or filename
    const pathMatch = url.match(/\/(\d+)[_-]/) || url.match(/livro[_-]?(\d+)/i);
    if (pathMatch) {
      return pathMatch[1];
    }
    
    // Fallback: use a hash of the PDF URL
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
  }

  async getUserId() {
    try {
      // Try to get user ID from session API
      const response = await fetch('/session');
      if (response.ok) {
        const data = await response.json();
        return data.userId;
      }
    } catch (error) {
      console.log('Could not fetch user session:', error);
    }
    
    // Fallback: generate or get anonymous user ID
    let anonymousId = localStorage.getItem('pdf_reader_user_id');
    if (!anonymousId) {
      anonymousId = 'anon_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('pdf_reader_user_id', anonymousId);
    }
    return anonymousId;
  }

  // Add method to go to specific page (used by reading session resume)
  goToPage(pageNumber) {
    console.log(`PDF Viewer - goToPage called with pageNumber: ${pageNumber}, pageCount: ${this.pageCount}, viewMode: ${this.viewMode}`);
    
    if (pageNumber >= 1 && pageNumber <= this.pageCount) {
      if (this.viewMode === 'continuous' && this.virtualScrolling) {
        console.log('Using continuous mode navigation');
        this.scrollToPageInContinuousMode(pageNumber);
      } else {
        // Direct page mode navigation without animation
        console.log('Using direct page mode navigation');
        this.renderPage(pageNumber);
      }
      
      // Update reading session in both modes
      if (this.readingSession) {
        this.readingSession.updateProgress(pageNumber, this.pageCount);
      }
    } else {
      console.warn(`Invalid page number: ${pageNumber}. Must be between 1 and ${this.pageCount}`);
    }
  }

  scrollToPageInContinuousMode(pageNumber) {
    if (!this.virtualScrolling || pageNumber < 1 || pageNumber > this.pageCount) return;
    
    // Calculate scroll position for the target page
    // Use a small offset to position the page nicely in the viewport
    const pageOffset = 20; // Small top padding
    const targetY = Math.max(0, (pageNumber - 1) * this.virtualScrolling.pageHeight - pageOffset);
    
    // Use smooth scrolling, but disable it temporarily if we're switching modes
    // to avoid jarring transitions
    const shouldUseSmooth = !this.isSwitchingModes;
    
    this.containerEl.scrollTo({
      top: targetY,
      behavior: shouldUseSmooth ? 'smooth' : 'auto'
    });
    
    // Update current page number immediately
    this.pageNum = pageNumber;
    this.updateUI();
  }

  // Enhanced Cleanup method
  cleanup() {
    // Clean up virtual scrolling
    if (this.virtualScrolling && this.virtualScrolling.cleanup) {
      this.virtualScrolling.cleanup();
      this.virtualScrolling = null;
    }
    
    // Disconnect page observer (legacy)
    if (this.pageObserver) {
      this.pageObserver.disconnect();
      this.pageObserver = null;
    }
    
    // Clean up system theme listener
    if (this.systemThemeCleanup) {
      this.systemThemeCleanup();
      this.systemThemeCleanup = null;
    }
    
    // Clean up time-based theme watcher
    if (this.timeBasedThemeInterval) {
      clearInterval(this.timeBasedThemeInterval);
      this.timeBasedThemeInterval = null;
    }
    
    if (this.readingSession) {
      this.readingSession.cleanup();
    }
    if (this.tableOfContents) {
      this.tableOfContents.cleanup();
    }
    if (this.pdfSearch) {
      this.pdfSearch.cleanup();
    }
    if (this.adaptiveLayout) {
      this.adaptiveLayout.cleanup();
    }
  }

  // Force re-render current view (used for theme changes)
  forceRerenderCurrentView() {
    if (!this.pdfDoc) return;
    
    if (this.viewMode === 'page') {
      // Force re-render current page
      this.renderPage(this.pageNum);
    } else if (this.viewMode === 'continuous' && this.virtualScrolling) {
      // Re-render all visible pages in continuous mode
      this.virtualScrolling.renderedPages.forEach((pageData, pageNum) => {
        if (pageData && pageData.canvas) {
          // Mark as not rendered to force fresh render with new theme
          pageData.rendered = false;
          this.renderPageToVirtualCanvas(pageNum, pageData.canvas);
        }
      });
    }
  }
} 