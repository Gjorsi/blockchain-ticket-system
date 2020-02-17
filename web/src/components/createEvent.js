import React, { Component } from "react";
import TextField from "@material-ui/core/TextField";

export default class CreateEvent extends Component {
	render() {
		return (
			<div>
				<h2>Create a new event</h2>
				<TextField id="event_ID" label="Unique event ID" variant="outlined" required="True" />
				<TextField id="event_title" label="Event title" variant="outlined" required="True" />
				<TextField id="event_title" label="Event title" variant="outlined" required="True" />
			</div>
		);
	}
}