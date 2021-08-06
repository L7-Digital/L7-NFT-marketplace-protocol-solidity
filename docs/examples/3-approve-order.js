const {exchange, exchangeAddress, ERC721ContractAddress, keys} = require("./utils/config");
const {makeOrder} = require('./utils/order');


/**
 * This function will have the Exchange approve an Order created by the `walletAddress`.
 *
 * The following example actually invoke method `approveOrder_()` in the `TaureumExchange` contract.
 */
(async () => {
    try {
        let order = makeOrder(exchangeAddress, keys.walletAddress, '0x0000000000000000000000000000000000000001', '0x0000000000000000000000000000000000000000', ERC721ContractAddress)

        const gasEstimate = await exchange.methods.approveOrder_(
            [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken],
            [order.makerRelayerFee, order.takerRelayerFee, order.makerProtocolFee, order.takerProtocolFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt],
            order.feeMethod,
            order.side,
            order.saleKind,
            order.howToCall,
            order.calldata,
            order.replacementPattern,
            order.staticExtradata,
            true,
        ).estimateGas({ from: keys.walletAddress });

        console.log(`estimatedGas for order-approving: ${gasEstimate}`)

        exchange.methods.approveOrder_(
            [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken],
            [order.makerRelayerFee, order.takerRelayerFee, order.makerProtocolFee, order.takerProtocolFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt],
            order.feeMethod,
            order.side,
            order.saleKind,
            order.howToCall,
            order.calldata,
            order.replacementPattern,
            order.staticExtradata,
            true,
        ).send({
            from: keys.walletAddress,
            gas: gasEstimate
        }).on('receipt', function(receipt){
            console.log(`Approve order receipt`, receipt);
        }).on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
            console.log("error", error, receipt)
        });
    } catch (e) {
        console.log(e);
    }
})();
