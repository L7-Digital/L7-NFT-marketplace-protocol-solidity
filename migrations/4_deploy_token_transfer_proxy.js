/* global artifacts: false */
const L7TokenTransferProxy = artifacts.require('L7TokenTransferProxy')

const {getConfigByNetwork, setConfig} = require('./config.js')

module.exports = (deployer, network) => {
    let cfg = getConfigByNetwork(network)
    console.log("proxyRegister", cfg.L7ProxyRegistry)
    return deployer.deploy(L7TokenTransferProxy, cfg.L7ProxyRegistry).then(() => {
        setConfig('deployed.' + network + '.L7TokenTransferProxy', L7TokenTransferProxy.address)
    })
}
