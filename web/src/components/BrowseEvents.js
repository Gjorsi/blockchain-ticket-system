import React, { Component } from "react";
import Web3 from 'web3';
import { Switch, TextField } from '@material-ui/core';
import EventList from './EventList.js';

export default class BrowseEvents extends Component {
  constructor(props) {
    super(props);
  }
  
  componentDidMount = async () => {
    let events = await this.props.contract.methods.get_events().call();
  };

  render() {
    return (
      <div>
        <h2>Browse Events</h2>
        <EventList {...this.props} />
      </div>
    );
  }
}
