// Copyright (C) 2020 LimeChain - Blockchain & DLT Solutions <https://limechain.tech>

pragma solidity ^0.5.4;

import "@openzeppelin/contracts/token/ERC20/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "../RulesOperator/RulesOperator.sol";

/**
 * @title IdoneusToken
 * @dev IDON Token contract.
 * @notice Upon transfers owner takes a percentage
 * of the sent amount, depending on Rules Operator contract.
 */
contract IdoneusToken is ERC20Detailed, ERC20Capped, Ownable {
    string private _name = "Idoneus Token";
    string private _symbol = "IDON";
    uint8 private _decimal = 18;
    uint256 private _cap = 1000000000 * 10**18;

    // The rules operator storage
    RulesOperator public rulesOperator;

    event RulesOperatorModified(
        address indexed executor,
        address indexed newRulesOperator
    );

    /**
     * @dev Sets rules operator and initialises inherited ERC20 contracts.
     * @param _rulesOperator The target rules operator.
     */
    constructor(address _rulesOperator)
        public
        ERC20Detailed(_name, _symbol, _decimal)
        ERC20Capped(_cap)
    {
        setRulesOperator(_rulesOperator);
    }

    /**
     * @dev Sets rules operator.
     * @param _rulesOperator The target rules operator.
     */
    function setRulesOperator(address _rulesOperator) public onlyOwner {
        require(
            _rulesOperator != address(0x0),
            "IdoneusToken: rulesOperator could not be zero address"
        );
        rulesOperator = RulesOperator(_rulesOperator);
        emit RulesOperatorModified(msg.sender, _rulesOperator);
    }

    function approve(address to, uint256 value) public returns (bool) {
        rulesOperator.onApprove(msg.sender, to, value);
        return super.approve(to, value);
    }

    /**
     * @dev Gets the fee from Rules Operator and makes the transfers.
     * @param to The target recipient.
     * @param value The target amount.
     */
    function transfer(address to, uint256 value) public returns (bool) {
        uint256 fee = rulesOperator.onTransfer(msg.sender, to, value);
        super.transfer(to, value.sub(fee));
        super.transfer(owner(), fee);
        return true;
    }

    /**
     * @dev Gets the fee from Rules Operator and makes the transfers.
     * @param from The target sender.
     * @param to The target recipient.
     * @param value The target amount.
     */
    function transferFrom(address from, address to, uint256 value)
        public
        returns (bool)
    {
        uint256 fee = rulesOperator.onTransferFrom(from, to, value);
        super.transferFrom(from, to, value.sub(fee));
        super.transferFrom(from, owner(), fee);
        return true;
    }
}
