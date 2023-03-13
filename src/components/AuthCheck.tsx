import React, { memo, ReactElement, useState } from 'react';
import { RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import GlowingBackground from './GlowingBackground';
import Biometrics from './Biometrics';
import PinPad from './PinPad';
import Store from '../store/types';

export interface IAuthCheck {
	children?: ReactElement;
	requirePin?: boolean;
	onSuccess?: () => void;
	onFailure?: () => void;
	showLogoOnPIN?: boolean;
	showBackNavigation?: boolean;
}
export interface IAuthCheckParams extends IAuthCheck {
	route?: RouteProp<{ params: IAuthCheck }, 'params'>;
}

/**
 * This component checks if the user has enabled pin or biometrics and runs through each check as needed before proceeding.
 * @param {ReactElement} children
 * @param {Function} onSuccess
 * @param {Function} onFailure
 * @param {RouteProp<{ params: IAuthCheck }, 'params'>} route
 */
const AuthCheck = ({
	children = <></>,
	requirePin,
	onSuccess,
	onFailure,
	showLogoOnPIN = false,
	showBackNavigation = true,
	route,
}: IAuthCheckParams): ReactElement => {
	const pin = useSelector((state: Store) => state.settings.pin);
	const biometrics = useSelector((state: Store) => state.settings.biometrics);

	const [displayPin, setDisplayPin] = useState(pin);
	const [displayBiometrics, setDisplayBiometrics] = useState(biometrics);
	const [authCheckParams] = useState<IAuthCheck>({
		requirePin: route?.params?.requirePin ?? requirePin,
		onSuccess: route?.params?.onSuccess ?? onSuccess,
		onFailure: route?.params?.onFailure ?? onFailure,
		showLogoOnPIN: route?.params?.showLogoOnPIN ?? showLogoOnPIN,
	});

	if (displayPin && displayBiometrics && !authCheckParams.requirePin) {
		return (
			<GlowingBackground topLeft="brand">
				<Biometrics
					onSuccess={(): void => {
						authCheckParams.onSuccess?.();
					}}
					onFailure={(): void => {
						setDisplayBiometrics(false);
					}}
				/>
			</GlowingBackground>
		);
	}

	if (displayPin) {
		return (
			<PinPad
				showBackNavigation={showBackNavigation}
				showLogoOnPIN={showLogoOnPIN}
				onSuccess={(): void => {
					setDisplayPin(false);
					authCheckParams.onSuccess?.();
				}}
			/>
		);
	}

	return children;
};

export default memo(AuthCheck);
