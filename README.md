# Protocol-state-machine

Definition of messages, states and transitions for communication protocols.

## How to use this:

- Define the message format using [compact-econding](https://www.npmjs.com/package/compact-encoding) schemes with help of [compact-encoding-struct](https://www.npmjs.com/package/compact-encoding-struct):

``` js
const c = require('compact-encoding')
const { compile, constant } = require('compact-encoding-struct')

const types = {
  HANDSHAKE: 0,
  QUERY: 1,
  ACK: 2
}

const handshake = compile({
  type: constant(c.uint8, types.HANDSHAKE),
  pk: c.buffer,
  core: c.buffer
})

const query = compile({
  type: constant(c.uint8, types.QUERY),
  timestamp: c.buffer,
  payload: c.buffer,
  signature: c.buffer,
  prev: c.buffer
})

const ack = compile({
  type: constant(c.uint8, types.ACK),
  timestamp: c.buffer,
  signature: c.buffer
})
```

- Define the states, messages and trasitions of the session:

``` js
const definition = {
  states: [
    { name: 'initial_state', onError: () => console.log('invalid message') }, // first state is always inital state of the machine
    { name: 'idle' },
    { name: 'waiting_ack' }
  ],
  messages: [
    { name: 'handshake', type: handshake },
    { name: 'query', type: query },
    { name: 'ack', type: ack }
  ],
  transitions: [
    {
      from: 'initial_state',
      to: 'idle',
      message: 'handshake',
      onMessage: async (message) => {
        this.handshake = message
        return true // return true for transition to next stage, false would stop the transition
      }
    },
    {
      from: 'idle',
      to: 'waiting_ack',
      message: 'query',
      onMessage: async (message) => {
        this.socket.write(c.encode(query, message))
        return true
      }
    },
    {
      from: 'waiting_ack',
      to: 'idle',
      message: 'ack',
      onMessage: async (message) => {
        return true
      }
    }
  ],
  logLength: 100
}
```

- Instantiate the state machine and input:

``` js
const session = ProtocolStateMachine(definition)
session.input("wrong message") // prints 'invalid message'
assert(session.state.name, 'initial_state')
await session.input(handshake)
assert(session.state.name, 'idle')
```
