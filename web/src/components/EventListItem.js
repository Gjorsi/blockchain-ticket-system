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

  render() {
    return (
      <ExpansionPanel>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <Typography className="heading">
            {bytesToString(this.props.event.title)}
          </Typography>
          <Typography className="secondaryHeading">
            {this.total_available_tickets()} available tickets
          </Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className="expansionPanelDetails">
          <BuyTicket 
            {...this.props}
          />
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }

  total_available_tickets() {
    let sum = 0;
    for (let i=0; i < this.props.event.available_tickets.length; i++) {
      sum += parseInt(this.props.event.available_tickets[i]);
    }
    return sum;
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
      let total_value = this.props.event.ticket_price[this.state.ticket_type]*this.state.num;
      await this.props.contract.methods.buy_tickets(this.props.eventId, this.state.ticket_type, this.state.num)
        .send({from: this.props.accounts[0], value: total_value});
    } catch (error){
      console.log(error.message);
    }
  }

  render() {
    let total_price;
    if(this.props.event.ticket_price.length > 0){
      total_price = this.props.event.ticket_price[this.state.ticket_type]*this.state.num;
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
        {this.props.event.available_tickets.map((e, i) => 
        <>
          <FormControlLabel
            value={i}
            control={<Radio />}
            label={"Type "+(i+1)+" - Price: "+this.props.event.ticket_price[i]+
                    " wei | Available: "+this.props.event.available_tickets[i]}
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
