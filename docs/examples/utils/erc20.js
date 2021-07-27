const {web3, keys, erc20ABI} = require("./config")

const getBalance = async(address, erc20TokenAddress) => {
    var erc20TokenContract = new web3.eth.Contract(erc20ABI, erc20TokenAddress);

    let gasEstimate = await erc20TokenContract.methods.balanceOf(
        address
    ).estimateGas({ from: keys.walletAddress });

    let res = await erc20TokenContract.methods.balanceOf(
        address
    ).call({
        from: keys.walletAddress,
        gas: gasEstimate
    })

    return res
}

const approveERC20 = async(owner, spender, amount, erc20TokenAddress) => {
    var erc20TokenContract = new web3.eth.Contract(erc20ABI, erc20TokenAddress);

    let gasEstimate = await erc20TokenContract.methods.approve(
        spender, amount
    ).estimateGas({ from: owner });

    let res = await erc20TokenContract.methods.approve(
        spender, amount
    ).send({
        from: owner,
        gas: gasEstimate
    })

    return res.events.Approval.returnValues.value
}

const getAllowance = async(owner, spender, erc20TokenAddress) => {
    var erc20TokenContract = new web3.eth.Contract(erc20ABI, erc20TokenAddress);
    let gasEstimate = await erc20TokenContract.methods.allowance(
        owner, spender
    ).estimateGas({ from: owner });

    let res = await erc20TokenContract.methods.allowance(
        owner, spender
    ).call({
        from: owner,
        gas: gasEstimate
    })
    return res
}

module.exports = {approveERC20, getAllowance, getBalance}

