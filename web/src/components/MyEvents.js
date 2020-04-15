import React, { Component } from "react";

import OwnedEvent from './MyEvents/OwnedEvent.js';

export default class MyEvents extends Component {
  owned_events = [];
  constructor() {
    super();
    this.state = {owned_events: []}
  }

  componentDidMount = async () => {
    // extract list of owned events from all events
    this.props.event_list.map(async (eventId) => {
      let event = this.props.events.get(eventId);
      if (event.owner === this.props.accounts[0]) {
        this.owned_events.push(eventId);
      }
    });

    this.setState({owned_events: this.owned_events});
  }

  render() {
    return (
      <div>
        {this.state.owned_events.map((e, i) =>
          <OwnedEvent
            key={i}
            accounts={this.props.accounts} 
            contract={this.props.contract}
            eventId={e} 
            event={this.props.events.get(e)}
            reload_event={this.props.reload_event}/>
        )}
      </div>
    );
  }
}
