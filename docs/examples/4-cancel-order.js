const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545')
const web3 = new Web3(provider)
const BN = require("bignumber.js");

const walletAddress = require('./config.json').walletAddress
const {makeOrder, hashToSign} = require('./utils')

const fs = require('fs');

const privateKey = fs.readFileSync("../../.secret").toString().trim(); // read the secret key of the account.
web3.eth.accounts.wallet.add({
    privateKey: privateKey,
    address: walletAddress
});

const exchangeABI = require('../../abi/TaureumExchange.json').abi
const exchangeAddress = require('../../config.json').deployed.testnet.TaureumExchange
const proxyAddress = require('../../config.json').deployed.testnet.TaureumProxyRegistry

let TaureumExchange = new web3.eth.Contract(exchangeABI, exchangeAddress);


/**
 * This function will have the Exchange approve an Order created by the `walletAddress`. The `msg.sender` must be the order creator.
 *
 * The following example actually invoke method `approveOrder_()` in the `TaureumExchange` contract.
 */
(async () => {
    try {
        let order = makeOrder(exchangeAddress, walletAddress, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', proxyAddress)
        let hashedOrder = hashToSign(order)
        let sig = await web3.eth.sign(hashedOrder, walletAddress)

        const r = '0x' + sig.slice(2, 66)
        const s = '0x' + sig.slice(66, 130)
        const v = 27 + parseInt('0x' + sig.slice(130, 132), 16)
        console.log(r,s,v)

        const gasEstimate = await TaureumExchange.methods.cancelOrder_(
            [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken],
            [order.makerRelayerFee, order.takerRelayerFee, order.makerProtocolFee, order.takerProtocolFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt],
            order.feeMethod,
            order.side,
            order.saleKind,
            order.howToCall,
            order.calldata,
            order.replacementPattern,
            order.staticExtradata,
            v, r, s
        ).estimateGas({ from: walletAddress });

        console.log(`estimatedGas: ${gasEstimate}`)

        TaureumExchange.methods.cancelOrder_(
            [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken],
            [order.makerRelayerFee, order.takerRelayerFee, order.makerProtocolFee, order.takerProtocolFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt],
            order.feeMethod,
            order.side,
            order.saleKind,
            order.howToCall,
            order.calldata,
            order.replacementPattern,
            order.staticExtradata,
            v, r, s
        ).send({
            from: walletAddress,
            gas: gasEstimate
        }).on('receipt', function(receipt){
            console.log(`Cancel order receipt`, receipt);
        }).on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
            console.log("error", error, receipt)
        });
    } catch (e) {
        console.log(e);
    }
})();
