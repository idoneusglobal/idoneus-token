// Copyright (C) 2020 LimeChain - Blockchain & DLT Solutions <https://limechain.tech>

pragma solidity ^0.5.4;

/**
 * @title RulesOperator
 * @dev Interface for a IdoneusToken Rules Operator.
 * A Rules Operator must implement the functions below to
 * successfully execute the IdoneusToken approval and transfers
 * functionality.
 */
interface RulesOperator {
    /**
     * @dev Validates upon ERC-20 `approve` call.
     */
    function onApprove(address from, address to, uint256 value)
        external
        returns (bool);

    /**
     * @dev Gets fee amount IdoneusToken owner will take upon ERC-20
     * `transfer` call.
     */
    function onTransfer(address from, address to, uint256 value)
        external
        returns (uint256);

    /**
     * @dev Gets fee amount IdoneusToken owner will take upon ERC-20
     * `transferFrom` call.
     */
    function onTransferFrom(address from, address to, uint256 value)
        external
        returns (uint256);
}
