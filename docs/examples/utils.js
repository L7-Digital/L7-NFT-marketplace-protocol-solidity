const Web3 = require('web3')
const crypto = require('crypto')
const ethers = require('ethers')
const BigNumber = require('bignumber.js')
const provider = new Web3.providers.HttpProvider('http://localhost:7545')
const web3 = new Web3(provider)

const makeOrder = (exchange, maker, taker, feeRecipient, target) => ({
    exchange: exchange,
    maker: maker,
    taker: taker,
    makerRelayerFee: 0,
    takerRelayerFee: 0,
    makerProtocolFee: 0,
    takerProtocolFee: 0,
    feeRecipient: feeRecipient,
    feeMethod: 0,
    side: 0,
    saleKind: 0,
    target: target,
    howToCall: 0,
    calldata: '0x',
    replacementPattern: '0x',
    staticTarget: '0x0000000000000000000000000000000000000000',
    staticExtradata: '0x',
    paymentToken: '0x0000000000000000000000000000000000000000',
    basePrice: 0,
    extra: 0,
    listingTime: 0,
    expirationTime: 0,
    salt: crypto.randomInt(0, 2000000)
})

const hashOrder = (order) => {
    return web3.utils.soliditySha3(
        {type: 'address', value: order.exchange},
        {type: 'address', value: order.maker},
        {type: 'address', value: order.taker},
        {type: 'uint', value: new BigNumber(order.makerRelayerFee)},
        {type: 'uint', value: new BigNumber(order.takerRelayerFee)},
        {type: 'uint', value: new BigNumber(order.takerProtocolFee)},
        {type: 'uint', value: new BigNumber(order.takerProtocolFee)},
        {type: 'address', value: order.feeRecipient},
        {type: 'uint8', value: order.feeMethod},
        {type: 'uint8', value: order.side},
        {type: 'uint8', value: order.saleKind},
        {type: 'address', value: order.target},
        {type: 'uint8', value: order.howToCall},
        {type: 'bytes', value: order.calldata},
        {type: 'bytes', value: order.replacementPattern},
        {type: 'address', value: order.staticTarget},
        {type: 'bytes', value: order.staticExtradata},
        {type: 'address', value: order.paymentToken},
        {type: 'uint', value: new BigNumber(order.basePrice)},
        {type: 'uint', value: new BigNumber(order.extra)},
        {type: 'uint', value: new BigNumber(order.listingTime)},
        {type: 'uint', value: new BigNumber(order.expirationTime)},
        {type: 'uint', value: order.salt}
    ).toString('hex')
}

const hashToSign = (order) => {
    const packed = web3.utils.soliditySha3(
        {type: 'address', value: order.exchange},
        {type: 'address', value: order.maker},
        {type: 'address', value: order.taker},
        {type: 'uint', value: new BigNumber(order.makerRelayerFee)},
        {type: 'uint', value: new BigNumber(order.takerRelayerFee)},
        {type: 'uint', value: new BigNumber(order.takerProtocolFee)},
        {type: 'uint', value: new BigNumber(order.takerProtocolFee)},
        {type: 'address', value: order.feeRecipient},
        {type: 'uint8', value: order.feeMethod},
        {type: 'uint8', value: order.side},
        {type: 'uint8', value: order.saleKind},
        {type: 'address', value: order.target},
        {type: 'uint8', value: order.howToCall},
        {type: 'bytes', value: order.calldata},
        {type: 'bytes', value: order.replacementPattern},
        {type: 'address', value: order.staticTarget},
        {type: 'bytes', value: order.staticExtradata},
        {type: 'address', value: order.paymentToken},
        {type: 'uint', value: new BigNumber(order.basePrice)},
        {type: 'uint', value: new BigNumber(order.extra)},
        {type: 'uint', value: new BigNumber(order.listingTime)},
        {type: 'uint', value: new BigNumber(order.expirationTime)},
        {type: 'uint', value: order.salt}
    ).toString('hex')
    return web3.utils.soliditySha3(
        {type: 'string', value: '\x19Ethereum Signed Message:\n32'},
        {type: 'bytes32', value: packed}
    ).toString('hex')
}

module.exports = {makeOrder, hashOrder, hashToSign}