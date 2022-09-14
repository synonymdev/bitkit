import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import {
	BackIcon,
	PlusIcon,
	Subtitle,
	Title,
	TouchableOpacity,
	View,
	XIcon,
} from '../styles/components';

const BackButton = memo(
	({ onPress = (): null => null }: { onPress: Function }): ReactElement => {
		return (
			<TouchableOpacity onPress={onPress} style={styles.iconContainer}>
				<BackIcon width={20} height={20} />
			</TouchableOpacity>
		);
	},
);

const CloseButton = memo(
	({ onPress = (): null => null }: { onPress: Function }): ReactElement => {
		return (
			<TouchableOpacity onPress={onPress} style={styles.iconContainer}>
				<XIcon width={24} height={24} />
			</TouchableOpacity>
		);
	},
);

const AddButton = memo(
	({ onPress = (): null => null }: { onPress: Function }): ReactElement => {
		return (
			<TouchableOpacity onPress={onPress} style={styles.iconContainer}>
				<PlusIcon width={24} height={24} />
			</TouchableOpacity>
		);
	},
);

export type NavigationHeaderProps = {
	title?: string;
	displayBackButton?: boolean;
	navigateBack?: boolean;
	size?: 'lg' | 'sm';
	style?: StyleProp<ViewStyle>;
	onBackPress?: Function;
	onClosePress?: Function;
	onAddPress?: Function;
};

const NavigationHeader = ({
	title = ' ',
	displayBackButton = true,
	onBackPress = (): null => null,
	navigateBack = true,
	size = 'lg',
	onClosePress,
	onAddPress,
	style,
}: NavigationHeaderProps): ReactElement => {
	const navigation = useNavigation<any>();

	const handleBackPress = useCallback(() => {
		onBackPress();
		if (navigateBack) {
			navigation.goBack();
		}
		//eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const Text = useMemo(() => (size === 'lg' ? Title : Subtitle), [size]);
	const container = useMemo(
		() => [
			styles.container,
			size === 'lg'
				? { marginTop: 17, marginBottom: 20 }
				: { marginTop: 2, marginBottom: 10 },
		],
		[size],
	);

	return (
		<View style={[container, style]}>
			<View style={styles.leftColumn}>
				{displayBackButton && <BackButton onPress={handleBackPress} />}
			</View>
			<View style={styles.middleColumn}>
				<Text style={styles.title}>{title}</Text>
			</View>
			<View style={styles.rightColumn}>
				{onClosePress && <CloseButton onPress={onClosePress} />}
				{onAddPress && <AddButton onPress={onAddPress} />}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		backgroundColor: 'transparent',
	},
	leftColumn: {
		width: 50,
		justifyContent: 'center',
		backgroundColor: 'transparent',
		left: 15,
	},
	middleColumn: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	rightColumn: {
		width: 50,
		justifyContent: 'center',
		alignItems: 'flex-end',
		backgroundColor: 'transparent',
		right: 15,
	},
	title: {
		textAlign: 'center',
	},
	iconContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
});

export default memo(NavigationHeader);
