import { useMemo } from 'react';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

export const useScreenSize = (): { isSmallScreen: boolean } => {
	const { height } = useSafeAreaFrame();

	const isSmallScreen = useMemo(() => {
		if (height > 812) {
			// iPhone 11 Pro and larger
			return false;
		} else {
			// iPhone SE and smaller
			return true;
		}
	}, [height]);

	return { isSmallScreen };
};
