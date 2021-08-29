const {TaureumProxyRegistry, keys} = require("./config");

const getProxies = async(address) => {
    let gasEstimate = await TaureumProxyRegistry.methods.proxies(
        address
    ).estimateGas({ from: keys.walletAddress });

    let res = await TaureumProxyRegistry.methods.proxies(
        address
    ).call({
        from: keys.walletAddress,
        gas: gasEstimate
    })

    return res
}

const registerProxy = async(address) => {
    let gasEstimate = await TaureumProxyRegistry.methods.registerProxy().estimateGas({ from: address });
    console.log(`estimatedGas for registerProxy: ${gasEstimate}`)

    await TaureumProxyRegistry.methods.registerProxy()
        .send({
            from: address,
            gas: gasEstimate
        }).on('receipt', function(receipt){
        console.log("Registered user in the proxy. User address:", address);
        console.log(receipt);
    }).on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
        console.log("error", error, receipt)
    });
}

module.exports = {getProxies, registerProxy}

