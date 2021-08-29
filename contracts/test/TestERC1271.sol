// SPDX-License-Identifier: UNLICENSED
/*

  << TestERC1271 >>

*/

pragma solidity 0.8.4;

import "../lib/ex/EIP1271.sol";

contract TestERC1271 is ERC1271 {

    bytes4 constant internal SIGINVALID = 0x00000000;

    address internal owner;

    /**
     * Set a new owner (for testing)
     *
     * @param ownerAddr Address of owner
     */
    function setOwner (address ownerAddr)
        public
    {
        owner = ownerAddr;
    }

    /**
     * Check if a signature is valid
     *
     * @param _data Data signed over
     * @param _signature Encoded signature
     * @return magicValue Magic value if valid, zero-value otherwise
     */
    function isValidSignature(
        bytes memory _data,
        bytes memory _signature)
        override
        public
        view
        returns (bytes4 magicValue)
    {
        bytes32 hash = abi.decode(_data, (bytes32));
        (uint8 v, bytes32 r, bytes32 s) = abi.decode(_signature, (uint8, bytes32, bytes32));
        if (owner == ecrecover(hash, v, r, s)) {
            return MAGICVALUE;
        } else {
            return SIGINVALID;
        }
    }

}
