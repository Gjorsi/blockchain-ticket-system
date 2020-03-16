import React, { Component } from "react";
import { TextField, ExpansionPanel, ExpansionPanelSummary, Button, 
ExpansionPanelDetails, Typography, Chip, Avatar, FormControl, Backdrop } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import { bytesToString } from '../../util/conversion.js';
import Web3 from 'web3';

export default class OwnedEvent extends Component {

  state = {};

  componentDidMount = async () => {
    // extract list of owned events from all events
    this.setState({event: await this.props.contract.methods.get_event_info(Web3.utils.asciiToHex(this.props.eventId)).call()});

    this.tickets_and_prices();
  }

  render() {
    if (!this.state.event) {
      return <div>Loading event data..</div>;
    }

    return (
      <ExpansionPanel>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          {!!(this.state.event)?bytesToString(this.state.event.title):"loading.."}
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <FormControl>
            <Chip
              avatar={<Avatar>S</Avatar>}
              label="Sale Status"
              color={this.get_color(this.state.event.sale_active)}
              clickable
              onClick={() => this.handleActivateSale(this.state.event.sale_active)}
              variant="outlined"/>
            <Chip
              avatar={<Avatar>B</Avatar>}
              label="Buyback Status"
              color={this.get_color(this.state.event.buyback_active)}
              variant="outlined"/>
            <br/>
            <div>
              {this.state.ticket_list}
            </div>
            <br/>

            <AddTickets
              tickets={this.state.event.available_tickets}
              prices={this.state.event.ticket_price}/>

            <ChangePrices
              tickets={this.state.event.available_tickets}
              prices={this.state.event.ticket_price}/>

            <br/>...Get customer list
            <br/>...Add tickets
            <br/>...Change ticket prices
          </FormControl>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }

  get_color(activator) {
    if (activator) return "primary" 
    else return "secondary";
  }

  handleActivateSale = async (activator) => {
    if (activator) {
      await this.props.contract.methods.stop_sale(Web3.utils.asciiToHex(this.props.eventId)).send({from: this.props.accounts[0]});
    } else {
      await this.props.contract.methods.continue_sale(Web3.utils.asciiToHex(this.props.eventId)).send({from: this.props.accounts[0]});
    }
  }

  tickets_and_prices() {
    this.setState({ticket_list: []});
    console.log(this.state.event.available_tickets.length);
    for (let i=0; i<this.state.event.available_tickets.length; i++) {
      
      this.setState(prevState => ({ ticket_list: [prevState.ticket_list, (
        <div>
          Ticket type {i} - Available tickets: {this.state.event.available_tickets[i]} | Ticket price: {this.state.event.ticket_price[i]}
        </div>
      )]}))
    }
  }
}

export class AddTickets extends Component {

  render() {
    return(
      <ExpansionPanel>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          Add tickets
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <FormControl>
            {this.props.tickets.map((e, i) => 
              <TextField 
                id={"tickets_to_add" + i}
                label="Tickets to add"
                variant="outlined" 
                margin="normal"
                required={false}
                type="number"
                defaultValue="0"
                inputProps={{ min: "0", step: "1" }}
                helperText={"Ticket type " + (i+1)} />
            )}
            <Button
              variant="contained"
              onClick={() => { this.submit() }}
              >Add</Button>
          </FormControl>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }
}

export class ChangePrices extends Component {

  render() {
    return(
      <ExpansionPanel>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          Change prices
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <FormControl>
            {this.props.tickets.map((e, i) => 
              <TextField
                id={"change_price" + i}
                label="New price (wei)"
                variant="outlined" 
                margin="normal"
                required={false}
                type="number"
                defaultValue="0"
                inputProps={{ min: "0", step: "1" }}
                helperText={"Ticket type " + (i+1)} />
            )}
            <Button
              variant="contained"
              onClick={() => { this.submit() }}
              >Change</Button>
          </FormControl>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }
}