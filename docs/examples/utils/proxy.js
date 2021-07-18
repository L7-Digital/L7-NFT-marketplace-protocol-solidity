const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545')
const web3 = new Web3(provider)

const walletAddress = require('../config.json').walletAddress

const fs = require('fs');
const privateKey = fs.readFileSync("../../.secret").toString().trim(); // read the secret key of the account.
web3.eth.accounts.wallet.add({
    privateKey: privateKey,
    address: walletAddress
});

const TaureumProxyRegistryABI = require('../../../abi/TaureumProxyRegistry.json').abi
const TaureumProxyRegistryAddress = require('../../../config.json').deployed.testnet.TaureumProxyRegistry

var TaureumProxyRegistry = new web3.eth.Contract(TaureumProxyRegistryABI, TaureumProxyRegistryAddress);

const getProxies = async(address) => {
    let gasEstimate = await TaureumProxyRegistry.methods.proxies(
        address
    ).estimateGas({ from: walletAddress });

    console.log(`estimatedGas for proxies: ${gasEstimate}`)

    let res = await TaureumProxyRegistry.methods.proxies(
        address
    ).call({
        from: walletAddress,
        gas: gasEstimate
    })

    return res
}

module.exports = {getProxies}

