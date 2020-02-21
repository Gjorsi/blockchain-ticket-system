import React, { Component } from "react";
import { TextField } from '@material-ui/core';
import { bytesToString } from '../util/conversion.js';

import EventListItem from './EventList.js';

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
        }
      });
    });

    await this.setState({owned_events: this.owned_events});
    console.log(this.state.owned_events);
  }

  render() {
    return (
      <div>
        {this.state.owned_events.map(e =>
          <EventListItem
            key={e}
            contract={this.props.contract}
            eventId={e} />
        )}
      </div>
    );
  }
}
