const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545')
const web3 = new Web3(provider)

const crypto = require('crypto')

const nftABI = require('../abi/TaureumNFT.json').abi
const nftContractAddress = "0xC4F7f1D1fa837Ba541be490CD4A13467Cc494E01"
const nftContract = new web3.eth.Contract(nftABI, nftContractAddress);

const {walletAddress, loadKeys} = require("./utils")

// load testing keys
loadKeys(web3)

const mintNFT = async(address) => {
    uri = crypto.randomBytes(20).toString('hex');
    gasEstimate = await nftContract.methods.mint(
        address, uri, 1, 1000000000
    ).estimateGas({ from: address });

    let res = await nftContract.methods.mint(
        address, uri, 1, 1000000000
    ).send({
        from: address,
        gas: gasEstimate
    })

    return res.events.Transfer.returnValues.tokenId
}

const transferNFT = async(from, to, tokenId) => {
    gasEstimate = await nftContract.methods.transferFrom(
        from, to, tokenId
    ).estimateGas({ from: from });

    console.log(`estimatedGas: ${gasEstimate}`)

    await nftContract.methods.transferFrom(
        from, to, tokenId
    ).send({
        from: from,
        gas: gasEstimate
    }).on('receipt', function(receipt){
        console.log("Orders have been atomic matched!");
    })
}

const setApprovalForAll = async(owner, to, isApproved) => {
    let gasEstimate = await nftContract.methods.setApprovalForAll(
        to, isApproved
    ).estimateGas({ from: owner });

    console.log(`estimatedGas: ${gasEstimate}`)

    await nftContract.methods.setApprovalForAll(
        to, isApproved
    ).send({
        from: owner,
        gas: gasEstimate
    }).on('receipt', function(receipt){
        console.log("Receipt", receipt);
    })
}

module.exports = {mintNFT, transferNFT, setApprovalForAll}