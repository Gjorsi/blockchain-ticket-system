import React, { Component } from "react";

import { TextField, ExpansionPanel, ExpansionPanelSummary, 
ExpansionPanelDetails, Typography, FormControl } from '@material-ui/core';

import { bytesToString } from '../../util/conversion.js';
import Web3 from 'web3';

export default class TicketView extends Component {

  componentDidMount = async () => {
    // get events of which user owns tickets to
    this.setState({event: await this.props.contract.methods.get_event_info(Web3.utils.asciiToHex(this.props.eventId)).call()});

  }  

  render() {
    return(
      <></>
    );
  }
}