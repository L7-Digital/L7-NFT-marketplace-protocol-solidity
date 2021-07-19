const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545')
const web3 = new Web3(provider)

const {makeOrder, signOrder} = require('./utils/order')
const {sellerPrivateKey, sellerWalletAddress, loadKeys} = require('./utils/utils')
loadKeys(web3)


const exchangeABI = require('../../abi/TaureumExchange.json').abi
const exchangeAddress = require('../../config.json').deployed.testnet.TaureumExchange

let TaureumExchange = new web3.eth.Contract(exchangeABI, exchangeAddress);

/**
 * This function will have the Exchange approve an Order created by the `walletAddress`. The `msg.sender` must be the order creator.
 *
 * The following example actually invoke method `cancelOrder_()` in the `TaureumExchange` contract.
 */
(async () => {
    try {
        let target = "0xCa007BcC979B8Ca76D9CF327287e7ad3F269DA6B"
        let order = makeOrder(exchangeAddress, sellerWalletAddress, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', target)
        let sig = await signOrder(order, sellerPrivateKey)
        console.log("signer", await web3.eth.accounts.recover(sig))

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
            sig.v, sig.r, sig.s
        ).estimateGas({ from: sellerWalletAddress });

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
            sig.v, sig.r, sig.s
        ).send({
            from: sellerWalletAddress,
            gas: gasEstimate,
        }).on('receipt', function(receipt){
            console.log(`Cancel order receipt`, receipt);
        }).on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
            console.log("error", error, receipt)
        });
    } catch (e) {
        console.log(e);
    }
})();
