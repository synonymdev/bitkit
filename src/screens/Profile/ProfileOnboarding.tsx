import React, {
	memo,
	ReactElement,
	ReactNode,
	useCallback,
	useMemo,
} from 'react';
import { View, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { Display, Text01S, Text02S } from '../../styles/text';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import GlowingBackground from '../../components/GlowingBackground';
import SafeAreaInset from '../../components/SafeAreaInset';
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
	({ navigation }: RootStackScreenProps<'Profile'>): ReactElement => {
		const { t } = useTranslation('slashtags');

		return (
			<Layout
				navigation={navigation}
				illustration={crownImageSrc}
				nextStep="InitialEdit"
				buttonText={t('continue')}
				header={t('profile')}>
				<Display>
					<Trans
						t={t}
						i18nKey="onboarding_profile1_header"
						components={{
							brand: <Display color="brand" />,
						}}
					/>
				</Display>
				<Text01S color="gray1" style={styles.introText}>
					{t('onboarding_profile1_text')}
				</Text01S>
			</Layout>
		);
	},
);

export const OfflinePayments = ({
	navigation,
}: RootStackScreenProps<'Profile'>): ReactElement => {
	const { t } = useTranslation('slashtags');
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
			illustration={coinsImageSrc}
			nextStep="Done"
			buttonText={t('profile_save')}
			header={t('profile_pay_contacts')}
			onNext={savePaymentConfig}>
			<Display>
				<Trans
					t={t}
					i18nKey="onboarding_profile2_header"
					components={{
						brand: <Display color="brand" />,
					}}
				/>
			</Display>
			<Text01S color="gray1" style={styles.introText}>
				{t('onboarding_profile2_text')}
			</Text01S>

			<View style={styles.enableOfflineRow}>
				<SwitchRow
					isEnabled={enableOfflinePayments}
					showDivider={false}
					onPress={(): void => {
						updateSettings({ enableOfflinePayments: !enableOfflinePayments });
					}}>
					<Text01S>{t('offline_enable')}</Text01S>
				</SwitchRow>
				<Text02S color="gray1">{t('offline_enable_explain')}</Text02S>
			</View>
		</Layout>
	);
};

const Layout = memo(
	({
		navigation,
		illustration,
		nextStep,
		buttonText,
		header,
		children,
		onNext,
	}: {
		navigation: StackNavigationProp<RootStackParamList, 'Profile'>;
		illustration: ImageSourcePropType;
		nextStep: ISlashtags['onboardingProfileStep'];
		buttonText: string;
		header: string;
		children: ReactNode;
		onNext?: () => void;
	}): ReactElement => {
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
				<SafeAreaInset type="top" />
				<NavigationHeader
					title={header}
					displayBackButton={true}
					onClosePress={(): void => {
						navigation.navigate('Wallet');
					}}
				/>
				<DetectSwipe onSwipeLeft={onSwipeLeft}>
					<View style={styles.content}>
						<View style={imageContainerStyles}>
							<Image source={illustration} style={styles.image} />
						</View>
						<View style={styles.middleContainer}>{children}</View>
						<Button
							text={buttonText}
							size="large"
							onPress={(): void => {
								onNext?.();
								setOnboardingProfileStep(nextStep);
							}}
							testID="OnboardingContinue"
						/>
					</View>
				</DetectSwipe>
				<SafeAreaInset type="bottom" minPadding={16} />
			</GlowingBackground>
		);
	},
);

const styles = StyleSheet.create({
	content: {
		flex: 1,
		justifyContent: 'space-between',
		paddingHorizontal: 32,
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
