const ethers = require("ethers");
const keys = require("./keys");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function main() {

  let api_key = keys.esApiKey;

  // pass the raw transaction hash to the "eth_sendRawTransaction" endpoint
  let gethProxy = await fetch(`https://api-kovan.etherscan.io/api?module=proxy&action=eth_gasPrice&apikey=${api_key}`);
  let response = await gethProxy.json();
     
  // print the API response
  console.log(parseInt(response.result));
  
}

main();