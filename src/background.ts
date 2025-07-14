// background.ts
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  try {
    // 콘텐츠 스크립트가 이미 주입되었다면 토글 메시지를 보냅니다.
    await chrome.tabs.sendMessage(tab.id, { type: 'toggle-panel' });
  } catch (e) {
    // 실패하면 콘텐츠 스크립트가 없는 것이므로 주입합니다.
    // 주입된 콘텐츠 스크립트는 처음 실행될 때 스스로 패널을 생성합니다.
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/content.js']
    });
  }
});
