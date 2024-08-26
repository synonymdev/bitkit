let mockKeychainPasswords = {};

const getGenericPassword = jest.fn(
	({ service }) =>
		new Promise((resolve, reject) => {
			const password = mockKeychainPasswords[service];
			if (password) {
				return resolve({
					password,
				});
			}

			return resolve({ password: '' });
		}),
);

const setGenericPassword = jest.fn(
	(key, value, args) =>
		new Promise((resolve, reject) => {
			mockKeychainPasswords[key] = value;
			resolve(true);
		}),
);

const keychainMock = {
	SECURITY_LEVEL_ANY: 'MOCK_SECURITY_LEVEL_ANY',
	SECURITY_LEVEL_SECURE_SOFTWARE: 'MOCK_SECURITY_LEVEL_SECURE_SOFTWARE',
	SECURITY_LEVEL_SECURE_HARDWARE: 'MOCK_SECURITY_LEVEL_SECURE_HARDWARE',
	setGenericPassword,
	getGenericPassword,
	resetGenericPassword: jest.fn().mockResolvedValue(true),
};

export default keychainMock;
