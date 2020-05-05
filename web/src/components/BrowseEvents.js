import React, { Component } from "react";
import EventList from './EventList.js';

export default class BrowseEvents extends Component {

  render() {
    return (
      <div>
        <EventList {...this.props} />
      </div>
    );
  }
}
