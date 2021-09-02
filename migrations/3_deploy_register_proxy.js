/* global artifacts: false */

const TaureumProxyRegistry = artifacts.require('TaureumProxyRegistry')

const {setConfig} = require('./config.js')

module.exports = (deployer, network) => {
    return deployer.deploy(TaureumProxyRegistry)
        .then(() => {
            setConfig('deployed.' + network + '.TaureumProxyRegistry', TaureumProxyRegistry.address)
        })
}
