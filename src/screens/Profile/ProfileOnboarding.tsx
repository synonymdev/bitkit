import React, { memo, useCallback, useMemo } from 'react';
import { View, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

import { Display, Text01S, Text02S } from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import GlowingBackground from '../../components/GlowingBackground';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import { setOnboardingProfileStep } from '../../store/actions/slashtags';
import { ISlashtags } from '../../store/types/slashtags';
import SwitchRow from '../../components/SwitchRow';
import { updateSlashPayConfig } from '../../utils/slashtags';
import { useSlashtagsSDK } from '../../components/SlashtagsProvider';
import { updateSettings } from '../../store/actions/settings';
import DetectSwipe from '../../components/DetectSwipe';
import type {
	RootStackParamList,
	RootStackScreenProps,
} from '../../navigation/types';
import { useScreenSize } from '../../hooks/screen';
import { enableOfflinePaymentsSelector } from '../../store/reselect/settings';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../store/reselect/wallet';

const crownImageSrc = require('../../assets/illustrations/crown.png');
const coinsImageSrc = require('../../assets/illustrations/coins.png');

export const ProfileIntro = memo(
	({ navigation }: RootStackScreenProps<'Profile'>): JSX.Element => {
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
	},
);

export const OfflinePayments = ({ navigation }): JSX.Element => {
	const enableOfflinePayments = useSelector(enableOfflinePaymentsSelector);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);

	const sdk = useSlashtagsSDK();

	const savePaymentConfig = useCallback(async (): Promise<void> => {
		updateSlashPayConfig({ sdk, selectedWallet, selectedNetwork });
	}, [sdk, selectedNetwork, selectedWallet]);

	return (
		<Layout
			navigation={navigation}
			backButton={true}
			illustration={coinsImageSrc}
			title="Pay your"
			header="Pay Contacts"
			highlighted="Contacts."
			text="You and your contacts can use Bitkit to send payments directly, without banks, anytime, anywhere."
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
					<Text01S>Enable payments with contacts*</Text01S>
				</SwitchRow>
				<Text02S color="gray1">* This requires sharing payment data.</Text02S>
			</View>
		</Layout>
	);
};

export const Layout = memo(
	({
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
		const { isSmallScreen } = useScreenSize();
		const onSwipeLeft = (): void => {
			navigation.navigate('Wallet');
		};

		const imageContainerStyles = useMemo(
			() => ({
				...styles.imageContainer,
				flex: isSmallScreen ? 0.7 : 1,
			}),
			[isSmallScreen],
		);

		return (
			<GlowingBackground topLeft="brand">
				<SafeAreaInsets type="top" />
				<NavigationHeader
					title={header}
					displayBackButton={backButton}
					onClosePress={(): void => {
						navigation.navigate('Wallet');
					}}
				/>
				<DetectSwipe onSwipeLeft={onSwipeLeft}>
					<View style={styles.content}>
						<View style={imageContainerStyles}>
							<Image source={illustration} style={styles.image} />
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
	},
);

const styles = StyleSheet.create({
	content: {
		flex: 1,
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	imageContainer: {
		flex: 1,
		alignItems: 'center',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	introText: {
		marginTop: 8,
	},
	middleContainer: {
		flex: 1,
	},
	enableOfflineRow: {
		marginTop: 25,
	},
});
