import React, { ReactElement, memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { View as ThemedView, ScrollView } from '../../../styles/components';
import { Caption13Up, Caption13M, Text01M } from '../../../styles/text';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/Button';
import NavigationHeader from '../../../components/NavigationHeader';
// import LightningChannel from '../../../components/LightningChannel';
import Money from '../../../components/Money';
import { SettingsScreenProps } from '../../../navigation/types';
import { EUnit } from '../../../store/types/wallet';

const Section = ({
	name,
	value,
}: {
	name: string;
	value: ReactElement;
}): ReactElement => {
	return (
		<View style={styles.sectionRoot}>
			<Caption13M>{name}</Caption13M>
			{value}
		</View>
	);
};

const AddConnection = ({
	navigation,
}: SettingsScreenProps<'LightningAddConnection'>): ReactElement => {
	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title="Add new connection" />

			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.sectionTitle}>
					<Caption13Up color="gray1">New connection</Caption13Up>
				</View>
				<Text01M>LNBIG Lightning Node</Text01M>
				<View style={styles.channel}>
					{/* Example channel */}
					{/* <LightningChannel channelId="" /> */}
				</View>

				<View style={styles.sectionTitle}>
					<Caption13Up color="gray1">CONNECTION DETAILS</Caption13Up>
				</View>
				<Section
					name="Node ID"
					value={<Caption13M>0296b2db..d73bf5c9</Caption13M>}
				/>
				<Section
					name="Receiving capacity"
					value={
						<Money
							sats={100500}
							size="caption13M"
							symbol={true}
							color="white"
							unit={EUnit.satoshi}
						/>
					}
				/>
				<Section
					name="Spending balance"
					value={
						<Money
							sats={100500}
							size="caption13M"
							symbol={true}
							color="white"
							unit={EUnit.satoshi}
						/>
					}
				/>
				<Section
					name="Total channel size"
					value={
						<Money
							sats={100500}
							size="caption13M"
							symbol={true}
							color="white"
							unit={EUnit.satoshi}
						/>
					}
				/>
				<Section
					name="Network fee for setup"
					value={
						<Money
							sats={100500}
							size="caption13M"
							symbol={true}
							color="white"
							unit={EUnit.satoshi}
						/>
					}
				/>

				<View style={styles.buttons}>
					<Button
						style={styles.button}
						text="Open Connection"
						size="large"
						onPress={(): void =>
							navigation.navigate('LightningAddConnectionResult')
						}
					/>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</ScrollView>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		justifyContent: 'space-between',
	},
	content: {
		paddingHorizontal: 16,
		flexGrow: 1,
	},
	channel: {
		paddingTop: 16,
		paddingBottom: 32,
	},
	buttons: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	button: {
		marginTop: 8,
	},
	sectionTitle: {
		height: 50,
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	sectionRoot: {
		height: 50,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
});

export default memo(AddConnection);
