/* global artifacts:false */

const Migrations = artifacts.require('./Migrations.sol')
const {setConfig } = require('./config.js')

module.exports = (deployer, network) => {
  if (network !== "mainnet") {
    return deployer.deploy(Migrations).then(() => {
      setConfig('deployed.' + network + '.Migrations', Migrations.address)
    })
  }
}
