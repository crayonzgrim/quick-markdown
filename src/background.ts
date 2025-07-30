interface MessageRequest {
  type: string;
}

const RELOAD_MESSAGE_TYPE = 'reload-extension';

// Side Panel 토글 함수
const toggleSidePanel = async (tab?: chrome.tabs.Tab): Promise<void> => {
  const currentTab = tab || await getCurrentTab();
  if (!currentTab?.windowId) return;

  try {
    // Side Panel 열기/닫기
    await chrome.sidePanel.open({ windowId: currentTab.windowId });
  } catch (error) {
    console.error('Failed to toggle side panel:', error);
  }
};

// 현재 탭 가져오기
const getCurrentTab = async (): Promise<chrome.tabs.Tab | null> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
};

// Message handler
const handleMessage = (request: MessageRequest): void => {
  if (request.type === RELOAD_MESSAGE_TYPE) {
    chrome.runtime.reload();
  }
};

// Event listeners
chrome.action.onClicked.addListener(toggleSidePanel);

chrome.commands.onCommand.addListener(async (command: string) => {
  if (command === 'toggle-markdown-panel') {
    await toggleSidePanel();
  }
});

chrome.runtime.onMessage.addListener(handleMessage);
