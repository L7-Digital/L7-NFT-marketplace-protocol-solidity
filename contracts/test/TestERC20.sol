// SPDX-License-Identifier: UNLICENSED
/*

  << TestERC20 >>

*/

pragma solidity 0.8.4;

import "../lib/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20("test", "TST") {

    /**
     */
    constructor () public {
    }

    /**
     */
    function mint(address to, uint256 value) public returns (bool) {
        _mint(to, value);
        return true;
    }

}
