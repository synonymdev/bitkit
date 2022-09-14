import React, { memo, ReactElement } from 'react';
import {
	Modal,
	ModalProps,
	StyleSheet,
	Text,
	Pressable,
	View,
} from 'react-native';

import colors from '../styles/colors';

type DialogProps = ModalProps & {
	visible: boolean;
	title: string;
	description: string;
	onCancel?: () => void;
	onConfirm?: () => void;
};

const Dialog = ({
	visible,
	title,
	description,
	onCancel,
	onConfirm,
	onRequestClose,
}: DialogProps): ReactElement => {
	return (
		<Modal
			animationType="slide"
			transparent={true}
			visible={visible}
			onRequestClose={onRequestClose}>
			<View style={styles.centeredView}>
				<View style={styles.view}>
					<View style={styles.text}>
						<Text style={styles.title}>{title}</Text>
						<Text style={styles.description}>{description}</Text>
					</View>
					<View style={styles.buttons}>
						<Pressable
							style={[styles.button, styles.buttonLeft]}
							onPress={onCancel}>
							<Text style={styles.buttonText}>No, Cancel</Text>
						</Pressable>
						<Pressable style={styles.button} onPress={onConfirm}>
							<Text style={styles.buttonText}>Yes, Reset</Text>
						</Pressable>
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
		marginTop: 22,
	},
	view: {
		margin: 20,
		width: 270,
		backgroundColor: 'rgba(49, 49, 49, 1)',
		backdropFilter: 'blur(27.1828px)',
		borderRadius: 14,
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
	},
	text: {
		padding: 16,
	},
	title: {
		fontWeight: '600',
		fontSize: 17,
		lineHeight: 22,
		textAlign: 'center',
		letterSpacing: -0.41,
		textTransform: 'capitalize',
		color: colors.white,
		marginBottom: 5,
	},
	description: {
		fontWeight: '500',
		fontSize: 13,
		lineHeight: 18,
		letterSpacing: -0.08,
		textAlign: 'center',
		color: colors.white,
	},
	buttons: {
		flexDirection: 'row',
	},
	button: {
		borderTopWidth: 1,
		borderColor: colors.gray3,
		padding: 16,
		flex: 1,
	},
	buttonLeft: {
		borderRightWidth: 1,
		borderColor: colors.gray3,
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
