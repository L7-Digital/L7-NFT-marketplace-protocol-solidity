// SPDX-License-Identifier: UNLICENSED
/*

  << Test Token (for use with the Test DAO) >>

*/

pragma solidity 0.8.4;

import "./lib/token/ERC20/ERC20.sol";


/**
  * @title TestToken
  * @author Project Wyvern Developers
  */
contract TestToken is ERC20("test", "TST") {

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

