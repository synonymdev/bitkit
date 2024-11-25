import React, { ReactElement, useEffect, useState } from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
	Easing,
	cancelAnimation,
	runOnJS,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { BodyM, BodySSB } from '../styles/text';
import { AnimatedView } from '../styles/components';
import SafeAreaInset from './SafeAreaInset';
import BottomSheetNavigationHeader from './BottomSheetNavigationHeader';
import GradientView from './GradientView';
import SyncSpinner from './SyncSpinner';
import { useAppSelector } from '../hooks/redux';
import { isLDKReadySelector } from '../store/reselect/ui';
import { __E2E__ } from '../constants/env';

const imageSrc = require('../assets/illustrations/lightning.png');

const LightningSyncing = ({
	title,
	style,
}: {
	title: string;
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const { t } = useTranslation('lightning');
	const glowOpacity = useSharedValue(0.5);
	const rootOpacity = useSharedValue(1);
	const isLDKReady = useAppSelector(isLDKReadySelector);
	const [hidden, setHidden] = useState(isLDKReady);

	useEffect(() => {
		// LDK is ready and LightningSyncing is already hidden, do nothing
		if (isLDKReady && hidden) {
			return;
		}

		// LDK is ready, but LightningSyncing is not yet hidden, let's hide it
		if (isLDKReady && !hidden) {
			rootOpacity.value = withTiming(0, { duration: 200 }, () => {
				cancelAnimation(glowOpacity);
				runOnJS(setHidden)(true);
			});
		}

		// if LightningSyncing is already hidden, do nothing
		if (hidden || __E2E__) {
			return;
		}

		// run glowing animation
		glowOpacity.value = withRepeat(
			withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.quad) }),
			-1,
			true,
		);
	}, [isLDKReady, hidden, glowOpacity, rootOpacity]);

	if (hidden) {
		return <></>;
	}

	return (
		<AnimatedView
			style={[style, { opacity: rootOpacity }]}
			testID="LightningSyncing">
			<GradientView style={styles.root}>
				<BottomSheetNavigationHeader title={title} />
				<View style={styles.content}>
					<BodyM color="secondary">{t('wait_text_top')}</BodyM>

					<View style={styles.imageContainer}>
						<SyncSpinner />
						<Image style={styles.image} source={imageSrc} />
					</View>

					<BodySSB style={styles.bottom} color="white32">
						{t('wait_text_bottom')}
					</BodySSB>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</GradientView>
		</AnimatedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	imageContainer: {
		flexShrink: 1,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		width: 256,
		aspectRatio: 1,
		marginTop: 'auto',
		position: 'relative',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	bottom: {
		textAlign: 'center',
		marginTop: 'auto',
		marginBottom: 16,
	},
});

export default LightningSyncing;
