import React, { Component } from 'react';

import EventListItem from './EventListItem.js'
import './EventList.css';

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
      <div>
        {this.state.events.map(e =>
          <EventListItem 
            key={e}
            eventId={e} 
            {...this.props}
          />
        )}
      </div>
    )
  }
}
