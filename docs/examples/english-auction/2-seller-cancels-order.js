const {keys, exchange
} = require("../utils/config");

const LOG_INDEX = "[ 2 ]";

/**
 * To cancel the order, just call `cancelOrder_()` with the order that has been created in 
 * `1-seller-creates-english-auction-order.js`
 * 
 * The fee of gas is charged to the seller.
 */

async function sellerCancelsOrder() {
    let sellAuction = require("./sellAuction.json");

    /**
     * 1. Prepare the order information
     */
    let order = sellAuction.order;

    /**
     * 2. Sign the order
     */
    order.sig = await signOrder(order, keys.sellerPrivateKey);
    console.log('sellSig', order.sig);

    /**
     * 3. Cancel the order
     */
    await exchange.methods.cancelOrder_(
        [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken],
        [order.makerRelayerFee, order.takerRelayerFee, order.makerProtocolFee, order.takerProtocolFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt],
        order.feeMethod,
        order.side,
        order.saleKind,
        order.howToCall,
        order.calldata,
        order.replacementPattern,
        order.staticExtradata,
        order.sig.v, order.sig.r, order.sig.s
    ).send({
        from: keys.sellerWalletAddress,
        gas: 1000000,
    }).on('receipt', function(receipt){
        console.log(LOG_INDEX, "Cancel order receipt", receipt);
    }).on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
        console.log(LOG_INDEX, "error", error, receipt)
    });
}

// (async () => {
//     try {
//         await sellerCancelsOrder();
//     } catch (e) {
//         console.log(e);
//     }
// })();

module.exports = {
    sellerCancelsOrder
}

