const { clientEmitter, serverEmitter, eventName } = require('nodejs-mobile-react-native');

const channel = {
	on: (_, cb) => {
		serverEmitter.addListener(eventName, cb)
		// clientCbs[eventName] = cb
	},
	send: (message) => {
		clientEmitter.emit(eventName, message)
	},
}

// public API to mock rn-bridge
exports.channel = channel
