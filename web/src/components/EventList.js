import React, { Component } from 'react';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import { bytesToString } from '../util/conversion.js';
import './EventList.css';

export class EventListItem extends Component {
  constructor(props){
    super(props);
    this.state = {title: null, tickets: [], prices: [], active: false}
  }

  componentDidMount = async () => {
    this.props.contract.methods
    .get_event_info(this.props.eventId).call().then(res => {
      console.log(res);
      this.setState({
        title: bytesToString(res.title),
        tickets: res.available_tickets,
        prices: res.ticket_price,
        active: res.sale_active,
      });
    });
  }

  render() {
    return (
      <ExpansionPanel>
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <Typography className="heading">
            {this.state.title}
          </Typography>
          <Typography className="secondaryHeading">
            {this.state.tickets.reduce((a,b)=>a+parseInt(b),0)} available tickets
          </Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          Title: {this.state.title}<br/>
        </ExpansionPanelDetails>
      </ExpansionPanel>
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
      <div>
        {this.state.events.map(e =>
          <EventListItem 
            key={e}
            contract={this.props.contract}
            eventId={e} />
        )}
      </div>
    )
  }
}
