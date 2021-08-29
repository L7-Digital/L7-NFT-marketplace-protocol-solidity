/* global artifacts: false */

const TestToken = artifacts.require('./TestToken.sol')
const TestStatic = artifacts.require('./TestStatic.sol')

const { setConfig } = require('./config.js')


module.exports = (deployer, network) => {
  if (network !== 'mainnet') {
    return deployer.deploy(TestToken).then(() => {
      setConfig('deployed.' + network + '.TestToken', TestToken.address)
      return deployer.deploy(TestStatic).then(() => {
        setConfig('deployed.' + network + '.TestStatic', TestStatic.address)
      })
    })
  }
}