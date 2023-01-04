/**
 * @format
 * @flow strict-local
 */
import React, { ReactElement } from 'react';
import { StyleSheet, ScrollView, Share } from 'react-native';
import { View } from '../styles/components';
import { Text } from '../styles/text';
import Button from './Button';

let scrollView;

const onSharePress = ({
	title = 'bitkit-lightning-logs',
	message = '',
}): void => {
	try {
		Share.share(
			{
				message,
				title,
			},
			{
				dialogTitle: title,
			},
		);
	} catch {}
};

interface ILogBox {
	data: string[];
}

const LogBox = ({ data = [] }: ILogBox): ReactElement => {
	return (
		<View type="transparent" style={styles.logBoxContainer}>
			<ScrollView
				ref={(ref): ScrollView | null => (scrollView = ref)}
				onContentSizeChange={(): void => {
					try {
						scrollView.scrollToEnd({ animated: true });
					} catch {}
				}}
				contentContainerStyle={styles.logBox}>
				{data.map((line, index) => (
					<Text color={'logText'} key={index} style={styles.logBoxText}>
						{line}
					</Text>
				))}
				<View style={styles.listFooter} />
			</ScrollView>
			<Button
				style={styles.shareButton}
				text="Share"
				onPress={(): void => onSharePress({ message: data.join('\n') })}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	logBoxContainer: {
		flex: 1,
	},
	logBox: {
		alignItems: 'flex-start',
		justifyContent: 'flex-end',
		marginHorizontal: 10,
		paddingBottom: 10,
	},
	logBoxText: {
		textAlign: 'left',
		fontSize: 12,
	},
	shareButton: {
		position: 'absolute',
		bottom: 0,
		padding: 8,
	},
	listFooter: {
		height: 100,
	},
});

export default LogBox;
