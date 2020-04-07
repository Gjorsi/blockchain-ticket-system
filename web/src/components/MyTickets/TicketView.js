import React, { Component } from "react";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {ExpansionPanel, ExpansionPanelSummary, Button, 
ExpansionPanelDetails, FormControl, List, ListItem } from '@material-ui/core';

import { bytesToString } from '../../util/conversion.js';

export default class TicketView extends Component {
  state = {customer: null}

  componentDidMount = async () => {

    // get list of tickets
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
          <FormControl>
            
            {!!(this.state.tickets)?this.list_tickets():"loading.."}

            <Button
              color="secondary"
              variant="contained"
              disabled={!!(this.props.event) ? !this.props.event.buyback_active : false}
              onClick={() => { this.return_tickets() }}
              >Return all tickets</Button>
          </FormControl>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }

  return_tickets = async () => {
    await this.props.contract.methods.return_tickets(this.props.eventId).send({from: this.props.accounts[0]});
  }

  list_tickets() {
    return(
      <List dense={true}>
        {this.state.tickets.map((e, i) => 
          {if(e > 0){
            return <ListItem>Tickets of type {i+1}: {e}</ListItem>
          }}
        )}
      </List>
    );
  }
}