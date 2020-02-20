import React, { Component } from 'react';
import { bytesToString } from '../util/conversion.js'

export class EventListItem extends Component {
  constructor(props){
    super(props);
    this.state = {title: null}
  }
  
  componentDidMount = async () => {
    this.props.contract.methods
    .get_event_info(this.props.eventId).call().then(res => {
      this.setState({title: bytesToString(res.title)});
    });
  }

  render() {
    return (
      <li>{this.state.title}</li>
    );
  }
}

export default class EventList extends Component {
  constructor(props){
    super(props);
    this.state = {events: []};
  }

  componentDidMount = async () => {
    let events = await this.props.contract.methods.get_events().call();
    this.setState({events});
  };

  render() {
    return(
      <ul>
        {this.state.events.map(e =>
          <EventListItem contract={this.props.contract} eventId={e} />
        )}
      </ul>
    )
  }
}
