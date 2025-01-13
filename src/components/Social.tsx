import React, { ReactElement } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
	DiscordIcon,
	GithubIcon,
	GlobeIcon,
	MediumIcon,
	TelegramIcon,
	TwitterIcon,
} from '../styles/icons';
import { openAppURL } from '../utils/helpers';
import Button from './buttons/Button';

const Social = ({ style }: { style?: StyleProp<ViewStyle> }): ReactElement => {
	return (
		<View style={[styles.root, style]}>
			<Button
				style={styles.socialLink}
				icon={<GlobeIcon color="white" height={24} width={24} />}
				onPress={(): void => {
					openAppURL('https://www.bitkit.to');
				}}
			/>
			<Button
				style={styles.socialLink}
				icon={<MediumIcon color="white" height={24} width={24} />}
				onPress={(): void => {
					openAppURL('https://www.medium.com/synonym-to');
				}}
			/>
			<Button
				style={styles.socialLink}
				icon={<TwitterIcon color="white" height={24} width={24} />}
				onPress={(): void => {
					openAppURL('https://www.twitter.com/bitkitwallet');
				}}
			/>
			<Button
				style={styles.socialLink}
				icon={<DiscordIcon color="white" height={24} width={24} />}
				onPress={(): void => {
					openAppURL('https://discord.gg/DxTBJXvJxn');
				}}
			/>
			<Button
				style={styles.socialLink}
				icon={<TelegramIcon color="white" height={24} width={24} />}
				onPress={(): void => {
					openAppURL('https://t.me/bitkitchat');
				}}
			/>
			<Button
				style={styles.socialLink}
				icon={<GithubIcon color="white" height={24} width={24} />}
				onPress={(): void => {
					openAppURL('https://www.github.com/synonymdev');
				}}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	socialLink: {
		height: 48,
		width: 48,
	},
});

export default Social;
