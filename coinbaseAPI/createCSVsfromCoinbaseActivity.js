const crypto = require('crypto');
const ObjectsToCsv = require('objects-to-csv');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const creds = require('./keys')


//Coinbase API Base URL
const baseURL = 'https://api.coinbase.com'
//the JSON properties in the Transaction object to use to split out files by see: https://developers.coinbase.com/api/v2#transaction-resource
const filesFilter = ['type','amount.currency']

//paginated fetch of all Coinbase Accounts (https://developers.coinbase.com/api/v2#accounts)
async function fetchAccounts(url = baseURL,
    endpoint = '/v2/accounts?limit=200&type=wallet',
    previousResponse = []) {
    
        const response = await fetch(url + endpoint, {
        method: 'GET',
        headers: auth('GET', endpoint)
        });
    
        const newResponse = await response.json();
        const accounts = [...previousResponse, ...newResponse.data];
    
        if (newResponse.pagination.next_uri !== null) {
        endpoint = newResponse.pagination.next_uri;
        return fetchAccounts(url, endpoint, accounts);
    }
    return accounts;
}

//fetch of all Transactions for each Coinbase account (https://developers.coinbase.com/api/v2#list-transactions)
async function listTxns(accounts) {
    
    const method = 'GET';
    const endpoints = accounts.map(account => `/v2/accounts/${account.id}/transactions`);
    let retries = [];
    const txns = await Promise.all(endpoints.map(endpoint => {
        return fetch(baseURL + endpoint, {
               method: method,
               headers: auth(method, endpoint)
                }).then((response) => {
                return response.json();
                }, retries.push(endpoint))
    }))
    return {txns: txns,
        retries: retries};
}

//optional local file read for testing
// async function readLocalFile(fileName) {
//     return JSON.parse(fs.readFileSync(`${fileName}.json`))
// }
// readLocalFile('transactions')
// .then(txns => {
//     filesFilter.forEach(filter => {
//         let allTxns = filterTxns(txns, filter)
//         let fileNames = Object.keys(allTxns)
//         createCSV(flatten(allTxns, fileNames), fileNames)
//     })
// })

//start script by fetching all accounts for user
fetchAccounts()
//pass accounts to listTxns function to list all Transactions for each account
.then(accounts => {
    return listTxns(accounts)
}, err => console.log(err))
//post-process the Transactions data then write to separate files based on intended filters in filesFilter array
.then(response => {
    txns = response.txns.map(txn => {return txn.data}).filter(txn => { if(txn.length > 0){return true;} return false; }).flat()
    filesFilter.forEach(filter => {
        let allTxns = filterTxns(txns, filter)
        let fileNames = Object.keys(allTxns)
        createCSV(flatten(allTxns, fileNames), fileNames, filter)
    })
}, err => console.log(err))

//create local CSV files
async function createCSV(allTxns, csvFiles, filter) {
    let folderName = filter.replace('.', '-')
    csvFiles.forEach(csvFile => {
        if(allTxns[csvFile]){
            const csv = new ObjectsToCsv(allTxns[csvFile])
            if (fs.existsSync(`./${folderName}`)) {
                csv.toDisk(`./${folderName}/${csvFile}.csv`)
            } else {
                fs.mkdirSync(`./${folderName}`)
                csv.toDisk(`./${folderName}/${csvFile}.csv`)
            }
        }
    })
}

//filter Transaction records based on JSON property specified in 'filesFilter'
function filterTxns(txns, filterParam, allTxns = {}){
    txns.forEach(txn => {
        let filter = filterParam.split('.').reduce((o,i)=> o[i], txn)
        
        if(!allTxns[filter]){
            allTxns[filter] = [];
        }
        allTxns[filter].push(txn);
    })
    return allTxns;
}

//flatten all JSON objects to be able to write to a CSV file
function flatten(allTxns, keys){
    keys.forEach(key => {
        const flatten = allTxns[key].map(txn => {
            const flatten = (txn, roots = [], sep = '.') => Object
            .keys(txn)
            .reduce((flatTxn, prop) => Object.assign(
                {},
                flatTxn,
                Object.prototype.toString.call(txn[prop]) === '[object Object]'
                  ? flatten(txn[prop], roots.concat([prop]), sep)
                  : {[roots.concat([prop]).join(sep)]: txn[prop]}
              ), {})
            return flatten(txn)
        })
        allTxns[key] = flatten 
    })
    return allTxns
}

//Coinbase API Auth mechanism (https://developers.coinbase.com/api/v2#api-key)
function auth(method, endpoint) {

    const time = Math.floor(Date.now() / 1000)

    let hmac = crypto.createHmac('sha256', creds.apiSecret);
    hmac.update(time + method + endpoint)
    const sign = hmac.digest('hex')

    return {'Content-Type': 'application/json',
    'CB-ACCESS-KEY': creds.apiKey,
    'CB-ACCESS-SIGN': sign,
    'CB-ACCESS-TIMESTAMP': time,
    'CB-VERSION': '2021-12-13'}
}