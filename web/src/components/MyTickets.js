import React, { Component } from "react";

import TicketView from './MyTickets/TicketView.js';

import { getErrorMessage } from '../util/EthErrorMsg.js';

export default class MyTickets extends Component {

  state = {participation: null}

  componentDidMount = async () => {
    // get events of which user owns tickets to
    try {
      let participation = await this.props.contract.methods.get_participation().call({from: this.props.accounts[0]})
      this.setState({participation: participation});
    } catch (error) {
      console.log(getErrorMessage(error));
    }
  }

  render() {
    return (
      <div>
        {!!(this.state.participation) ? this.state.participation.map((e, i) =>
          {if (this.props.events.has(e)) {
            return(<TicketView
              key={i}
              accounts={this.props.accounts} 
              contract={this.props.contract}
              eventId={e}
              reload_event={this.props.reload_event}
              add_pending_tx={this.props.add_pending_tx}
              add_confirmed_tx={this.props.add_confirmed_tx}
              event={this.props.events.get(e)} />)
          } else return ("No tickets found.")} 

        ):"No tickets found..."}
          
      </div>
    );
  }
}
