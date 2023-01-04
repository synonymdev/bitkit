import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { View } from '../../../styles/components';
import { Text } from '../../../styles/text';

const Summary = ({
	leftText = ' ',
	rightText = ' ',
}: {
	leftText: string;
	rightText: string;
}): ReactElement => {
	return (
		<View color="transparent" style={styles.summaryContainer}>
			<View color="transparent" style={styles.row}>
				<View color="transparent" style={styles.summaryLeft}>
					<Text>{leftText}</Text>
				</View>
				<View color="transparent" style={styles.summaryRight}>
					<Text>{rightText}</Text>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		justifyContent: 'space-evenly',
	},
	summaryContainer: {
		marginVertical: 5,
	},
	summaryLeft: {
		flex: 1,
		alignItems: 'flex-end',
		marginRight: 10,
	},
	summaryRight: {
		flex: 1,
		alignItems: 'flex-start',
		marginLeft: 10,
	},
});

export default Summary;
