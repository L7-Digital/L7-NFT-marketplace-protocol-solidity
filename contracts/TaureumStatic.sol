// SPDX-License-Identifier: MIT
/*

  << Taureum Static >>

*/

pragma solidity 0.8.4;

import "./static/StaticERC20.sol";
import "./static/StaticERC721.sol";
import "./static/StaticERC1155.sol";
import "./static/StaticUtil.sol";

/**
 * @title TaureumStatic
 */
contract TaureumStatic is StaticERC20, StaticERC721, StaticERC1155, StaticUtil {

    string public constant name = "Taureum Static";

    constructor (address atomicizerAddress) {
        atomicizer = atomicizerAddress;
    }

    function test () 
        public
        pure
    {
    }

}
