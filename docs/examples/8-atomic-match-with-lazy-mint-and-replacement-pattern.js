const {keys, exchange, exchangeAddress, web3, ERC721ContractAddress} = require("./utils/config")
const {makeOrder, signOrder, makeReplacementPattern} = require('./utils/order')
const {ERC721_setApprovalForAll, randomURI} = require('./utils/ERC721/nft')
const {getProxies} = require('./utils/proxy')
const {LazyMinter} = require("./utils/ERC721/lazy-minter");

(async () => {
    try {
        /**
         * 1. Instead of minting an NFT before doing the `atomicMatch`, we create a piece of lazy minting data,
         * and have the first buyer pay the minting fee upon matching orders.
         * */
        let lm = new LazyMinter({contractAddress: ERC721ContractAddress, signer: keys.sellerWalletAddress})
        let uri = randomURI()
        let lazyData = await lm.createLazyMintingData(uri)
        console.log("lazyData", lazyData)

        /**
         * 1.2. Approve the authenticated proxy to spent the NFT (if needed). At this step, caller must ensure that his
         * proxy has been created.
         * */
        let proxyAddress = await getProxies(keys.sellerWalletAddress)
        await ERC721_setApprovalForAll(keys.sellerWalletAddress, proxyAddress, true)

        /**
         * 2. Create orders
         */
        let sell = makeOrder(exchangeAddress, keys.sellerWalletAddress, '0x0000000000000000000000000000000000000000', '0x1Ad8359dF979371a9F1A305776562597bd0A7Da0', ERC721ContractAddress, 100)
        let buy = makeOrder(exchangeAddress, keys.buyerWalletAddress, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', ERC721ContractAddress)
        sell.side = 1
        buy.makerRelayerFee = 0

        /**
         * 3. Prepare the callData for the Sell Order
         * Here, we want to transfer the NFT from the sell.Maker to the buy.Maker. Using the redeem function with
         * the following signature `redeem(address redeemer, string uri, bytes signature)`. At the time of placing the
         * sellOrder, we do not know who the redeemer is. Therefore, we encode it with the `ZERO_ADDRESS` and create a
         * replacement pattern that allow later-caller to change this value.
         * */
        let callDataSell = web3.eth.abi.encodeFunctionCall({
            name: 'redeem',
            type: 'function',
            inputs: [{
                type: 'address',
                name: 'redeemer'
            },{
                type: 'string',
                name: 'uri'
            },{
                type: 'bytes',
                name: 'signature'
            }]
        }, [
            "0x0000000000000000000000000000000000000000", // Leave this address as zeros since seller doesnt know who the redeemer will be
            uri,
            lazyData.signature
        ])
        console.log("callDataSell", callDataSell)

        /**
         * 3.1 Prepare replacement pattern for sell order. In this case, the `redeemer` parameter is located at the bytes
         * [4-36] of the callData. So we enable replacing it with non-zero flags.
         *
         * The replacement pattern will look like this.
         * '0x' + '00000000'                                                     // [function signature `redeem`]: protected, cannot be replaced
         + 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'    // [address of the buyer  `redeemer`]: can be replaced
         + '0000000000000000000000000000000000000000000000000000000000000000'    // the rest consists of URI + signature
         + '0000000000000000000000000000000000000000000000000000000000000000'    // these values cannot be replaced.
         + '0000000000000000000000000000000000000000000000000000000000000000'
         + '0000000000000000000000000000000000000000000000000000000000000000'
         + '0000000000000000000000000000000000000000000000000000000000000000'
         + '0000000000000000000000000000000000000000000000000000000000000000'
         + '0000000000000000000000000000000000000000000000000000000000000000'
         + '0000000000000000000000000000000000000000000000000000000000000000'
         + '0000000000000000000000000000000000000000000000000000000000000000'
         */
        let rplmPatternSell = makeReplacementPattern(callDataSell, 10, 74)
        console.log("rplmPatternSell", rplmPatternSell)
        sell.calldata = callDataSell
        sell.replacementPattern = rplmPatternSell

        /**
         * 3.2 Prepare the callData for buy order. It's essentially the same as the callData of the sell order with the
         * `redeemer` value being replaced by the buyer address.
         */
        let callDataBuy = web3.eth.abi.encodeFunctionCall({
            name: 'redeem',
            type: 'function',
            inputs: [{
                type: 'address',
                name: 'redeemer'
            },{
                type: 'string',
                name: 'uri'
            },{
                type: 'bytes',
                name: 'signature'
            }]
        }, [
            keys.buyerWalletAddress, // The redeemer should be the buyer.
            uri,
            lazyData.signature
        ])
        console.log("callDataBuy", callDataBuy)

        /** 3.3. Prepare the replacementPattern for buy order. In this case, we don't need to change any thing on the call
         * data of the buy order. So we leave this value empty as '0x'.
         */
        let rplmPatternBuy = "0x"
        console.log("rplmPatternBuy", rplmPatternBuy)
        buy.calldata = callDataBuy
        buy.replacementPattern = rplmPatternBuy

        /**
         * 4. Sign orders off-chain
         */
        buy.sig = await signOrder(buy, keys.buyerPrivateKey);
        // console.log('buySig', buy.sig)
        sell.sig = await signOrder(sell, keys.sellerPrivateKey);
        // console.log('sellSig', sell.sig)

        /**
         * 5. Do atomic match
         */
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
        ).estimateGas({ from: keys.buyerWalletAddress, value: sell.basePrice });
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
            value: sell.basePrice
        }).on('receipt', function(receipt){
            console.log("Orders have been atomic matched!", receipt, receipt.events);
        })

    } catch (e) {
        console.log(e);
    }
})();