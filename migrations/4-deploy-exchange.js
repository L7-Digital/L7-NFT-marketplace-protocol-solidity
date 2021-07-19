/* global artifacts: false */

const TaureumExchange = artifacts.require('./TaureumExchange.sol')
const TaureumProxyRegistry = artifacts.require('./TaureumProxyRegistry.sol')
const TaureumTokenTransferProxy = artifacts.require('./TaureumTokenTransferProxy.sol')
const TestToken = artifacts.require('TestToken')

const {setConfig} = require('./config.js')

module.exports = (deployer, network) => {
    if (network === 'development' || network === 'rinkeby' || network === 'coverage' || network === 'main') {
        return TaureumProxyRegistry.deployed()
            .then(() => {
                return TestToken.deployed().then(tokenInstance => {
                    return TaureumTokenTransferProxy.deployed()
                        .then(() => {
                            return deployer.deploy(TaureumExchange, TaureumProxyRegistry.address, TaureumTokenTransferProxy.address, (network === 'development' || network === 'rinkeby' || network === 'coverage') ? tokenInstance.address : '0x056017c55ae7ae32d12aef7c679df83a85ca75ff', '0x1Ad8359dF979371a9F1A305776562597bd0A7Da0')
                                .then(() => {
                                    setConfig('deployed.' + network + '.TaureumExchange', TaureumExchange.address)
                                    return TaureumProxyRegistry.deployed()
                                        .then(proxyRegistry => {
                                            return TaureumExchange.deployed()
                                                .then(exchange => {
                                                    return proxyRegistry.grantInitialAuthentication(exchange.address)
                                                })
                                        })
                                })
                        })
                })
            })
    }
    if (network === 'testnet') {
        return TaureumProxyRegistry.deployed()
            .then(() => {
                return TestToken.deployed().then(tokenInstance => {
                    return TaureumTokenTransferProxy.deployed()
                        .then(() => {
                            return deployer.deploy(TaureumExchange, TaureumProxyRegistry.address, TaureumTokenTransferProxy.address, tokenInstance.address, '0x1Ad8359dF979371a9F1A305776562597bd0A7Da0')
                                .then(() => {
                                    setConfig('deployed.' + network + '.TaureumExchange', TaureumExchange.address)
                                    return TaureumProxyRegistry.deployed()
                                        .then(proxyRegistry => {
                                            return TaureumExchange.deployed()
                                                .then(exchange => {
                                                    return proxyRegistry.grantInitialAuthentication(exchange.address)
                                                })
                                        })
                                })
                        })
                })
            })
    }
}