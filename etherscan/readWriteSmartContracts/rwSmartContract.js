const keys = require('./config');
const ethers = require("ethers")
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function main() {
    const apiKey = keys.esApiKey;
    const privKey = keys.walletPrivateKey;

    // make an API call to the ABIs endpoint 
    const response = await fetch(`https://api-kovan.etherscan.io/api?module=contract&action=getabi&address=0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa&apikey=${apiKey}`);
    const data = await response.json();

    // print the JSON response 
    let abi = data.result;
    console.log(abi);

    // creating a new Provider, and passing in our node URL
    const node = "wss://kovan.infura.io/ws/v3/e758fa158b604da3a037c26ad92ac978";
    const provider = new ethers.providers.WebSocketProvider(node);

    let wallet = new ethers.Wallet(privKey, provider);
}

main();