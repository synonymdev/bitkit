import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { StyleSheet, Image, ImageSourcePropType } from 'react-native';

import { Display, View, Text01S } from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import GlowingBackground from '../../components/GlowingBackground';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import { setOnboardingProfileStep } from '../../store/actions/slashtags';
import { ISlashtags, SlashPayConfig } from '../../store/types/slashtags';
import SwitchRow from '../../components/SwitchRow';
import { getReceiveAddress } from '../../utils/wallet';
import Store from '../../store/types';
import { useSlashtagsSDK } from '../../components/SlashtagsProvider';
import { getSelectedSlashtag } from '../../utils/slashtags';

export const ProfileIntro = ({ navigation }): JSX.Element => {
	return (
		<Layout
			navigation={navigation}
			backButton={false}
			illustration={require('../../assets/illustrations/crown.png')}
			title="Own your"
			highlighted="Social Profile"
			text="Use Slashtags to control your public profile and links, so your
contacts can reach you or pay you anytime."
			nextStep="InitialEdit"
		/>
	);
};

export const PaymentsFromContacts = ({ navigation }): JSX.Element => {
	return (
		<Layout
			navigation={navigation}
			backButton={true}
			illustration={require('../../assets/illustrations/coins.png')}
			title="Pay your"
			header="Pay Contacts"
			subtitle=""
			highlighted="Contacts."
			text="You and your contacts can use Bitkit to send payments directly, without banks, anytime, anywhere."
			nextStep="OfflinePayments"
		/>
	);
};

export const OfflinePayments = ({ navigation }): JSX.Element => {
	const [enableOfflinePayment, setEnableOfflinePayment] = useState(true);

	const selectedWallet = useSelector(
		(state: Store) => state.wallet.selectedWallet,
	);

	const sdk = useSlashtagsSDK();

	const savePaymentConfig = (): void => {
		const payConfig: SlashPayConfig = {};
		if (enableOfflinePayment) {
			const response = getReceiveAddress({ selectedWallet });
			if (response.isOk()) {
				payConfig.p2wpkh = response.value;
			}
		}
		const slashtag = getSelectedSlashtag(sdk);
		slashtag?.publicDrive.put(
			'/slashprofile',
			Buffer.from(JSON.stringify(payConfig)),
		);
	};

	return (
		<Layout
			navigation={navigation}
			backButton={true}
			illustration={require('../../assets/illustrations/switch.png')}
			title="Offline"
			header="Offline payments"
			highlighted="Payments."
			text="Bitkit can also create a fixed Bitcoin address for you, so you’re able to receive payments even when you are offline."
			nextStep="Done"
			buttonText="Save Profile"
			onNext={savePaymentConfig}>
			<View style={styles.enableOfflineRow}>
				<SwitchRow
					isEnabled={enableOfflinePayment}
					onPress={(): void => setEnableOfflinePayment(!enableOfflinePayment)}>
					<Text01S>Enable offline payments</Text01S>
				</SwitchRow>
			</View>
		</Layout>
	);
};

const Layout = ({
	navigation,
	backButton = false,
	illustration,
	title,
	subtitle,
	text,
	highlighted,
	nextStep,
	buttonText = 'Next',
	header = 'Profile',
	children,
	onNext,
}: {
	navigation;
	backButton: boolean;
	illustration: ImageSourcePropType;
	title: string;
	subtitle?: string;
	text: string;
	highlighted: string;
	nextStep: ISlashtags['onboardingProfileStep'];
	buttonText?: string;
	header?: string;
	children?;
	onNext?;
}): JSX.Element => {
	return (
		<GlowingBackground topLeft="brand">
			<SafeAreaInsets type={'top'} />
			<NavigationHeader
				title={header}
				displayBackButton={backButton}
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>
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
						setOnboardingProfileStep(nextStep);
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
	imageContainer: {
		alignSelf: 'center',
		backgroundColor: 'transparent',
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
	},
	middleContainer: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	enableOfflineRow: {
		marginTop: 25,
		backgroundColor: 'transparent',
	},
});
