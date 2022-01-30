const c = require('compact-encoding')

class ProtocolStateMachine {
  constructor (definition) {
    this.definition = definition
    this.state = this.definition.states[0] // state 0 is always initial state
    this.reset = this.definition.reset || this._reset // default reset behaviour
    this.log = []
    this.logLength = definition.logLength || 100 // default log length
  }

  async input (buffer) {
    this._addLog({ timestamp: Date.now(), message: buffer })
    const message = this._parse(buffer)

    if (!message) { // Message could not be parsed for current state, either the behaviour is undefined, or the message is not well formed
      if (this.state.onError) {
        await this.state.onError((message, this.reset, this.state))
      }
      return
    }
    const transition = this.definition.transitions.find(t => t.from === this.state.name && t.message === message.name)
    const nextState = this.definition.states.find(s => s.name === transition.to)
    const result = await transition.onMessage(message.payload)
    if (result) this.state = nextState
  }

  _addLog (buffer) {
    this.log.unshift(buffer)
    this.log.length = this.logLength
  }

  _parse (buffer) {
    const transactions = this.definition.transitions.filter(t => t.from === this.state.name)
    const messages = transactions.map(t => (this.definition.messages.find(m => m.name === t.message)))
    for (let i = 0; i < messages.length; i++) {
      try {
        const decodedMessage = c.decode(messages[i].type, buffer)
        return { name: messages[i].name, payload: decodedMessage }
      } catch (err) {
      }
    }
  }

  _reset () {
    this.state = this.definition.states[0]
  }
}

module.exports = (definition) => new ProtocolStateMachine(definition)
