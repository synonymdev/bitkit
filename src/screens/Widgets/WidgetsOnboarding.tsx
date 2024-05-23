import React, { ReactElement, ReactNode } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../styles/components';
import { Display, BodyM } from '../../styles/text';
import Button from '../../components/Button';
import DetectSwipe from '../../components/DetectSwipe';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import { useAppDispatch } from '../../hooks/redux';
import { setWidgetsOnboarding } from '../../store/slices/widgets';
import type { RootStackScreenProps } from '../../navigation/types';

const puzzleImageSrc = require('../../assets/illustrations/puzzle.png');
const padlockImageSrc = require('../../assets/illustrations/padlock.png');

export const HelloWidgets = ({
	navigation,
}: RootStackScreenProps<'HelloWidgets'>): ReactElement => {
	const { t } = useTranslation('slashtags');
	const dispatch = useAppDispatch();

	return (
		<Layout
			navigation={navigation}
			image={puzzleImageSrc}
			screenIndex={0}
			onNext={(): void => {
				dispatch(setWidgetsOnboarding(true));
				navigation.navigate('GoodbyePasswords');
			}}>
			<Display>
				<Trans
					t={t}
					i18nKey="onboarding_widgets2_header"
					components={{ accent: <Display color="brand" /> }}
				/>
			</Display>
			<BodyM style={styles.introText} color="secondary">
				{t('onboarding_widgets2_text')}
			</BodyM>
		</Layout>
	);
};

export const GoodbyePasswords = ({
	navigation,
}: RootStackScreenProps<'GoodbyePasswords'>): ReactElement => {
	const { t } = useTranslation('slashtags');

	return (
		<Layout
			navigation={navigation}
			image={padlockImageSrc}
			screenIndex={1}
			onNext={(): void => {
				navigation.navigate('WidgetsSuggestions');
			}}>
			<Display>
				<Trans
					t={t}
					i18nKey="onboarding_widgets1_header"
					components={{ accent: <Display color="brand" /> }}
				/>
			</Display>
			<BodyM style={styles.introText} color="secondary">
				{t('onboarding_widgets1_text')}
			</BodyM>
		</Layout>
	);
};

const Layout = ({
	navigation,
	screenIndex,
	image,
	children,
	onNext,
}: {
	navigation:
		| RootStackScreenProps<'HelloWidgets'>['navigation']
		| RootStackScreenProps<'GoodbyePasswords'>['navigation'];
	screenIndex: number;
	image: ImageSourcePropType;
	children: ReactNode;
	onNext: () => void;
}): ReactElement => {
	const { t } = useTranslation('slashtags');

	const onSwipeRight = (): void => {
		navigation.getParent()?.navigate('Wallet');
	};

	return (
		<ThemedView style={styles.root}>
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
						<Image source={image} style={styles.image} />
					</View>
					{children}
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
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		justifyContent: 'space-between',
		paddingHorizontal: 32,
	},
	imageContainer: {
		flexShrink: 1,
		alignItems: 'center',
		alignSelf: 'center',
		width: '100%',
		aspectRatio: 1,
		marginTop: 'auto',
		marginBottom: 48,
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	introText: {
		marginTop: 4,
	},
	buttonContainer: {
		flexDirection: 'row',
		marginTop: 32,
	},
	button: {
		flex: 1,
	},
});
