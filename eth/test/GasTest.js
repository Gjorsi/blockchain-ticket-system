const EventContract = artifacts.require("EventContract");

contract('EventContract', (accounts) => {

  let eventC;
  const eth = 1e18; //1 eth in wei units
  const ticket_price = 1e16; // 0.01 eth
  let buyer = accounts[1];
  const owner = accounts[0];
  let events = [];

  let gas = {}

  it('Measure gas usage', async () => {
    eventC = await EventContract.deployed();

    let receipt = (await eventC.create_event(1000, ticket_price.toString(), false, 0, {from:owner})).receipt;
    events.push({ id: 0, num_tickets: 1000, ticket_price: 1e16, per_customer_limit: false, max_per_customer: 0, owner: owner});
    gas['create_event'] = receipt.gasUsed;

    let tickets_to_buy = 1;

    // Buy ticket
    let purchase = await eventC.buy_tickets(events[0].id, tickets_to_buy, {from:buyer, value:ticket_price});
    gas['buy_ticket'] = purchase.receipt.gasUsed;

    // Buy ticket with too much money
    buyer = accounts[3];
    let amount = 2*ticket_price;
    purchase = await eventC.buy_tickets(events[0].id, tickets_to_buy, {from:buyer, value:amount});
    gas['buy_ticket_excessive'] = purchase.receipt.gasUsed;

    // Stop sale
    let action = await eventC.stop_sale(events[0].id, {from:owner});
    gas['stop_sale'] = action.receipt.gasUsed;

    // Continue sale
    action = await eventC.continue_sale(events[0].id, {from:owner});
    gas['continue_sale'] = action.receipt.gasUsed;

    // Add tickets
    action = await eventC.add_tickets(events[0].id, 10, {from:owner});
    gas['add_tickets'] = action.receipt.gasUsed;

    Object.keys(gas).map((action) => {
      gas[action] = gas[action].toLocaleString('nb-NO');
    });
    console.table(gas);
  });
});
