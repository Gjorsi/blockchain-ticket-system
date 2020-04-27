#!/usr/bin/env python3

import matplotlib.pyplot as plt
import numpy as np
import sys

g = 1e9
ethusd = 195
gasprice = 5*g

data = {}

with open(sys.argv[1]) as reader:
    data['Cost'] = [int(k) for k in reader.readlines()]

data['Events'] = range(1,len(data['Cost'])+1)

fig, ax = plt.subplots()
ax.plot('Events', 'Cost', data=data)
ax.set(xlabel='Events in contract', ylabel='Gas needed to buy single ticket', title='Transaction costs as contract has more events')
ax.grid()
ax.set_xlim([1,len(data['Cost'])+1])
ax.ticklabel_format(style='plain')

def gasToUsd(gas):
    return gas*gasprice*ethusd / 1e18

def usdToGas(usd):
    return usd*1e18 / (ethusd*gasprice)

secax = ax.secondary_yaxis('right', functions=(gasToUsd,usdToGas))
secax.set_ylabel('Transaction cost in dollars')

plt.show()
