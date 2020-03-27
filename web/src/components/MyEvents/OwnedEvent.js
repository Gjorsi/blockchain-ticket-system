import React, { Component } from "react";
import { TextField, ExpansionPanel, ExpansionPanelSummary, Button, Select, FormHelperText, 
ExpansionPanelDetails, Typography, Chip, Avatar, FormControl, MenuItem, List, ListItem } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import { bytesToString } from '../../util/conversion.js';
import Web3 from 'web3';

export default class OwnedEvent extends Component {

  state = {customer_list: []};

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
              {...this.props}
              tickets={this.state.event.available_tickets}/>

            <ChangePrices
              {...this.props}
              prices={this.state.event.ticket_price}/>
            <br/>

            <div><Button
              variant="contained"
              color="primary"
              onClick={() => { this.submit() }}
              >Load customer list</Button></div>

            <List dense={true}>
              {this.state.customer_list.map(e => 
                <ListItem>
                  {e}
                </ListItem>
              )}
            </List>
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
    for (let i=0; i<this.state.event.available_tickets.length; i++) {
      
      this.setState(prevState => ({ ticket_list: [prevState.ticket_list, (
        <div>
          Ticket type {i+1} - Available tickets: {this.state.event.available_tickets[i]} | Ticket price: {this.state.event.ticket_price[i]}
        </div>
      )]}))
    }
  }

  submit = async () => {
    try {
      this.setState({customer_list: await this.props.contract.methods.get_customers(
        this.props.web3.utils.asciiToHex(this.props.eventId)
        ).call({from: this.props.accounts[0]})});
    } catch (error) {
      console.log("Dev error: " + error.message);
    }
  }
}

export class AddTickets extends Component {
  addTickets = new Array(this.props.tickets.length).fill("0");

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
                onChange={e => this.addTickets[i] = e.target.value}
                inputProps={{ min: "0", step: "1" }}
                helperText={"Ticket type " + (i+1)} />
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={() => { this.submit() }}
              >Add</Button>
          </FormControl>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }

  submit = async () => {
    try {
      await this.props.contract.methods.add_tickets(
        this.props.web3.utils.asciiToHex(this.props.eventId),
        this.addTickets
        ).send({from: this.props.accounts[0]});
    } catch (error) {
      console.log("Dev error: " + error.message);
    }
  }
}

export class ChangePrices extends Component {
  state = {ticketType: 0, newPrice: this.props.prices[0]}

  render() {
    return(
      <ExpansionPanel>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          Change prices
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <FormControl>
            <FormHelperText>Ticket type to change</FormHelperText>
            <Select
              labelId="Ticket type to change"
              value={this.state.ticketType}
              onChange={e => this.setState({ticketType: e.target.value})}
            >
              {this.props.prices.map((e, i) => 
                <MenuItem value={i}>{i+1}</MenuItem>
              )}
            </Select>
            
            <TextField 
                id={"new_price"}
                label="New price"
                variant="outlined" 
                margin="normal"
                required={true}
                type="number"
                defaultValue={this.props.prices[this.state.ticketType]}
                onChange={e => this.setState({newPrice: e.target.value})}
                inputProps={{ min: "1", step: "1" }}/>

            <Button
              variant="contained"
              onClick={() => { this.submit() }}
              >Change price</Button>
          </FormControl>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }

  submit = async () => {
    try {
      await this.props.contract.methods.change_ticket_price(
        this.props.web3.utils.asciiToHex(this.props.eventId),
        this.state.ticketType,
        this.state.newPrice
        ).send({from: this.props.accounts[0]});
    } catch (error) {
      console.log("Dev error: " + error.message);
    }
  }
}