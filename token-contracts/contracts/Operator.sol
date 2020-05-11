// Copyright (C) 2020 LimeChain - Blockchain & DLT Solutions <https://limechain.tech>

pragma solidity ^0.5.4;

import "@openzeppelin/contracts/ownership/Ownable.sol";


/**
 * @title Operator
 * @dev Simple ownable Operator contract that stores operators.
 */
contract Operator is Ownable {
    // The operators storage
    mapping(address => bool) private operators;

    event OperatorModified(
        address indexed executor,
        address indexed operator,
        bool status
    );

    /**
     * @dev Enables/Disables an operator.
     * @param _operator The target operator.
     * @param _status Set to true to enable an operator.
     */
    function setOperator(address _operator, bool _status) public onlyOwner {
        require(
            _operator != address(0),
            "Operator: operator is the zero address"
        );
        operators[_operator] = _status;
        emit OperatorModified(msg.sender, _operator, _status);
    }

    /**
     * @dev Checks if an operator is enabled/disabled.
     * @param _operator The target operator.
     */
    function isOperator(address _operator) public view returns (bool) {
        return operators[_operator];
    }
}
