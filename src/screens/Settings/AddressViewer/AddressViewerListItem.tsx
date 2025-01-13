import { IAddress } from 'beignet';
import React, { ReactElement } from 'react';
import { StyleSheet, TextInputProps, View } from 'react-native';
import { TouchableOpacity } from '../../../styles/components';
import { Checkmark } from '../../../styles/icons';
import { BodyMSB, Subtitle } from '../../../styles/text';
import { IThemeColors } from '../../../styles/themes';

type ListItemProps = TextInputProps & {
	item: IAddress;
	balance: number;
	isSelected: boolean;
	onCheckMarkPress: () => void;
	onItemRowPress: () => void;
	backgroundColor: keyof IThemeColors;
};

const AddressViewerListItem = (props: ListItemProps): ReactElement => {
	const {
		item,
		balance,
		isSelected,
		onCheckMarkPress,
		onItemRowPress,
		backgroundColor,
	} = props;
	return (
		<TouchableOpacity
			style={styles.listContent}
			activeOpacity={0.7}
			color={backgroundColor}
			onPress={onItemRowPress}>
			<View style={styles.contentRow}>
				<View style={styles.container}>
					<BodyMSB
						color="white80"
						numberOfLines={1}
						ellipsizeMode="middle"
						testID={`Address-${item.index}`}>
						{item.index}: {item.address}
					</BodyMSB>
				</View>
				{balance >= 0 && (
					<View style={styles.balanceRow}>
						<Subtitle style={styles.balance} color="white80">
							{balance} sats
						</Subtitle>
						<TouchableOpacity
							style={styles.checkmark}
							activeOpacity={0.7}
							onPress={onCheckMarkPress}>
							{balance > 0 && (
								<Checkmark
									color={isSelected ? 'brand' : 'gray3'}
									height={30}
									width={30}
								/>
							)}
						</TouchableOpacity>
					</View>
				)}
			</View>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	listContent: {
		paddingVertical: 10,
	},
	balance: {
		marginRight: 10,
	},
	contentRow: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 5,
	},
	checkmark: {
		borderRadius: 100,
	},
	balanceRow: {
		flexDirection: 'row',
		alignItems: 'center',
		flexGrow: 0,
		marginLeft: 20,
	},
});

export default AddressViewerListItem;
