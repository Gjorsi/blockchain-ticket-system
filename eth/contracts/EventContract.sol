pragma solidity ^0.5.12;

contract EventContract {
  // Mapping from event id to event
  mapping(bytes32 => Event) public events;
  bytes32[] public event_id_list;
  uint8 public max_ticket_types = 100;

  struct Event { // attempt strict packaging
    bytes32 event_id;
    bytes32 title;
    bool exists;
    bool sale_active;
    bool buyback_active;
    bool per_customer_limit;
    uint64 max_per_customer;
    uint128 funds;
    address payable owner;
    uint64[] available_tickets;
    uint128[] ticket_prices;
    address[] customers;
    mapping(address => Customer) tickets;
  }

  struct Customer {
    bool exists;
    uint64 total_num_tickets;
    uint128 total_paid;
    address addr;
    uint64[] num_tickets;
  }

  modifier eventExists(bytes32 event_id){
    require(events[event_id].exists, "Event with given ID not found.");
    _;
  }

  modifier onlyHost(bytes32 event_id){
    require(events[event_id].owner == msg.sender, "Sender is not the owner of this event");
    _;
  }

// ----- Event host functions -----

  function create_event(bytes32 _event_id,
    bytes32 _title,
    uint64[] calldata num_tickets,
    uint128[] calldata _ticket_prices,
    bool _per_customer_limit,
    uint64 _max_per_customer,
    bool _sale_active,
    bool _buyback_active) external {
      require(!events[_event_id].exists, "Given event ID is already in use.");
      require(num_tickets.length == _ticket_prices.length,
        "Different number of ticket types given by price and number available arrays.");
      require(num_tickets.length > 0, "Cannot create event with zero ticket types.");
      require(num_tickets.length <= max_ticket_types, "Maximum number of ticket types exceeded.")
      events[_event_id].exists = true;
      events[_event_id].event_id = _event_id;
      events[_event_id].title = _title;
      events[_event_id].available_tickets = num_tickets;
      events[_event_id].ticket_prices = _ticket_prices;
      events[_event_id].max_per_customer = _max_per_customer;
      events[_event_id].per_customer_limit = _per_customer_limit;
      events[_event_id].owner = msg.sender;
      events[_event_id].sale_active = _sale_active;
      events[_event_id].buyback_active = _buyback_active;
      event_id_list.push(_event_id);
  }

  function withdraw_funds(bytes32 event_id) external eventExists(event_id) onlyHost(event_id) {
    require(events[event_id].exists, "Event with given ID not found.");
    events[event_id].buyback_active = false;
    uint128 withdraw_amount = events[event_id].funds;
    events[event_id].funds = 0;

    (bool success, ) = events[event_id].owner.call.value(withdraw_amount)("");
    require(success, "Withdrawal transfer failed.");
  }

  function get_tickets(bytes32 event_id, address customer) external view returns (uint64[] memory) {
    return events[event_id].tickets[customer].num_tickets;
  }

  function get_customers(bytes32 event_id) external view eventExists(event_id)
        returns (address[] memory) {
    return (events[event_id].customers);
  }

  function stop_sale(bytes32 event_id) external eventExists(event_id) onlyHost(event_id) {
    events[event_id].sale_active = false;
  }

  function continue_sale(bytes32 event_id) external eventExists(event_id) onlyHost(event_id) {
    events[event_id].sale_active = true;
  }

  function add_tickets(bytes32 event_id, uint64[] calldata additional_tickets) external eventExists(event_id) onlyHost(event_id) {
    require(additional_tickets.length == events[event_id].available_tickets.length,
      "List of number of tickets to add must be of same length as existing list of tickets.");

    for(uint64 i = 0; i < events[event_id].available_tickets.length ; i++) {
      // Check for integer overflow
      require(events[event_id].available_tickets[i] + additional_tickets[i] > events[event_id].available_tickets[i],
              "Cannot exceed 2^64-1 tickets");
      events[event_id].available_tickets[i] += additional_tickets[i];
    }

  }

  function change_ticket_price(bytes32 event_id, uint64 ticket_type, uint128 new_price) external eventExists(event_id) onlyHost(event_id) {
    require(ticket_type < events[event_id].ticket_prices.length, "Ticket type does not exist.");
    events[event_id].ticket_prices[ticket_type] = new_price;
  }

// ----- Public functions -----

  function buy_tickets(bytes32 event_id, uint64 ticket_type, uint64 requested_num_tickets) external payable {
    require(requested_num_tickets > 0);
    require(ticket_type < events[event_id].available_tickets.length, "Ticket type does not exist.");
    require(events[event_id].sale_active, "Ticket sale is closed by seller.");
    require(requested_num_tickets <= events[event_id].available_tickets[ticket_type],
      "Not enough tickets available.");
    require(!events[event_id].per_customer_limit ||
      (events[event_id].tickets[msg.sender].total_num_tickets + requested_num_tickets <= events[event_id].max_per_customer),
      "Purchase surpasses max per customer.");
    uint128 sum_price = uint128(requested_num_tickets)*uint128(events[event_id].ticket_prices[ticket_type]);
    require(msg.value >= sum_price, "Not enough ether was sent.");

    if(!events[event_id].tickets[msg.sender].exists) {
      events[event_id].tickets[msg.sender].exists = true;
      events[event_id].tickets[msg.sender].addr = msg.sender;
      events[event_id].customers.push(msg.sender);
      events[event_id].tickets[msg.sender].num_tickets = new uint64[](events[event_id].available_tickets.length);
    }

    events[event_id].tickets[msg.sender].total_num_tickets += requested_num_tickets;
    events[event_id].tickets[msg.sender].num_tickets[ticket_type] += requested_num_tickets;
    events[event_id].tickets[msg.sender].total_paid += sum_price;
    events[event_id].available_tickets[ticket_type] -= requested_num_tickets;
    events[event_id].funds += sum_price;

    // Return excessive funds
    if(msg.value > sum_price) {
      (bool success, ) = msg.sender.call.value(msg.value - sum_price)("");
      require(success, "Return of excess funds to sender failed.");
    }
  }

  function return_tickets(bytes32 event_id) external {
    require(events[event_id].tickets[msg.sender].total_num_tickets > 0,
      "User does not own any tickets to this event.");
    require(events[event_id].buyback_active, "Ticket buyback has been deactivated by owner.");
    require(events[event_id].sale_active, "Ticket sale is locked, which disables buyback.");

    uint return_amount = events[event_id].tickets[msg.sender].total_paid;

    for(uint64 i = 0; i < events[event_id].available_tickets.length ; i++) {
      // Check for integer overflow
      require(events[event_id].available_tickets[i] +
        events[event_id].tickets[msg.sender].num_tickets[i] >
        events[event_id].available_tickets[i],
        "Failed because returned tickets would increase ticket pool past storage limit.");
      events[event_id].available_tickets[i] += events[event_id].tickets[msg.sender].num_tickets[i];
    }

    delete_customer(event_id, msg.sender);

    (bool success, ) = msg.sender.call.value(return_amount)("");
    require(success, "Return transfer to customer failed.");
  }

  function get_event_info(bytes32 event_id) external view eventExists(event_id) returns (
    bytes32 id,
    bytes32 title,
    address owner,
    uint64[] memory available_tickets,
    uint64 max_per_customer,
    uint128[] memory ticket_price,
    bool sale_active,
    bool buyback_active,
    bool per_customer_limit) {
      Event memory e = events[event_id]; // does this make a deep copy of the struct to memory?
      return (
        e.event_id,
        e.title,
        e.owner,
        e.available_tickets,
        e.max_per_customer,
        e.ticket_prices,
        e.sale_active,
        e.buyback_active,
        e.per_customer_limit);
    }

// ----- Internal functions -----

  function delete_customer(bytes32 event_id, address customer_addr) internal {
    delete events[event_id].tickets[customer_addr];
    for(uint64 i = 0; i < events[event_id].customers.length; i++) {
      if (events[event_id].customers[i] == customer_addr) {
        // replace with last element in array and reduce its length by 1 to avoid gaps
        events[event_id].customers[i] = events[event_id].customers[events[event_id].customers.length-1];
        delete events[event_id].customers[events[event_id].customers.length-1];
        events[event_id].customers.length--;
        break;
      }
    }
  }

  function delete_event(bytes32 event_id) internal {
    delete events[event_id];
    for(uint64 i = 0; i < event_id_list.length; i++) {
      if (event_id_list[i] == event_id) {
        // replace with last element in array and reduce its length by 1 to avoid gaps
        event_id_list[i] = event_id_list[event_id_list.length-1];
        delete event_id_list[event_id_list.length-1];
        event_id_list.length--;
        break;
      }
    }
  }
}
