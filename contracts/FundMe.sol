// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./PriceConverter.sol";

error FundMe__NotOwner();
error FundMe__FundAmountNotEnough();
error FundMe__CallFailed();

/**
 * @title A contract for crowd funding
 * @author Ghaieth BEN MOUSSA
 * @notice To demo a sample funding contract
 * @dev Implements price feeds as a library
 */
contract FundMe {
    using PriceConverter for uint256;

    AggregatorV3Interface public s_priceFeed;

    address public immutable i_owner;

    uint256 public constant MINIMUM_USD = 50 * 1e18;

    address[] public s_funders;
    mapping(address => uint256) public s_addressToAmountFunded;

    modifier onlyOwner() {
        if (msg.sender != i_owner) { revert FundMe__NotOwner(); }
        _;
    }

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    function fund() public payable {
        // We want to be able to set a minimum fund amount of 50 USD
        if(msg.value.getConversionRate(s_priceFeed) < MINIMUM_USD) { revert FundMe__FundAmountNotEnough();}

        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
    }

    function withdraw() public onlyOwner {
        // Reset the mapping
        for (uint256 i = 0; i < s_funders.length; i++) {
            address funder = s_funders[i];
            s_addressToAmountFunded[funder] = 0;
        }

        // Reset the array
        s_funders = new address[](0);

        // Call
        (
            bool callSuccess, /*bytes memory dataReturned*/
        ) = payable(msg.sender).call{value: address(this).balance}("");
        if(!callSuccess) { revert FundMe__CallFailed(); }
    }
}
