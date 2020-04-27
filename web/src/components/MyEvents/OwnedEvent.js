import React, { Component } from "react";
import { TextField, ExpansionPanel, ExpansionPanelSummary, Button, Select, FormHelperText, 
ExpansionPanelDetails, Chip, Avatar, FormControl, MenuItem, List, ListItem, Popover } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import { bytesToString } from '../../util/conversion.js';

export default class OwnedEvent extends Component {

  constructor() {
    super();
    this.state = {customer_list: [], view_funds: false, funds: 0, delete_event_popup: false}
  }

  render() {
    if (!this.props.event) {
      return <div>Loading event data..</div>;
    }

    return (
      <ExpansionPanel>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          {!!(this.props.event)?bytesToString(this.props.event.title):"loading.."}
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <FormControl>
            <Chip
              avatar={<Avatar>S</Avatar>}
              label="Sale Status"
              color={this.get_color(this.props.event.sale_active)}
              clickable
              onClick={() => this.handleActivateSale(this.props.event.sale_active)}
              variant="outlined"/>
            <Chip
              avatar={<Avatar>B</Avatar>}
              label="Buyback Status"
              color={this.get_color(this.props.event.buyback_active)}
              variant="outlined"/>
            <TextField
              label="Deadline"
              margin="normal"
              type="datetime-local"
              disabled={true}
              error={Date.now() >= this.props.event.deadline*1000}
              value={new Date(this.props.event.deadline*1000).toISOString().substr(0,16)}
            />

            <br/>

            <List dense={true}>
              {this.props.event.available_tickets.map((e,i) => 
                <ListItem>
                  Ticket type {i+1} - Available tickets: 
                  {this.props.event.available_tickets[i]} | Ticket price: 
                  {this.props.web3.utils.fromWei(this.props.event.ticket_price[i])} ETH
                </ListItem>
              )}
            </List>
            <br/>

            <Chip
              label={"View funds: " + (this.state.view_funds? (this.props.web3.utils.fromWei(this.state.funds) + " ETH") : "...")}
              variant="outlined"
              clickable
              onClick={() => this.view_funds()} /> <br/>

            <div><Button
              variant="contained"
              color="primary"
              disabled={(Date.now() < this.props.event.deadline*1000) || this.state.funds <= 0}
              onClick={() => { this.withdraw_funds() }}
              >Withdraw funds</Button></div><br/>

            <AddTickets
              {...this.props}
              tickets={this.props.event.available_tickets}/>

            <ChangePrices
              {...this.props}
              prices={this.props.event.ticket_price}/>
            <br/>

            <div><Button
              variant="contained"
              color="primary"
              onClick={() => { this.get_customer_list() }}
              >Load customer list</Button></div>

            <List dense={true}>
              {this.state.customer_list.map(e => 
                <ListItem>
                  {e}
                </ListItem>
              )}
            </List>

            <div><Button
              variant="contained"
              color="secondary"
              /*disabled={(Date.now() < (this.props.event.deadline/*+604800)*1000) || this.state.funds > 0}*/
              onClick={() => this.delete_event()}
              >Delete Event</Button></div>

          </FormControl>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }

  delete_event = async () => {
    try {
      await this.props.contract.methods.delete_event(this.props.eventId).send({from: this.props.accounts[0]});
      await this.props.delete_event(this.props.eventId)
    } catch (error) {
      console.log("Dev error: " + error.message);
    }
  }

  get_color(activator) {
    if (activator) return "primary" 
    else return "secondary";
  }

  handleActivateSale = async (activator) => {
    try {
      if (activator) {
        await this.props.contract.methods.stop_sale(this.props.eventId).send({from: this.props.accounts[0]});
      } else {
        await this.props.contract.methods.continue_sale(this.props.eventId).send({from: this.props.accounts[0]});
      }
      this.props.reload_event(this.props.eventId); //call to App.js to reload affected event
    
    } catch (error) {
      console.log("Dev error: " + error.message);
    }
  }

  view_funds = async () => {
    if (!this.state.view_funds) {
      try{
        this.setState({funds: await this.props.contract.methods.view_funds(
          this.props.eventId
          ).call({from: this.props.accounts[0]})});
        this.setState({view_funds: true})
      } catch (error) {
        console.log("Dev error: " + error.message);
      }
    } else {
      this.setState({view_funds: false})
    }
  }

  withdraw_funds = async () => {
    try{
      // attempt to withdraw funds
      await this.props.contract.methods.withdraw_funds(this.props.eventId)
        .send({from: this.props.accounts[0]});

      //update current funds display
      this.setState({funds: await this.props.contract.methods.view_funds(
        this.props.eventId
        ).call({from: this.props.accounts[0]})});
    } catch (error) {
      console.log("Dev error: " + error.message);
    }
  }

  get_customer_list = async () => {
    try {
      this.setState({customer_list: await this.props.contract.methods.get_customers(
        this.props.eventId
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
        this.props.eventId,
        this.addTickets
        ).send({from: this.props.accounts[0]});
      this.props.reload_event(this.props.eventId); //call to App.js to reload affected event

    } catch (error) {
      console.log("Dev error: " + error.message);
    }
  }
}

export class ChangePrices extends Component {
  state = {ticketType: 0, newPrice: this.props.prices[0], button_state: false}

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
                label="New price (ETH)"
                variant="outlined" 
                margin="normal"
                required={true}
                type="number"
                defaultValue={this.props.prices[this.state.ticketType]}
                onChange={e => {
                  !!e.target.value ? this.setState({newPrice: this.props.web3.utils.toWei(e.target.value)}) : 
                    this.setState({newPrice: null});
                  this.check_input(e.target.value);
                }}
                inputProps={{ min: "0.000001", step: "0.000001" }}/>

            <Button
              variant="contained"
              onClick={() => { this.submit() }}
              disabled={this.state.button_state}
              >Change price</Button>
          </FormControl>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }

  check_input(input) {
    let s = (!input || input < 0.000001);
    this.setState({button_state: s });
  }

  submit = async () => {
    try {
      await this.props.contract.methods.change_ticket_price(
        this.props.eventId,
        this.state.ticketType,
        this.state.newPrice
        ).send({from: this.props.accounts[0]});
      this.props.reload_event(this.props.eventId); //call to App.js to reload affected event

    } catch (error) {
      console.log("Dev error: " + error.message);
    }
  }
}