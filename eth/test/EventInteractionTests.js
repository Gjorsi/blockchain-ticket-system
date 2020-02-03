const EventContract = artifacts.require("EventContract");

contract('EventContract - Interaction tests', (accounts) => {

  let eventC;
  let events = [];
  const owner = accounts[0];

  it('Setup', async () => {
    eventC = await EventContract.deployed();
  });

  it('Create event', async () => {
    let id = web3.utils.asciiToHex("TestEvent2");
    let title = web3.utils.asciiToHex("This is the event title");
    await eventC.create_event(id, title, [1000], [1e16.toString()], false, 0, true, true, {from:owner});

    events.push({ id: id, num_tickets: 1000, ticket_price: 1e16, per_customer_limit: false, max_per_customer: 0, owner: owner});
  });

  it('Attempt to buy tickets', async () => {
    let buyer = accounts[1];
    let tickets_to_buy = 1;
    let purchase = await eventC.buy_tickets(events[0].id, 0, tickets_to_buy, {from:buyer, value: events[0].ticket_price});
    console.log(`     Gas used to buy ${tickets_to_buy} ticket(s): ${purchase.receipt.gasUsed}`);

    let buyers_tickets = await eventC.get_tickets(events[0].id, buyer, {from:owner});
    assert.equal(buyers_tickets, tickets_to_buy);

    tickets_to_buy = 5;
    purchase = await eventC.buy_tickets(events[0].id, 0, tickets_to_buy, {from: buyer, value: events[0].ticket_price*tickets_to_buy});
    console.log(`     Gas used to buy ${tickets_to_buy} ticket(s): ${purchase.receipt.gasUsed}`);

    buyers_tickets = await eventC.get_tickets(events[0].id, buyer, {from:owner});
    assert.equal(buyers_tickets, tickets_to_buy+1);
  });

  it('Attempt to buy a ticket with insufficient amount', async () => {
    let buyer = accounts[2];
    let tickets_to_buy = 1;
    let amount = events[0].ticket_price / 2;
    try {
      await eventC.buy_tickets(events[0].id, 0, tickets_to_buy, {from:buyer, value:amount});
      assert.fail("Attempt to buy ticket at less than actual price succeeded");
    } catch (error) {
      if(error.message.search('Not enough ether was sent') > -1) {
        // correct outcome, test should pass
      } else {
        assert.fail(error.message);
      }
    }
  });

  it('Attempt to buy a ticket with excessive amount', async () => {
    let buyer = accounts[3];
    let balance_before = BigInt(await web3.eth.getBalance(buyer));
    let tickets_to_buy = 1;
    let amount = 2*events[0].ticket_price;
    try {
      let rcpt = await eventC.buy_tickets(events[0].id, 0, tickets_to_buy, {from:buyer, value:amount});
      let tx = await web3.eth.getTransaction(rcpt.tx);
      let total_gas_cost = tx.gasPrice*rcpt.receipt.gasUsed;

      let expected_balance = balance_before - BigInt(events[0].ticket_price) - BigInt(total_gas_cost);
      let balance_after = BigInt(await web3.eth.getBalance(buyer));
      assert.equal(expected_balance, balance_after);
    } catch (error) {
      assert.fail(error.message);
    }
  });

  it('Attempt to withdraw funds from unauthorized address', async () => {
    try {
      await eventC.withdraw_funds(events[0].id, {from:accounts[9]});
      assert.fail("Unauthorized address was allowed to call withdraw_funds");
    } catch (error) {
      if(error.message.search('Sender is not the owner of this event') > -1) {
        // correct outcome, test should pass
      } else {
        throw error;
      }
    }
  });

  it('Stop and continue sale', async () => {
    await eventC.stop_sale(events[0].id, {from:events[0].owner});
    let _sale_active = (await eventC.get_event_info(events[0].id)).sale_active;
    assert.equal(_sale_active, false);

    try {
      await eventC.buy_tickets(events[0].id, 0, 1, {from:accounts[4], value:events[0].ticket_price})
      assert.fail("Ticket sale was not stopped");
    } catch (error) {
      if(error.message.search('Ticket sale is closed by seller') > -1) {
        // correct outcome, test should pass
      } else {
        assert.fail(error.message);
      }
    }

    await eventC.continue_sale(events[0].id, {from:events[0].owner});
    _sale_active = (await eventC.get_event_info(events[0].id)).sale_active;
    assert.equal(_sale_active, true);
  });

  it('Add tickets', async () => {
    let _n_tickets = parseFloat((await eventC.get_event_info(events[0].id)).available_tickets);
    await eventC.add_tickets(events[0].id, [10], {from:events[0].owner});
    let new_n_tickets = parseFloat((await eventC.get_event_info(events[0].id)).available_tickets);
    assert.equal(_n_tickets+10, new_n_tickets);
  });

  it('Change ticket price', async () => {
    let old_ticket_price = BigInt((await eventC.get_event_info(events[0].id)).ticket_price);
    await eventC.change_ticket_price(events[0].id, 0, (old_ticket_price + BigInt(1e16)).toString(), {from:owner});
    let new_ticket_price = BigInt((await eventC.get_event_info(events[0].id)).ticket_price);
    assert.equal(old_ticket_price+BigInt(1e16), new_ticket_price);
  });
});
