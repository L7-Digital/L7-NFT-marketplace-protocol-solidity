const fs = require("fs");

const {signOrder} = require('../utils/order')
const {approveERC20, getAllowance, getBalance} = require('../utils/erc20')
const utime = require('../utils/utime')
const crypto = require('crypto')

const {keys, exchange, erc20TokenAddress, tokenTransferProxyAddress, web3} = require("../utils/config");

const LOG_INDEX = "[ 2 ]";

/**
 * The current price of the auction:
 * - should be displayed at run-time on the exchange website
 * - is determined by the contract, at the time of sending buy order
 * 
 * The time of sending buy order (`buy.listingTime`) CANNOT be
 * manipulated, since it will be verified with `block.timestamp`.
 */

async function buyerMatchesOrder({isTimeManipulatedDemo}={}) {
    let sellAuction = require("./sellAuction.json")
    let sell = JSON.parse(JSON.stringify(sellAuction.order,null,0));

    /**
     * 1. Choose the asset to bid
     * `tokenId` is provide buy the seller, see `nftId` in `1-seller-creates-english-auction-order.js`
     * */

    // FIXME: Replace the nftId 
    let nftId = sellAuction.nftID
    console.log(LOG_INDEX, "Buyer get NFT ID to trade", nftId)

    /**
     * 2. Prepare the callData for the Bid (Buy Order)
     * */
    let callDataBuy = web3.eth.abi.encodeFunctionCall({
        name: 'transferFrom',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'from'
        },{
            type: 'address',
            name: 'to'
        },{
            type: 'uint256',
            name: 'tokenId'
        }]
    }, [
        "0x0000000000000000000000000000000000000000",   // Replace by the seller address is provided in the auction, or just by a zero-address
        keys.buyerWalletAddress,    // Buyer address here
        nftId
    ])
    console.log(LOG_INDEX, "callDataBuy    ", callDataBuy)

    let rplmPatternBuy = '0x' + '00000000'                                                     
                        + 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'   // [address of seller  `from`]: open for being overridden by seller
                        + '0000000000000000000000000000000000000000000000000000000000000000'   
                        + '0000000000000000000000000000000000000000000000000000000000000000';  
    console.log(LOG_INDEX, "rplmPatternBuy ", rplmPatternBuy)

    /**
     * 3. Create the matching order
     * 
     * Change the appropriate params based on the sell order
     */
    let buy = JSON.parse(JSON.stringify(sellAuction.order,null,0));

    buy.maker = keys.buyerWalletAddress
    buy.taker = sell.maker
    buy.side = 0

    buy.calldata = callDataBuy
    buy.replacementPattern = rplmPatternBuy

    buy.makerRelayerFee = 0
    buy.feeRecipient = "0x0000000000000000000000000000000000000000"   // Must be set to zero-address, since only one side of orders sets this param
    
    buy.extra = 0                                                     // Can be set to 0, or be kept as in sell order

    buy.listingTime = isTimeManipulatedDemo ?
                      utime.getUnixTime() + 1000 :                    // DEMO[2b]: demo failed-case `listingTime` exceeds `block.timestamp` for lower price
                      utime.getUnixTime()                             // DEMO[2a]: success-case

    buy.expirationTime = buy.listingTime + 300                        // FIXME:BUG: `expirationTime` must be 0 theoretically. However, there is bug
                                                                      // in the contract which requires `expirationTime` must be defined.

    buy.salt = crypto.randomInt(0, 2000000)

    /** 
     * 4. Sign order
     */
    console.log(LOG_INDEX, "[buyer] Sign buy order")
    buy.sig = await signOrder(buy, keys.buyerPrivateKey);
    console.log(LOG_INDEX, 'buySig', buy.sig)

    /**
     * 5. The buyer must approve the TokenTransferProxy to spend sufficient amount (if needed)
     */
    console.log(LOG_INDEX, "Buyer allows TokenTransferProxy to spend token (if needed)")
    let erc20Balance = await getBalance(keys.buyerWalletAddress, erc20TokenAddress)
    console.log(LOG_INDEX, 'currentERC20Balance', erc20Balance)

    let erc20Allowance = await getAllowance(keys.buyerWalletAddress, tokenTransferProxyAddress, erc20TokenAddress)
    console.log(LOG_INDEX, 'currentAllowance', erc20Allowance);

    // let erc20RequiredAllowance = buy.basePrice*(1+buy.makerRelayerFee/1000)
    let erc20RequiredAllowance = 20000;                 // FIXME:BUG: Problem of charging fee, dont know when and who to set

    console.log(LOG_INDEX, 'requiredAllowance', erc20RequiredAllowance);
    if (erc20Allowance < erc20RequiredAllowance) {
        let res = await approveERC20(keys.buyerWalletAddress, tokenTransferProxyAddress, erc20RequiredAllowance - erc20Allowance, erc20TokenAddress)
        console.log(LOG_INDEX, "[buyer] approveERC20 status", res)
    }

    /**
     * LOG
     */
    buyAuction = {
        nftID: nftId,
        order: buy
    }

    fs.writeFileSync("./buyAuction.json", JSON.stringify(buyAuction, null, 4), (e) => {
        if (e) {  
            console.error(e);
            return;
        };
        console.log(LOG_INDEX, "Buy auction info is written at ./buyAuction.json");
    });

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

    /**
     * 6. Do atomic match
     */
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
        from: keys.buyerWalletAddress,
        gas: 1000000,
    }).on('receipt', function(receipt){
        console.log(LOG_INDEX, "Orders have been atomic matched!", receipt, receipt.events);
    }).on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
        console.error(LOG_INDEX, "atomicMatch_ encounters error!", receipt);
    });
}

// (async () => {
//     try {
//         await buyerMatchesOrder();
//     } catch (e) {
//         console.log(e);
//     }
// })();

module.exports = {
    buyerMatchesOrder
}