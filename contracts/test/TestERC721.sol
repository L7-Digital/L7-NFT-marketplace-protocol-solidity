// SPDX-License-Identifier: MIT
/*

  << TestERC721 >>

*/

pragma solidity 0.8.4;

import "../lib/token/ERC721/ERC721.sol";

contract TestERC721 is ERC721("test", "TST") {

    /**
     */
    constructor () public {
        mint(msg.sender, 1);
        mint(msg.sender, 2);
        mint(msg.sender, 3);
    }

    /**
     */
    function mint(address to, uint256 tokenId) public returns (bool) {
        _mint(to, tokenId);
        return true;
    }

}
