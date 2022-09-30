import React, { memo, ReactElement, useMemo } from 'react';
import {
	StyleSheet,
	View,
	useWindowDimensions,
	TouchableOpacity,
} from 'react-native';

import { Headline, XIcon } from '../../styles/components';
import { updateSettings } from '../../store/actions/settings';
import Arrow from '../../assets/dotted-arrow.svg';

const EmptyWallet = (): ReactElement => {
	const { height } = useWindowDimensions();
	const [root, arrowContainer, arrow] = useMemo(() => {
		return [
			[styles.root, { marginTop: height * 0.17 }],
			[styles.arrowContainer, { marginTop: height * 0.04 }],
			{ maxHeight: height * 0.28 },
		];
	}, [height]);

	const handleHide = (): void => {
		updateSettings({ hideOnboardingMessage: true });
	};

	return (
		<View style={root}>
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
		flex: 6,
	},
	spaceRight: {
		flex: 3,
	},
});

export default memo(EmptyWallet);
