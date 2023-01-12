import React, { ReactElement } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SafeAreaInset = ({
	type,
	maxPaddingTop,
	maxPaddingBottom,
}: {
	type: 'top' | 'bottom';
	maxPaddingTop?: number;
	maxPaddingBottom?: number;
}): ReactElement => {
	const insets = useSafeAreaInsets();

	let paddingTop = 0;
	let paddingBottom = 0;

	if (type === 'top') {
		paddingTop = Math.max(insets.top, maxPaddingTop || 0);
	}

	if (type === 'bottom') {
		paddingBottom = Math.max(insets.bottom, maxPaddingBottom || 0);
	}

	return <View style={{ paddingTop, paddingBottom }} />;
};

export default SafeAreaInset;
