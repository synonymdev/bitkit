import React, { memo, ReactElement, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RouteProp } from '@react-navigation/native';
import Animated, { FadeOut } from 'react-native-reanimated';

import GlowingBackground from './GlowingBackground';
import Biometrics from './Biometrics';
import PinPad from './PinPad';
import Store from '../store/types';

type AuthCheckProps = {
	showBackNavigation?: boolean;
	showLogoOnPIN?: boolean;
	route?: RouteProp<{ params: { requirePin: boolean; onSuccess: () => void } }>;
	onSuccess?: () => void;
};

/**
 * This component checks if the user has enabled pin or biometrics and runs through each check as needed before proceeding.
 */
const AuthCheck = ({
	showBackNavigation = true,
	showLogoOnPIN = false,
	route,
	onSuccess,
}: AuthCheckProps): ReactElement => {
	const biometrics = useSelector((state: Store) => state.settings.biometrics);
	const [requireBiometrics, setRequireBiometrics] = useState(biometrics);

	const requirePin = route?.params?.requirePin ?? false;
	onSuccess = route?.params?.onSuccess ?? onSuccess;

	if (requireBiometrics && !requirePin) {
		return (
			<Animated.View style={StyleSheet.absoluteFillObject} exiting={FadeOut}>
				<GlowingBackground topLeft="brand">
					<Biometrics
						onSuccess={(): void => onSuccess?.()}
						onFailure={(): void => setRequireBiometrics(false)}
					/>
				</GlowingBackground>
			</Animated.View>
		);
	}

	return (
		<Animated.View style={StyleSheet.absoluteFillObject} exiting={FadeOut}>
			<PinPad
				showBackNavigation={showBackNavigation}
				showLogoOnPIN={showLogoOnPIN}
				onSuccess={(): void => onSuccess?.()}
			/>
		</Animated.View>
	);
};

export default memo(AuthCheck);
