// Copyright (C) 2020 LimeChain - Blockchain & DLT Solutions <https://limechain.tech>

pragma solidity ^0.5.4;

import "./RulesOperator.sol";
import "./../Operator.sol";
import "./../Whitelisting/Whitelisting.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

/**
 * @title IdonRulesOperator
 * @dev Manages IdoneusToken (IDON) USD price. Used as fee calculator
 * on IDON Token transfers.
 */
contract IdonRulesOperator is RulesOperator, Operator {
    using SafeMath for uint256;

    /**
     * @notice The IDON token price, stored with 3 digits
     * after the decimal point (e.g. $12.340 => 12 340).
     */
    uint256 public idonTokenPrice;

    /**
     * @notice The minimum IDON token price, stored with 3 digits
     * after the decimal point (e.g. $23.456 => 23 456).
     */
    uint256 public minimumIDONPrice;

    /**
     * @notice The transfer fee percentage, stored with 3 digits
     * after the decimal point (e.g. 12.345% => 12 345).
     */
    uint256 public transferFeePercentage;

    // The whitelisting contract storage
    Whitelisting public whitelisting;

    /**
     * @dev Throws if the sender is neither operator nor owner.
     */
    modifier onlyAuthorized() {
        require(
            isOperator(msg.sender) || msg.sender == owner(),
            "RulesOperator: the caller is not Authorised"
        );
        _;
    }

    event TokenPriceModified(address indexed executor, uint256 tokenPrice);
    event MinimumPriceLimitModified(
        address indexed executor,
        uint256 minimumPrice
    );
    event FeePercentageModified(
        address indexed executor,
        uint256 feePercentage
    );
    event WhitelistingInstanceModified(
        address indexed executor,
        address whitelisting
    );

    /**
     * @dev Sets the initial values for IDON token price,
     * minimum IDON token price, transfer fee percetange and whitelisting contract.
     *
     * @param _idonTokenPrice Initial IDON token price.
     * @param _minimumIDONPrice Initial minimum IDON token price.
     * @param _transferFeePercentage Initial fee percentage on transfers.
     * @param _whitelisting Initial whitelisting contract.
     */
    constructor(
        uint256 _idonTokenPrice,
        uint256 _minimumIDONPrice,
        uint256 _transferFeePercentage,
        address _whitelisting
    ) public {
        require(
            _idonTokenPrice != 0,
            "IdonRulesOperator: idon token price could not be 0"
        );
        require(
            _transferFeePercentage < 100000,
            "IdonRulesOperator: fee percentage could not be higher than 100%"
        );
        require(
            _whitelisting != address(0),
            "IdonRulesOperator: whitelisting contract address could not be 0"
        );
        idonTokenPrice = _idonTokenPrice;
        minimumIDONPrice = _minimumIDONPrice;
        transferFeePercentage = _transferFeePercentage;
        whitelisting = Whitelisting(_whitelisting);

        emit TokenPriceModified(msg.sender, _idonTokenPrice);
        emit MinimumPriceLimitModified(msg.sender, _minimumIDONPrice);
        emit FeePercentageModified(msg.sender, _transferFeePercentage);
        emit WhitelistingInstanceModified(msg.sender, _whitelisting);
    }

    /**
     * @dev Sets IDON Token Price.
     * @param _price The target price.
     */
    function setIdonTokenPrice(uint256 _price) public onlyAuthorized {
        require(
            _price != 0,
            "IdonRulesOperator: idon token price could not be 0"
        );
        idonTokenPrice = _price;
        emit TokenPriceModified(msg.sender, _price);
    }

    /**
     * @dev Sets minimum IDON price.
     * @param _minimumPriceLimit The target minimum price limit.
     */
    function setMinimumPriceLimit(uint256 _minimumPriceLimit) public onlyOwner {
        minimumIDONPrice = _minimumPriceLimit;
        emit MinimumPriceLimitModified(msg.sender, _minimumPriceLimit);
    }

    /**
     * @dev Sets fee percentage.
     * @param _transferFeePercentage The target transfer fee percentage.
     */
    function setFeePercentage(uint256 _transferFeePercentage) public onlyOwner {
        require(
            _transferFeePercentage < 100000,
            "IdonRulesOperator: fee percentage could not be higher than 100%"
        );
        transferFeePercentage = _transferFeePercentage;
        emit FeePercentageModified(msg.sender, _transferFeePercentage);
    }

    function setWhitelisting(address _whitelisting) public onlyOwner {
        require(
            _whitelisting != address(0),
            "IdonRulesOperator: whitelisting contract address could not be zero address"
        );
        whitelisting = Whitelisting(_whitelisting);
        emit WhitelistingInstanceModified(msg.sender, _whitelisting);
    }

    /**
     * @dev Validates upon IDON token `approve` call.
     * @notice Lacks implementation.
     */
    function onApprove(address from, address to, uint256 value)
        public
        returns (bool)
    {
        return true;
    }

    /**
     * @dev Calculates fee on IDON token `transfer` call.
     * @param from The target sender.
     * @param to The target recipient.
     * @param value The target amount.
     */
    function onTransfer(address from, address to, uint256 value)
        public
        returns (uint256 fee)
    {
        return transactionValidation(from, to, value);
    }

    /**
     * @dev Calculates fee on IDON token `transferFrom` call.
     * @param from The target sender.
     * @param to The target recipient.
     * @param value The target amount.
     */
    function onTransferFrom(address from, address to, uint256 value)
        public
        returns (uint256)
    {
        return transactionValidation(from, to, value);
    }

    /**
     * @dev Calculates fee on IDON Token transfer calls, depending on
     * IDON Token price and the whitelisting of given accounts (EOA or contracts).
     * @param _from The target sender.
     * @param _to The target recipient.
     * @param _value The target amount.
     */
    function transactionValidation(address _from, address _to, uint256 _value)
        internal
        view
        returns (uint256)
    {
        if (idonTokenPrice <= minimumIDONPrice) {
            require(
                whitelisting.isWhitelisted(_from) &&
                    whitelisting.isWhitelisted(_to),
                "IdonRulesOperator: one of the users is not whitelisted"
            );
        }
        if (
            whitelisting.isWhitelisted(_from) && whitelisting.isWhitelisted(_to)
        ) {
            return 0;
        }
        return calculateFee(_value);
    }

    /**
     * @dev Calculates fee of given amount.
     * @notice `transferFeePercentage` is stored with 3 digits
     * after the decimal point (e.g. 12.345% => 12 345).
     * @param _value The target amount
     */
    function calculateFee(uint256 _value) public view returns (uint256) {
        return _value.mul(transferFeePercentage).div(100000);
    }
}
