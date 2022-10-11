import React, { memo, ReactElement, useState } from 'react';
import { RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import PinPad from './PinPad';
import Biometrics from './Biometrics';
import Store from '../store/types';

export interface IAuthCheck {
	children?: ReactElement;
	onSuccess?: Function;
	onFailure?: Function;
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
	onSuccess = (): null => null,
	onFailure = (): null => null,
	showLogoOnPIN = false,
	showBackNavigation = true,
	route,
}: IAuthCheckParams): ReactElement => {
	const pin = useSelector((state: Store) => state.settings.pin);
	const biometrics = useSelector((state: Store) => state.settings.biometrics);

	const [displayPin, setDisplayPin] = useState(pin);
	const [displayBiometrics, setDisplayBiometrics] = useState(biometrics);
	const [authCheckParams] = useState<IAuthCheck>({
		onSuccess: route?.params?.onSuccess ?? onSuccess,
		onFailure: route?.params?.onFailure ?? onFailure,
		showLogoOnPIN: route?.params?.showLogoOnPIN ?? showLogoOnPIN,
	});

	if (displayPin && displayBiometrics) {
		return (
			<Biometrics
				onSuccess={(): void => {
					setDisplayBiometrics(false);
					setDisplayPin(false);
					authCheckParams?.onSuccess?.();
				}}
				onFailure={(): void => {
					setDisplayBiometrics(false);
				}}
			/>
		);
	}

	if (displayPin) {
		return (
			<PinPad
				showBackNavigation={showBackNavigation}
				showLogoOnPIN={showLogoOnPIN}
				onSuccess={(): void => {
					setDisplayPin(false);
					authCheckParams?.onSuccess?.();
				}}
			/>
		);
	}

	return children;
};

export default memo(AuthCheck);
