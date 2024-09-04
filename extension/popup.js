
const etherscanAPIs = {
  mainnet: 'https://api.etherscan.io/api',
  sepolia: 'https://api-sepolia.etherscan.io/api'
};

const infuraAPIs = {
  mainnet: 'https://mainnet.infura.io/v3/',
  sepolia: 'https://sepolia.infura.io/v3/'
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const { network } = await chrome.storage.local.get('network');
    const { txHash } = await chrome.storage.local.get('txHash');
    const { etherscanApiKey } = await chrome.storage.local.get('etherscanApiKey');
    const { infuraApiKey } = await chrome.storage.local.get('infuraApiKey');

    if (!etherscanApiKey || !infuraApiKey) {
      document.getElementById('configSection').style.display = 'block';
      document.getElementById('saveApiKey').addEventListener('click', async () => {
        const etherscanApiKey = document.getElementById('etherscanApiKeyInput').value.trim();
        const infuraApiKey = document.getElementById('infuraApiKeyInput').value.trim();
        if (etherscanApiKey && infuraApiKey) {
          await chrome.storage.local.set({
            etherscanApiKey: etherscanApiKey,
            infuraApiKey: infuraApiKey,
          });
          document.getElementById('configMessage').textContent = 'API Key saved successfully. Please refresh the page.';
        } else {
          document.getElementById('configMessage').textContent = 'Please enter a valid API Key.';
        }
      });
      return;
    }

    document.getElementById('txSection').style.display = 'block';

    if (!network || !txHash) {
      console.error('No TX Hash found');
      document.getElementById('txHash').textContent = 'No TX Hash found';
      return
    }

    const etherscanAPI = etherscanAPIs[network];
    const infuraAPI = infuraAPIs[network] + infuraApiKey;

    document.getElementById('txHash').textContent = txHash + ' (' + network + ')';

    const url = `${etherscanAPI}?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${etherscanApiKey}`;

    const response = await fetch(url);
    const data = await response.json();
  
    if (!data.result) {
      console.error('Transaction not found or error occurred');
      document.getElementById('txDetails').textContent = 'Transaction not found or error occurred.';
      return
    }

    document.getElementById('txDetails').textContent = JSON.stringify(data.result, null, 2);

    const statusURL = `${etherscanAPI}?module=transaction&action=getstatus&txhash=${txHash}&apikey=${etherscanApiKey}`;
    const statusResponse = await fetch(statusURL);
    const statusData = await statusResponse.json();
    const isError = statusData.result.isError;
    if (isError === '0') {
      document.getElementById('txResult').textContent = 'Success';
      return
    }

    const { from, to, input, blockNumber } = data.result;
    const infuraData = {
      method: 'eth_call',
      params: [
        {
          from,
          to,
          data: input
        },
        blockNumber
      ],
      id: 1,
      jsonrpc: '2.0'
    };

    console.log('infuraData:', infuraData);
    console.log('infuraAPI:', infuraAPI);

    const infuraResponse = await fetch(infuraAPI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(infuraData)
    });
    const infuraResult = await infuraResponse.json();
    console.log('infuraResult:', infuraResult);

    document.getElementById('txResult').textContent = JSON.stringify(infuraResult, null, 2);

    if (infuraResult.error && infuraResult.error.data) {
      const errorData = infuraResult.error.data;
      const errorCode = errorData.slice(0, 10);
      const fourByteUrl = `https://www.4byte.directory/signatures/?bytes4_signature=${errorCode}`;
      document.getElementById('bytes4Signature').innerHTML += `<a href="${fourByteUrl}" target="_blank">${errorCode}</a>`;
    }
  } catch (error) {
    document.getElementById('txResult').textContent = 'Error occurred while fetching transaction data. Error: ' + error;
  }
});

document.getElementById('resetButton').addEventListener('click', async () => {
  document.getElementById('txSection').style.display = 'none';
  document.getElementById('configSection').style.display = 'block';
try {
    await chrome.storage.local.clear();
    document.getElementById('configMessage').textContent = 'All data has been cleared.';
  } catch (error) {
    console.error('Error clearing storage:', error);
    document.getElementById('configMessage').textContent = 'Error occurred while clearing storage.';
  }
});
