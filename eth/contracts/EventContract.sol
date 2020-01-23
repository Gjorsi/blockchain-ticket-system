pragma solidity ^0.5.12;

contract EventContract {
  address payable private owner;
  uint64 public available_tickets;
  uint64 public ticket_price;
  bool public sale_active = true;
  mapping(address => Customer) private tickets;
  address[] private customers;

  struct Customer {
      address addr;
      uint64 num_tickets;
  }

  constructor(uint64 num_tickets, uint64 _ticket_price) public {
    available_tickets = num_tickets;
    ticket_price = _ticket_price;
    owner = msg.sender;
  }

// ----- Owner functions -----

  modifier onlyOwner {
    require(msg.sender == owner, "User was not authorized to call this function.");
    _;
  }

  function withdraw_funds() external payable onlyOwner {
      owner.transfer(address(this).balance);
  }

  function get_tickets(address customer) external view onlyOwner returns (uint64) {
      return tickets[customer].num_tickets;
  }

  function get_customers() external view onlyOwner
        returns (address[] memory, uint64[] memory) {
    uint64[] memory num_tickets = new uint64[](customers.length);
    for(uint64 i = 0; i < customers.length; i++) {
        num_tickets[i] = tickets[customers[i]].num_tickets;
    }
    return (customers, num_tickets);
  }

  function stop_sale() external onlyOwner {
    sale_active = false;
  }

  function continue_sale() external onlyOwner {
    sale_active = true;
  }

  function add_tickets(uint64 additional_tickets) external onlyOwner {
    // Check for integer overflow
    require(available_tickets + additional_tickets > available_tickets,
            "Cannot exceed 2^64-1 tickets");

    available_tickets += additional_tickets;
  }

// ----- Public functions -----

  function buy_tickets(uint64 requested_num_tickets) external payable {
      require(requested_num_tickets <= available_tickets, "Not enough tickets available");
      require(msg.value >= uint128(requested_num_tickets)*uint128(ticket_price), "Not enough ether was sent.");
      require(sale_active, "Ticket sale is closed by owner.");

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
}
