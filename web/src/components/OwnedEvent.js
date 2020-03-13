import React, { Component } from "react";
import { TextField, ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails, Typography, Chip, Avatar } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import { bytesToString } from '../util/conversion.js';
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
          <div>
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
          </div>
          <div>
            {this.state.ticket_list}
          </div>

          <br/>...List tickets available / sold / total
          <br/>...Get customer list
          <br/>...Add tickets
          <br/>...Change ticket prices
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }

  get_color(activator) {
    if (activator) return "primary" 
    else return "secondary";
  }

  get_icon(activator) {
    if (activator) return <CloseIcon />
    else return <CheckIcon />;
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