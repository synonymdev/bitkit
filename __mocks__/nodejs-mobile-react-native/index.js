import { EventEmitter } from 'node:events';

const clientEmitter = new EventEmitter();
const serverEmitter = new EventEmitter();
const eventName = 'message';

const channel = {
	addListener: (_, cb) => {
		clientEmitter.addListener(eventName, cb);
	},
	send: (message) => {
		// if (serverEmitter.lis)
		if (serverEmitter.listeners(eventName).length === 0) {
			throw new Error('nodejs-project/main.js not initialized');
		}
		serverEmitter.emit(eventName, message);
	},
};

// public API to mock nodejs-mobile-react-native
exports.channel = channel;

// private API for rn-bridge
exports.clientEmitter = clientEmitter;
exports.serverEmitter = serverEmitter;
exports.eventName = eventName;
