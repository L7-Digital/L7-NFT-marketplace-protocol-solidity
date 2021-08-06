const {
    keys,
    exchange,
    exchangeAddress,
    erc20TokenAddress,
    web3,
    ERC1155ContractAddress,
    tokenTransferProxyAddress,
    zeroAddress,
} = require("./utils/config")
const {makeOrder, signOrder, makeReplacementPattern} = require('./utils/order')
const {ERC1155_mint, ERC1155_setApprovalForAll, ERC1155_transfer, ERC1155_isApprovedForAll} = require('./utils/ERC1155/nft')
const {getProxies} = require('./utils/proxy')
const {approveERC20, getAllowance, getBalance} = require('./utils/erc20');
const crypto = require("crypto");

(async () => {
    try {
        /**
         * 1. Mint some token on the NFT contracts.
         * */
        console.log("Step 1. Mint NFT")
        let mintData = await ERC1155_mint(keys.sellerWalletAddress)
        console.log("mintData", mintData)
        let id = mintData.id
        let amount = 1 + crypto.randomInt(mintData.value - 1) // choose the amount to sell

        /**
         * 1.1 Test transferring the token
         */
        console.log("Step 1.1 Test transferring the minted token.")
        await ERC1155_transfer(keys.sellerWalletAddress, keys.buyerWalletAddress, id, 1)

        /**
         * 1.2 Approve the authenticated proxy to spent the NFT (if needed). At this step, caller must ensure that his
         * proxy has been created.
         * */
        console.log("Step 1.2. Seller approves the proxy to transfer the asset")
        let proxyAddress = await getProxies(keys.sellerWalletAddress)
        let isApproved = await ERC1155_isApprovedForAll(keys.sellerWalletAddress, proxyAddress)
        if (!isApproved) {
            await ERC1155_setApprovalForAll(keys.sellerWalletAddress, proxyAddress, true)
        } else {
            console.log("Already approved")
        }

        /**
         * 2. Create orders
         */
        console.log("Step 2. Create orders")
        let sell = makeOrder(exchangeAddress, keys.sellerWalletAddress, '0x0000000000000000000000000000000000000000', '0x1Ad8359dF979371a9F1A305776562597bd0A7Da0', ERC1155ContractAddress)
        sell.side = 1
        sell.paymentToken = erc20TokenAddress // payment token is an ERC20 token
        sell.makerRelayerFee = 100 // set the fee paid to sell.feeRecipient to 1%

        let buy = makeOrder(exchangeAddress, keys.buyerWalletAddress, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', ERC1155ContractAddress)
        buy.paymentToken = erc20TokenAddress // must be the same as that in the sell order

        /**
         * 2.1 The buyer must allow the proxy to TokenTransferProxy to transfer an amount of the ERC20 token (if needed).
         */
        let erc20Allowance = await getAllowance(keys.buyerWalletAddress, tokenTransferProxyAddress, erc20TokenAddress)
        if (erc20Allowance < buy.basePrice) {
            let res = await approveERC20(keys.buyerWalletAddress, tokenTransferProxyAddress, buy.basePrice - erc20Allowance, erc20TokenAddress)
            console.log("[buyer] approveERC20 status", res)
        }

        /**
         * 2.2 If the tx fee > 0, the seller must approve the TokenTransferProxy to transfer an amount of token
         * equal to the fee (in case of fixed-price order, fee = (sell.basePrice * sell.makerRelayerFee)/ 10000
         * */
        if (sell.makerRelayerFee > 0) {
            // console.log("Step 2.2 Seller allows TokenTransferProxy to spend token (paying fee)")
            // let erc20Balance = await getBalance(keys.sellerWalletAddress, erc20TokenAddress)
            // console.log('currentERC20Balance', erc20Balance)

            let erc20Allowance = await getAllowance(keys.sellerWalletAddress, tokenTransferProxyAddress, erc20TokenAddress)
            // console.log('currentAllowance', erc20Allowance)

            let fee = (sell.basePrice * sell.makerRelayerFee) / 10000
            if (erc20Allowance < fee) {
                let res = await approveERC20(keys.sellerWalletAddress, tokenTransferProxyAddress, fee, erc20TokenAddress)
                console.log("[seller] approveERC20 status", res)
            }
        }


        /**
         * 3. Prepare the callData for the Sell Order
         * Here, we want to transfer the NFT from the sell.Maker to the buy.Maker. Using the transferForm function with
         * the following signature `safeTransferFrom(address from, address to, uint256 tokenId, uint256 amount, bytes data)`.
         *
         * Regularly, the address of the `buyer` (or `to`) hasn't been determined at the time an order is created. Therefore,
         * we replace this value with the zeroAddress, and enable replacing it. Other parameters cannot be changed.
         * */
        console.log("Step 3. Create callData and replacement patterns")
        let callDataSell = web3.eth.abi.encodeFunctionCall({
            name: 'safeTransferFrom',
            type: 'function',
            inputs: [{
                type: 'address',
                name: 'from'
            }, {
                type: 'address',
                name: 'to'
            }, {
                type: 'uint256',
                name: 'id'
            }, {
                type: 'uint256',
                name: 'amount'
            }, {
                type: 'bytes',
                name: 'data'
            }]
        }, [keys.sellerWalletAddress, zeroAddress, id, amount, "0x"])
        console.log("callDataSell", callDataSell)

        /**
         * 3.1 Prepare replacement pattern for sell order.
         * In this case, the `to` parameter is located at the bytes [36-68] of the callData.
         * So we enable replacing it with non-zero flags.
         *
         * The replacement pattern will look like this.
         * '0x' + '00000000'                                                     // [function signature `safeTransferFrom`]: protected, cannot be replaced
         + '0000000000000000000000000000000000000000000000000000000000000000'    // [address of the seller `from`]: cannot be replaced
         + 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'    // [address of the buyer `to`]: can be replaced
         + '0000000000000000000000000000000000000000000000000000000000000000'   // the rest consists of id + amount
         + '0000000000000000000000000000000000000000000000000000000000000000'    // + data: cannot be replaced
         + '................................................................'
         */
        let rplmPatternSell = makeReplacementPattern(callDataSell, 74, 138) //[36 * 2 + 2: 68 * 2 + 2]
        console.log("rplmPatternSell", rplmPatternSell)
        sell.calldata = callDataSell
        sell.replacementPattern = rplmPatternSell

        /**
         * 3.2 We do the same thing for the buy order. In most of the case, we know all the parameters for the function
         * `safeTransferFrom` at the time creating the buy order. So, we just fill in all the needed info, and do not
         * allow any changes to the callData(e.g, replacementPattern = 0x).
         *
         * */
        let callDataBuy = web3.eth.abi.encodeFunctionCall({
            name: 'safeTransferFrom',
            type: 'function',
            inputs: [{
                type: 'address',
                name: 'from'
            }, {
                type: 'address',
                name: 'to'
            }, {
                type: 'uint256',
                name: 'id'
            }, {
                type: 'uint256',
                name: 'amount'
            }, {
                type: 'bytes',
                name: 'data'
            }]
        }, [keys.sellerWalletAddress, keys.buyerWalletAddress, id, amount, "0x"])
        console.log("callDataBuy", callDataBuy)
        buy.calldata = callDataBuy
        buy.replacementPattern = "0x"

        /**
         * 4. Sign orders off-chain
         */
        console.log("Step 4. Sign orders")
        buy.sig = await signOrder(buy, keys.buyerPrivateKey);
        sell.sig = await signOrder(sell, keys.sellerPrivateKey);

        /**
         * 5. Do atomic match
         */
        console.log("Step 5. Do atomicMatch_")
        let gasEstimate = await exchange.methods.atomicMatch_(
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
        ).estimateGas({from: keys.buyerWalletAddress});
        console.log(`estimatedGas for orderMatch: ${gasEstimate}`)

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
            gas: gasEstimate,
        }).on('receipt', function (receipt) {
            console.log("Orders have been atomic matched!", receipt);
        })

    } catch (e) {
        console.log(e);
    }
})();