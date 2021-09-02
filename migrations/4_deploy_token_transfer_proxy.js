/* global artifacts: false */
const TaureumTokenTransferProxy = artifacts.require('TaureumTokenTransferProxy')

const {getConfigByNetwork, setConfig} = require('./config.js')

module.exports = (deployer, network) => {
    let cfg = getConfigByNetwork(network)
    console.log("proxyRegister", cfg.TaureumProxyRegistry)
    return deployer.deploy(TaureumTokenTransferProxy, cfg.TaureumProxyRegistry).then(() => {
        setConfig('deployed.' + network + '.TaureumTokenTransferProxy', TaureumTokenTransferProxy.address)
    })
}
