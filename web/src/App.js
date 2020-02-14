import React, { Component } from "react";
import EventContract from "./contracts/EventContract.json";
import getWeb3 from "./getWeb3";
import Tabs from "./Tabs.js";

import "./App.css";

const styles = {
    fontFamily: 'sans-serif',
};

class App extends Component {
  state = { web3: null, accounts: null, contract: null, active: 'viewEventsTab' };

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

  render() {
    
    const content = {
     viewEventsTab: 'Browse events',
     myEventsTab: 'My events',
     createEventTab: 'Create event',
	};

    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App" style={styles}>
        <Tabs
            active={this.state.active} 
            onChange={active => this.setState({active})}
        >
            <div key="viewEventsTab">Browse events</div>
            <div key="myEventsTab">My events</div>
            <div key="createEventTab">Create event</div>
        </Tabs>
        <p>{content[this.state.active]}</p>
      </div>
    );
  }
}

export default App;
