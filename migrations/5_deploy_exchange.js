/* global artifacts: false */

const TaureumExchange = artifacts.require('TaureumExchange')
const TaureumProxyRegistry = artifacts.require('TaureumProxyRegistry')
const TaureumTokenTransferProxy = artifacts.require('TaureumTokenTransferProxy')

const {getConfigByNetwork, setConfig} = require('./config.js')

module.exports = (deployer, network, accounts) => {
    let cfg = getConfigByNetwork(network)
    let registerProxy = cfg.TaureumProxyRegistry
    let tokenTransferProxy = cfg.TaureumTokenTransferProxy
    let feeTokenAddress = "0x0000000000000000000000000000000000000000"
    let protocolFeeReceiver = accounts[0]

    console.log("proxyRegister", registerProxy)
    console.log("tokenTransferProxy", tokenTransferProxy)
    console.log("protocolFeeReceiver", protocolFeeReceiver)
    if (network !== 'mainnet') {
        feeTokenAddress = cfg.TestToken
    }
    return deployer.deploy(TaureumExchange, TaureumProxyRegistry.address, TaureumTokenTransferProxy.address, feeTokenAddress, protocolFeeReceiver)
        .then(() => {
            setConfig('deployed.' + network + '.TaureumExchange', TaureumExchange.address)
        })
}