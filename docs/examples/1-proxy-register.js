const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545')
const web3 = new Web3(provider)

const {sellerWalletAddress} = require("./utils/keys")

const {getProxies} = require("./utils/proxy")

const L7ProxyRegistryABI = require('../../abi/L7ProxyRegistry.json').abi
const L7ProxyRegistryAddress = require('../../config.json').deployed.testnet.L7ProxyRegistry

var L7ProxyRegistry = new web3.eth.Contract(L7ProxyRegistryABI, L7ProxyRegistryAddress);


/**
 * This function will register account `walletAddress` into exchange's proxy. We can only register account from `msg.sender`,
 * and CANNOT register for other accounts from which we have not permission to send transaction.
 *
 * The following example actually invoke method `registerProxy()` in the `L7ProxyRegistry` contract.
 */
(async () => {
    try {
        let proxyAddress = await getProxies(sellerWalletAddress)
        if (proxyAddress !== '0x0000000000000000000000000000000000000000') {
            console.log("proxy has been registered at", proxyAddress)
            return
        }

        const gasEstimate = await L7ProxyRegistry.methods.registerProxy().estimateGas({ from: sellerWalletAddress });
        console.log(`estimatedGas for registerProxy: ${gasEstimate}`)

        L7ProxyRegistry.methods.registerProxy()
            .send({
                from: sellerWalletAddress,
                gas: gasEstimate
            }).on('receipt', function(receipt){
            console.log("Registered user in the proxy. User address:", sellerWalletAddress);
            console.log(receipt);
        }).on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
            console.log("error", error, receipt)
        });
    } catch (e) {
        // This should return `Error: Returned error: execution reverted: User already has a proxy`
        console.log(e);
    }
})();
