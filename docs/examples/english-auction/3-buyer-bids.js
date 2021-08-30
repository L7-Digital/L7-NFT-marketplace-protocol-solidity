const fs = require("fs");

const {signOrder} = require('../utils/order')
const {getUnixTime, getUnixTimeAfterSeconds, getUnixTimeAfterDays} = require('../utils/utime')

const {keys, erc20TokenAddress, tokenTransferProxyAddress, web3} = require("../utils/config");
const {approveERC20, getAllowance, getBalance} = require('../utils/erc20')
const crypto = require('crypto')

const LOG_INDEX = "[ 3 ]";

/**
 * After the exchange listing the auction, MANY buyers can bid the asset.
 * The bid is treated as a "buy order" or a "buy offer". During the auction
 * happens, one can bid at any price without restrictions.
 * 
 * However, buyers need to set a expiration time for their buy offers (default
 * to 7 days).
 * 
 * At the ends, seller will accepts AN OFFER that they want to. The highest
 * bid may not be the winner.
 * 
 * The exchange only has the responsibility to listing the sell auction, and the
 * buy offers; and NOT assuring the highest bid will be winner, or the transfers
 * will be automatically executed after the auction ends. Result of the auction
 * is all determined by the seller.
 */

async function buyerBids({isOfferExpiresDemo}={}) {
    let sellAuction = require("./sellAuction.json")

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
        keys.sellerWalletAddress,   // The seller address is provided in the auction
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
     * 3. Create the bid order
     * 
     * Change the appropriate params based on the sell order
     */

    let buy = JSON.parse(JSON.stringify(sellAuction.order,null,0));

    buy.maker = keys.buyerWalletAddress;
    buy.taker = keys.sellerWalletAddress;

    buy.makerRelayerFee = 0;
    buy.feeRecipient = "0x0000000000000000000000000000000000000000";

    buy.side = 0;                                       
    buy.calldata = callDataBuy;
    buy.replacementPattern = rplmPatternBuy;

    buy.basePrice = sellAuction.order.basePrice*1.1;            // FIXME: Set the price to bid

    buy.listingTime = getUnixTime();
    buy.expirationTime = isOfferExpiresDemo ? 
                            getUnixTimeAfterSeconds(2) :     // DEMO[4b]: The expiry time for the buy offer set to after 2 seconds, for demo failed-case
                            getUnixTimeAfterDays(7);         // DEMO[4a]: Success case. FIXME: The expiry day for the buy offer set to after 7 days

    buy.salt = crypto.randomInt(0, 2000000);

    /** 
     * 4. Sign the buy order
     */
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
    let erc20RequiredAllowance = buy.basePrice;

    console.log(LOG_INDEX, 'requiredAllowance', erc20RequiredAllowance);
    if (erc20Allowance < erc20RequiredAllowance) {
        let res = await approveERC20(keys.buyerWalletAddress, tokenTransferProxyAddress, erc20RequiredAllowance - erc20Allowance, erc20TokenAddress)
        console.log(LOG_INDEX, "[buyer] approveERC20 status", res)
    }

    /**
     * 5. Send the bid to exchange
     * 
     * Note: We just print the order for demonstration.
     */

    // FIXME: Implement the sending order to exchange here
    console.log(LOG_INDEX, "buy order    ", buy);
    let buyAuction = {
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
}

// (async () => {
//     try {
//         await buyerBids()
//     } catch (e) {
//         console.log(e);
//     }
// })();

module.exports = {
    buyerBids
}