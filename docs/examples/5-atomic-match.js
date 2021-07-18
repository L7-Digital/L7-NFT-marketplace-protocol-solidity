const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545')
const web3 = new Web3(provider)

const walletAddress = require('./config.json').walletAddress
const {makeOrder, hashOrder} = require('./utils/order')
const {mintNFT, setApprovalForAll} = require('./utils/nft')

const fs = require('fs');

const privateKey = fs.readFileSync("../../.secret").toString().trim(); // read the secret key of the account.
web3.eth.accounts.wallet.add({
    privateKey: privateKey,
    address: walletAddress
});

const exchangeABI = require('../../abi/TaureumExchange.json').abi
const exchangeAddress = require('../../config.json').deployed.testnet.TaureumExchange
const exchange = new web3.eth.Contract(exchangeABI, exchangeAddress);

const nftContractAddress = "0xCa007BcC979B8Ca76D9CF327287e7ad3F269DA6B"

const signOrder = async (order) => {
    let orderHash = hashOrder(order);
    return web3.eth.sign(orderHash, walletAddress).then(signature => {
        signature = signature.substr(2)
        const r = '0x' + signature.slice(0, 64)
        const s = '0x' + signature.slice(64, 128)
        const v = 27 + parseInt('0x' + signature.slice(128, 130), 16)

        return {
            r: r,
            s: s,
            v: v
        }
    });
}

(async () => {
    try {
        /**
         * 1. Mint some token on the NFT contracts.
         * */
        let id = await mintNFT(walletAddress)
        console.log("nftID", id)

        // /**
        //  * 1.2. Approve the authenticated proxy to spent the NFT (if needed)
        //  * */
        // await setApprovalForAll('0x2cde2a15314698148ca7d2cab11117d96ef283d6', true)

        /**
         * 2. Prepare the callData for the Sell Order
         * Here, we want to transfer the NFT from the sell.Maker to the buy.Maker. Using the transferForm function with
         * the following signature `transferFrom(address from, address to, uint256 tokenId)`.
         * */
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
        }, [walletAddress, '0x0000000000000000000000000000000000000000', id])
        console.log("callData", callData)

        /**
         * 3. Create orders
         */
        let sell = makeOrder(exchangeAddress, walletAddress, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', nftContractAddress)
        let buy = makeOrder(exchangeAddress, '0x0000000000000000000000000000000000000000', walletAddress, walletAddress, nftContractAddress)
        sell.side = 1
        sell.calldata = callData
        buy.calldata = callData

        console.log("buy", buy)
        console.log("sell", sell)

        /**
         * 4. Sign orders off-chain
         */
        buy.sig = await signOrder(buy);
        sell.sig = await signOrder(sell);

        /**
         * 5. Do atomic match
         */
        gasEstimate = await exchange.methods.atomicMatch_(
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
        ).estimateGas({ from: walletAddress, value: sell.basePrice });
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
            from: walletAddress,
            gas: gasEstimate,
            value: sell.basePrice
        }).on('receipt', function(receipt){
            console.log("Orders have been atomic matched!", receipt);
        })

    } catch (e) {
        console.log(e);
    }
})();