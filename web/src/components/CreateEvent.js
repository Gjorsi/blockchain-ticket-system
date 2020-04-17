import React, { Component } from "react";
import { Switch, TextField, FormControlLabel, Button } from '@material-ui/core';
import DateFnsUtils from '@date-io/date-fns'
import { MuiPickersUtilsProvider, KeyboardTimePicker, KeyboardDatePicker } from '@material-ui/pickers';

export default class CreateEvent extends Component {
  state = {event_ID: null, event_title: null, sale_active: false, buyback_active: false, customer_limited: false, 
        tickets_per_customer: 1, ticket_types: 1, price_table: [], deadline: null, button_disabled: true, event_ID_helperText: ""};

  componentDidMount() {
    this.set_ticket_types(1);
  }

  tickets_avail = [];
  ticket_prices = [];
  event_ID_hex = "";

  render() {
    return (
      <div>
        <h2>Create a new event</h2>

        <TextField 
          id="event_ID" 
          label="Unique event ID" 
          helperText={this.state.event_ID_helperText}
          variant="outlined" 
          required={true} 
          onChange={e => this.update_event_ID(e.target.value) } />

        <TextField 
          id="event_title" 
          label="Event title" 
          variant="outlined" 
          required={true}
          onChange={e => this.update_title(e.target.value) } />

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
          inputProps={{ min: "1", max: "15", step: "1" }}
          onChange={e => this.set_ticket_types(e.target.value)} /></div>

        {this.state.price_table}

        <div>
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDatePicker
              id="deadline"
              variant="inline"
              format="yyyy-MM-dd"
              margin="normal"
              label="Choose a deadline date"
              value={this.state.deadline}
              onChange={d => this.update_deadline(d)}
            />
	    <KeyboardTimePicker
              margin="normal"
              id="time-picker"
              label="Choose a deadline time"
              value={this.state.deadline}
              onChange={d => this.update_deadline(d)}
            />
          </MuiPickersUtilsProvider>
        </div>

        <div><Button
          id="createButton"
          variant="contained"
          disabled={this.state.button_disabled}
          onClick={() => { this.submit() }}
          >Create Event</Button></div>
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

  set_ticket_types = async (val) => {
    val = Math.min(val,15);
    await this.setState({ticket_types: val});
    this.tickets_and_prices();
    this.tickets_avail = new Array(val);
    this.ticket_prices = new Array(val);
    this.check_form();
  }

  tickets_and_prices() {
    this.setState({price_table: []});
    for (let i=0; i<this.state.ticket_types; i++) {
      this.setState(prevState => ({ price_table: [prevState.price_table, (
        <div key={i}><TextField 
          id={"tickets_avail" + i}
          label="Nr. of tickets"
          variant="outlined" 
          margin="normal"
          required={true}
          type="number"
          inputProps={{ min: "1", step: "1" }}
          onChange={e => { this.tickets_avail[i] = e.target.value; this.check_form() }}
          helperText={"Ticket type " + (i+1)} />
        <TextField 
          id={"ticket_price" + i}
          label="Ticket price (ETH)"
          variant="outlined"
          margin="normal"
          required={true}
          type="number"
          inputProps={{ min: "0.000001", step: "0.000001" }}
          onChange={e => {
            !!e.target.value ? this.ticket_prices[i] = this.props.web3.utils.toWei(e.target.value) : this.ticket_prices[i] = null; 
            this.check_form();
          }}
          /></div>
      )]}))
    }
  }

  update_deadline = async (val) => {
    await this.setState({deadline: val});
    this.check_form();
  }

  update_event_ID = async (val) => {
    await this.setState({event_ID: val});
    this.event_ID_hex = this.props.web3.utils.padRight(
          this.props.web3.utils.asciiToHex(
            this.state.event_ID), 64);
    
    this.check_form();
  }

  update_title = async (val) => {
    await this.setState({title: val});
    this.check_form();
  }

  check_form = async () => {
    let button_state = this.check_fields();
    await this.setState({button_disabled: button_state})
  }

  check_fields() {
    if (typeof this.state.event_ID !== "string") return true;
    if (typeof this.state.event_ID === "string" && this.state.event_ID.length < 1) return true;

    if (this.props.event_list.includes(this.event_ID_hex)) {
      this.setState({event_ID_helperText: "Event ID is not available."});
      return true;
    } else this.setState({event_ID_helperText: "Event ID is available."});
      
    if (typeof this.state.title !== "string") return true;
    if (typeof this.state.title === "string" && this.state.title.length < 1) return true;
    if (this.state.deadline == null) return true;

    for (let i=0; i<this.state.ticket_types; i++) {
      if (!this.tickets_avail[i] || !this.ticket_prices[i]) return true;
      if (this.tickets_avail[i] < 1 || this.ticket_prices[i] < 1) return true; //avoid zero or negative ticket availability or prices
    }

    return false;
  }

  submit = async () => {
    try {
      await this.props.contract.methods.create_event(
        this.props.web3.utils.asciiToHex(this.state.event_ID),
        this.props.web3.utils.asciiToHex(this.state.title),
        this.tickets_avail,
        this.ticket_prices,
        this.state.customer_limited,
        this.state.tickets_per_customer,
        this.state.sale_active,
        this.state.buyback_active,
        Math.round(this.state.deadline.getTime() / 1000)
        ).send({from: this.props.accounts[0]});
      this.props.new_event_update(
        this.props.web3.utils.padRight(
          this.props.web3.utils.asciiToHex(
            this.state.event_ID), 
            64)); //call App.js to update event list and load the event into cache
    } catch (error) {
      console.log("Dev error: " + error);
    }
  }
}
