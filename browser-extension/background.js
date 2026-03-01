// background.js - prototype service worker that injects Readability and extracts article
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // simple inline Readability usage (assumes document is available)
        try {
          const article = new Readability(document.cloneNode(true)).parse();
          const payload = { title: article.title, content: article.textContent };
          console.log('Extracted article', payload);
          alert('Article extracted to console (prototype)');
        } catch (err) {
          alert('Extraction failed: ' + err.message);
        }
      }
    });
  } catch (err) {
    console.error(err);
  }
});
