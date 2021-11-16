// SPDX-License-Identifier: MIT
/*

  << L7 Static >>

*/

pragma solidity 0.8.4;

import "./static/StaticERC20.sol";
import "./static/StaticERC721.sol";
import "./static/StaticERC1155.sol";
import "./static/StaticUtil.sol";

/**
 * @title L7Static
 */
contract L7Static is StaticERC20, StaticERC721, StaticERC1155, StaticUtil {

    string public constant name = "L7 Static";

    constructor (address atomicizerAddress) {
        atomicizer = atomicizerAddress;
    }

    function test () 
        public
        pure
    {
    }

}
