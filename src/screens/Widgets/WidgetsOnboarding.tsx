import React, { ReactElement, ReactNode } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import Button from '../../components/Button';
import DetectSwipe from '../../components/DetectSwipe';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import { setWidgetsOnboarding } from '../../store/actions/widgets';
import { Display, Text01S } from '../../styles/text';
import type { RootStackScreenProps } from '../../navigation/types';

const padlockImageSrc = require('../../assets/illustrations/padlock.png');
const puzzleImageSrc = require('../../assets/illustrations/puzzle.png');

export const GoodbyePasswords = ({
	navigation,
}: RootStackScreenProps<'GoodbyePasswords'>): ReactElement => {
	const { t } = useTranslation('slashtags');

	return (
		<Layout
			navigation={navigation}
			illustration={padlockImageSrc}
			screenIndex={0}
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
}: RootStackScreenProps<'HelloWidgets'>): ReactElement => {
	const { t } = useTranslation('slashtags');

	return (
		<Layout
			navigation={navigation}
			illustration={puzzleImageSrc}
			screenIndex={1}
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
	screenIndex,
	illustration,
	children,
	onNext,
}: {
	navigation:
		| RootStackScreenProps<'GoodbyePasswords'>['navigation']
		| RootStackScreenProps<'HelloWidgets'>['navigation'];
	screenIndex: number;
	illustration: ImageSourcePropType;
	children: ReactNode;
	onNext: () => void;
}): ReactElement => {
	const { t } = useTranslation('slashtags');

	const onSwipeRight = (): void => {
		navigation.getParent()?.navigate('Wallet');
	};

	return (
		<GlowingBackground topLeft="brand">
			<SafeAreaInset type="top" />
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
					<View style={styles.buttonContainer}>
						<Button
							style={styles.button}
							text={t('continue')}
							size="large"
							testID={`ContinueWidgets-${screenIndex}`}
							onPress={onNext}
						/>
					</View>
				</View>
			</DetectSwipe>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
		justifyContent: 'space-between',
		paddingHorizontal: 32,
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
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
	},
});
