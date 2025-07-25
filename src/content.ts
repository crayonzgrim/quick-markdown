const PANEL_ID = 'markdown-panel';

let iframe: HTMLIFrameElement | null = null;

async function createPanel() {
  if (document.getElementById(PANEL_ID)) return;

  const width = '624px';

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

}

function removePanel() {
  const panel = document.getElementById(PANEL_ID);
  if (panel) {
    panel.style.transform = 'translateX(100%)';
    setTimeout(() => {
      panel.remove();
      iframe = null;
    }, 200);
  }
}


// --- Event Listeners ---
// background script와의 통신
chrome.runtime.onMessage.addListener(async (message, _, sendResponse) => {
  if (message.type === 'is-panel-open') {
    sendResponse({ isOpen: !!iframe });
    return true;
  }
  if (message.type === 'toggle-panel') {
    if (iframe) {
      removePanel();
    } else {
      await createPanel();
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
(async () => {
  if (!iframe) {
    await createPanel();
  }
})();
