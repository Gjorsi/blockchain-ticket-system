const EventContract = artifacts.require("EventContract");

contract('EventContract - Buyback tests', (accounts) => {
  let eventC;
  let events = [];
  const owner = accounts[0];

  it('Setup', async () => {
    eventC = await EventContract.deployed();
  });

  it('Create event', async () => {
    let id = web3.utils.asciiToHex("TestEvent1");
    let title = web3.utils.asciiToHex("This is the event title");
    let deadline = Math.round(new Date("2021-01-01").getTime() / 1000)
    await eventC.create_event(id, title, [1000], [1e16.toString()], false, 0, true, true, deadline,{from:owner});
    events.push({ id: id, num_tickets: 1000, ticket_price: 1e16, per_customer_limit: false, max_per_customer: 0, owner: owner});
  });

  it('Attempt to buy and return tickets', async () => {
    let buyer = accounts[1];
    let tickets_to_buy = 2;
    let tickets_available_before = parseFloat((await eventC.get_event_info(events[0].id)).available_tickets);
    let balance_before = BigInt(await web3.eth.getBalance(buyer));
    let receipt = await eventC.buy_tickets(events[0].id, 0, tickets_to_buy, {from:buyer, value:events[0].ticket_price*2});
    console.log(`     Gas used to buy ${tickets_to_buy} ticket(s): ${receipt.receipt.gasUsed}`);

    let tx = await web3.eth.getTransaction(receipt.tx);
    let total_gas_cost = tx.gasPrice*receipt.receipt.gasUsed;

    let buyers_tickets = parseFloat(await eventC.get_tickets(events[0].id, buyer, {from:events[0].owner}));
    assert.equal(buyers_tickets, tickets_to_buy);

    let tickets_available_after = parseFloat((await eventC.get_event_info(events[0].id)).available_tickets);
    assert.equal(tickets_available_before, tickets_available_after+buyers_tickets);

    receipt = await eventC.return_tickets(events[0].id, {from:buyer});

    console.log(`     Gas used to return ${tickets_to_buy} ticket(s): ${receipt.receipt.gasUsed}`);
    tickets_available_after = parseFloat((await eventC.get_event_info(events[0].id)).available_tickets);
    assert.equal(tickets_available_before, tickets_available_after);

    tx = await web3.eth.getTransaction(receipt.tx);
    total_gas_cost += tx.gasPrice*receipt.receipt.gasUsed;
    let balance_after = BigInt(await web3.eth.getBalance(buyer));
    assert.equal(balance_before, balance_after+BigInt(total_gas_cost));

  });

  it('Attempt to return non-existing tickets', async () => {
    let buyer = accounts[2];
    try {
      await eventC.return_tickets(events[0].id, {from:buyer});
      assert.fail("User without tickets was allowed to call buyback function.");
    } catch (error) {
      if(error.message.search('User does not own any tickets') > -1) {
        // correct outcome, test should pass
      } else {
        throw error;
      }
    }
  });
});
