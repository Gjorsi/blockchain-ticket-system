import React, { Component } from "react";

import TicketView from './MyTickets/TicketView.js';

export default class MyTickets extends Component {

  state = {participation: null}

  componentDidMount = async () => {
    // get events of which user owns tickets to
    this.setState({participation: await this.props.contract.methods.get_participation().call({from: this.props.accounts[0]})});
  }

  render() {
    return (
      <div>
        {!!(this.state.participation)?this.state.participation.map((e, i) =>
          <TicketView
            key={i}
            web3={this.props.web3} 
            accounts={this.props.accounts} 
            contract={this.props.contract}
            eventId={e} />
        ):"loading.."}
      </div>
    );
  }
}
