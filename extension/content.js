// content.js
console.log('Content script loaded');

const url = window.location.href;
const txHash = url.split('/').pop();

const network = url.includes('sepolia') ? 'sepolia' : 'mainnet';

console.log("Transaction Hash:", txHash);

chrome.runtime.sendMessage({ network: network, txHash: txHash });
