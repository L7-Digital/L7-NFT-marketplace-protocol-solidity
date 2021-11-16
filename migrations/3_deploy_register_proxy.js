/* global artifacts: false */

const L7ProxyRegistry = artifacts.require('L7ProxyRegistry')

const {setConfig} = require('./config.js')

module.exports = (deployer, network) => {
    return deployer.deploy(L7ProxyRegistry)
        .then(() => {
            setConfig('deployed.' + network + '.L7ProxyRegistry', L7ProxyRegistry.address)
        })
}
