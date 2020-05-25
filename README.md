# Blockchain Ticket System
This project is an Ethereum-based smart contract ticket sale system. 

The contract has been deployed to the Ropsten public test network and the web app is currently hosted through Github Pages. Access the web app [here](https://gjorsi.github.io/blockchain-ticket-system), where you can view the content on the Ropsten network or, if you have MetaMask installed, you can connect to the Ropsten network and create events / buy tickets etc. To get ETH for testing on Ropsten, you can access this [faucet](https://faucet.metamask.io/).

The repo contains the contract, compiled with Solidity 0.5.12, and a web app using React and Web3.js. 

## Security considerations

### Function structuring
- As a step to mitigate reentry exploitation, every function is structured in the following manner: 
	1. Authorization and validity checks ("require()" methods)
	2. Computations and state changes
	3. Call(s) / transactions

### Transfer / Send / Call functions
- Due to gas cost changes in [EIP 1884](https://eips.ethereum.org/EIPS/eip-1884), use of the transfer and send functions should be avoided after the Istanbul hard fork. Instead, the call-function is used. Call returns a boolean which represents if the transaction can be performed, so a require() should check the boolean to potentially revert the entire operation if one call fails. 

### Integer overflow
- In Solidity smart contracts, int and uint values are vulnerable to overflow. This can be used to exploit functions where addition and multiplication is used to calculate prices or total number of tickets. Necessary safety measures have been implemented in those cases.


## Tools 
- Solidity 0.5.12
- Truffle v5.1.7
- Ganache v2.3.0-beta.2
- Node v12.14.1
- Web3.js v1.2.1


## Contract interface

### Event host functions
create_event()
- Create a new event. The sender becomes the owner of the new event.

A function modifier is applied to all the following functions to make sure the sender can only alter events he/she has created.

withdraw_funds()
- Withdraw all funds received for tickets to the event identified
- Disables the customer buyback function for this event

get_tickets()
- Get the number of tickets this customer owns for the given event

get_customers()
- Get array of all customer addresses

stop_sale()
- Stop the sale until further notice. Calls to buy tickets will be rejected while sale is stopped.

continue_sale()
- Reopens sale if stopped by stop_sale()

add_tickets()
- Increase the number of available tickets by the given amount

change_ticket_price()
- Change the ticket price to the new value

delete_event()
- Delete an owned event

### Customer (public) functions
buy_tickets()
- Ticket sale must be open
- The number of tickets requested must be available
- A customer can buy an amount of tickets up to the maximum per customer allowed by owner (if the owner has set a limit)
- The customer must transfer at least the amount equal to number of tickets requested multiplied by the ticket price
- The customer is stored if accepted (address and number of tickets)
- Excess amount is returned to sender

return_tickets()
- Rejects if buyback or sale is disabled
- Rejects if deadline is passed
- Returns the total amount the sender has previously paid to the contract
- Deletes all tickets owned by sender and adds them to available tickets

get_event_info()
- Get all info associated with an event: title, owner, deadline, available_tickets, max_per_customer, ticket_price, sale_active, buyback_active, per_customer_limit

get_events()
- Get a list of all event IDs

get_participation()
- Get a list of events for which sender owns tickets to

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
- Tested by manually interacting with the web app (creation of events, editing of owned events, buying of tickets etc)
