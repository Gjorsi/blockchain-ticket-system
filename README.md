# Blockchain Ticket System
This project is an ethereum-based smart contract ticket sale system. 

# Phase 2
A single contract capable of hosting a number of unique events simultaneously


# Phase 1 
A single contract for a single event (proof of concept stage)

## Contract interface
### Owner functions
A function modifier is applied to all the following functions to make sure only the owner of the contract can call them.


withdraw_funds()
- Withdraw all funds in the contract
- Disables the customer buyback function

get_tickets(address customer)
- Get the number 

get_customers()
- Get arrays of all customer addresses and their associated number of tickets

stop_sale()
- Stop the sale until further notice. Calls to buy tickets will be rejected while sale is stopped.

continue_sale()
- Reopens sale if stopped by stop_sale()

add_tickets(uint64 additional_tickets)
- Increase the number of available tickets by the given amount

change_ticket_price(uint128 new_price)
- Change the ticket price to the new values

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
- 