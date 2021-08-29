/* global artifacts: false */

const TaureumProxyRegistry = artifacts.require('./TaureumProxyRegistry.sol')

const {getConfigByNetwork} = require('./config.js')

module.exports = (deployer, network) => {
    let cfg = getConfigByNetwork(network)
    let exchangeAddress = cfg.TaureumExchange
    console.log("exchangeAddress", exchangeAddress)
    return TaureumProxyRegistry.deployed()
        .then(proxyRegistry => {
            return proxyRegistry.grantInitialAuthentication(exchangeAddress)
        })
}