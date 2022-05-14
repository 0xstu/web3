const ethers = require("ethers");
const keys = require("../keys");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const main = async () => {

  // defining the wallet private key
  const privatekey = keys.walletPrivateKey;
  const api_key = keys.esApiKey;
  const wallet = new ethers.Wallet(privatekey);

  // print the wallet address
  console.log(`Using wallet address ${wallet.address}`)

  const transaction = {
    to: '0x5d6880610086557aBce58A0fD42Aa7811336060e',
    value: ethers.utils.parseEther('.0001'),
    gasLimit: '30000000',
    maxPriorityFeePerGas: ethers.utils.parseUnits('5', 'gwei'),
    maxFeePerGas: ethers.utils.parseUnits('20', 'gwei'),
    nonce: 1,
    type: 2,
    chainId: 42
  };

  // sign and serialize the transaction 
  const rawTransaction = await wallet.signTransaction(transaction)
  .then(ethers.utils.serializeTransaction(transaction));
  
  // print the raw transaction hash
  //console.log('Raw txhash string ' + rawTransaction);

  // pass the raw transaction hash to the "eth_sendRawTransaction" endpoint
  const gethProxy = await fetch(`https://api-kovan.etherscan.io/api?module=proxy&action=eth_sendRawTransaction&hex=${rawTransaction}&apikey=${api_key}`);
  const response = await gethProxy.json();
     
  // print the API response
  console.log(response);
  
}

main();