const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545')
const web3 = new Web3(provider)

const {walletAddress, loadKeys} = require("./utils")

// load testing keys
loadKeys(web3)

const erc20ABI = require('../../../abi/ERC20.json').abi

const getBalance = async(address, erc20TokenAddress) => {
    var erc20TokenContract = new web3.eth.Contract(erc20ABI, erc20TokenAddress);

    let gasEstimate = await erc20TokenContract.methods.balanceOf(
        address
    ).estimateGas({ from: walletAddress });

    let res = await erc20TokenContract.methods.balanceOf(
        address
    ).call({
        from: walletAddress,
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

    return res.events.Approval.value
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

