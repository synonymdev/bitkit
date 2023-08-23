import React, { ReactElement, useEffect, useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
	Easing,
	cancelAnimation,
	runOnJS,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { Text01S, Text02M } from '../styles/text';
import { AnimatedView } from '../styles/components';
import SafeAreaInset from './SafeAreaInset';
import BottomSheetNavigationHeader from './BottomSheetNavigationHeader';
import GlowImage from './GlowImage';
import GradientView from './GradientView';
import { isLDKReadySelector } from '../store/reselect/ui';
import { __E2E__ } from '../constants/env';

const imageSrc = require('../assets/illustrations/lightning.png');

const LightningSyncing = ({
	style,
	title,
}: {
	style: ViewStyle;
	title: string;
}): ReactElement => {
	const { t } = useTranslation('lightning');
	const glowOpacity = useSharedValue(0.5);
	const rootOpacity = useSharedValue(1);
	const isLDKReady = useSelector(isLDKReadySelector);
	const [hidden, setHidden] = useState(isLDKReady);

	useEffect(() => {
		// ldk is ready and LightningSyncing is already hidden, do nothing
		if (isLDKReady && hidden) {
			return;
		}

		// ldk is ready, but LightningSyncing is not yet hidden, let's hide it
		if (isLDKReady && !hidden) {
			rootOpacity.value = withTiming(0, { duration: 200 }, () => {
				cancelAnimation(glowOpacity);
				runOnJS(() => setHidden(true));
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
			testID="LightningSyncing"
			style={[style, { opacity: rootOpacity }]}>
			<GradientView style={styles.gradient}>
				<BottomSheetNavigationHeader title={title} />
				<View style={styles.content}>
					<Text01S style={styles.description} color="gray1">
						{t('wait_text_top')}
					</Text01S>

					<Animated.View style={[styles.glow, { opacity: glowOpacity }]}>
						<GlowImage image={imageSrc} glowColor="purple" />
					</Animated.View>

					<View style={styles.bottomContainer}>
						<Text02M style={styles.bottom} color="white32">
							{t('wait_text_bottom')}
						</Text02M>
					</View>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</GradientView>
		</AnimatedView>
	);
};

const styles = StyleSheet.create({
	glow: {
		flex: 1,
	},
	gradient: {
		flex: 1,
	},
	content: {
		flex: 1,
		marginTop: 8,
		paddingHorizontal: 16,
	},
	description: {
		marginTop: 16,
		marginBottom: 16,
	},
	bottomContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
	},
	bottom: {
		marginVertical: 18,
	},
});

export default LightningSyncing;
