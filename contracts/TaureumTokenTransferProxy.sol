// SPDX-License-Identifier: MIT
/*

  << Project Taureum Token Transfer Proxy >.

*/

pragma solidity 0.8.4;

import "./registry/TokenTransferProxy.sol";

contract TaureumTokenTransferProxy is TokenTransferProxy {

    constructor (ProxyRegistry registryAddr) {
        registry = registryAddr;
    }

}
