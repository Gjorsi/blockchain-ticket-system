const EventContract = artifacts.require("EventContract");
const util = require('./Util');

contract('EventContract - Gas measurements', (accounts) => {

  let eventC;
  const eth = 1e18; //1 eth in wei units
  const ticket_price = 1e16; // 0.01 eth
  let buyer = accounts[1];
  const owner = accounts[0];
  let test_event;

  let gas = {}

  it('Measure gas usage', async () => {
    eventC = await EventContract.deployed();

    let id = web3.utils.asciiToHex("TestEvent3");
    let title = web3.utils.asciiToHex("This is the event title");

    // Snapshot
    const snapshotId = util.takeSnapshot();

    // Test event for later tests
    let deadline = Math.round((Date.now() + 1000*60*60*24)/ 1000) // One day in the future.
    let receipt = (await eventC.create_event(id, title, [1000], [ticket_price.toString()], false, 0, true, true, deadline, {from:owner})).receipt;
    test_event = { id: id, num_tickets: 1000, ticket_price: 1e16, per_customer_limit: false, max_per_customer: 0, owner: owner};

    // Create event
    gas['create_event'] = await Promise.all(accounts.map(async (acc) => {
      // Create one event per account
      return eventC.create_event(acc, title, [1000], [ticket_price.toString()], false, 0, true, true, deadline, {from:acc}); 
    })).then((receipts) => {
      let total = receipts.map((r) => r.receipt.gasUsed).reduce((a,b) => a+b,0); // Sum gas
      return Math.round(total / accounts.length); // Calculate average
    });

    let tickets_to_buy = 1;

    // Buy ticket
    gas['buy_ticket'] = await Promise.all(accounts.map(async (acc) => {
      return eventC.buy_tickets(test_event.id, 0, 1, {from: acc, value: ticket_price}) // Buy tickets from all accounts
    })).then((receipts) => {
      let total = receipts.map((r) => r.receipt.gasUsed).reduce((a,b) => a+b); // Sum gas
      return Math.round(total / accounts.length); // Calculate average
    });

    // Stop sale
    let action = await eventC.stop_sale(test_event.id, {from:owner});
    gas['stop_sale'] = action.receipt.gasUsed;

    // Continue sale
    action = await eventC.continue_sale(test_event.id, {from:owner});
    gas['continue_sale'] = action.receipt.gasUsed;

    // Add tickets
    action = await eventC.add_tickets(test_event.id, [10], {from:owner});
    gas['add_tickets'] = action.receipt.gasUsed;

    // Return tickets
    gas['return_tickets'] = await Promise.all(accounts.map(async (acc) => {
      return eventC.return_tickets(test_event.id, {from:acc}); // Return tickets from all accounts
    })).then((receipts) => {
      let total = receipts.map((r) => r.receipt.gasUsed).reduce((a,b) => a+b,0); // Sum gas
      return Math.round(total / accounts.length); // Calculate average
    });

    await eventC.buy_tickets(test_event.id, 0, 1, {from: owner, value: ticket_price})

    // Go to the future :)
    util.advanceTime(60*60*24*9);

    // Withdraw funds
    action = await eventC.withdraw_funds(test_event.id, {from:owner});
    gas['withdraw_funds'] = action.receipt.gasUsed;

    // Delete event
    action = await eventC.delete_event(test_event.id, {from: owner});
    gas['delete_event'] = action.receipt.gasUsed;

    Object.keys(gas).map((action) => {
      gas[action] = gas[action].toLocaleString('nb-NO');
    });
    console.table(gas);

    // Revert time travel
    util.revertToSnapshot(snapshotId);
  });
});

contract('', (acc) => {
  // Dummy test to fix bug where snapshots are not properly rerverted in the last test to run
  it('Dummy test', async () => {
    util.advanceBlock();
  });
});
