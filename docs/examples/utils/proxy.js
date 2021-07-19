const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545')
const web3 = new Web3(provider)

const {sellerWalletAddress, loadKeys} = require("./utils")
loadKeys(web3)

const TaureumProxyRegistryABI = require('../../../abi/TaureumProxyRegistry.json').abi
const TaureumProxyRegistryAddress = require('../../../config.json').deployed.testnet.TaureumProxyRegistry

var TaureumProxyRegistry = new web3.eth.Contract(TaureumProxyRegistryABI, TaureumProxyRegistryAddress);

const getProxies = async(address) => {
    let gasEstimate = await TaureumProxyRegistry.methods.proxies(
        address
    ).estimateGas({ from: sellerWalletAddress });

    let res = await TaureumProxyRegistry.methods.proxies(
        address
    ).call({
        from: sellerWalletAddress,
        gas: gasEstimate
    })

    return res
}

module.exports = {getProxies}

