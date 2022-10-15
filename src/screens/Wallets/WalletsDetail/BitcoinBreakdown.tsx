import React, { memo, ReactElement, useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import {
	Caption13M,
	Text01M,
	View,
	TransferIcon,
	SavingsIcon,
	CoinsIcon,
} from '../../../styles/components';
import { useBalance } from '../../../hooks/wallet';
import Money from '../../../components/Money';
import { RootNavigationProp } from '../../../navigation/types';
import { getOpenChannels } from '../../../utils/lightning';

const NetworkRow = ({
	title,
	subtitle,
	color,
	icon,
	satoshis,
}: {
	title: string;
	subtitle: string;
	color: string;
	icon: ReactElement;
	satoshis: number;
}): ReactElement => {
	return (
		<View color="transparent" style={styles.networkRow}>
			<View color="transparent" style={styles.titleContainer}>
				<View style={[styles.networkIconContainer, { backgroundColor: color }]}>
					{icon}
				</View>
				<View color="transparent">
					<Text01M>{title}</Text01M>
					<Caption13M color="gray1">{subtitle}</Caption13M>
				</View>
			</View>
			<View color="transparent" style={styles.valueContainer}>
				<Money sats={satoshis} size="text01m" enableHide={true} />
				<Money
					sats={satoshis}
					enableHide={true}
					size="caption13M"
					showFiat={true}
					color="gray1"
				/>
			</View>
		</View>
	);
};

const BitcoinBreakdown = (): ReactElement => {
	const navigation = useNavigation<RootNavigationProp>();
	const { satoshis: onchain } = useBalance({ onchain: true });
	const { satoshis: lightning } = useBalance({ lightning: true });
	const [hasLighning, setHasLightning] = useState<boolean>(false);

	useEffect(() => {
		getOpenChannels({ fromStorage: true }).then((res) => {
			if (res.isOk() && res.value.length > 0) {
				setHasLightning(true);
			}
		});
	}, []);

	return (
		<View color="transparent" style={styles.container}>
			<NetworkRow
				title="Bitcoin Savings"
				subtitle="On-chain BTC"
				color="rgba(247, 147, 26, 0.16)"
				icon={<SavingsIcon color="orange" width={17} height={17} />}
				satoshis={onchain}
			/>
			<View color="transparent" style={styles.transferRow}>
				<View color="gray4" style={styles.line} />
				<TouchableOpacity
					onPress={(): void => {
						navigation.navigate('LightningRoot', {
							screen: hasLighning ? 'RebalanceSetup' : 'Introduction',
						});
					}}>
					<View style={styles.transferButton} color="white08">
						<TransferIcon height={13} color="white" />
					</View>
				</TouchableOpacity>
				<View color="gray4" style={styles.line} />
			</View>
			<NetworkRow
				title="Spending Balance"
				subtitle="Instant BTC"
				color="rgba(185, 92, 232, 0.16)"
				icon={<CoinsIcon color="purple" width={13} height={13} />}
				satoshis={lightning}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		display: 'flex',
	},
	networkRow: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	transferRow: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 16,
	},
	line: {
		flex: 1,
		height: 1,
	},
	networkIconContainer: {
		backgroundColor: 'rgba(185, 92, 232, 0.16)',
		borderRadius: 30,
		overflow: 'hidden',
		height: 32,
		width: 32,
		marginRight: 14,
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
	},
	transferButton: {
		paddingHorizontal: 15,
		height: 36,
		borderRadius: 34,
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginHorizontal: 16,
	},
	titleContainer: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
	},
	valueContainer: {
		display: 'flex',
		alignItems: 'flex-end',
	},
});

export default memo(BitcoinBreakdown);
