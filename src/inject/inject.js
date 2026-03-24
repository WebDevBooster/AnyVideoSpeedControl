(() => {
  const DEFAULT_SETTINGS = {
    speed: 1.0,
    speedStep: 0.25,
    slowerKeyCode: 'NumpadSubtract,Minus',
    fasterKeyCode: 'NumpadAdd,Equal',
    resetKeyCode: 'NumpadMultiply',
    displayOption: 'FadeInFadeOut',
    allowMouseWheel: true,
    rememberSpeed: false
  };

  let settings = { ...DEFAULT_SETTINGS };
  const controllers = new WeakMap();

  function matchesKey(keyCodes, code) {
    return keyCodes.split(',').includes(code);
  }

  function adjustSpeed(action) {
    const videos = document.getElementsByTagName('video');
    for (const video of videos) {
      if (video.classList.contains('vc-cancelled')) continue;

      if (action === 'faster') {
        video.playbackRate = Math.min(video.playbackRate + settings.speedStep, 16);
      } else if (action === 'slower') {
        video.playbackRate = Math.max(video.playbackRate - settings.speedStep, 0.05);
      } else if (action === 'reset') {
        video.playbackRate = 1.0;
      }
    }

    // Briefly show all panels when speed changes via keyboard
    for (const panel of document.querySelectorAll('.avscPlayBackPanel')) {
      if (panel.style.display === 'none') {
        panel.style.display = 'inline';
        setTimeout(() => { panel.style.display = 'none'; }, 2000);
      }
    }
  }

  function createController(video) {
    if (controllers.has(video)) return;

    if (!settings.rememberSpeed) {
      settings.speed = 1.0;
    }

    const panel = document.createElement('div');
    panel.className = 'avscPlayBackPanel';

    const speedBtn = document.createElement('button');
    speedBtn.className = 'avscBtn avscBtn-speed';
    speedBtn.textContent = parseFloat(settings.speed).toFixed(2);

    const slowBtn = document.createElement('button');
    slowBtn.className = 'avscBtn avscBtn-left';
    slowBtn.textContent = '<<';

    const fastBtn = document.createElement('button');
    fastBtn.className = 'avscBtn avscBtn-right';
    fastBtn.textContent = '>>';

    // Apply display option
    switch (settings.displayOption) {
      case 'None':
        panel.style.display = 'none';
        break;
      case 'Always':
        panel.style.display = 'inline';
        break;
      case 'Simple':
        panel.style.display = 'inline';
        fastBtn.style.display = 'none';
        slowBtn.style.display = 'none';
        speedBtn.style.border = 'none';
        speedBtn.style.background = 'transparent';
        break;
      case 'FadeInFadeOut':
        panel.style.display = 'none';
        break;
      default:
        panel.style.display = 'inline';
    }

    panel.appendChild(fastBtn);
    panel.appendChild(speedBtn);
    panel.appendChild(slowBtn);

    // Insert panel near the video
    const parent = video.parentElement;
    if (parent) {
      parent.insertBefore(panel, video);
    }

    // Hover behavior for FadeInFadeOut
    let hoverTimeout = null;
    if (parent) {
      parent.addEventListener('mousemove', () => {
        if (panel.style.display === 'none') {
          panel.style.display = 'inline';
          clearTimeout(hoverTimeout);
          hoverTimeout = setTimeout(() => {
            if (settings.displayOption === 'FadeInFadeOut') {
              panel.style.display = 'none';
            }
          }, 1000);
        }
      });

      parent.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
        if (settings.displayOption === 'FadeInFadeOut' && !panel.classList.contains('avscPlayBackPanelFullScreen')) {
          panel.style.display = 'none';
        }
      });
    }

    // Panel button clicks
    panel.addEventListener('click', (e) => {
      if (e.target === slowBtn) adjustSpeed('slower');
      else if (e.target === fastBtn) adjustSpeed('faster');
      else if (e.target === speedBtn) adjustSpeed('reset');
      e.preventDefault();
      e.stopPropagation();
    }, true);

    panel.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, true);

    // Track rate changes
    video.addEventListener('play', () => {
      video.playbackRate = settings.speed;
    });

    video.addEventListener('ratechange', () => {
      if (video.readyState === 0) return;
      const speed = parseFloat(video.playbackRate).toFixed(2);
      speedBtn.textContent = speed;
      settings.speed = parseFloat(speed);
      chrome.storage.sync.set({ speed });
    });

    video.playbackRate = settings.speed;
    controllers.set(video, { panel, speedBtn });
  }

  function init() {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
      settings.speed = Number(stored.speed);
      settings.speedStep = Number(stored.speedStep);
      settings.slowerKeyCode = stored.slowerKeyCode;
      settings.fasterKeyCode = stored.fasterKeyCode;
      settings.resetKeyCode = stored.resetKeyCode;
      settings.displayOption = stored.displayOption;
      settings.allowMouseWheel = Boolean(stored.allowMouseWheel);
      settings.rememberSpeed = Boolean(stored.rememberSpeed);

      // Attach controllers to existing videos
      for (const video of document.getElementsByTagName('video')) {
        createController(video);
      }

      // Watch for dynamically added videos
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeName === 'VIDEO') {
              createController(node);
            }
            if (node.querySelectorAll) {
              for (const video of node.querySelectorAll('video')) {
                createController(video);
              }
            }
          }
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });

      // Keyboard controls
      document.addEventListener('keydown', (e) => {
        const active = document.activeElement;
        if (active && (active.nodeName === 'INPUT' || active.nodeName === 'TEXTAREA' || active.isContentEditable)) {
          return;
        }

        if (matchesKey(settings.fasterKeyCode, e.code)) {
          adjustSpeed('faster');
        } else if (matchesKey(settings.slowerKeyCode, e.code)) {
          adjustSpeed('slower');
        } else if (matchesKey(settings.resetKeyCode, e.code)) {
          adjustSpeed('reset');
        }
      }, true);

      // Mouse wheel controls
      if (settings.allowMouseWheel) {
        document.addEventListener('wheel', (e) => {
          if (e.shiftKey) {
            if (e.deltaY < 0) adjustSpeed('faster');
            else if (e.deltaY > 0) adjustSpeed('slower');
          }
        }, { passive: true });
      }

      // Fullscreen change — update the panel closest to the fullscreen element
      document.addEventListener('fullscreenchange', () => {
        const panels = document.querySelectorAll('.avscPlayBackPanel');
        if (document.fullscreenElement) {
          const fsPanel = document.fullscreenElement.querySelector('.avscPlayBackPanel');
          if (fsPanel) {
            fsPanel.classList.add('avscPlayBackPanelFullScreen');
          }
        } else {
          for (const panel of panels) {
            panel.classList.remove('avscPlayBackPanelFullScreen');
          }
        }
      });
    });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
