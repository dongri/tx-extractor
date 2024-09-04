// dotenv
require('dotenv').config();

const etherscanAPIs = {
  mainnet: 'https://api.etherscan.io/api',
  sepolia: 'https://api-sepolia.etherscan.io/api'
};

const infuraAPIs = {
  mainnet: 'https://mainnet.infura.io/v3/',
  sepolia: 'https://sepolia.infura.io/v3/'
};

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const INFURA_API_KEY = process.env.INFURA_API_KEY;
if (!ETHERSCAN_API_KEY || !INFURA_API_KEY) {
  console.error('Please set ETHERSCAN_API_KEY and INFURA_API_KEY in .env');
  process.exit(1);
}

const url = process.argv[2];

const network = url.includes('sepolia') ? 'sepolia' : 'mainnet';

const etherscanAPI = etherscanAPIs[network];
const infuraAPI = infuraAPIs[network] + INFURA_API_KEY;

const txhash = url.split('/tx/')[1];

console.log('================================================');
console.log(network);
console.log(txhash);

const getTransaction = async (txhash) => {
  const response = await fetch(`${etherscanAPI}?module=proxy&action=eth_getTransactionByHash&txhash=${txhash}&apikey=${ETHERSCAN_API_KEY}`);
  const data = await response.json();
  return data;
};

const getStatus = async (txhash) => {
  const response = await fetch(`${etherscanAPI}?module=transaction&action=getstatus&txhash=${txhash}&apikey=${ETHERSCAN_API_KEY}`);
  const data = await response.json();
  return data;
};

const getEthCall = async (from, to, input, blockNumber) => {
  const body = {
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

  const response = await fetch(infuraAPI, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  return data;
};

(async () => {
  const data = await getTransaction(txhash);
  console.log('================================================');
  console.log('transaction:', data);

  if (!data.result) {
    console.error('Transaction not found or error occurred');
    return
  }

  const statusData = await getStatus(txhash);
  const isError = statusData.result.isError;
  if (isError === '0') {
    return
  }

  const { from, to, input, blockNumber } = data.result;
  const ethCall = await getEthCall(from, to, input, blockNumber);
  console.log('================================================');
  console.log('eth_call:', ethCall);
})();
