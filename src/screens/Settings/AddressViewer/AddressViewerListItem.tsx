import React, { ReactElement } from 'react';
import { StyleSheet, TextInputProps, View } from 'react-native';
import { IAddress } from '../../../store/types/wallet';
import { TouchableOpacity } from '../../../styles/components';
import { Subtitle, Text01M } from '../../../styles/text';
import { Checkmark } from '../../../styles/icons';
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
			color={backgroundColor}
			onPress={onItemRowPress}>
			<View style={styles.contentRow}>
				<View style={styles.container}>
					<Text01M
						color={'white8'}
						numberOfLines={1}
						ellipsizeMode="middle"
						testID={`Address-${item.index}`}>
						{item.index}: {item.address}
					</Text01M>
				</View>
				{balance >= 0 && (
					<View style={styles.balanceRow}>
						<Subtitle style={styles.balance} color={'white8'}>
							{balance} sats
						</Subtitle>
						<TouchableOpacity
							style={styles.checkmark}
							onPress={onCheckMarkPress}>
							{balance > 0 && (
								<Checkmark
									color={isSelected ? 'brand' : 'gray4'}
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
