import React, { ReactElement, ReactNode } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import Button from '../../components/Button';
import DetectSwipe from '../../components/DetectSwipe';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import { setWidgetsOnboarding } from '../../store/actions/widgets';
import { Display, Text01S } from '../../styles/text';
import type { WidgetsScreenProps } from '../../navigation/types';

const padlockImageSrc = require('../../assets/illustrations/padlock.png');
const puzzleImageSrc = require('../../assets/illustrations/puzzle.png');

export const GoodbyePasswords = ({
	navigation,
}: WidgetsScreenProps<'GoodbyePasswords'>): ReactElement => {
	const { t } = useTranslation('slashtags');

	return (
		<Layout
			navigation={navigation}
			illustration={padlockImageSrc}
			onNext={(): void => {
				navigation.navigate('HelloWidgets');
			}}>
			<Display>
				<Trans
					t={t}
					i18nKey="onboarding_widgets1_header"
					components={{
						brand: <Display color="brand" />,
					}}
				/>
			</Display>
			<Text01S color="gray1" style={styles.introText}>
				{t('onboarding_widgets1_text')}
			</Text01S>
		</Layout>
	);
};

export const HelloWidgets = ({
	navigation,
}: WidgetsScreenProps<'HelloWidgets'>): ReactElement => {
	const { t } = useTranslation('slashtags');

	return (
		<Layout
			navigation={navigation}
			illustration={puzzleImageSrc}
			onNext={(): void => {
				setWidgetsOnboarding(true);
				navigation.navigate('WidgetsSuggestions');
			}}>
			<Display>
				<Trans
					t={t}
					i18nKey="onboarding_widgets2_header"
					components={{
						brand: <Display color="brand" />,
					}}
				/>
			</Display>
			<Text01S color="gray1" style={styles.introText}>
				{t('onboarding_widgets2_text')}
			</Text01S>
		</Layout>
	);
};

const Layout = ({
	navigation,
	illustration,
	children,
	onNext,
}: {
	navigation:
		| WidgetsScreenProps<'GoodbyePasswords'>['navigation']
		| WidgetsScreenProps<'HelloWidgets'>['navigation'];
	illustration: ImageSourcePropType;
	children: ReactNode;
	onNext: () => void;
}): JSX.Element => {
	const { t } = useTranslation('slashtags');

	const onSwipeRight = (): void => {
		navigation.getParent()?.navigate('Wallet');
	};

	return (
		<GlowingBackground topLeft="brand">
			<SafeAreaInsets type="top" />
			<NavigationHeader
				displayBackButton={true}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<DetectSwipe onSwipeRight={onSwipeRight}>
				<View style={styles.content}>
					<View style={styles.imageContainer}>
						<Image source={illustration} style={styles.illustration} />
					</View>
					<View style={styles.middleContainer}>{children}</View>
					<Button
						text={t('continue')}
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
