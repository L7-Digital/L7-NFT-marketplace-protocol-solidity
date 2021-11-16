// SPDX-License-Identifier: MIT
/*

  << Project L7 Token Transfer Proxy >.

*/

pragma solidity 0.8.4;

import "./registry/TokenTransferProxy.sol";

contract L7TokenTransferProxy is TokenTransferProxy {

    constructor (ProxyRegistry registryAddr) {
        registry = registryAddr;
    }

}
