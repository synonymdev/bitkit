import React, { memo, ReactElement } from 'react';
import { Image, ImageSourcePropType, StyleSheet } from 'react-native';

import useColors from '../../hooks/colors';
import useDisplayValues from '../../hooks/displayValues';
import { TouchableOpacity } from '../../styles/components';
import { Subtitle } from '../../styles/text';
import { TPackages } from './CustomSetup';

const Barrel = ({
	active,
	id,
	amount,
	img,
	testID,
	onPress,
}: {
	active: boolean;
	id: TPackages['id'];
	amount: number;
	img: ImageSourcePropType;
	testID?: string;
	onPress: (id: TPackages['id']) => void;
}): ReactElement => {
	const colors = useColors();
	const dp = useDisplayValues(amount);

	return (
		<TouchableOpacity
			style={[styles.root, active && { borderColor: colors.purple }]}
			color="purple16"
			testID={testID}
			onPress={(): void => onPress(id)}>
			<Image style={styles.image} source={img} />
			<Subtitle style={styles.amount}>
				{dp.fiatSymbol} {dp.fiatWhole}
			</Subtitle>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		justifyContent: 'space-between',
		alignItems: 'center',
		marginHorizontal: 8,
		borderRadius: 8,
		borderWidth: 1,
	},
	image: {
		margin: 8,
		height: 100,
		width: 100,
		resizeMode: 'contain',
	},
	amount: {
		marginTop: 8,
		marginBottom: 16,
		textAlign: 'center',
	},
});

export default memo(Barrel);
