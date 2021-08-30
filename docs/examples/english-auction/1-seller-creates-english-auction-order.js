const fs = require("fs");

const {makeOrder} = require('../utils/order')
const {getProxies, registerProxy} = require('../utils/proxy')
const {getUnixTime, getUnixTimeAfterHours} = require('../utils/utime')

const {ERC721ContractAddress, keys, exchangeAddress, zeroAddress, erc20TokenAddress, tokenTransferProxyAddress, web3} = require("../utils/config");
const {makeReplacementPattern} = require("../utils/order");
const {ERC721_mint, ERC721_setApprovalForAll} = require("../utils/ERC721/nft");

const LOG_INDEX = "[ 1 ]";

/**
 * The flow below is the same as in `atomic-match-with-replacement-patterns.js`
 * The only different are the parameters that passed to make a AUCTION order
 * For quick lookup, see `Section 3. Create sell auction order...`
 * 
 * NOTE: all steps below are for DISPLAY PURPOSE ONLY. The display is all
 * handled by the relayer, no contract is involved.
 */

async function sellCreateEnglishAuction() {
    /**
     * 1. Mint some token on the NFT contracts.
     * */
    console.log(LOG_INDEX, "Step 1. Mint NFT")
    let id = await ERC721_mint(keys.sellerWalletAddress)

    /**
     * 1.1 Approve the authenticated proxy to spent the NFT (if needed). At this step, caller must ensure that his
     * proxy has been created.
     * */
    console.log(LOG_INDEX, "Step 1.2. Seller approves the proxy to transfer the asset")
    let proxyAddress = await getProxies(keys.sellerWalletAddress)
    if (proxyAddress === zeroAddress) {
        await registerProxy(keys.sellerWalletAddress)
    }
    await ERC721_setApprovalForAll(keys.sellerWalletAddress, proxyAddress, true)
    console.log(LOG_INDEX, "Seller approves the proxy to transfer the asset")

    /**
     * 2. Create sell auction order
     *
     * This order is sent directly to the exchange for displaying only.
     * But exchange must store this order off-chain in order seller asks to cancel this order.
     */
    let sell = makeOrder(exchangeAddress, keys.sellerWalletAddress, zeroAddress, '0x1Ad8359dF979371a9F1A305776562597bd0A7Da0', ERC721ContractAddress)
    sell.side = 1
    sell.basePrice = 1000 // The starting price
    sell.listingTime = getUnixTime() // get the current time stamp
    sell.expirationTime = getUnixTimeAfterHours(1)  // Set this auction ends in 12 hours
    sell.paymentToken = erc20TokenAddress // payment token is an ERC20 token
    sell.makerRelayerFee = 100 // set the fee paid to sell.feeRecipient to 1%

    /**
     * 3. Prepare the callData for the Sell Order
     * Here, we want to transfer the NFT from the sell.Maker to the buy.Maker. Using the transferForm function with
     * the following signature `transferFrom(address from, address to, uint256 tokenId)`.
     * */
    let callDataSell = web3.eth.abi.encodeFunctionCall({
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
        keys.sellerWalletAddress,
        '0x0000000000000000000000000000000000000000',  // Leave this address as zeros, since seller doesnt know who the buyer will be
        id                                          // tokenId of the NFT to be sold
    ])
    console.log(LOG_INDEX, "callDataSell   ", callDataSell)

    /**
     * 3.1 Prepare replacement pattern for sell order.
     * In this case, the `to` parameter is located at the bytes [36-68] of the callData.
     * So we enable replacing it with non-zero flags.
     *
     * The replacement pattern will look like this.
     * '0x' + '00000000'                                                     // [function signature `safeTransferFrom`]: protected, cannot be replaced
     + '0000000000000000000000000000000000000000000000000000000000000000'    // [address of the seller `from`]: cannot be replaced
     + 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'    // [address of the buyer `to`]: can be replaced
     + '0000000000000000000000000000000000000000000000000000000000000000'    // tokenId: cannot be replaced
     */
    let rplmPatternSell = makeReplacementPattern(callDataSell, 74, 138) //[36 * 2 + 2: 68 * 2 + 2]
    sell.calldata = callDataSell
    sell.replacementPattern = rplmPatternSell

    /** 
     * 4. Sign order: is NOT REQUIRED here, neither off-chain nor on-chain
     * 
     * Since at this phase, seller only sends the information of the sell order
     * to the exchange. The exchange then displays the order, and have no further
     * permission to proceed this order.
     */

    /**
     * 5. Send the order to exchange
     * 
     * Note: We just print the order for demonstration and write the order to file
     * for later use.
     */

    // FIXME: Implement the sending order to exchange here
    console.log(LOG_INDEX, "Seller lists sell order", sell)
    
    let sellAuction = {
        nftID: id,
        order: sell
    }

    fs.writeFileSync("./sellAuction.json", JSON.stringify(sellAuction, null, 4), (e) => {
        if (e) {  
            console.error(e);
            return;
        };
        console.log(LOG_INDEX, "Sell auction info is written at ./sellAuction.json");
    });
}

// (async () => {
//     try {
//         await sellCreateEnglishAuction();
//     } catch (e) {
//         console.log(e);
//     }
// })();

module.exports = {
    sellCreateEnglishAuction
}