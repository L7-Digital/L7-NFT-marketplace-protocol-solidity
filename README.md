# Taudreum-NFT-Exchange

## Dependencies
* `node`: 14.17
* `npm`: 7.19
* `truffle`: 5.3 or higher
* `solidity`: 0.8.4

### Install dependencies
```shell
$ npm install
```

## How to deploy
1. Copy your BSC secret key into file [.secret](./.secret) (remember not to commit it)
2. Compile the project
```shell
$ truffle compile
```
3. Deploy the project
```shell
$ truffle migrate --network NET_WORK_NAME --compile-none
```
In this case, `NET_WORK_NAME` could be one of the following: *mainnet*, *testnet*, *development*.

Modify the scripts in the folder [migrations](./migrations) to favoured contracts.
