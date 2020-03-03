import React, { Component } from "react";
import { TextField } from '@material-ui/core';
import { bytesToString } from '../util/conversion.js';

import OwnedEvent from './OwnedEvent.js';

export default class MyEvents extends Component {
  owned_events = [];
  constructor() {
    super();
    this.state = {owned_events: []}
  }

  componentDidMount = async () => {
    // extract list of owned events from all events
    this.props.events.forEach((e) => {
      this.props.contract.methods.get_event_info(e).call().then(res => {
        if (res.owner === this.props.accounts[0]) {
          this.owned_events.push(bytesToString(e));
          this.setState({owned_events: [...this.owned_events]});
          console.log(bytesToString(e));
        }
      });
    });

    console.log(this.owned_events.length);
  }

  render() {
    return (
      <div>
        {this.state.owned_events.map(e =>
          <OwnedEvent
            key={e}
            web3={this.state.web3} 
            accounts={this.state.accounts} 
            contract={this.props.contract}
            eventId={e} />
        )}
      </div>
    );
  }
}
