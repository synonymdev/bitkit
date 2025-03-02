import { useEffect, useState } from 'react';
import { appStatusSelector } from '../store/reselect/ui';
import { THealthState } from '../store/types/ui';
import { useAppSelector } from './redux';

// Give the app some time to initialize before showing the status
const INIT_DELAY = 5000;

export const useAppStatus = (): THealthState => {
	const [showStatus, setShowStatus] = useState(false);
	const appStatus = useAppSelector(appStatusSelector);

	useEffect(() => {
		const timer = setTimeout(() => {
			setShowStatus(true);
		}, INIT_DELAY);

		return () => clearTimeout(timer);
	}, []);

	// During initialization, return 'ready' instead of error
	if (!showStatus) {
		return 'ready';
	}

	return appStatus;
};
