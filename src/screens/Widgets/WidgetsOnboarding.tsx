import React, { ReactElement } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

import Button from '../../components/Button';
import DetectSwipe from '../../components/DetectSwipe';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import { setWidgetsOnboarding } from '../../store/actions/widgets';
import { Display, Text01S } from '../../styles/components';
import type { WidgetsScreenProps } from '../../navigation/types';

const padlockImageSrc = require('../../assets/illustrations/padlock.png');
const puzzleImageSrc = require('../../assets/illustrations/puzzle.png');

export const GoodbyePasswords = ({
	navigation,
}: WidgetsScreenProps<'GoodbyePasswords'>): ReactElement => {
	return (
		<Layout
			header=""
			navigation={navigation}
			backButton={true}
			illustration={padlockImageSrc}
			title="Goodbye,"
			highlighted="Passwords."
			text="Experience the web without passwords. Use Bitkit to log in to your favorite web services."
			onNext={(): void => {
				navigation.navigate('HelloWidgets');
			}}
		/>
	);
};

export const HelloWidgets = ({
	navigation,
}: WidgetsScreenProps<'HelloWidgets'>): ReactElement => {
	return (
		<Layout
			header=""
			navigation={navigation}
			backButton={true}
			illustration={puzzleImageSrc}
			title="Hello,"
			highlighted="Widgets."
			text="Enjoy decentralized feeds from your favorite web services, by adding fun and useful widgets to your wallet."
			onNext={(): void => {
				setWidgetsOnboarding(true);
				navigation.navigate('WidgetsSuggestions');
			}}
		/>
	);
};

export const Layout = ({
	navigation,
	backButton = false,
	illustration,
	title,
	subtitle,
	text,
	highlighted,
	buttonText = 'Continue',
	header = 'Profile',
	children,
	onNext,
}: {
	// TODO: type this
	navigation: any;
	backButton: boolean;
	illustration: ImageSourcePropType;
	title: string;
	subtitle?: string;
	text: string;
	highlighted: string;
	buttonText?: string;
	header?: string;
	children?;
	onNext?;
}): JSX.Element => {
	const onSwipeRight = (): void => {
		navigation.getParent()?.navigate('Tabs');
	};

	return (
		<GlowingBackground topLeft="brand">
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title={header}
				displayBackButton={backButton}
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>
			<DetectSwipe onSwipeRight={onSwipeRight}>
				<View style={styles.content}>
					<View style={styles.imageContainer}>
						<Image source={illustration} style={styles.illustration} />
					</View>
					<View style={styles.middleContainer}>
						<Display>{title}</Display>
						<Display>
							{subtitle}
							<Display color="brand">{highlighted}</Display>
						</Display>
						<Text01S color="gray1" style={styles.introText}>
							{text}
						</Text01S>
						{children}
					</View>
					<Button
						text={buttonText}
						size="large"
						onPress={(): void => {
							onNext?.();
						}}
					/>
				</View>
			</DetectSwipe>
			<SafeAreaInsets type="bottom" />
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	imageContainer: {
		alignSelf: 'center',
		width: '100%',
		flex: 1,
		marginBottom: 16,
	},
	illustration: {
		alignSelf: 'center',
		width: '100%',
		height: '100%',
		resizeMode: 'contain',
	},
	introText: {
		marginTop: 8,
		width: 280,
	},
	middleContainer: {
		flex: 1,
	},
});
