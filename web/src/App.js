import React, { Component } from "react";
import EventContract from "./contracts/EventContract.json";
import getWeb3 from "./getWeb3";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";

import "./App.css";

const styles = {
    fontFamily: 'sans-serif',
};

class App extends Component {
  state = { web3: null, accounts: null, contract: null, activeTab: 'browse' };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = EventContract.networks[networkId];
      const instance = new web3.eth.Contract(
        EventContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.runExample);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  runExample = async () => {
    const { accounts, contract } = this.state;

    // Stores a given value, 5 by default.
    //await contract.methods.set(5).send({ from: accounts[0] });

    // Get the value from the contract to prove it worked.
    //const response = await contract.methods.get().call();

    // Update state with the result.
    //this.setState({ storageValue: response });
  };

  changeTab = (event, value) => {
    this.setState({ activeTab: value });
  }



  render() {

    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    const content = {
      browse: 'Browsing events',
      my_tickets: 'My tickets',
      my_events: 'My events',
      create: 'Create event',
    }

    return (
      <div className="App" style={styles}>
        <Tabs
            value={this.state.activeTab}
            indicatorColor="secondary"
            textColor="primary"
            centered="True"
            onChange={this.changeTab}
        >
            <Tab label="Browse events" value="browse" />
            <Tab label="My tickets" value="my_tickets" />
            <Tab label="My events" value="my_events" />
            <Tab label="Create event" value="create" />
        </Tabs>
        <div>{content[this.state.activeTab]}</div>
      </div>
    );
  }
}

export default App;
