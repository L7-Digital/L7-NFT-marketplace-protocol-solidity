// SPDX-License-Identifier: MIT
/*

  << Test Static Calls >>

*/

pragma solidity 0.8.4;

/**
  * @title TestStatic
  * @author Project Wyvern Developers
  */
contract TestStatic {

    /**
      * @dev Initialize contract
      */
    constructor () public {
    }

    function alwaysSucceed()
        public
        pure
    {
        require(true);
    }

    function alwaysFail()
        public
        pure
    {
        require(false);
    }

    function requireMinimumLength(bytes memory callData)
        public
        pure
    {
        require(callData.length > 2);
    }

}
