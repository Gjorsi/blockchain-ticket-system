import React, { Component } from 'react';
import {TextField, Radio, RadioGroup, FormControl, FormControlLabel, Button, Grid } from '@material-ui/core';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import { bytesToString } from '../util/conversion.js';
import { getErrorMessage } from '../util/EthErrorMsg.js';
import './ExpansionPanel.css';

export default class EventListItem extends Component {

  render() {
    return (
      
      <ExpansionPanel>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />} >
          <Typography className="heading" 
            color={(this.props.event.sale_active && Date.now() < this.props.event.deadline*1000) ? "primary" : "error"}>
            {bytesToString(this.props.event.title)}
          </Typography>
          <Typography className="secondaryHeading">
            {this.total_available_tickets()} available tickets
          </Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className="expansionPanelDetails">
          <Grid item xs={true} style={{textAlign: "center"}}>
          <BuyTicket 
            {...this.props}
          />
          </Grid>
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

  state = {
    ticket_type: 0, 
    num: 1, 
    button_state: this.props.event.available_tickets[0] > 0, 
    total: this.convert_to_eth(this.props.event.ticket_price[0])};

  handleChange = async (event) => {
    await this.setState({[event.target.name]: parseInt(event.target.value)});
    await this.setState({total: this.convert_to_eth(this.props.event.ticket_price[this.state.ticket_type]*this.state.num)});
    this.setState({button_state: this.check_choice() && this.state.total !== "invalid"})
  }

  check_choice() {
    return (!!this.state.num && this.props.event.available_tickets[this.state.ticket_type] >= this.state.num);
  }

  convert_to_eth(val) {
    let r;
    try{
      r = this.props.web3.utils.fromWei(val.toString()) + " ETH";
    } catch(e) {
      r = "invalid";
    }
    return r;
  }

  buyTickets = async () => {
    try {
      let total_value = this.props.event.ticket_price[this.state.ticket_type]*this.state.num;
      await this.props.contract.methods.buy_tickets(this.props.eventId, this.state.ticket_type, this.state.num)
        .send({from: this.props.accounts[0], value: total_value})
        .on('transactionHash', (tx) => {
          this.props.add_pending_tx(tx);
        })
        .on('confirmation', (num, receipt) => {
          if(num == 0){
            this.props.add_confirmed_tx(receipt.transactionHash, receipt);
          }
        });
      this.props.reload_event(this.props.eventId); //call to App.js to reload affected event

    } catch (error){
      console.log(getErrorMessage(error));
    }
  }

  render() {

    return(
      <>
      <FormControl>
        <TextField
          label="Deadline"
          margin="normal"
          type="datetime-local"
          disabled={true}
          error={Date.now() >= this.props.event.deadline*1000}
          value={new Date(this.props.event.deadline*1000).toISOString().substr(0,16)}/>
        <RadioGroup 
          value={this.state.ticket_type}
          name="ticket_type"
          onChange={this.handleChange}
        >
        {this.props.event.available_tickets.map((e, i) => 

          <FormControlLabel
            key={i}
            value={i}
            control={<Radio />}
            label={"Type "+(i+1)+" - Price: "+this.props.web3.utils.fromWei(this.props.event.ticket_price[i])+
                    " ETH | Available: "+this.props.event.available_tickets[i]}
          />

        )}
        <br/><TextField
          type="number"
          name="num"
          label="Number of tickets"
          required={true}
          variant="outlined"
          disabled={!this.props.event.sale_active || Date.now() >= this.props.event.deadline*1000}
          helperText={(!this.props.event.sale_active || Date.now() >= this.props.event.deadline*1000) ? "Sale is closed for this event." : ""}
          inputProps={{min: "1", max:this.props.event.available_tickets[this.state.ticket_type], step: "1"}}
          defaultValue={1}
          onChange={this.handleChange}
        />
        </RadioGroup>
        Total: {this.state.total}
        <Button
          variant="contained"
          color="secondary"
          disabled={!this.state.button_state || 
            !this.props.event.sale_active || 
            Date.now() >= this.props.event.deadline*1000 || 
            !this.props.accounts}
          onClick={this.buyTickets}
        > Buy tickets
        </Button>
      </FormControl>
      </>
    );
  }
}
