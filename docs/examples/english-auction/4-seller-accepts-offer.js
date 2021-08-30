const fs = require('fs')

const {signOrder} = require('../utils/order')

const {keys, exchange, erc20TokenAddress, tokenTransferProxyAddress} = require("../utils/config");
const {getUnixTime} = require('../utils/utime')
const {approveERC20, getAllowance, getBalance} = require('../utils/erc20')
const crypto = require('crypto')

const LOG_INDEX = "[ 4 ]";

/**
 * After getting the information of buy offers from the exchange, seller now
 * choose which buy offer to match. The match the simply done by calling
 * `atomicMatch_()`
 */

async function sellerAcceptsOffer() {
    let sellAuction = require("./sellAuction.json")
    let buyAuction = require("./buyAuction.json")

    let sell = JSON.parse(JSON.stringify(sellAuction.order,null,0));
    let buy = JSON.parse(JSON.stringify(buyAuction.order,null,0));

    /**
     * 1. Modify the sell order to match with the highest bid order from the buyer.
     */
    console.log(LOG_INDEX, "[seller] Create final sell order to accept bid")

    sell.maker = keys.sellerWalletAddress
    sell.taker = keys.buyerWalletAddress

    sell.basePrice = buy.basePrice;                       // Re-set the base price to the highest bid
    sell.listingTime = getUnixTime();
    sell.expirationTime = 0                                // Set to infinity since this order will be matched right after now
    sell.salt = crypto.randomInt(0, 2000000);
    console.log(LOG_INDEX, "sell order", sell)


    /** 
     * 2. Sign the final sell order
     */
    console.log(LOG_INDEX, "[seller] Sign sell order")
    sell.sig = await signOrder(sell, keys.sellerPrivateKey);
    console.log(LOG_INDEX, "sellSig", sell.sig)

    /**
     * 3. Allowing proxy to charge fee from seller.
     * 
     * If the tx fee > 0, the seller must approve the TokenTransferProxy to transfer an amount of token
     * equal to the fee (in case of fixed-price order, fee = (sell.basePrice * sell.makerRelayerFee)/ 10000
     */
    if (sell.makerRelayerFee > 0) {
        console.log(LOG_INDEX, "Seller allows TokenTransferProxy to spend token (paying fee)")
        let erc20Balance = await getBalance(keys.sellerWalletAddress, erc20TokenAddress)
        console.log(LOG_INDEX, 'currentERC20Balance', erc20Balance)

        let erc20Allowance = await getAllowance(keys.sellerWalletAddress, tokenTransferProxyAddress, erc20TokenAddress)
        console.log(LOG_INDEX, 'currentAllowance', erc20Allowance)

        let erc20RequiredAllowance = (sell.basePrice * sell.makerRelayerFee) / 10000; // FIXME: this is the amount of fee which the seller will send back to the relayer.
        console.log(LOG_INDEX, 'requiredAllowance', erc20RequiredAllowance);

        if (erc20Allowance < erc20RequiredAllowance) {
            let res = await approveERC20(keys.sellerWalletAddress, tokenTransferProxyAddress, erc20RequiredAllowance, erc20TokenAddress)
            console.log(LOG_INDEX, "[seller] approveERC20 status", res)
        }
    }

    /**
     * 3. Do atomic match
     */

    let auction = {
        sell: sell,
        buy: buy
    }

    fs.writeFileSync("./auction.json", JSON.stringify(auction, null, 4), (e) => {
        if (e) {  
            console.error(e);
            return;
        };
        console.log(LOG_INDEX, "Final match info is written at ./auction.json");
    });

    await exchange.methods.atomicMatch_(
        [buy.exchange, buy.maker, buy.taker, buy.feeRecipient, buy.target, buy.staticTarget, buy.paymentToken, sell.exchange, sell.maker, sell.taker, sell.feeRecipient, sell.target, sell.staticTarget, sell.paymentToken],
        [buy.makerRelayerFee, buy.takerRelayerFee, buy.makerProtocolFee, buy.takerProtocolFee, buy.basePrice, buy.extra, buy.listingTime, buy.expirationTime, buy.salt, sell.makerRelayerFee, sell.takerRelayerFee, sell.makerProtocolFee, sell.takerProtocolFee, sell.basePrice, sell.extra, sell.listingTime, sell.expirationTime, sell.salt],
        [buy.feeMethod, buy.side, buy.saleKind, buy.howToCall, sell.feeMethod, sell.side, sell.saleKind, sell.howToCall],
        buy.calldata,
        sell.calldata,
        buy.replacementPattern,
        sell.replacementPattern,
        buy.staticExtradata,
        sell.staticExtradata,
        [buy.sig.v, sell.sig.v],
        [buy.sig.r, buy.sig.s, sell.sig.r, sell.sig.s, '0x0000000000000000000000000000000000000000000000000000000000000000']
    ).send({
        from: keys.sellerWalletAddress, // FIXME: This `atomicMatch_` could be sent by any one, either the seller or the buyer or a third party as long as both orders and signatures are available.
        // from: keys.buyerWalletAddress, // FIXME: This `atomicMatch_` could be send by any one, either the seller or the buyer or a third party as long as both orders and signatures are available.
        gas: 1000000,
    }).on('receipt', function(receipt){
        console.log(LOG_INDEX, "Orders have been atomic matched!", receipt, receipt.events);
    }).on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
        console.error(LOG_INDEX, "atomicMatch_ encounters error!", receipt);
    });
}

// (async () => {
//     try {
//         sellerAcceptsOffer();
//     } catch (e) {
//         console.log(e);
//     }
// })();

module.exports = {
    sellerAcceptsOffer
}