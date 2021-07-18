const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545')
const web3 = new Web3(provider)

const walletAddress = require('./config.json').walletAddress
const {makeOrder} = require('./utils')

const fs = require('fs');

const privateKey = fs.readFileSync("../../.secret").toString().trim(); // read the secret key of the account.
web3.eth.accounts.wallet.add({
    privateKey: privateKey,
    address: walletAddress
});

const exchangeABI = require('../../abi/TaureumExchange.json').abi
const exchangeAddress = require('../../config.json').deployed.testnet.TaureumExchange
const proxyAddress = require('../../config.json').deployed.testnet.TaureumProxyRegistry

let TaureumExchange = new web3.eth.Contract(exchangeABI, exchangeAddress);


/**
 * This function will have the Exchange approve an Order created by the `walletAddress`.
 *
 * The following example actually invoke method `approveOrder_()` in the `TaureumExchange` contract.
 */
(async () => {
    try {
        let order = makeOrder(exchangeAddress, walletAddress, '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', proxyAddress)

        const gasEstimate = await TaureumExchange.methods.approveOrder_(
            [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken],
            [order.makerRelayerFee, order.takerRelayerFee, order.makerProtocolFee, order.takerProtocolFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt],
            order.feeMethod,
            order.side,
            order.saleKind,
            order.howToCall,
            order.calldata,
            order.replacementPattern,
            order.staticExtradata,
            true,
        ).estimateGas({ from: walletAddress });

        console.log(`estimatedGas: ${gasEstimate}`)

        TaureumExchange.methods.approveOrder_(
            [order.exchange, order.maker, order.taker, order.feeRecipient, order.target, order.staticTarget, order.paymentToken],
            [order.makerRelayerFee, order.takerRelayerFee, order.makerProtocolFee, order.takerProtocolFee, order.basePrice, order.extra, order.listingTime, order.expirationTime, order.salt],
            order.feeMethod,
            order.side,
            order.saleKind,
            order.howToCall,
            order.calldata,
            order.replacementPattern,
            order.staticExtradata,
            true,
        ).send({
                from: walletAddress,
                gas: gasEstimate
            }).on('receipt', function(receipt){
            console.log(`Approve order receipt`, receipt);
        }).on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
            console.log("error", error, receipt)
        });
    } catch (e) {
        console.log(e);
    }
})();
