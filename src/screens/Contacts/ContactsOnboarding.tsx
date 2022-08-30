import React from 'react';
import { Image, StyleSheet } from 'react-native';

import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import { Display, Text01S, View } from '../../styles/components';
import GlowingBackground from '../../components/GlowingBackground';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import { setOnboardedContacts } from '../../store/actions/slashtags';

export const ContactsOnboarding = ({ navigation }): JSX.Element => {
	return (
		<GlowingBackground topLeft="brand">
			<SafeAreaInsets type={'top'} />
			<NavigationHeader
				title="Contacts"
				displayBackButton={false}
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>
			<View style={styles.content}>
				<Image
					source={require('../../assets/illustrations/book.png')}
					style={styles.illustration}
				/>
				<Display>Dynamic</Display>
				<Display color="brand">Contacts.</Display>
				<Text01S color="gray1" style={styles.introText}>
					Use Slashtags to get automatic updates from your contacts, pay them,
					and follow their public profiles
				</Text01S>
				<Button
					text="Add Your First Contact"
					size="large"
					onPress={(): void => {
						setOnboardedContacts();
					}}
				/>
			</View>
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
		justifyContent: 'space-between',
		margin: 20,
		marginTop: 0,
		backgroundColor: 'transparent',
	},
	illustration: {
		alignSelf: 'center',
		width: 332,
		height: 332,
	},
	introText: {
		marginTop: 8,
	},
});

export default ContactsOnboarding;
