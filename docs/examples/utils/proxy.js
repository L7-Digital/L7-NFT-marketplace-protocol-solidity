const {TaureumProxyRegistry, keys} = require("./config")

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
module.exports = {getProxies}

