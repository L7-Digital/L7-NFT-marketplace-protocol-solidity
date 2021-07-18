/*

  << Project Taureum Token Transfer Proxy >.

*/

pragma solidity 0.8.4;

import "./registry/TokenTransferProxy.sol";

contract TaureumTokenTransferProxy is TokenTransferProxy {

    constructor (ProxyRegistry registryAddr)
        public
    {
        registry = registryAddr;
    }

}
