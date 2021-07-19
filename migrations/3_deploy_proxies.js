/* global artifacts: false */

const TaureumProxyRegistry = artifacts.require('./TaureumProxyRegistry.sol')
const TaureumTokenTransferProxy = artifacts.require('./TaureumTokenTransferProxy.sol')

const {setConfig} = require('./config.js')

module.exports = (deployer, network) => {
    if (network === 'development' || network === 'rinkeby' || network === 'coverage' || network === 'main' || network === 'testnet') {
        return deployer.deploy(TaureumProxyRegistry)
            .then(() => {
                setConfig('deployed.' + network + '.TaureumProxyRegistry', TaureumProxyRegistry.address)
                return deployer.deploy(TaureumTokenTransferProxy, TaureumProxyRegistry.address).then(() => {
                    setConfig('deployed.' + network + '.TaureumTokenTransferProxy', TaureumTokenTransferProxy.address)
                })
            })
    }
}
