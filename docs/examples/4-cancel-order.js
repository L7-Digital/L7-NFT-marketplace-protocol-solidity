const {makeOrder, signOrder} = require('./utils/order');
const {keys, exchange, exchangeAddress, nftContractAddress, web3} = require('./utils/config');

/**
 * This function will have the Exchange approve an Order created by the `walletAddress`. The `msg.sender` must be the order creator.
 *
 * The following example actually invoke method `cancelOrder_()` in the `TaureumExchange` contract.
 */
(async () => {
    try {
        let order = makeOrder(exchangeAddress, keys.sellerWalletAddress, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', nftContractAddress)
        let sig = await signOrder(order, keys.sellerPrivateKey)
        console.log("signer", await web3.eth.accounts.recover(sig))

        const gasEstimate = await exchange.methods.cancelOrder_(
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
        ).estimateGas({ from: keys.sellerWalletAddress });

        console.log(`estimatedGas: ${gasEstimate}`)

        exchange.methods.cancelOrder_(
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
            from: keys.sellerWalletAddress,
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
