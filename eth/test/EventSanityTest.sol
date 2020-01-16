pragma solidity ^0.5.12;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/EventContract.sol";

contract EventSanityTest {

  uint ticket_price = 10000000000000000; // 0.01 eth
  uint n_tickets = 100;

  function testInitialState() public {
    EventContract eventC = new EventContract(n_tickets, ticket_price);

    Assert.equal(n_tickets, eventC.available_tickets(), "Available_tickets after deployment should be as initialised");
    Assert.equal(ticket_price, eventC.ticket_price(), "Ticket_price check after deployment should be as initialised");
  }
}
