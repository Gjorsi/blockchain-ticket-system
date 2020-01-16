const EventContract = artifacts.require("EventContract");

contract('EventContract', (accounts) => {

  let eventC;
  const eth = 1e18; //1 eth in wei units
  const ticket_price = 1e16; // 0.01 eth
  let receipt = [];
  let gasPrice = [];
  const buyer = accounts[1];
  const owner = accounts[0];

  it('Setup', async () => {
    eventC = await EventContract.deployed();
    //balance_before = parseFloat(await web3.eth.getBalance(accounts[1]));
    let actual_n_tickets = await eventC.available_tickets();
    let actual_ticket_price = await eventC.ticket_price();
    console.log(`Available tickets: ${actual_n_tickets}`);
    console.log(`Ticket price: ${parseFloat(actual_ticket_price)}`);
  })

  it('Attempt to buy a ticket', async () => {
    let tickets_to_buy = 1;
    receipt.push(await eventC.buy_tickets(tickets_to_buy, {from:buyer, value:ticket_price}));
    console.log(`Gas used to buy ticket: ${receipt[0].receipt.gasUsed}`);
    let buyers_tickets = await eventC.get_tickets(buyer, {from:owner});
    assert.equal(buyers_tickets, tickets_to_buy);
  });
});
