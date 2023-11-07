// Add text streaming support via react-native-fetch-api
window.fetch = (url, options): Promise<Response> => {
	return window.fetch(url, {
		...options,
		reactNative: { textStreaming: true },
	});
};

export default window.fetch;
