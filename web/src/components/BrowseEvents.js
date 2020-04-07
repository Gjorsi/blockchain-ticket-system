import React, { Component } from "react";
import EventList from './EventList.js';

export default class BrowseEvents extends Component {
  
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
