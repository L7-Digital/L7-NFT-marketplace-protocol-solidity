const walletAddress = require('../config.json').walletAddress
const sellerPrivateKey = require('../config.json').sellerPrivateKey
const sellerWalletAddress = require('../config.json').sellerWalletAddress
const buyerPrivateKey = require('../config.json').buyerPrivateKey
const buyerWalletAddress = require('../config.json').buyerWalletAddress
const backendPrivateKey = require('../config.json').backendPrivateKey
const backendWalletAddress = require('../config.json').backendAddress

const loadKeys = (web3) => {
    web3.eth.accounts.wallet.add({
        privateKey: sellerPrivateKey,
        address: sellerWalletAddress
    });
    web3.eth.accounts.wallet.add({
        privateKey: buyerPrivateKey,
        address: buyerWalletAddress
    });
    web3.eth.accounts.wallet.add({
        privateKey: backendPrivateKey,
        address: backendWalletAddress
    });
}

module.exports = {walletAddress, sellerWalletAddress, sellerPrivateKey, buyerPrivateKey, buyerWalletAddress, backendPrivateKey, backendWalletAddress, loadKeys}