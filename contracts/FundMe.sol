// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./PriceConverter.sol";

error NotOwner();
error FundAmountNotEnough();
error CallFailed();

contract FundMe {
    using PriceConverter for uint256;

    AggregatorV3Interface public priceFeed;

    address public immutable i_owner;
    // 21,508 gas - immutable
    // 23,644 gas - non-immutable

    uint256 public constant MINIMUM_USD = 50 * 1e18;
    // 21,415 gas - constant
    // 23,515 gas - non-constant

    address[] public funders;
    mapping(address => uint256) public addressToAmountFunded;

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function fund() public payable {
        // We want to be able to set a minimum fund amount of 50 USD
        if(msg.value.getConversionRate(priceFeed) < MINIMUM_USD) { revert FundAmountNotEnough();}

        funders.push(msg.sender);
        addressToAmountFunded[msg.sender] = msg.value;
    }

    function withdraw() public onlyOwner {
        // Reset the mapping
        for (uint256 i = 0; i < funders.length; i++) {
            address funder = funders[i];
            addressToAmountFunded[funder] = 0;
        }

        // Reset the array
        funders = new address[](0);

        // You can send Ether to other contracts by converting msg.sender to a payable address, then:
        // - transfer (2300 gas, throws error)
        // - send (2300 gas, returns bool)
        // - call (forward all gas or set gas, returns bool)

        // Transfer
        // payable(msg.sender).transfer(address(this).balance);

        // Send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed!");

        // Call
        (
            bool callSuccess, /*bytes memory dataReturned*/

        ) = payable(msg.sender).call{value: address(this).balance}("");
        if(!callSuccess) { revert CallFailed(); }
    }

    modifier onlyOwner() {
        if (msg.sender != i_owner) { revert NotOwner(); }
        _;
    }

    // What happens if someone sends ETH to this
    // contract without calling the fund() function:
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }
}
