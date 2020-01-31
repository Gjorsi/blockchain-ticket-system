pragma solidity ^0.5.12;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/EventContract.sol";

contract EventSanityTest {
  function testInitialState() public {
    EventContract eventC = new EventContract();
  }
}
