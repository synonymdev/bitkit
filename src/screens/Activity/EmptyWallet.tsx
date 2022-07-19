import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { Headline } from '../../styles/components';
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

	return (
		<View style={root}>
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
