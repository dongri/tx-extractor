// background.js
console.log('Background script loaded');

chrome.runtime.onMessage.addListener((message) => {
  if (message.network && message.txHash) {
    console.log("Received TX Hash:", message.txHash);
    chrome.storage.local.set({
      network: message.network,
      txHash: message.txHash
    });
  }
});
