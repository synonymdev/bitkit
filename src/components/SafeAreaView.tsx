import React, { memo, useMemo, ReactElement } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import {
	Edge,
	NativeSafeAreaViewProps,
	SafeAreaView as SafeAreaViewRN,
} from 'react-native-safe-area-context';
import { useAppSelector } from '../hooks/redux';
import { themeColorsSelector } from '../store/reselect/settings';

type SafeAreaViewProps = NativeSafeAreaViewProps & {
	style?: StyleProp<ViewStyle>;
};

const SafeAreaView = ({
	children,
	style,
	...props
}: SafeAreaViewProps): ReactElement => {
	const colors = useAppSelector(themeColorsSelector);

	const safeAreaStyles = useMemo(() => {
		return {
			backgroundColor: colors.background,
			...styles.container,
		};
	}, [colors.background]);

	const edges: readonly Edge[] = useMemo(() => ['top'], []);

	return (
		<SafeAreaViewRN style={[safeAreaStyles, style]} edges={edges} {...props}>
			{children}
		</SafeAreaViewRN>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

export default memo(SafeAreaView);
