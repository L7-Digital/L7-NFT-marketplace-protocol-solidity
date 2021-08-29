/* global artifacts: false */

const TaureumProxyRegistry = artifacts.require('./TaureumProxyRegistry.sol')
const TaureumTokenTransferProxy = artifacts.require('./TaureumTokenTransferProxy.sol')

const {setConfig} = require('./config.js')

module.exports = (deployer, network) => {
    return deployer.deploy(TaureumProxyRegistry)
        .then(() => {
            setConfig('deployed.' + network + '.TaureumProxyRegistry', TaureumProxyRegistry.address)
        })
}
