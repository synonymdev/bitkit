import React, { ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Checkmark } from '../../../styles/icons';
import { BodySSB } from '../../../styles/text';
import Divider from '../../Divider';

type ItemProps = {
	title: string | ReactElement;
	value?: string | ReactElement;
	isChecked: boolean;
	testID: string;
	onToggle: () => void;
};

const Item = ({
	title,
	value,
	isChecked,
	testID,
	onToggle,
}: ItemProps): ReactElement => (
	<Pressable testID={testID} onPress={onToggle}>
		<View style={styles.row}>
			<View style={styles.rowLeft}>
				{typeof title === 'string' ? (
					<BodySSB color="secondary">{title}</BodySSB>
				) : (
					title
				)}
			</View>
			{value && (
				<View style={styles.rowRight}>
					{typeof value === 'string' ? (
						<BodySSB numberOfLines={1} ellipsizeMode="middle">
							{value}
						</BodySSB>
					) : (
						value
					)}
				</View>
			)}
			<Checkmark
				style={styles.checkmark}
				color={isChecked ? 'brand' : 'gray3'}
				height={30}
				width={30}
			/>
		</View>
		<Divider />
	</Pressable>
);

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	rowLeft: {
		flex: 1,
	},
	rowRight: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
	},
	checkmark: {
		marginLeft: 16,
	},
});

export default Item;
