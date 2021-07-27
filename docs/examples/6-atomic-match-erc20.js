const {keys, exchange, exchangeAddress, erc20TokenAddress, web3, nftContractAddress, tokenTransferProxyAddress} = require("./utils/config")
const {makeOrder, signOrder} = require('./utils/order')
const {mintNFT, setApprovalForAll} = require('./utils/nft')
const {getProxies} = require('./utils/proxy')
const {approveERC20, getAllowance, getBalance} = require('./utils/erc20');

(async () => {
    try {
        /**
         * 1. Mint some token on the NFT contracts.
         * */
        console.log("Step 1. Mint NFT")
        let id = await mintNFT(keys.sellerWalletAddress)
        console.log("nftID", id)

        /**
         * 1.2. Approve the authenticated proxy to spent the NFT (if needed). At this step, caller must ensure that his
         * proxy has been created.
         * */
        console.log("Step 1.2. Seller approves the proxy to transfer the asset")
        let proxyAddress = await getProxies(keys.sellerWalletAddress)
        await setApprovalForAll(keys.sellerWalletAddress, proxyAddress, true)

        /**
         * 2. Prepare the callData for the Sell Order
         * Here, we want to transfer the NFT from the sell.Maker to the buy.Maker. Using the transferForm function with
         * the following signature `transferFrom(address from, address to, uint256 tokenId)`.
         * */
        console.log("Step 2. Prepare callData")
        let callData = web3.eth.abi.encodeFunctionCall({
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
        }, [keys.sellerWalletAddress, keys.buyerWalletAddress, id])
        console.log("callData", callData)

        /**
         * 3. Create orders
         */
        console.log("Step 3. Create orders")
        let sell = makeOrder(exchangeAddress, keys.sellerWalletAddress, '0x0000000000000000000000000000000000000000', '0x1Ad8359dF979371a9F1A305776562597bd0A7Da0', nftContractAddress)
        let buy = makeOrder(exchangeAddress, keys.buyerWalletAddress, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', nftContractAddress)
        sell.side = 1
        sell.calldata = callData
        sell.paymentToken = erc20TokenAddress
        sell.makerRelayerFee = 100 // set the fee paid to sell.feeRecipient to 1%

        buy.calldata = callData
        buy.makerRelayerFee = 0
        buy.paymentToken = erc20TokenAddress

        /**
         * 3.2. The buyer must approve the TokenTransferProxy to spend sufficient amount (if needed)
         * */
        console.log("Step 3.2. Buyer allows TokenTransferProxy to spend token (if needed)")
        let erc20Balance = await getBalance(keys.buyerWalletAddress, erc20TokenAddress)
        console.log('currentERC20Balance', erc20Balance)

        let erc20Allowance = await getAllowance(keys.buyerWalletAddress, tokenTransferProxyAddress, erc20TokenAddress)
        console.log('currentAllowance', erc20Allowance)
        if (erc20Allowance < buy.basePrice) {
            let res = await approveERC20(keys.buyerWalletAddress, tokenTransferProxyAddress, buy.basePrice - erc20Allowance, erc20TokenAddress)
            console.log("[buyer] approveERC20 status", res)
        }
        /**
         * 3.3. If the tx fee > 0, the seller must approve the TokenTransferProxy to transfer an amount of token
         * equal to the fee (in case of fixed-price order, fee = (sell.basePrice * sell.makerRelayerFee)/ 10000
         * */
        if (sell.makerRelayerFee > 0) {
            console.log("Step 3.3. Seller allows TokenTransferProxy to spend token (paying fee)")
            let erc20Balance = await getBalance(keys.sellerWalletAddress, erc20TokenAddress)
            console.log('currentERC20Balance', erc20Balance)

            let erc20Allowance = await getAllowance(keys.sellerWalletAddress, tokenTransferProxyAddress, erc20TokenAddress)
            console.log('currentAllowance', erc20Allowance)

            let fee = (sell.basePrice * sell.makerRelayerFee)/ 10000
            if (erc20Allowance < fee) {
                let res = await approveERC20(keys.sellerWalletAddress, tokenTransferProxyAddress, fee, erc20TokenAddress)
                console.log("[seller] approveERC20 status", res)
            }
        }

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
        ).estimateGas({ from: keys.buyerWalletAddress});
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
        }).on('receipt', function(receipt){
            console.log("Orders have been atomic matched!", receipt);
        })

    } catch (e) {
        console.log(e);
    }
})();