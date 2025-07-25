interface MessageRequest {
  type: string;
}

const CONTENT_SCRIPT_FILE = 'src/content.js';
const TOGGLE_MESSAGE_TYPE = 'toggle-panel';
const RELOAD_MESSAGE_TYPE = 'reload-extension';

// Utils
const getCurrentTab = async (): Promise<chrome.tabs.Tab | null> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id ? tab : null;
};

const injectContentScript = async (tabId: number): Promise<void> => {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: [CONTENT_SCRIPT_FILE]
  });
};

const sendToggleMessage = async (tabId: number): Promise<void> => {
  await chrome.tabs.sendMessage(tabId, { type: TOGGLE_MESSAGE_TYPE });
};

const togglePanel = async (tab?: chrome.tabs.Tab): Promise<void> => {
  const currentTab = tab || (await getCurrentTab());
  if (!currentTab?.id) return;

  try {
    await sendToggleMessage(currentTab.id);
  } catch {
    await injectContentScript(currentTab.id);
  }
};

// Message handler
const handleMessage = (request: MessageRequest): void => {
  if (request.type === RELOAD_MESSAGE_TYPE) {
    chrome.runtime.reload();
  }
};

// Event listeners
chrome.action.onClicked.addListener(togglePanel);

chrome.commands.onCommand.addListener(async (command: string) => {
  if (command === 'toggle-markdown-panel') {
    await togglePanel();
  }
});

chrome.runtime.onMessage.addListener(handleMessage);
