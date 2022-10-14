import React from 'react';
import { setWidgetsOnboarding } from '../../store/actions/widgets';

import { Layout } from '../Profile/ProfileOnboarding';

const padlockImageSrc = require('../../assets/illustrations/padlock.png');
const puzzleImageSrc = require('../../assets/illustrations/puzzle.png');

export const GoodbyePasswords = ({ navigation }): JSX.Element => {
	return (
		<Layout
			navigation={navigation}
			backButton={true}
			illustration={padlockImageSrc}
			title="Goodbye,"
			highlighted="Passwords."
			text="Experience the web without passwords. Use Bitkit to log in?to your favorite web services."
			onNext={(): void => {
				navigation.navigate('HelloWidgets', {});
			}}
		/>
	);
};

export const HelloWidgets = ({ navigation }): JSX.Element => {
	return (
		<Layout
			navigation={navigation}
			backButton={true}
			illustration={puzzleImageSrc}
			title="Hello,"
			highlighted="Widgets."
			text="Enjoy decentralized feeds from your favorite web services, by adding fun and useful widgets to your wallet."
			onNext={(): void => {
				setWidgetsOnboarding(true);
				navigation.navigate('WidgetsSuggestions', {});
			}}
		/>
	);
};
