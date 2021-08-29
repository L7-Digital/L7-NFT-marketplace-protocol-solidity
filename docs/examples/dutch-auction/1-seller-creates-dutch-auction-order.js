const fs = require("fs");

const {makeOrder, signOrder} = require('../utils/order')
const {approveERC20, getAllowance, getBalance} = require('../utils/erc20')
const {getProxies, registerProxy} = require('../utils/proxy')
const {getUnixTime, getUnixTimeAfterHours} = require('../utils/utime')

const {ERC721ContractAddress, keys, exchangeAddress, zeroAddress, erc20TokenAddress, tokenTransferProxyAddress, web3} = require("../utils/config");
const {makeReplacementPattern} = require("../utils/order");
const {ERC721_mint, ERC721_setApprovalForAll} = require("../utils/ERC721/nft");

const LOG_INDEX = "[ 1 ]";

/**
 * DUTCH AUCTION
 * This section is for the seller to create, sign and display his selling order.
 */

async function sellerCreatesDutchAuction() {
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
     * 2. Create orders
     */
    console.log(LOG_INDEX, "Step 2. Create orders")
    let sell = makeOrder(exchangeAddress, keys.sellerWalletAddress, '0x0000000000000000000000000000000000000000', '0x1Ad8359dF979371a9F1A305776562597bd0A7Da0', ERC721ContractAddress)
    sell.side = 1
    sell.saleKind = 1 // saleKind = 1 => Dutch Auction
    /**
     * This auction lists a SellOrder whose price falls from `1000` down to `100` in `1 hour`.
     */
    sell.basePrice = 1000 // The starting price
    sell.extra = 900 // The difference to the lowest price (= 1000 - 100)
    sell.listingTime = getUnixTime() // get the current time stamp
    sell.expirationTime = getUnixTimeAfterHours(1)  // Set this auction ends in 12 hours
    sell.paymentToken = erc20TokenAddress // payment token is an ERC20 token
    sell.makerRelayerFee = 100 // set the fee paid to sell.feeRecipient to 1%

    /**
     * 2.1 If the tx fee > 0, the seller must approve the TokenTransferProxy to transfer an amount of token
     * equal to the fee (in case of fixed-price order, fee = (sell.basePrice * sell.makerRelayerFee)/ 10000
     * */
    if (sell.makerRelayerFee > 0) {
        console.log(LOG_INDEX, "Step 2.2 Seller allows TokenTransferProxy to spend token (paying fee)")
        let erc20Balance = await getBalance(keys.sellerWalletAddress, erc20TokenAddress)
        console.log(LOG_INDEX, 'currentERC20Balance', erc20Balance)

        let erc20Allowance = await getAllowance(keys.sellerWalletAddress, tokenTransferProxyAddress, erc20TokenAddress)
        let fee = (sell.basePrice * sell.makerRelayerFee) / 10000
        if (erc20Allowance < fee) {
            let res = await approveERC20(keys.sellerWalletAddress, tokenTransferProxyAddress, fee, erc20TokenAddress)
            console.log(LOG_INDEX, "[seller] approveERC20 status", res)
        }
    }


    /**
     * 3. Prepare the callData for the Sell Order
     * Here, we want to transfer the NFT from the sell.Maker to the buy.Maker. Using the transferForm function with
     * the following signature `transferFrom(address from, address to, uint256 tokenId)`.
     *
     * Regularly, the address of the `buyer` (or `to`) hasn't been determined at the time an order is created. Therefore,
     * we replace this value with the zeroAddress, and enable replacing it. Other parameters cannot be changed.
     * */
    console.log("Step 3. Create callData and replacement patterns")
    let callDataSell = web3.eth.abi.encodeFunctionCall({
        name: 'transferFrom',
        type: 'function',
        inputs: [{
            type: 'address',
            name: 'from'
        }, {
            type: 'address',
            name: 'to'
        }, {
            type: 'uint256',
            name: 'tokenId'
        }]
    }, [keys.sellerWalletAddress, zeroAddress, id])
    console.log(LOG_INDEX, "callDataSell", callDataSell)

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
     * 4. Sign orders off-chain
     */
    console.log("Step 4. Sign orders")
    sell.sig = await signOrder(sell, keys.sellerPrivateKey);

    /**
     * 5. Send the order to the website for displaying.
     * 
     * Note: We just write the order to file here for later use.
     */

    // TODO: Send order to the exchange
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
//         await sellerCreatesDutchAuction();
//     } catch (e) {
//         console.log(e);
//     }
// })();

module.exports = {
    sellerCreatesDutchAuction
}