const crypto = require('crypto')

const {ERC1155Contract} = require("../config")

const ERC1155_mint = async(address) => {
    let uri = crypto.randomBytes(20).toString('hex');
    let supply = 1 + crypto.randomInt(100000000)
    let gasEstimate = await ERC1155Contract.methods.mint(
        address, uri, supply, "0x"
    ).estimateGas({ from: address });

    console.log("estimatedGas for mintERC1155:", gasEstimate)

    let res = await ERC1155Contract.methods.mint(
        address, uri, supply, "0x"
    ).send({
        from: address,
        gas: gasEstimate
    })

    return {id: res.events.TransferSingle.returnValues.id, value: res.events.TransferSingle.returnValues.value}
}

const ERC1155_transfer = async(from, to, tokenId, amount) => {
    let gasEstimate = await ERC1155Contract.methods.safeTransferFrom(
        from, to, tokenId, amount, "0x"
    ).estimateGas({ from: from });

    console.log(`estimatedGas for transferERC1155: ${gasEstimate}`)

    await ERC1155Contract.methods.safeTransferFrom(
        from, to, tokenId, amount, "0x"
    ).send({
        from: from,
        gas: gasEstimate
    }).on('receipt', function(receipt){
        console.log("transfer Receipt:", receipt);
    })
}

const ERC1155_setApprovalForAll = async(owner, to, isApproved) => {
    let gasEstimate = await ERC1155Contract.methods.setApprovalForAll(
        to, isApproved
    ).estimateGas({ from: owner });

    console.log(`estimatedGas for setApprovalForAll: ${gasEstimate}`)

    await ERC1155Contract.methods.setApprovalForAll(
        to, isApproved
    ).send({
        from: owner,
        gas: gasEstimate
    }).on('receipt', function(receipt){
        console.log("setApprovalForAll Receipt", receipt);
    })
}

const ERC1155_isApprovedForAll = async(owner, operator) => {
    return await ERC1155Contract.methods.isApprovedForAll(
        owner, operator
    ).call({
        from: owner,
    })
}

module.exports = {ERC1155_mint, ERC1155_transfer, ERC1155_setApprovalForAll, ERC1155_isApprovedForAll}