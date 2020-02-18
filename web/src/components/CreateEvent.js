import React, { Component } from "react";
import { Switch, TextField, FormControlLabel } from '@material-ui/core';

export default class CreateEvent extends Component {
	state = {event_ID: null, event_title: null, sale_active: false, buyback_active: false, customer_limited: false, 
				tickets_per_customer: 0, ticket_types: 1, price_table: [], ticket_avail: [], ticket_prices: []};
	
	render() {
		return (
			<div>
				<h2>Create a new event</h2>

				<TextField 
					id="event_ID" 
					label="Unique event ID" 
					variant="outlined" 
					required={true} 
					onChange={e => this.setState({event_ID: e.target.value})} />

				<TextField 
					id="event_title" 
					label="Event title" 
					variant="outlined" 
					required={true}
					onChange={e => this.setState({event_title: e.target.value})} />

				<div><FormControlLabel
					control={<Switch onChange={e => this.setState({sale_active: e.target.checked})} />}
					label="Sale active on deployment" /></div>

				<div><FormControlLabel
					control={<Switch onChange={e => this.setState({buyback_active: e.target.checked})} />}
					label="Buyback active on deployment" /></div>

				<div><FormControlLabel
					control={<Switch onChange={e => this.setState({customer_limited: e.target.checked})} />}
					label="Limit number of tickets per customer" /></div>
				
				{this.tickets_per_customer()}

				<div><TextField 
					id="ticket_types" 
					label="# of ticket types" 
					variant="outlined" 
					margin="normal"
					required={true}
					type="number"
					defaultValue={1}
					inputProps={{ min: "1", max: "50", step: "1" }}
					onChange={e => this.set_ticket_types(e.target.value)} /></div>

				{this.state.price_table}

				{this.ticket_avail}
				{this.ticket_prices}
					
			</div>
		);
	}

	tickets_per_customer() {
		if (this.state.customer_limited) return (
			<div><TextField 
				id="tickets_per_customer" 
				label="Max. tickets / customer" 
				variant="outlined" 
				margin="normal"
				required={true}
				type="number"
				defaultValue={1}
				inputProps={{ min: "1", step: "1" }}
				onChange={e => this.setState({tickets_per_customer: e.target.value})} /></div>
		)
	}

	set_ticket_types(val) {
		this.setState({ticket_types: val});
		this.setState({ticket_avail: new Array(val).fill(1)});
		this.setState({ticket_prices: new Array(val).fill(1)});
		this.tickets_and_prices();
	}

	tickets_and_prices() {
		this.setState({price_table: []});
		for (let i=0; i<this.state.ticket_types; i++) {
			this.setState(prevState => ({ price_table: [prevState.price_table, (
				<div key={i}><TextField 
					id={"tickets_avail" + i}
					label="Total # of tickets"
					variant="outlined" 
					margin="normal"
					required={true}
					type="number"
					defaultValue={this.state.ticket_avail[i]}
					inputProps={{ min: "1", step: "1" }}
					onChange={e => this.state.ticket_avail[i] = e.target.value} />
				<TextField 
					id={"ticket_price" + i}
					label="Ticket price" 
					variant="outlined" 
					margin="normal"
					required={true}
					type="number"
					defaultValue={this.state.ticket_prices[i]}
					inputProps={{ min: "1", step: "1" }}
					onChange={e => this.state.ticket_prices[i] = e.target.value} /></div>
			)]}))
		}
	}
}