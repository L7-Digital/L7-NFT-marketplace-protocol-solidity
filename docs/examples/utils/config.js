const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545')
const web3 = new Web3(provider)

const {walletAddress, sellerWalletAddress, sellerPrivateKey, buyerPrivateKey, buyerWalletAddress, loadKeys} = require("./keys")
loadKeys(web3)

const nftABI = require('../abi/TaureumERC721Enumerable.json').abi
const nftContractAddress = "0x4441C8f380379e234268D59853dcBdA8ea2f72b2"
const nftContract = new web3.eth.Contract(nftABI, nftContractAddress);

const exchangeABI = require('../../../abi/TaureumExchange.json').abi
const exchangeAddress = require('../../../config.json').deployed.testnet.TaureumExchange
const exchange = new web3.eth.Contract(exchangeABI, exchangeAddress);

const TaureumProxyRegistryABI = require('../../../abi/TaureumProxyRegistry.json').abi
const TaureumProxyRegistryAddress = require('../../../config.json').deployed.testnet.TaureumProxyRegistry
const TaureumProxyRegistry = new web3.eth.Contract(TaureumProxyRegistryABI, TaureumProxyRegistryAddress);

const erc20ABI = require('../../../abi/ERC20.json').abi
const erc20TokenAddress = '0xA11c8D9DC9b66E209Ef60F0C8D969D3CD988782c'; // ERC tokenID for USDT for testing

const tokenTransferProxyAddress = require('../../../config.json').deployed.testnet.TaureumTokenTransferProxy;


const keys = {
    walletAddress, sellerWalletAddress, sellerPrivateKey, buyerPrivateKey, buyerWalletAddress
}

module.exports = {
    nftContract,
    nftContractAddress,
    web3,
    exchange,
    exchangeAddress,
    keys,
    TaureumProxyRegistry,
    erc20ABI,
    erc20TokenAddress,
    tokenTransferProxyAddress
}