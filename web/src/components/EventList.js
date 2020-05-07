import React, { Component } from 'react';

import EventListItem from './EventListItem.js'
import './ExpansionPanel.css';

export default class EventList extends Component {

  render() {
    return(
      <div>
        {this.props.event_list.map(e =>
          {if (this.props.events.has(e)) {
            return(<EventListItem 
              key={e}
              eventId={e}
              event={this.props.events.get(e)}
              {...this.props}
            />)
          }}
        )}
      </div>
    )
  }
}
