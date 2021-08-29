const crypto = require('crypto')

const {ERC721Contract} = require("../config")

const ERC721_mint = async(address) => {
    let uri = crypto.randomBytes(20).toString('hex');
    let gasEstimate = await ERC721Contract.methods.mint(
        address, uri
    ).estimateGas({ from: address });

    console.log("estimatedGas for mintNFT:", gasEstimate)

    let res = await ERC721Contract.methods.mint(
        address, uri
    ).send({
        from: address,
        gas: gasEstimate
    })

    return res.events.Transfer.returnValues.tokenId
}

const ERC721_transfer = async(from, to, tokenId) => {
    let gasEstimate = await ERC721Contract.methods.transferFrom(
        from, to, tokenId
    ).estimateGas({ from: from });

    console.log(`estimatedGas for transferNFT: ${gasEstimate}`)

    await ERC721Contract.methods.transferFrom(
        from, to, tokenId
    ).send({
        from: from,
        gas: gasEstimate
    }).on('receipt', function(receipt){
        console.log("Orders have been atomic matched!");
    })
}

const ERC721_setApprovalForAll = async(owner, to, isApproved) => {
    let gasEstimate = await ERC721Contract.methods.setApprovalForAll(
        to, isApproved
    ).estimateGas({ from: owner });

    console.log(`estimatedGas for setApprovalForAll: ${gasEstimate}`)

    await ERC721Contract.methods.setApprovalForAll(
        to, isApproved
    ).send({
        from: owner,
        gas: gasEstimate
    }).on('receipt', function(receipt){
    })
}

function randomURI() {
    return crypto.randomBytes(32).toString('hex');
}

module.exports = {ERC721_mint, ERC721_transfer, ERC721_setApprovalForAll, randomURI}