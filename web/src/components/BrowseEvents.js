import React, { Component } from "react";
import EventList from './EventList.js';

export default class BrowseEvents extends Component {

  render() {
    return (
      <div>
        <h2>Browse Events</h2>
        <EventList {...this.props} />
      </div>
    );
  }
}
