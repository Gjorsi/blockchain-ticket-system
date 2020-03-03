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
          <Chip
            avatar={<Avatar>A</Avatar>}
            label="Sale Status"
            color={this.get_color(this.state.event.sale_active)}
            variant="outlined"
            onDelete={this.handleActivateSale()}/>
          <br/>...Sale status (active, buyback etc)
          <br/>...List tickets available / sold / total
          <br/>...Start/stop sale
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
    if (activator) return "CloseIcon"
    else return "CheckIcon";
  }

  handleActivateSale() {
    return
  }
}