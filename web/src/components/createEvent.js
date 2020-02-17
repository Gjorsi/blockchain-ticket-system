import React, { Component } from "react";
import { Switch, TextField, FormControlLabel } from '@material-ui/core';

export default class CreateEvent extends Component {
	state = {event_ID: null, event_title: null, sale_active: false, buyback_active: false, customer_limited: false, 
				tickets_per_customer: 0}

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
					
			</div>
		);
	}

	tickets_per_customer() {
		if (this.state.customer_limited) return (
			<TextField 
				id="tickets_per_customer" 
				label="Max. tickets / customer" 
				variant="outlined" 
				required={true}
				type="number"
				onChange={e => this.setState({tickets_per_customer: e.target.value})} />
		)
	}
}