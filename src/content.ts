const PANEL_ID = 'markdown-panel';
const RESIZE_HANDLE_ID = 'markdown-panel-resize-handle';
const STORAGE_KEY_WIDTH = 'markdown-panel-width';

let iframe: HTMLIFrameElement | null = null;

function createPanel() {
  if (document.getElementById(PANEL_ID)) return;

  const savedWidth = localStorage.getItem(STORAGE_KEY_WIDTH);
  const width = savedWidth ? `${parseInt(savedWidth, 10)}px` : '600px';

  iframe = document.createElement('iframe');
  iframe.id = PANEL_ID;
  iframe.src = chrome.runtime.getURL('index.html');
  iframe.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: ${width};
    min-height: 100vh;
    height: 100vh;
    z-index: 999999;
    border-left: 1px solid #444;
    background: #002b36;
    transition: transform 0.2s ease-in-out;
    transform: translateX(100%);
    box-shadow: -2px 0 15px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(iframe);

  requestAnimationFrame(() => {
    if (iframe) {
      iframe.style.transform = 'translateX(0)';
    }
  });

  createResizeHandle();
}

function removePanel() {
  const panel = document.getElementById(PANEL_ID);
  if (panel) {
    panel.style.transform = 'translateX(100%)';
    setTimeout(() => {
      panel.remove();
      const handle = document.getElementById(RESIZE_HANDLE_ID);
      if (handle) handle.remove();
      iframe = null;
    }, 200);
  }
}

function createResizeHandle() {
  const handle = document.createElement('div');
  handle.id = RESIZE_HANDLE_ID;
  handle.style.cssText = `
    position: fixed;
    top: 0;
    right: ${iframe?.style.width || '600px'};
    width: 8px;
    height: 100vh;
    cursor: col-resize;
    z-index: 1000000;
    user-select: none;
  `;
  document.body.appendChild(handle);

  const onMouseMove = (e: MouseEvent) => {
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 300) {
      // 최소 너비
      const newWidthPx = `${newWidth}px`;
      if (iframe) {
        iframe.style.width = newWidthPx;
      }
      handle.style.right = newWidthPx;
    }
  };

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    if (iframe) {
      localStorage.setItem(STORAGE_KEY_WIDTH, iframe.style.width);
    }
  };

  handle.addEventListener('mousedown', () => {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

// --- Event Listeners ---
// background script와의 통신
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.type === 'is-panel-open') {
    sendResponse({ isOpen: !!iframe });
    return true;
  }
  if (message.type === 'toggle-panel') {
    if (iframe) {
      removePanel();
    } else {
      createPanel();
    }
  }
});

// iframe(App.tsx)과의 통신
window.addEventListener('message', (e) => {
  if (e.data?.type === 'markdown-panel-close') {
    removePanel();
  }
  if (e.data?.type === 'download-markdown') {
    const { content, filename } = e.data;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'note.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
});

// 초기 실행 시 패널 생성
if (!iframe) {
  createPanel();
}
