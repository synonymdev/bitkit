import React, { memo, ReactElement, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
	StyleSheet,
	View,
	useWindowDimensions,
	TouchableOpacity,
} from 'react-native';

import { Headline } from '../../styles/text';
import { XIcon } from '../../styles/icons';
import { updateSettings } from '../../store/actions/settings';
import Arrow from '../../assets/dotted-arrow.svg';

const EmptyWallet = (): ReactElement => {
	const { height } = useWindowDimensions();
	const insets = useSafeAreaInsets();

	const [root, arrowContainer, arrow] = useMemo(() => {
		return [
			[styles.root, { marginBottom: 110 + insets.bottom }],
			[styles.arrowContainer, { marginTop: height * 0.04 }],
			{ maxHeight: height * 0.28 },
		];
	}, [height, insets.bottom]);

	const handleHide = (): void => {
		updateSettings({ hideOnboardingMessage: true });
	};

	return (
		<View style={root} testID="TestToGetStarted">
			<TouchableOpacity style={styles.closeButton} onPress={handleHide}>
				<XIcon color="gray1" width={16} height={16} />
			</TouchableOpacity>

			<Headline>
				To get started send <Headline color="brand">Bitcoin</Headline> to your
				wallet.
			</Headline>

			<View style={arrowContainer}>
				<View style={styles.spaceLeft} />
				<Arrow style={arrow} />
				<View style={styles.spaceRight} />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		paddingHorizontal: 16,
		position: 'relative',
		marginTop: 'auto',
	},
	closeButton: {
		height: 30,
		width: 30,
		alignItems: 'center',
		justifyContent: 'center',
		position: 'absolute',
		top: -10,
		right: 10,
		zIndex: 1,
	},
	arrowContainer: {
		flexDirection: 'row',
	},
	spaceLeft: {
		flex: 7,
	},
	spaceRight: {
		flex: 3,
	},
});

export default memo(EmptyWallet);
