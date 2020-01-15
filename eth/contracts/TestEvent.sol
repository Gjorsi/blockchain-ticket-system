pragma solidity >=0.4.21 <0.7.0;

contract TestEvent {
  address payable owner;
  uint available_tickets;
  uint ticket_price;
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
    require(msg.sender == owner, "Only owner can call this function.");
    _;
  }

  function buy_tickets(uint num_tickets) external payable {
      require(num_tickets <= available_tickets, "Not enough tickets available");
      require(msg.value >= num_tickets*ticket_price, "Not enough ether was sent.");
      if(tickets[msg.sender].num_tickets == 0){
          tickets[msg.sender].addr = msg.sender;
          customers.push(msg.sender);
      }
      tickets[msg.sender].num_tickets += num_tickets;
      available_tickets -= num_tickets;
      // Should return excessive ether
  }

  function get_tickets(address customer) external view onlyOwner returns (uint) {
      return tickets[customer].num_tickets;
  }

  function get_customers() external view onlyOwner
        returns (address[] memory, uint[] memory) {
    // TODO: Find a cheaper way
    uint[] memory num_tickets = new uint[](customers.length);
    for(uint i = 0; i < customers.length; i++) {
        num_tickets[i] = tickets[customers[i]].num_tickets;
    }
    return (customers, num_tickets);
  }
}
