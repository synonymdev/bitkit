import React, { memo, ReactElement } from 'react';
import {
	Modal,
	ModalProps,
	StyleSheet,
	Text,
	View,
	Platform,
	TouchableOpacity,
} from 'react-native';

import colors from '../styles/colors';

type DialogProps = ModalProps & {
	visible: boolean;
	title: string;
	description: string;
	cancelText?: string;
	confirmText?: string;
	onCancel?: () => void;
	onConfirm?: () => void;
};

const Dialog = ({
	visible,
	title,
	description,
	cancelText = 'No, Cancel',
	confirmText = 'Yes, Reset',
	onCancel,
	onConfirm,
	onRequestClose,
}: DialogProps): ReactElement => {
	return (
		<Modal
			animationType="fade"
			// on iOS transparent={true} leads to a bug
			// use it with presentationStyle="fullScreen" to get a black background
			// https://github.com/facebook/react-native/issues/34018
			transparent={true}
			presentationStyle="fullScreen"
			visible={visible}
			onRequestClose={onRequestClose}>
			<View style={styles.centeredView}>
				<View style={styles.view}>
					<View style={styles.text}>
						<Text style={styles.title}>{title}</Text>
						<Text style={styles.description}>{description}</Text>
					</View>
					<View style={styles.buttons}>
						{onCancel && (
							<TouchableOpacity
								style={[styles.button, styles.buttonLeft]}
								onPress={onCancel}>
								<Text style={styles.buttonText}>{cancelText}</Text>
							</TouchableOpacity>
						)}
						{onConfirm && (
							<TouchableOpacity style={styles.button} onPress={onConfirm}>
								<Text style={styles.buttonText}>{confirmText}</Text>
							</TouchableOpacity>
						)}
					</View>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	centeredView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	view: {
		backgroundColor: 'rgba(49, 49, 49, 1)',
		backdropFilter: 'blur(27.1828px)',
		alignItems: 'center',
		shadowColor: colors.black,
		color: colors.white,
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
		...Platform.select({
			ios: {
				borderRadius: 14,
				width: 270,
			},
			android: {
				width: '85%',
			},
		}),
	},
	text: {
		padding: 16,
		width: '100%',
	},
	title: {
		fontWeight: '600',
		fontSize: 17,
		lineHeight: 22,
		letterSpacing: -0.41,
		textTransform: 'capitalize',
		color: colors.white,
		marginBottom: 5,
		...Platform.select({
			ios: {
				textAlign: 'center',
			},
		}),
	},
	description: {
		fontWeight: '500',
		fontSize: 13,
		lineHeight: 18,
		letterSpacing: -0.08,
		color: colors.white,
		...Platform.select({
			ios: {
				textAlign: 'center',
			},
		}),
	},
	buttons: {
		...Platform.select({
			ios: {
				borderTopWidth: 1,
				borderColor: colors.gray3,
				flexDirection: 'row',
			},
			android: {
				width: '100%',
				flexDirection: 'row',
				justifyContent: 'flex-end',
				paddingHorizontal: 16,
			},
		}),
	},
	button: {
		...Platform.select({
			ios: {
				padding: 16,
				flex: 1,
			},
			android: {
				padding: 16,
			},
		}),
	},
	buttonLeft: {
		...Platform.select({
			ios: {
				borderRightWidth: 1,
				borderColor: colors.gray3,
			},
		}),
	},
	buttonText: {
		fontWeight: '400',
		fontSize: 17,
		lineHeight: 22,
		textAlign: 'center',
		letterSpacing: -0.41,
		textTransform: 'capitalize',
		color: colors.brand,
	},
});

export default memo(Dialog);
