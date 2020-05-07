import React, { Component } from "react";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {TextField, ExpansionPanel, ExpansionPanelSummary, Button, 
ExpansionPanelDetails, FormControl, List, ListItem, Grid } from '@material-ui/core';

import { bytesToString } from '../../util/conversion.js';

export default class TicketView extends Component {
  state = {customer: null}

  componentDidMount = async () => {
    // get list of tickets
    this.load_tickets();
  }

  load_tickets = async () => {
    this.setState({tickets: 
      await this.props.contract.methods.get_tickets(this.props.eventId, this.props.accounts[0]).call()});
  }

  render() {
    return(
      <ExpansionPanel>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          {!!(this.props.event)?bytesToString(this.props.event.title):"loading.."}
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <Grid item xs={true} style={{textAlign: "center"}}>
          <FormControl>
            
            {!!(this.state.tickets) ? this.list_tickets() : "loading.."}
            <TextField
              label="Deadline"
              margin="normal"
              type="datetime-local"
              disabled={true}
              error={Date.now() >= this.props.event.deadline*1000}
              value={new Date(this.props.event.deadline*1000).toISOString().substr(0,16)}/>
            <Button
              color="secondary"
              variant="contained"
              disabled={this.can_return_tickets()}
              onClick={() => { this.return_tickets() }}
              >{!this.can_return_tickets() ? "Return All Tickets" : "Ticket return is disabled"}</Button>
          </FormControl>
          </Grid>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }

  can_return_tickets() {
    return !!(this.state.tickets) ? 
      (!this.props.event.buyback_active 
      || !this.props.event.sale_active 
      || (this.state.tickets.length < 1)
      || (Date.now() > this.props.event.deadline*1000)) :
      true;
  }

  return_tickets = async () => {
    let failed = true;
    await this.props.contract.methods.return_tickets(this.props.eventId).estimateGas({from: this.props.accounts[0]})
    .then(function(gasAmount){
      failed = false;
    })
    .catch(function(error){
      console.log(error);
    });

    if (!failed) {
      await this.props.contract.methods.return_tickets(this.props.eventId).send({from: this.props.accounts[0]})
        .on('transactionHash', (tx) => {
          this.props.add_pending_tx(tx);
        })
        .on('confirmation', (num, receipt) => {
          if(num == 0){
            this.props.add_confirmed_tx(receipt.transactionHash, receipt);
          }
        });
      this.load_tickets();
      this.props.reload_event(this.props.eventId);
    }

  }

  list_tickets() {
    if (this.state.tickets.length > 0) {
      return(
        <List dense={true}>
          {this.state.tickets.map((e, i) => 
            {if(e > 0){
              return <ListItem key={i}>Tickets of type {i+1}: {e}</ListItem>
            }}
          )}
        </List>
      );
    } else {
      return(
        <div>No tickets found.</div>
      );
    }
    
  }
}
