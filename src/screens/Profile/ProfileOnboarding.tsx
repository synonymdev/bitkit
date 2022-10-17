import React from 'react';
import { View, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

import { Display, Text01S } from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import GlowingBackground from '../../components/GlowingBackground';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import { setOnboardingProfileStep } from '../../store/actions/slashtags';
import { ISlashtags } from '../../store/types/slashtags';
import SwitchRow from '../../components/SwitchRow';
import { updateSlashPayConfig } from '../../utils/slashtags';
import { useSlashtagsSDK } from '../../components/SlashtagsProvider';
import Store from '../../store/types';
import { updateSettings } from '../../store/actions/settings';
import DetectSwipe from '../../components/DetectSwipe';
import type {
	RootStackParamList,
	RootStackScreenProps,
} from '../../navigation/types';

const crownImageSrc = require('../../assets/illustrations/crown.png');
const coinsImageSrc = require('../../assets/illustrations/coins.png');
const switchImageSrc = require('../../assets/illustrations/switch.png');

export const ProfileIntro = ({
	navigation,
}: RootStackScreenProps<'Profile'>): JSX.Element => {
	return (
		<Layout
			navigation={navigation}
			backButton={true}
			illustration={crownImageSrc}
			title="Own your"
			highlighted="Social Profile."
			text="Use Bitkit to control your public profile and links, so your contacts can reach you or pay you anytime."
			nextStep="InitialEdit"
		/>
	);
};

export const PaymentsFromContacts = ({ navigation }): JSX.Element => {
	return (
		<Layout
			navigation={navigation}
			backButton={true}
			illustration={coinsImageSrc}
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
	const enableOfflinePayments = useSelector(
		(state: Store) => state.settings.enableOfflinePayments,
	);

	const sdk = useSlashtagsSDK();

	const savePaymentConfig = async (): Promise<void> => {
		updateSlashPayConfig(sdk, { p2wpkh: enableOfflinePayments });
	};

	return (
		<Layout
			navigation={navigation}
			backButton={true}
			illustration={switchImageSrc}
			title="Offline"
			header="Offline payments"
			highlighted="Payments."
			text="Bitkit can also create a fixed Bitcoin address for you, so you’re able to receive payments even when you are offline."
			nextStep="Done"
			buttonText="Save Profile"
			onNext={savePaymentConfig}>
			<View style={styles.enableOfflineRow}>
				<SwitchRow
					isEnabled={enableOfflinePayments}
					showDivider={false}
					onPress={(): void => {
						updateSettings({ enableOfflinePayments: !enableOfflinePayments });
					}}>
					<Text01S>Enable offline payments</Text01S>
				</SwitchRow>
			</View>
		</Layout>
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
	nextStep,
	buttonText = 'Continue',
	header = 'Profile',
	children,
	onNext,
}: {
	navigation: StackNavigationProp<RootStackParamList, 'Profile'>;
	backButton: boolean;
	illustration: ImageSourcePropType;
	title: string;
	subtitle?: string;
	text: string;
	highlighted: string;
	nextStep?: ISlashtags['onboardingProfileStep'];
	buttonText?: string;
	header?: string;
	children?;
	onNext?;
}): JSX.Element => {
	const onSwipeLeft = (): void => {
		navigation.navigate('Tabs');
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
			<DetectSwipe onSwipeLeft={onSwipeLeft}>
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
							nextStep && setOnboardingProfileStep(nextStep);
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
	enableOfflineRow: {
		marginTop: 25,
	},
});
