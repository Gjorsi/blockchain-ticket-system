import React, { Component } from "react";
import EventContract from "./contracts/EventContract.json";
import getWeb3 from "./getWeb3";
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import { Button, Typography, AppBar, Tabs, Tab } from '@material-ui/core';

import "./App.css";
import CreateEvent from "./components/CreateEvent";
import BrowseEvents from "./components/BrowseEvents";
import MyTickets from "./components/MyTickets";
import MyEvents from "./components/MyEvents";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`app-tabpanel-${index}`}
      aria-labelledby={`app-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </Typography>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

function tabProps(index) {
  return {
    id: `app-tab-${index}`,
    'aria-controls': `app-tabpanel-${index}`,
  };
}

class App extends Component {
  state = { web3: null, accounts: null, contract: null, activeTab: 3 };

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
        deployedNetwork.address
      );

      // load list of event IDs
      let event_list = await instance.methods.get_events().call();

      // Set web3, accounts, and contract to the state
      this.setState({ web3, accounts, contract: instance, event_list: event_list});

      // cache all events
      this.load_events();

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  load_events = async () => {
    let events = new Map();
    await Promise.all(this.state.event_list.map(async (event) => {
      events.set(event, await this.state.contract.methods.get_event_info(event).call());
    }));
    this.setState({ events: events });
    console.log(this.state.events);
  }

  changeTab = (event, value) => {
    this.setState({ activeTab: value });
  }

  render() {

    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    return (
 
      <div className="App">
        <AppBar position="static">
            <Button
              id="reload_events"
              variant="contained"
              onClick={() => { this.load_events() }}
              >Reload events</Button>
            <Tabs
                value={this.state.activeTab}
                indicatorColor="primary"
                textColor="primary"
                centered={true}
                onChange={this.changeTab}
                aria-label="simple tabs example"
            >
                <Tab label="Browse events" {...tabProps(0)} />
                <Tab label="My tickets" {...tabProps(1)} />
                <Tab label="My events" {...tabProps(2)} />
                <Tab label="Create event" {...tabProps(3)} />
            </Tabs>
        </AppBar>
        <TabPanel value={this.state.activeTab} index={0}>
          <BrowseEvents 
            contract={this.state.contract} 
            accounts={this.state.accounts}
            event_list={this.state.event_list}
            events={this.state.events}/>
        </TabPanel>

        <TabPanel value={this.state.activeTab} index={1}>
            <MyTickets 
              accounts={this.state.accounts} 
              contract={this.state.contract}
              events={this.state.events}/>
        </TabPanel>

        <TabPanel value={this.state.activeTab} index={2}>
            <MyEvents
              accounts={this.state.accounts} 
              contract={this.state.contract} 
              event_list={this.state.event_list}
              events={this.state.events}/>
        </TabPanel>

        <TabPanel value={this.state.activeTab} index={3}>
            <CreateEvent 
              web3={this.state.web3} 
              accounts={this.state.accounts} 
              contract={this.state.contract}/>
        </TabPanel>

      </div>
    );
  }
}

export default App;
