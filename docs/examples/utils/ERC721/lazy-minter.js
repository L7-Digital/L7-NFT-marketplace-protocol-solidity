const {web3} = require("../config")

class LazyMinter {
    constructor({contractAddress, signer}) {
        this.contractAddress = contractAddress
        this.signer = signer
        this.hashedName = web3.utils.soliditySha3({type: "string", value: "L7NFT"})
        this.hashedVersion = web3.utils.soliditySha3({type: "string", value: "1"})
        this.typeHash = web3.utils.soliditySha3("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
    }

    async _buildDomainSeparator() {
        this.chainId = await web3.eth.getChainId()
        let packed = web3.eth.abi.encodeParameters(
            ["bytes32", "bytes32", "bytes32", "uint256", "address"],
            [this.typeHash, this.hashedName, this.hashedVersion, this.chainId, this.contractAddress]
        )
        return web3.utils.soliditySha3(packed)
    }

    async _toTypedDataHash(digest) {
        let domainSeparator = await this._buildDomainSeparator()
        return web3.utils.soliditySha3(
            "\x19\x01", domainSeparator, digest
        )
    }

    async _getStructHash(uri) {
        let packed = web3.eth.abi.encodeParameters(
            ["bytes32", "bytes32"],
            [web3.utils.soliditySha3("L7NFT(string uri)"), web3.utils.soliditySha3(uri)]
        )
        return web3.utils.soliditySha3(packed)
    }

    async createLazyMintingData(uri) {
        let expectedTokenId = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(['address', 'string'],
            [this.signer, uri]))

        const structHash = await this._getStructHash(uri)
        const typedDataHash = await this._toTypedDataHash(structHash)

        let signature = await web3.eth.sign(typedDataHash, this.signer)
        return {
            uri,
            expectedTokenId,
            signature,
            typedDataHash,
        }
    }
}

module.exports = {
    LazyMinter
}