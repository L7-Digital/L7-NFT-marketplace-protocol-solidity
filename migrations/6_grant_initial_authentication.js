/* global artifacts: false */

const L7ProxyRegistry = artifacts.require('L7ProxyRegistry')

const {getConfigByNetwork} = require('./config.js')

module.exports = (deployer, network) => {
    let cfg = getConfigByNetwork(network)
    let exchangeAddress = cfg.L7Exchange
    console.log("exchangeAddress", exchangeAddress)
    return L7ProxyRegistry.deployed()
        .then(proxyRegistry => {
            return proxyRegistry.grantInitialAuthentication(exchangeAddress)
        })
}