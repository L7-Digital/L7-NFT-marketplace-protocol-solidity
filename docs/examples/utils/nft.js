const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545')
const web3 = new Web3(provider)

const crypto = require('crypto')

const nftABI = require('../abi/TaureumERC721Enumerable.json').abi
const nftContractAddress = "0x4441C8f380379e234268D59853dcBdA8ea2f72b2"
const nftContract = new web3.eth.Contract(nftABI, nftContractAddress);

const {walletAddress, loadKeys} = require("./utils")

// load testing keys
loadKeys(web3)

const mintNFT = async(address) => {
    uri = crypto.randomBytes(20).toString('hex');
    gasEstimate = await nftContract.methods.mint(
        address, uri
    ).estimateGas({ from: address });

    console.log("Estimate Gas:", gasEstimate)

    let res = await nftContract.methods.mint(
        address, uri
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

module.exports = {mintNFT, transferNFT, setApprovalForAll, nftContractAddress}