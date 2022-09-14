module.exports = {
	extends: ['@ptsecurity/commitlint-config'],
	rules: {
		'scope-enum': [
			2,
			'always',
			[
				'accounts',
				'activity',
				'assets',
				'backup',
				'contacts',
				'lang',
				'lightning',
				'onboarding',
				'profile',
				'receive',
				'scan',
				'security',
				'send',
				'settings',
				'tokens',
				'ui',
				'wallet',
			],
		],
	},
	ignores: [(msg) => /\bWIP\b/i.test(msg)],
};
