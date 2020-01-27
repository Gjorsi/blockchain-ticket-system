const EventContract = artifacts.require("EventContract");

contract('EventContract', (accounts) => {
  let eventC;
  const eth = 1e18; //1 eth in wei units
  const ticket_price = 1e16; // 0.01 eth
  let receipt = [];
  let gasPrice = [];
  let buyer = accounts[10];
  const owner = accounts[0];

  it('Setup', async () => {
    eventC = await EventContract.deployed();
    let actual_n_tickets = await eventC.available_tickets();
    let actual_ticket_price = await eventC.ticket_price();
    console.log(`     Available tickets: ${actual_n_tickets}`);
    console.log(`     Ticket price: ${parseFloat(actual_ticket_price)}`);
    await eventC.buy_tickets(1, {from:accounts[9], value:ticket_price})
  })

  it('Attempt to buy and return tickets', async () => {
    let tickets_to_buy = 2;
    let tickets_available_before = parseFloat(await eventC.available_tickets());
    let balance_before = parseFloat(await web3.eth.getBalance(buyer));
    receipt.push(await eventC.buy_tickets(tickets_to_buy, {from:buyer, value:ticket_price*2}));
    console.log(`     Gas used to buy ${tickets_to_buy} ticket(s): ${receipt[0].receipt.gasUsed}`);

    let tx = await web3.eth.getTransaction(receipt[0].tx);
    let total_gas_cost = tx.gasPrice*receipt[0].receipt.gasUsed;

    let buyers_tickets = parseFloat(await eventC.get_tickets(buyer, {from:owner}));
    assert.equal(buyers_tickets, tickets_to_buy);

    let tickets_available_after = parseFloat(await eventC.available_tickets());
    assert.equal(tickets_available_before, tickets_available_after+buyers_tickets);

    receipt.push(await eventC.return_tickets({from:buyer}));

    console.log(`     Gas used to return ${tickets_to_buy} ticket(s): ${receipt[1].receipt.gasUsed}`);
    tickets_available_after = await eventC.available_tickets();
    assert.equal(tickets_available_before, tickets_available_after);

    tx = await web3.eth.getTransaction(receipt[1].tx);
    total_gas_cost += tx.gasPrice*receipt[1].receipt.gasUsed;
    let balance_after = parseFloat(await web3.eth.getBalance(buyer));
    assert.equal(balance_before.toFixed(15), (balance_after+total_gas_cost).toFixed(15));
    // using only the first 15 digits due to js float imprecision

  });

  it('Attempt to return non-existing tickets', async () => {
    try {
      await eventC.return_tickets({from:buyer});
      assert.fail("User without tickets was allowed to call buyback function.");
    } catch (error) {
      if(error.message.search('User does not own any tickets') > -1) {
        // correct outcome, test should pass
      } else {
        assert.fail(error.message);
      }
    }
  });
});
