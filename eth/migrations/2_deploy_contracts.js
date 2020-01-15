const TestEvent = artifacts.require("TestEvent");

module.exports = function(deployer) {
  deployer.deploy(TestEvent, 100, "1000000000000000000");
};
