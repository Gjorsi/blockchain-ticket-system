# Blockchain Ticket System
This project is an ethereum-based smart contract ticket sale system. 

# Phase 2
A single contract capable of hosting a number of unique events simultaneously

## Contract interface
### Event host functions
create_event(
	uint64 num_tickets,
    uint128 _ticket_price,
    bool _per_customer_limit,
    uint64 _max_per_customer)
- Create a new event. The sender becomes the owner of the new event.

A function modifier is applied to all the following functions to make sure the sender can only alter events he/she has created.

withdraw_funds(uint64 event_id)
- Withdraw all funds received for tickets to the event identified
- Disables the customer buyback function for this event

get_tickets(uint64 event_id, address customer)
- Get the number of tickets this customer owns for the given event

get_customers(uint64 event_id)
- Get arrays of all customer addresses and their associated number of tickets for the given event

stop_sale(uint64 event_id)
- Stop the sale until further notice. Calls to buy tickets will be rejected while sale is stopped.

continue_sale(uint64 event_id)
- Reopens sale if stopped by stop_sale()

add_tickets(uint64 event_id, uint64 additional_tickets)
- Increase the number of available tickets by the given amount

change_ticket_price(uint128 new_price)
- Change the ticket price to the new value

### Customer (public) functions
buy_tickets()
- Ticket sale must be open
- The number of tickets requested must be available
- A customer can buy an amount of tickets up to the maximum per customer allowed by owner (if the owner has set a limit)
- The customer must transfer at least the amount equal to number of tickets requested multiplied by the ticket price
- The customer is stored if accepted (address and number of tickets)
- Excess amount is returned to sender

return_tickets()
- Rejects if buyback is disabled
- Returns the total amount the sender has previously paid to the contract
- Deletes all tickets owned by sender and adds them to available tickets

get_event_info(uint64 event_id)
- Get all info associated with an event: owner, available_tickets, max_per_customer, ticket_price, sale_active, buyback_active, per_customer_limit

## Security considerations

### Function structuring
- As a step to mitigate reentry exploitation, every function is structured in the following manner: 
	1. Authorization and validity checks ("require()" methods)
	2. Computations and state changes
	3. Call(s)

### Transfer / Send / Call functions
- Due to gas cost changes in [EIP 1884](https://eips.ethereum.org/EIPS/eip-1884), use of the transfer and send functions should be avoided after the Istanbul hard fork. Instead, the call-function is used. Call returns a boolean which represents if the transaction can be performed, so a require() should check the boolean to potentially revert the entire operation if one call fails. 

### Integer overflow
- In Solidity smart contracts, int and uint values are vulnerable to overflow. This can be used to exploit functions where addition and multiplication is used to calculate prices or total number of tickets. Necessary safety measures have been implemented in those cases.

## Tools 
- Solidity 0.5.12
	- smart contract language (not the latest available version, but the latest supported by truffle)
- Truffle v5.1.7
	- compilation
	- testing
	- deployment to blockchain
- Ganache v2.3.0-beta.1
	- Private ethereum blockchain
	
## Tests
### Unit tests
- Ticket purchase, checking that contract state changes correctly and cost is correct.
- Returning tickets, checking that customer no longer owns tickets, and that ether has been returned.
- Check that customer is unable to buy tickets with insufficient funds.
- Check that contract returns excessive funds.
- Check that address which is not owner cannot withdraw.
- Stop and continue sale function test.
- Add tickets.
- Change ticket price. 
- Gas usage measurements.
- Functionality of ticket buyback.

### Manual tests
- Tested by manually interacting with the contract through MyEtherWallet (MEW)
