import React, { Component } from 'react';
import {TextField, Radio, RadioGroup, FormControl, FormControlLabel, Button } from '@material-ui/core';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import { bytesToString } from '../util/conversion.js';
import './EventList.css';

export default class EventListItem extends Component {
  constructor(props){
    super(props);
    this.state = {title: null, tickets: [], prices: [], active: false}
  }

  componentDidMount = async () => {

    this.setState({
      title: bytesToString(this.props.event.title),
      tickets: this.props.event.available_tickets.map((a,i) => [a,this.props.event.ticket_price[i]]), // Create array of ticket types, with available tickets and price as a tuple
      active: this.props.event.sale_active,
    });
  }

  render() {
    return (
      <ExpansionPanel>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <Typography className="heading">
            {this.state.title}
          </Typography>
          <Typography className="secondaryHeading">
            {this.state.tickets.reduce((a,b)=>a+parseInt(b),0)} available tickets
          </Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className="expansionPanelDetails">
          <BuyTicket 
            tickets={this.state.tickets} 
            key={this.state.tickets.length}
            {...this.props}
          />
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }
}

export class BuyTicket extends Component {
  constructor(props){
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.buyTickets = this.buyTickets.bind(this);
  }

  state = {ticket_type: 0, num: 1};

  handleChange(event){
    this.setState({[event.target.name]: parseInt(event.target.value)});
  }

  buyTickets = async () => {
    try {
      let total_value = this.props.tickets[this.state.ticket_type][1]*this.state.num;
      await this.props.contract.methods.buy_tickets(this.props.eventId, this.state.ticket_type, this.state.num)
        .send({from: this.props.accounts[0], value: total_value});
    } catch {
    }
  }

  render() {
    let total_price;
    if(this.props.tickets.length > 0){
      total_price = this.props.tickets[this.state.ticket_type][1]*this.state.num;
    } else {
      total_price = 0;
    }

    return(
      <>
      <FormControl>
        <RadioGroup 
          value={this.state.ticket_type}
          name="ticket_type"
          onChange={this.handleChange}
        >
        {this.props.tickets.map(([avail,price], i) => 
        <>
          <FormControlLabel
            value={i}
            control={<Radio />}
            label={"Type "+(i+1)+": "+price+" wei"}
          />
        </>
        )}
        <TextField
          type="number"
          name="num"
          label="Number of tickets"
          required={true}
          variant="outlined"
          inputProps={{min: "1", step: "1"}}
          onChange={this.handleChange}
        />
        </RadioGroup>
        Total: {total_price || 0} wei
        <Button
          variant="contained"
          onClick={this.buyTickets}
        >
          Buy tickets
        </Button>
      </FormControl>
      </>
    );
  }
}
