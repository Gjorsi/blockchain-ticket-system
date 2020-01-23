const EventContract = artifacts.require("EventContract");

contract('EventContract', (accounts) => {

  let eventC;
  const eth = 1e18; //1 eth in wei units
  const ticket_price = 1e16; // 0.01 eth
  let receipt = [];
  let gasPrice = [];
  let buyer = accounts[1];
  const owner = accounts[0];

  it('Setup', async () => {
    eventC = await EventContract.deployed();
    //balance_before = parseFloat(await web3.eth.getBalance(accounts[1]));
    let actual_n_tickets = await eventC.available_tickets();
    let actual_ticket_price = await eventC.ticket_price();
    console.log(`   Available tickets: ${actual_n_tickets}`);
    console.log(`   Ticket price: ${parseFloat(actual_ticket_price)}`);
  })

  it('Attempt to buy tickets', async () => {
    let tickets_to_buy = 1;
    receipt.push(await eventC.buy_tickets(tickets_to_buy, {from:buyer, value:ticket_price}));
    console.log(`   Gas used to buy ${tickets_to_buy} ticket(s): ${receipt[0].receipt.gasUsed}`);

    let buyers_tickets = await eventC.get_tickets(buyer, {from:owner});
    assert.equal(buyers_tickets, tickets_to_buy);

    tickets_to_buy = 5;
    receipt.push(await eventC.buy_tickets(tickets_to_buy, {from:buyer, value:ticket_price*tickets_to_buy}));
    console.log(`   Gas used to buy ${tickets_to_buy} ticket(s): ${receipt[1].receipt.gasUsed}`);

    buyers_tickets = await eventC.get_tickets(buyer, {from:owner});
    assert.equal(buyers_tickets, tickets_to_buy+1);
  });

  it('Attempt to buy a ticket with insufficient amount', async () => {
    buyer = accounts[2];
    let tickets_to_buy = 1;
    let amount = 5e15; // 0.005 eth
    try {
      await eventC.buy_tickets(tickets_to_buy, {from:buyer, value:amount});
      assert.fail("Attempt to buy ticket at less than actual price succeeded");
    } catch (error) {
      if(error.message.search('Not enough ether was sent') < 0) {
        assert.fail("Unknown error from transaction:");
        console.log(`   ${error.message}`);
      }
    }
  });

  it('Attempt to withdraw funds from unauthorized address', async () => {
    try {
      await eventC.withdraw_funds({from:buyer});
      assert.fail("Unauthorized address was allowed to call withdraw_funds");
    } catch (error) {
      if(error.message.search('User was not authorized') > -1) {
        // correct outcome, test should pass
      } else {
        assert.fail(error.message);
      }
    }
  });

  it('Attempt to steal tickets using integer overflow', async () => {
    // 2^63 = 9223372036854775808
    let contract = await EventContract.new('9223372036854775808', '2');
    try {
      // num_tickets*ticket_price = 2^63 * 2 = 2^64, which will overflow to 0 when using uint64
      await contract.buy_tickets('9223372036854775808', { from: accounts[4], value: 1 });
      assert.fail('Was able to buy 2^63 tickets for only 1 wei');
    } catch (error) {
      if(error.message.search('Not enough ether was sent') < 0) {
        throw error;
      }
    }
  });
});
