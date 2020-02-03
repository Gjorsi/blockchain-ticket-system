pragma solidity ^0.5.12;

contract EventContract {
  // Mapping from event id to event
  mapping(bytes32 => Event) public events;
  bytes32[] public event_id_list;

  struct Event {
    bytes32 event_id;
    bytes32 title;
    uint128 funds;
    address payable owner;
    uint64 available_tickets;
    uint64 max_per_customer;
    uint128 ticket_price;
    bool exists;
    bool sale_active;
    bool buyback_active;
    bool per_customer_limit;
    mapping(address => Customer) tickets;
    address[] customers;
  }

  struct Customer {
    address addr;
    uint64 num_tickets;
    uint128 total_paid;
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
    uint64 num_tickets,
    uint128 _ticket_price,
    bool _per_customer_limit,
    uint64 _max_per_customer,
    bool _sale_active,
    bool _buyback_active) external {
      require(!events[_event_id].exists, "Given event ID is not unique - it is already in use.");
      events[_event_id].exists = true;
      events[_event_id].event_id = _event_id;
      events[_event_id].title = _title;
      events[_event_id].available_tickets = num_tickets;
      events[_event_id].ticket_price = _ticket_price;
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

  function get_tickets(bytes32 event_id, address customer) external view returns (uint64) {
    return events[event_id].tickets[customer].num_tickets;
  }

  function get_customers(bytes32 event_id) external view eventExists(event_id)
        returns (address[] memory, uint64[] memory) {
    uint256 n_customers = events[event_id].customers.length;
    uint64[] memory num_tickets = new uint64[](n_customers);
    for(uint64 i = 0; i < n_customers; i++) {
        num_tickets[i] = events[event_id]
                          .tickets[events[event_id].customers[i]]
                          .num_tickets;
    }
    return (events[event_id].customers, num_tickets);
  }

  function stop_sale(bytes32 event_id) external eventExists(event_id) onlyHost(event_id) {
    events[event_id].sale_active = false;
  }

  function continue_sale(bytes32 event_id) external eventExists(event_id) onlyHost(event_id) {
    events[event_id].sale_active = true;
  }

  function add_tickets(bytes32 event_id, uint64 additional_tickets) external eventExists(event_id) onlyHost(event_id) {
    // Check for integer overflow
    require(events[event_id].available_tickets + additional_tickets > events[event_id].available_tickets,
            "Cannot exceed 2^64-1 tickets");
    events[event_id].available_tickets += additional_tickets;
  }

  function change_ticket_price(bytes32 event_id, uint128 new_price) external eventExists(event_id) onlyHost(event_id) {
    events[event_id].ticket_price = new_price;
  }

// ----- Public functions -----

  function buy_tickets(bytes32 event_id, uint64 requested_num_tickets) external payable {
    require(requested_num_tickets > 0);
    require(events[event_id].sale_active, "Ticket sale is closed by seller.");
    require(requested_num_tickets <= events[event_id].available_tickets,
      "Not enough tickets available.");
    require(!events[event_id].per_customer_limit ||
      (events[event_id].tickets[msg.sender].num_tickets + requested_num_tickets <= events[event_id].max_per_customer),
      "Purchase surpasses max per customer.");
    uint128 sum_price = uint128(requested_num_tickets)*uint128(events[event_id].ticket_price);
    require(msg.value >= sum_price, "Not enough ether was sent.");

    if(events[event_id].tickets[msg.sender].num_tickets == 0) {
      events[event_id].tickets[msg.sender].addr = msg.sender;
      events[event_id].customers.push(msg.sender);
    }
    events[event_id].tickets[msg.sender].num_tickets += requested_num_tickets;
    events[event_id].tickets[msg.sender].total_paid += sum_price;
    events[event_id].available_tickets -= requested_num_tickets;
    events[event_id].funds += sum_price;

    // Return excessive funds
    if(msg.value > sum_price) {
      (bool success, ) = msg.sender.call.value(msg.value - sum_price)("");
      require(success, "Return of excess funds to sender failed.");
    }
  }

  function return_tickets(bytes32 event_id) external {
    require(events[event_id].tickets[msg.sender].num_tickets > 0, "User does not own any tickets.");
    require(events[event_id].buyback_active, "Ticket buyback has been deactivated by owner.");
    require(events[event_id].sale_active, "Ticket sale is locked, which disables buyback.");

    uint return_amount = events[event_id].tickets[msg.sender].total_paid;
    events[event_id].available_tickets += events[event_id].tickets[msg.sender].num_tickets;
    delete_customer(event_id, msg.sender); // Necessary? Could potentially just set num_tickets = 0

    (bool success, ) = msg.sender.call.value(return_amount)("");
    require(success, "Return transfer to customer failed.");
  }

  function get_event_info(bytes32 event_id) external view eventExists(event_id) returns (
    bytes32 id,
    bytes32 title,
    address owner,
    uint64 available_tickets,
    uint64 max_per_customer,
    uint128 ticket_price,
    bool sale_active,
    bool buyback_active,
    bool per_customer_limit) {
      Event memory e = events[event_id];
      return (
        e.event_id,
        e.title,
        e.owner,
        e.available_tickets,
        e.max_per_customer,
        e.ticket_price,
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
