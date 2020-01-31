pragma solidity ^0.5.12;

contract EventContract {
  address payable private owner;
  uint64 public available_tickets;
  uint64 public max_per_customer;
  uint128 public ticket_price;
  bool public sale_active = true;
  bool public buyback_active = true;
  bool public per_customer_limit;
  mapping(address => Customer) private tickets;
  address[] private customers;

  struct Customer {
      address addr;
      uint64 num_tickets;
      uint128 total_paid;
  }

  constructor(uint64 num_tickets,
    uint128 _ticket_price,
    bool _per_customer_limit,
    uint64 _max_per_customer) public {
    available_tickets = num_tickets;
    ticket_price = _ticket_price;
    max_per_customer = _max_per_customer;
    per_customer_limit = _per_customer_limit;
    owner = msg.sender;
  }

// ----- Owner functions -----

  modifier onlyOwner {
    require(msg.sender == owner, "User was not authorized to call this function.");
    _;
  }

  function withdraw_funds() external payable onlyOwner {
    buyback_active = false;
    (bool success, ) = owner.call.value(address(this).balance)("");
    require(success, "Withdrawal transfer failed.");
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
    require(requested_num_tickets <= available_tickets,
      "Not enough tickets available.");
    require(!per_customer_limit || (tickets[msg.sender].num_tickets + requested_num_tickets <= max_per_customer),
      "Purchase surpasses max per customer.");
    uint128 sum_price = uint128(requested_num_tickets)*uint128(ticket_price);
    require(msg.value >= sum_price, "Not enough ether was sent.");
    require(sale_active, "Ticket sale is closed by seller.");

    if(tickets[msg.sender].num_tickets == 0) {
      tickets[msg.sender].addr = msg.sender;
      customers.push(msg.sender);
    }
    tickets[msg.sender].num_tickets += requested_num_tickets;
    tickets[msg.sender].total_paid += sum_price;
    available_tickets -= requested_num_tickets;

    // Return excessive funds
    if(msg.value > sum_price) {
      (bool success, ) = msg.sender.call.value(msg.value - sum_price)("");
      require(success, "Return of excess funds to sender failed.");
    }
  }

  function return_tickets() external {
    require(tickets[msg.sender].num_tickets > 0, "User does not own any tickets.");
    require(buyback_active, "Ticket buyback has been deactivated by owner.");
    require(sale_active, "Ticket sale is locked, which disables buyback.");

    uint return_amount = tickets[msg.sender].total_paid;
    available_tickets += tickets[msg.sender].num_tickets;
    delete_customer(msg.sender); // Necessary? Could potentially just set num_tickets = 0

    (bool success, ) = msg.sender.call.value(return_amount)("");
    require(success, "Return transfer to customer failed.");
  }

// ----- Internal functions -----

  function delete_customer(address customer_addr) internal {
    delete tickets[customer_addr];
    for(uint64 i = 0; i < customers.length; i++) {
      if (customers[i] == customer_addr) {
        // replace with last element in array and reduce its length by 1 to avoid gaps
        customers[i] = customers[customers.length-1];
        delete customers[customers.length-1];
        customers.length--;
        break;
      }
    }
  }
}
