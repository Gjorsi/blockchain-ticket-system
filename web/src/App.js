import React, { Component } from "react";
import EventContract from "./contracts/EventContract.json";
import getWeb3 from "./getWeb3";
import Web3 from 'web3';
import PropTypes from 'prop-types';
import Box from '@material-ui/core/Box';
import styled from 'styled-components';
import { green, orange, red } from '@material-ui/core/colors';
import { Button, Typography, AppBar, Tabs, Tab, Backdrop, CircularProgress, FormControl, 
  Grid, ButtonGroup, Dialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

import "./App.css";
import CreateEvent from "./components/CreateEvent";
import BrowseEvents from "./components/BrowseEvents";
import MyTickets from "./components/MyTickets";
import MyEvents from "./components/MyEvents";

const colors = {white: "#ffffff", black: "#000000", teal: "#2fc4b5", grey: "#7a7a7a", light_grey: "#b5b5b5", 
  dark_grey: "#363636", orange: "#e85623"};

const theme = createMuiTheme({
  
  palette: {
    primary: {
      main: colors.white,
    },
    secondary: {
      main: colors.teal,
    },
    error: {
      main: colors.orange,
    },
    background: {
      main: colors.dark_grey,
    },
    text: {
      primary: colors.white,
      secondary: colors.light_grey,
      disabled: colors.light_grey,
    },
    action: {
      disabled: colors.light_grey,
    }
  },

  overrides: {
    MuiExpansionPanelSummary: {
      root: {
        backgroundColor: colors.dark_grey,
      },
    },

    MuiExpansionPanelDetails: {
      root: {
        backgroundColor: colors.dark_grey,
      },
    },

    MuiFormControlLabel: {
      label: {
        color: colors.light_grey,
      },
    },

    MuiOutlinedInput: {
      root: {
        '& $notchedOutline': {
          borderColor: colors.grey,
        },
      }
    },

    MuiPickersBasePicker:{
      pickerView:{
        backgroundColor:colors.dark_grey,
      }
    },

    MuiPickersCalendarHeader: {
      dayLabel: {
        color: colors.light_grey,
      },
    },

    MuiSvgIcon: {
      root: {
        color: colors.light_grey,
      }
    },

    MuiDialog: {
      paper: {
        backgroundColor: colors.dark_grey,
        color: colors.white,
      }
    }
  }
});

const PendingButton = styled(Button)`
  && {
    text-transform: none;
    background-color: ${orange[200]};
  }
`;

const ConfirmedButton = styled(Button)`
  text-transform: none;
  background-color: ${green[200]};
`;

const FailedButton = styled(Button)`
  text-transform: none;
  background-color: ${red[200]};
`;


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

function SimpleBackdrop() {
  return (
    <div>
      <Backdrop  open={true}>
        <FormControl>
          <CircularProgress color="secondary" />
        </FormControl>
      </Backdrop>
    </div>
  );
}



class App extends Component {
  state = { 
    web3: null, 
    accounts: null, 
    contract: null, 
    activeTab: 0, 
    pending_tx: [], 
    confirmed_tx: [],
    failed_tx: [],
    failed_metamask: false};

  accountChangeCheck = setInterval( async () => {
    if (this.state.web3 && this.state.accounts && this.state.web3.eth.accounts[0] !== this.state.accounts[0]) {
      this.setState({accounts: await this.state.web3.eth.getAccounts()});
    }
  }, 1000);

  componentDidMount = async () => {
    /*window.addEventListener('load', async () => {
      if (window.ethereum) {
        try {
          // Get network provider and web3 instance.
          const web3 = window.ethereum;
          this.setState({web3: web3});
        } catch (error) {
          console.log(error.message);
        }
      }
    });*/

    try {
      // Get network provider and web3 instance.
      
      let web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/v3/5c214d15dc4145778640005163a91851"));

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = EventContract.networks[networkId];
      const instance = new web3.eth.Contract(
        EventContract.abi,
        deployedNetwork.address
      );

      instance.options.handleRevert = true;

      // Set web3, accounts, and contract to the state
      this.setState({ web3: web3, contract: instance});

      // load list of event IDs
      await this.load_event_list();

      // cache all events
      await this.load_events();

      // Listen for the EventCreated event to be emitted from the contract
      instance.events.EventCreated(async (err, res) => {
        if(!err){
          await this.reload_event(res.returnValues.event_id);
          await this.load_event_list();
        }
      });

    } catch (error) {
      // Catch any errors for any of the above operations.
      console.error(error);
    }
  };

  connect_metamask = async () => {
    try {
      await window.ethereum.enable();
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = EventContract.networks[networkId];
      const instance = new web3.eth.Contract(
        EventContract.abi,
        deployedNetwork.address
      );

      instance.options.handleRevert = true;

      // Set web3, accounts, and contract to the state
      this.setState({ web3: web3, contract: instance});

      this.setState({web3: web3, accounts: accounts});

      // load list of event IDs
      await this.load_event_list();

      // cache all events
      await this.load_events();

    } catch (error) {
      console.log(error);
      this.setState({failed_metamask: true});
    }
  }

  load_event_list = async () => {
    let event_list = await this.state.contract.methods.get_events().call();
    this.setState({event_list: event_list});
  }

  load_events = async () => {
    let events = new Map();
    await Promise.all(this.state.event_list.map(async (event) => {
      events.set(event, await this.state.contract.methods.get_event_info(event).call());
    }));
    this.setState({ events: events });
  }

  reload_event = async (event_id) => {
    let updated_event = await this.state.contract.methods.get_event_info(event_id).call();
    this.setState((prevState) => {
      let updatedEvents = new Map(prevState.events);
      return { events: updatedEvents.set(event_id, updated_event)};
    });
  }

  delete_event = async (event_id) => {
    await this.load_event_list();
    this.setState((prevState) => {
      let updatedEvents = new Map(prevState.events);
      updatedEvents.delete(event_id);
      return { events: updatedEvents};
    });
  }

  changeTab = (event, value) => {
    this.setState({ activeTab: value });
  }

  add_confirmed_tx = async (tx, receipt) => {
    let pending = this.state.pending_tx;
    pending.splice(pending.indexOf(tx), 1);
    this.setState({ pending_tx: pending });
    if(receipt.status){
        this.setState({ confirmed_tx: [...this.state.confirmed_tx, tx] });
    } else {
        this.setState({ failed_tx: [...this.state.failed_tx, tx] });
    }
  }

  add_failed_tx = async (tx) => {
    let pending = this.state.pending_tx;
    pending.splice(pending.indexOf(tx), 1);
    this.setState({ pending_tx: pending });
    this.setState({ failed_tx: [...this.state.failed_tx, tx] });
  }

  add_pending_tx = async (id) => {
    this.setState({ pending_tx: [...this.state.pending_tx, (id)] });
  }

  handle_close_error = async () => {
    await this.setState({failed_metamask: false});
  }

  render() {

    if (!this.state.web3 || !this.state.events) {
      return (
        <ThemeProvider theme={theme}>
          <SimpleBackdrop/>;
        </ThemeProvider> );
    }

    return (
      <ThemeProvider theme={theme}>
      <div className="App">
        <Dialog open={this.state.failed_metamask} onClose={this.handle_close_error}>
          <DialogTitle>Failed to connect</DialogTitle>
          <DialogContent>Connection to MetaMask account failed. Is MetaMask installed?</DialogContent>
          <DialogActions>
            <Button onClick={this.handle_close_error} color="secondary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
        <AppBar position="static">
          {this.state.pending_tx.map((tx) => {
            let short = tx.substring(0,15) + '...';
            return (
              <PendingButton 
                variant="contained"
                onClick={() => {
                  navigator.clipboard.writeText(tx);
                  alert('Transaction id copied to clipboard!');
                }}
              >Transaction with id {short} is pending</PendingButton>
            );
          })}
          {this.state.confirmed_tx.map((tx) => {
            let short = tx.substring(0,15) + '...';
            return (
              <ConfirmedButton 
                variant="contained"
                onClick={() => {
                  let conf = this.state.confirmed_tx;
                  conf.splice(conf.indexOf(tx), 1);
                  this.setState({ confirmed_tx: conf });
                }}
              >Transaction with id {short} has been confirmed! Click to dismiss.</ConfirmedButton>
            );
          })}
          {this.state.failed_tx.map((tx) => {
            let short = tx.substring(0,15) + '...';
            return (
              <FailedButton 
                variant="contained"
                onClick={() => {
                  let failed = this.state.failed_tx;
                  failed.splice(failed.indexOf(tx), 1);
                  this.setState({ failed_tx: failed });
                }}
              >Transaction with id {short} failed. Click to dismiss.</FailedButton>
            );
          })}
          <Tabs
            value={this.state.activeTab}
            className="Tabs"
            indicatorColor="secondary"
            centered={true}
            onChange={this.changeTab}
            aria-label="simple tabs example"
          >
            <Tab label="Browse" {...tabProps(0)} />
            <Tab label="My tickets" disabled={!this.state.accounts} {...tabProps(1)} />
            <Tab label="My events" disabled={!this.state.accounts} {...tabProps(2)} />
            <Tab label="Create" disabled={!this.state.accounts} {...tabProps(3)} />
          </Tabs>
        </AppBar>
        {this.login_bar()}
        <TabPanel value={this.state.activeTab} index={0}>
          <BrowseEvents 
            contract={this.state.contract} 
            accounts={this.state.accounts}
            event_list={this.state.event_list}
            events={this.state.events}
            reload_event={this.reload_event}
            add_confirmed_tx={this.add_confirmed_tx}
            add_failed_tx={this.add_failed_tx}
            add_pending_tx={this.add_pending_tx}
            web3={this.state.web3}/>
        </TabPanel>

        <TabPanel value={this.state.activeTab} index={1}>
            <MyTickets 
              accounts={this.state.accounts} 
              contract={this.state.contract}
              reload_event={this.reload_event}
              add_failed_tx={this.add_failed_tx}
              add_confirmed_tx={this.add_confirmed_tx}
              add_pending_tx={this.add_pending_tx}
              events={this.state.events}/>
        </TabPanel>

        <TabPanel value={this.state.activeTab} index={2}>
            <MyEvents
              accounts={this.state.accounts} 
              contract={this.state.contract} 
              event_list={this.state.event_list}
              events={this.state.events}
              reload_event={this.reload_event}
              delete_event={this.delete_event}
              add_confirmed_tx={this.add_confirmed_tx}
              add_failed_tx={this.add_failed_tx}
              add_pending_tx={this.add_pending_tx}
              web3={this.state.web3}/>
        </TabPanel>

        <TabPanel value={this.state.activeTab} index={3}>
            <CreateEvent 
              event_list={this.state.event_list}
              web3={this.state.web3} 
              accounts={this.state.accounts} 
              contract={this.state.contract}
              add_confirmed_tx={this.add_confirmed_tx}
              add_failed_tx={this.add_failed_tx}
              add_pending_tx={this.add_pending_tx}
              colors={this.colors}/>
        </TabPanel>
      </div>
      </ThemeProvider>
    );
  }

  login_bar() {
    if (!this.state.accounts) return (
      <Grid item xs={true} style={{textAlign: "center"}}>
        <ButtonGroup color="secondary">
          <Button 
            variant="outlined"
            onClick={() => this.connect_metamask()}
            >Connect with MetaMask</Button>
          <Button 
            variant="outlined"
            href="https://metamask.io"
            target="_blank"
            >Get MetaMask</Button>
          </ButtonGroup>
      </Grid>
    );
  }
}

export default App;
