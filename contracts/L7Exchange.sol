// SPDX-License-Identifier: MIT
/*

  << L7 Exchange >>

*/

pragma solidity 0.8.4;

import "./exchange/Exchange.sol";

/**
 * @title L7Exchange
 * @author L7 Protocol Developers
 */
contract L7Exchange is Exchange {

    string public constant name = "L7 Exchange";
  
    string public constant version = "0.1";

    string public constant codename = "L7Beta";

    /**
     * @dev Initialize a WyvernExchange instance
     * @param registryAddress Address of the registry instance which this Exchange instance will use
     * @param tokenAddress Address of the token used for protocol fees
     */
    constructor (ProxyRegistry registryAddress, TokenTransferProxy tokenTransferProxyAddress, ERC20 tokenAddress, address protocolFeeAddress) Ownable() {
        registry = registryAddress;
        tokenTransferProxy = tokenTransferProxyAddress;
        exchangeToken = tokenAddress;
        protocolFeeRecipient = protocolFeeAddress;
    }

}
