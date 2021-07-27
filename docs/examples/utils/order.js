const crypto = require('crypto')
const BigNumber = require('bignumber.js')

const {web3, exchange, keys} = require("./config");

const exchangeHash = async (order) => {
    return await exchange.methods.hashOrder_(
        [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken],
        [order.makerRelayerFee, order.takerRelayerFee, order.makerProtocolFee, order.takerProtocolFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt],
        order.feeMethod,
        order.side,
        order.saleKind,
        order.howToCall,
        order.calldata,
        order.replacementPattern,
        order.staticExtradata,
    ).call({from : keys.walletAddress})
}

const exchangeHashToSign = async (order) => {
    return await exchange.methods.hashToSign_(
        [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken],
        [order.makerRelayerFee, order.takerRelayerFee, order.makerProtocolFee, order.takerProtocolFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt],
        order.feeMethod,
        order.side,
        order.saleKind,
        order.howToCall,
        order.calldata,
        order.replacementPattern,
        order.staticExtradata,
    ).call({from : keys.walletAddress})
}

const makeOrder = (exchangeAddress, maker, taker, feeRecipient, target, makerRelayerFee = 0, paymentToken = '0x0000000000000000000000000000000000000000') => ({
    exchange: exchangeAddress,
    maker: maker,
    taker: taker,
    /* Maker fees are deducted from the token amount that the maker receives. Taker fees are extra tokens that must be paid by the taker. */
    makerRelayerFee: makerRelayerFee, // 100 => 1%, 250 => 2,5%
    takerRelayerFee: 0,
    makerProtocolFee: 0,
    takerProtocolFee: 0,
    feeRecipient: feeRecipient,
    feeMethod: 1,
    side: 0,
    saleKind: 0,
    target: target,
    howToCall: 0,
    calldata: '0x',
    replacementPattern: '0x',
    staticTarget: '0x0000000000000000000000000000000000000000',
    staticExtradata: '0x',
    paymentToken: paymentToken,
    basePrice: 1000, // calculated based on the `paymentToken`
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
        {type: 'uint256', value: new BigNumber(order.makerRelayerFee)},
        {type: 'uint256', value: new BigNumber(order.takerRelayerFee)},
        {type: 'uint256', value: new BigNumber(order.makerProtocolFee)},
        {type: 'uint256', value: new BigNumber(order.takerProtocolFee)},
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
        {type: 'uint256', value: new BigNumber(order.basePrice)},
        {type: 'uint256', value: new BigNumber(order.extra)},
        {type: 'uint256', value: new BigNumber(order.listingTime)},
        {type: 'uint256', value: new BigNumber(order.expirationTime)},
        {type: 'uint256', value: order.salt}
    ).toString('hex')
}

const toEncodedMessage = (order) => {
    return web3.eth.abi.encodeParameters(
        ['address', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'address', 'uint8', 'uint8',
            'uint8', 'address', 'uint8', 'bytes', 'bytes', 'address', 'bytes', 'address', 'uint256', 'uint256',
            'uint256', 'uint256', 'uint256'],
        [order.maker, order.taker, new BigNumber(order.makerRelayerFee), new BigNumber(order.takerRelayerFee),
            new BigNumber(order.makerProtocolFee), new BigNumber(order.takerProtocolFee), order.feeRecipient,
            order.feeMethod, order.side, order.saleKind, order.target, order.howToCall, order.calldata,
            order.replacementPattern, order.staticTarget, order.staticExtradata, order.paymentToken,
            new BigNumber(order.basePrice), new BigNumber(order.extra), new BigNumber(order.listingTime),
            new BigNumber(order.expirationTime), order.salt]
    )
}

const hashToSign = (order) => {
    const packed = web3.utils.soliditySha3(
        {type: 'address', value: order.exchange},
        {type: 'address', value: order.maker},
        {type: 'address', value: order.taker},
        {type: 'uint256', value: new BigNumber(order.makerRelayerFee)},
        {type: 'uint256', value: new BigNumber(order.takerRelayerFee)},
        {type: 'uint256', value: new BigNumber(order.makerProtocolFee)},
        {type: 'uint256', value: new BigNumber(order.takerProtocolFee)},
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
        {type: 'uint256', value: new BigNumber(order.basePrice)},
        {type: 'uint256', value: new BigNumber(order.extra)},
        {type: 'uint256', value: new BigNumber(order.listingTime)},
        {type: 'uint256', value: new BigNumber(order.expirationTime)},
        {type: 'uint256', value: order.salt}
    )
    console.log("packed", packed, typeof packed)
    return web3.utils.soliditySha3(
        web3.eth.abi.encodeParameters(['string', 'bytes32'], ['\x19Ethereum Signed Message:\n32', packed])
    ).toString('hex')
}

const signOrder = async (order, signer) => {
    // console.log()
    let orderHash = hashOrder(order)
    let sig = await web3.eth.accounts.sign(orderHash, signer)

    return sig
};

//`to` must be greater than from.
const makeReplacementPattern = (callData, from, to) => {
    let str = "0x" + new Array(callData.length - 1).join("0")
    return str.substr(0, from) + new Array(to + 1 - from).join("f") + str.substr(to)
}
module.exports = {makeOrder, hashOrder, hashToSign, signOrder, exchangeHash, exchangeHashToSign, toEncodedMessage, makeReplacementPattern}