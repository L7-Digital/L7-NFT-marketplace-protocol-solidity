const crypto = require('crypto')

const {nftContract} = require("./config")

const mintNFT = async(address) => {
    let uri = crypto.randomBytes(20).toString('hex');
    let gasEstimate = await nftContract.methods.mint(
        address, uri
    ).estimateGas({ from: address });

    console.log("estimatedGas for mintNFT:", gasEstimate)

    let res = await nftContract.methods.mint(
        address, uri
    ).send({
        from: address,
        gas: gasEstimate
    })

    return res.events.Transfer.returnValues.tokenId
}

const transferNFT = async(from, to, tokenId) => {
    let gasEstimate = await nftContract.methods.transferFrom(
        from, to, tokenId
    ).estimateGas({ from: from });

    console.log(`estimatedGas for transferNFT: ${gasEstimate}`)

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

    console.log(`estimatedGas for setApprovalForAll: ${gasEstimate}`)

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