const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');
const privateKey = fs.readFileSync(".secret").toString().trim();

const bscProvider = new HDWalletProvider(privateKey, `https://data-seed-prebsc-2-s2.binance.org:8545/`, 0, 1)

module.exports = {
  plugins: ["truffle-contract-size"],
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
      gasPrice: 0x01,
      allowUnlimitedContractSize: true
    },
    testnet: {
      networkCheckTimeout: 100000,
      provider: bscProvider,
      network_id: 97,
      confirmations: 1,
      timeoutBlocks: 1000000000,
      gasLimit: 100000000,
    },
  },
  contracts_directory: "./contracts/",
  contracts_build_directory: "./abi/",
  mocha: {
    reporter: "eth-gas-reporter",
    reporterOptions: {
      currency: "USD",
      gasPrice: 2,
    },
  },
  compilers: {
    solc: {
      version: '0.8.4',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
}