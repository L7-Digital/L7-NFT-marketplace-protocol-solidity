/* global artifacts: false */

const L7Exchange = artifacts.require('L7Exchange')
const L7ProxyRegistry = artifacts.require('L7ProxyRegistry')
const L7TokenTransferProxy = artifacts.require('L7TokenTransferProxy')

const {getConfigByNetwork, setConfig} = require('./config.js')

module.exports = (deployer, network, accounts) => {
    let cfg = getConfigByNetwork(network)
    let registerProxy = cfg.L7ProxyRegistry
    let tokenTransferProxy = cfg.L7TokenTransferProxy
    let feeTokenAddress = "0x0000000000000000000000000000000000000000"
    let protocolFeeReceiver = accounts[0]

    console.log("proxyRegister", registerProxy)
    console.log("tokenTransferProxy", tokenTransferProxy)
    console.log("protocolFeeReceiver", protocolFeeReceiver)
    if (network !== 'mainnet') {
        feeTokenAddress = cfg.TestToken
    }
    return deployer.deploy(L7Exchange, L7ProxyRegistry.address, L7TokenTransferProxy.address, feeTokenAddress, protocolFeeReceiver)
        .then(() => {
            setConfig('deployed.' + network + '.L7Exchange', L7Exchange.address)
        })
}