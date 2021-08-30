const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545')
const web3 = new Web3(provider)

const {walletAddress, sellerWalletAddress, sellerPrivateKey, buyerPrivateKey, buyerWalletAddress, loadKeys} = require("./keys")
loadKeys(web3)

const erc721ABI = require('../abi/TaureumERC721LazyMint.json').abi
const ERC721ContractAddress = "0xE07577082Ac981FF3a2F0C403F68893fC25A11a8"
const ERC721Contract = new web3.eth.Contract(erc721ABI, ERC721ContractAddress);

const erc1155ABI = require('../abi/TaureumERC1155.json').abi
const ERC1155ContractAddress = "0xdA000B8f8fdfaaeD4142dAfa752fA258B74E7523"
const ERC1155Contract = new web3.eth.Contract(erc1155ABI, ERC1155ContractAddress);

const exchangeABI = require('../../../abi/TaureumExchange.json').abi
const exchangeAddress = require('../../../config.json').deployed.testnet.TaureumExchange
const exchange = new web3.eth.Contract(exchangeABI, exchangeAddress);

const TaureumProxyRegistryABI = require('../../../abi/TaureumProxyRegistry.json').abi
const TaureumProxyRegistryAddress = require('../../../config.json').deployed.testnet.TaureumProxyRegistry
const TaureumProxyRegistry = new web3.eth.Contract(TaureumProxyRegistryABI, TaureumProxyRegistryAddress);

const erc20ABI = require('../../../abi/ERC20.json').abi
const erc20TokenAddress = '0x337610d27c682e347c9cd60bd4b3b107c9d34ddd'; // ERC tokenID for USDT for testing

const tokenTransferProxyAddress = require('../../../config.json').deployed.testnet.TaureumTokenTransferProxy;

const zeroAddress = "0x0000000000000000000000000000000000000000"


const keys = {
    walletAddress, sellerWalletAddress, sellerPrivateKey, buyerPrivateKey, buyerWalletAddress
}

module.exports = {
    ERC721Contract,
    ERC721ContractAddress,
    ERC1155Contract,
    ERC1155ContractAddress,
    web3,
    exchange,
    exchangeAddress,
    keys,
    TaureumProxyRegistry,
    erc20ABI,
    erc20TokenAddress,
    tokenTransferProxyAddress,
    zeroAddress
}