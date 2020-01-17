pragma solidity ^0.5.12;

contract EventContract {
  address payable private owner;
  uint public available_tickets;
  uint public ticket_price;
  mapping(address => Customer) private tickets;
  address[] private customers;

  struct Customer {
      address addr;
      uint num_tickets;
  }

  constructor(uint num_tickets, uint _ticket_price) public {
    available_tickets = num_tickets;
    ticket_price = _ticket_price;
    owner = msg.sender;
  }

  modifier onlyOwner {
    require(msg.sender == owner, "Sender was not authorized to call this function.");
    _;
  }

  function buy_tickets(uint requested_num_tickets) external payable {
      require(requested_num_tickets <= available_tickets, "Not enough tickets available");
      require(msg.value >= requested_num_tickets*ticket_price, "Not enough ether was sent.");
      if(tickets[msg.sender].num_tickets == 0){
          tickets[msg.sender].addr = msg.sender;
          customers.push(msg.sender);
      }
      tickets[msg.sender].num_tickets += requested_num_tickets;
      available_tickets -= requested_num_tickets;

      // Return excessive funds
      if(msg.value > requested_num_tickets*ticket_price) {
          msg.sender.transfer(msg.value - requested_num_tickets*ticket_price);
      }
  }

  function withdraw_funds() external payable onlyOwner {
      owner.transfer(address(this).balance);
  }

  function get_tickets(address customer) external view onlyOwner returns (uint) {
      return tickets[customer].num_tickets;
  }

  function get_customers() external view onlyOwner
        returns (address[] memory, uint[] memory) {
    // TODO: Find a cheaper way (for-loops are potentially expensive)
    uint[] memory num_tickets = new uint[](customers.length);
    for(uint i = 0; i < customers.length; i++) {
        num_tickets[i] = tickets[customers[i]].num_tickets;
    }
    return (customers, num_tickets);
  }
}
