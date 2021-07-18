const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545')
const web3 = new Web3(provider)

const crypto = require('crypto')

const nftABI = require('../abi/TaureumNFT.json').abi
const nftContractAddress = "0xCa007BcC979B8Ca76D9CF327287e7ad3F269DA6B"
const nftContract = new web3.eth.Contract(nftABI, nftContractAddress);

const walletAddress = require('../config.json').walletAddress
const fs = require('fs');
const privateKey = fs.readFileSync("../../.secret").toString().trim(); // read the secret key of the account.
web3.eth.accounts.wallet.add({
    privateKey: privateKey,
    address: walletAddress
});

const mintNFT = async(address) => {
    uri = crypto.randomBytes(20).toString('hex');
    gasEstimate = await nftContract.methods.mint(
        address, uri, 1, 1000000000
    ).estimateGas({ from: walletAddress });

    console.log(`estimatedGas: ${gasEstimate}`)

    let res = await nftContract.methods.mint(
        address, uri, 1, 1000000000
    ).send({
        from: walletAddress,
        gas: gasEstimate
    })

    return res.events.Transfer.returnValues.tokenId
}

const transferNFT = async(from, to, tokenId) => {
    gasEstimate = await nftContract.methods.transferFrom(
        walletAddress, to, tokenId
    ).estimateGas({ from: walletAddress });

    console.log(`estimatedGas: ${gasEstimate}`)

    await nftContract.methods.transferFrom(
        walletAddress, to, tokenId
    ).send({
        from: walletAddress,
        gas: gasEstimate
    }).on('receipt', function(receipt){
        console.log("Orders have been atomic matched!");
    })
}

const setApprovalForAll = async(to, isApproved) => {
    let gasEstimate = await nftContract.methods.setApprovalForAll(
        to, isApproved
    ).estimateGas({ from: walletAddress });

    console.log(`estimatedGas: ${gasEstimate}`)

    await nftContract.methods.setApprovalForAll(
        to, isApproved
    ).send({
        from: walletAddress,
        gas: gasEstimate
    }).on('receipt', function(receipt){
        console.log("Receipt", receipt);
    })
}

module.exports = {mintNFT, transferNFT, setApprovalForAll}