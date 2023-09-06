import React, {
	memo,
	ReactElement,
	ReactNode,
	useCallback,
	useMemo,
	useState,
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
import { updateSettings } from '../../store/actions/settings';
import DetectSwipe from '../../components/DetectSwipe';
import type {
	RootStackParamList,
	RootStackScreenProps,
} from '../../navigation/types';
import { useScreenSize } from '../../hooks/screen';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../store/reselect/wallet';
import { updateSlashPayConfig2 } from '../../utils/slashtags2';

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
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const [enableOfflinePayments, setOfflinePayments] = useState(true);

	const savePaymentConfig = useCallback((): void => {
		updateSettings({ enableOfflinePayments });
		updateSlashPayConfig2({ selectedWallet, selectedNetwork });
	}, [enableOfflinePayments, selectedNetwork, selectedWallet]);

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
					components={{ brand: <Display color="brand" /> }}
				/>
			</Display>
			<Text01S color="gray1" style={styles.introText}>
				{t('onboarding_profile2_text')}
			</Text01S>

			<View style={styles.enableOfflineRow}>
				<SwitchRow
					isEnabled={enableOfflinePayments}
					showDivider={false}
					onPress={(): void => setOfflinePayments(!enableOfflinePayments)}>
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
