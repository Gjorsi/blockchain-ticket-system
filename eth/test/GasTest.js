const EventContract = artifacts.require("EventContract");

contract('EventContract', (accounts) => {

  let eventC;
  const eth = 1e18; //1 eth in wei units
  const ticket_price = 1e16; // 0.01 eth
  let buyer = accounts[1];
  const owner = accounts[0];
  
  let gas = {}

  it('Measure gas usage', async () => {
    let balance_before = await web3.eth.getBalance(accounts[0]);
    eventC = await EventContract.new(100, String(ticket_price));
    let balance_after = await web3.eth.getBalance(accounts[0]);
    gas['constructor'] = balance_before - balance_after;

    let tickets_to_buy = 1;

    // Buy ticket
    let purchase = await eventC.buy_tickets(tickets_to_buy, {from:buyer, value:ticket_price});
    gas['buy_ticket'] = purchase.receipt.gasUsed;

    // Buy ticket with too much money
    buyer = accounts[3];
    let amount = 2*ticket_price;
    purchase = await eventC.buy_tickets(tickets_to_buy, {from:buyer, value:amount});
    gas['buy_ticket_excessive'] = purchase.receipt.gasUsed;

    // Stop sale
    let action = await eventC.stop_sale({from:owner});
    gas['stop_sale'] = action.receipt.gasUsed;

    // Continue sale
    action = await eventC.continue_sale({from:owner});
    gas['continue_sale'] = action.receipt.gasUsed;

    // Add tickets
    action = await eventC.add_tickets(10, {from:owner});
    gas['add_tickets'] = action.receipt.gasUsed;

    Object.keys(gas).map((action) => {
      gas[action] = gas[action].toLocaleString('nb-NO');
    });
    console.table(gas);
  });
});
