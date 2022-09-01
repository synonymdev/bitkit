import React, {
	ReactElement,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import {
	ActivityIndicator,
	Alert,
	Linking,
	ScrollView,
	StyleSheet,
	View,
} from 'react-native';
import {
	Canvas,
	Path,
	RadialGradient,
	Rect,
	Skia,
	vec,
} from '@shopify/react-native-skia';
import { useSelector } from 'react-redux';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
	Caption13M,
	Caption13Up,
	CheckCircleIcon,
	ClockIcon,
	GitBranchIcon,
	ReceiveIcon,
	SendIcon,
	TagIcon,
	Text02M,
	TimerIconAlt,
	Title,
	UserPlusIcon,
	View as ThemedView,
} from '../../styles/components';
import Button from '../../components/Button';
import Money from '../../components/Money';
import NavigationHeader from '../../components/NavigationHeader';
import { EActivityTypes, IActivityItem } from '../../store/types/activity';
import {
	canBoost,
	getBlockExplorerLink,
} from '../../utils/wallet/transactions';
import useDisplayValues from '../../hooks/displayValues';
import SafeAreaView from '../../components/SafeAreaView';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import Tag from '../../components/Tag';
import useColors from '../../hooks/colors';
import Store from '../../store/types';
import { toggleView } from '../../store/actions/user';
import { deleteMetaTxTag } from '../../store/actions/metadata';
import { getTransactions } from '../../utils/wallet/electrum';
import { ITransaction, ITxHash } from '../../utils/wallet';
import type { RootStackParamList } from '../../navigation/types';

const Section = memo(
	({ title, value }: { title: string; value: React.ReactNode }) => {
		const { white1 } = useColors();

		return (
			<View style={[styles.sRoot, { borderBottomColor: white1 }]}>
				<View style={styles.sText}>
					<Caption13Up color="gray1">{title}</Caption13Up>
				</View>
				<View style={styles.sText}>{value}</View>
			</View>
		);
	},
);

const Glow = ({
	color,
	size,
}: {
	color: string;
	size: { width: number; height: number };
}): ReactElement => {
	return (
		<Rect x={0} y={0} width={size.width} height={size.height} opacity={0.3}>
			<RadialGradient c={vec(0, 100)} r={600} colors={[color, 'transparent']} />
		</Rect>
	);
};

const ZigZag = ({ color }): ReactElement => {
	const step = 12;
	let n = 0;
	const path = Skia.Path.Make();
	path.moveTo(0, 0);
	do {
		path.lineTo((n + 1) * step, step);
		path.lineTo((n + 2) * step, 0);
		n += 2;
	} while (n < 100);
	path.close();

	return <Path path={path} color={color} />;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ActivityDetail'>;

const emptyActivityItem: IActivityItem = {
	id: '',
	message: '',
	address: '',
	activityType: EActivityTypes.onChain,
	txType: 'sent',
	value: 0,
	confirmed: false,
	fee: 0,
	timestamp: 0,
};

const ActivityDetail = (props: Props): ReactElement => {
	const [item] = useState<IActivityItem>(
		props.route.params?.activityItem ?? emptyActivityItem,
	);
	const {
		id,
		message,
		activityType,
		txType,
		value,
		confirmed,
		timestamp,
		address,
	} = item;
	const tags =
		useSelector((store: Store) => store.metadata.tags[item.id]) ?? [];

	const [size, setSize] = useState({ width: 0, height: 0 });
	const [txDetails, setTxDetails] = useState<
		null | ITransaction<ITxHash>['result']
	>(null);
	const selectedNetwork = useSelector(
		(store: Store) => store.wallet.selectedNetwork,
	);

	const colors = useColors();
	const extended = props.route.params?.extended ?? false;

	const showBoost = useMemo(() => {
		if (confirmed) {
			return false;
		}
		if (activityType !== EActivityTypes.onChain) {
			return false;
		}
		return canBoost(id).canBoost;
	}, [confirmed, activityType, id]);

	const handleBoost = (): void => {
		toggleView({
			view: 'boostPrompt',
			data: { isOpen: true, activityItem: item },
		});
	};

	const handleTag = (): void => {
		toggleView({
			view: 'activityTagsPrompt',
			data: { isOpen: true, id: item.id },
		});
	};

	const handleLayout = (e): void => {
		const { height, width } = e.nativeEvent.layout;
		setSize((s) => (s.width === 0 ? { width, height } : s));
	};

	const handleTagClose = (tag: string): void => {
		const res = deleteMetaTxTag(id, tag);
		if (res.isErr()) {
			Alert.alert(res.error.message);
		}
	};

	useEffect(() => {
		if (txDetails || !extended) {
			return;
		}
		getTransactions({ txHashes: [{ tx_hash: id }], selectedNetwork }).then(
			(txResponse) => {
				if (txResponse.isErr()) {
					return Alert.alert(txResponse.error.message);
				}
				const txData: ITransaction<ITxHash>[] = txResponse.value.data;
				if (txData.length === 0) {
					return Alert.alert('tx not found');
				}
				const data = txData[0].result;
				setTxDetails(data);
			},
		);
	}, [id, activityType, extended, selectedNetwork, txDetails]);

	let status = '';
	if (value < 0) {
		if (confirmed) {
			status = 'Sent bitcoin';
		} else {
			status = 'Sending bitcoin...';
		}
	} else {
		if (confirmed) {
			status = 'Received bitcoin';
		} else {
			status = 'Receiving bitcoin...';
		}
	}

	let glowColor;

	switch (activityType) {
		case EActivityTypes.onChain:
			glowColor = 'brand';
			break;
		case EActivityTypes.lightning:
			glowColor = 'purple';
			break;
		case EActivityTypes.tether:
			glowColor = 'green';
			break;
	}

	glowColor = colors[glowColor] ?? glowColor;

	const { fiatSymbol } = useDisplayValues(1);

	const blockExplorerUrl =
		activityType === 'onChain' ? getBlockExplorerLink(id) : '';

	const handleBlockExplorerOpen = useCallback(async () => {
		if (await Linking.canOpenURL(blockExplorerUrl)) {
			await Linking.openURL(blockExplorerUrl);
		}
	}, [blockExplorerUrl]);

	return (
		<SafeAreaView onLayout={handleLayout}>
			<Canvas style={[styles.canvas, size]}>
				<Glow color={glowColor} size={size} />
			</Canvas>
			<NavigationHeader title={status} />
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}>
				<View style={styles.title}>
					<View style={styles.titleBlock}>
						<Money sats={value} highlight={true} sign={value > 0 ? '+' : '-'} />
					</View>

					<ThemedView
						color={txType === 'sent' ? 'red16' : 'green16'}
						style={styles.iconContainer}>
						{txType === 'sent' ? (
							<SendIcon height={19} color="red" />
						) : (
							<ReceiveIcon height={19} color="green" />
						)}
					</ThemedView>
				</View>

				<View style={styles.sectionContainer}>
					<Section
						title={`VALUE (${fiatSymbol})`}
						value={
							<Money
								sats={value}
								showFiat={true}
								size="text02m"
								color="white"
							/>
						}
					/>
					<Section
						title="STATUS"
						value={
							<View style={styles.confStatus}>
								{confirmed ? (
									<CheckCircleIcon color="green" style={styles.checkmarkIcon} />
								) : (
									<ClockIcon color="white" style={styles.checkmarkIcon} />
								)}
								<Text02M color={confirmed ? 'green' : 'white'}>
									{confirmed ? 'Confirmed' : 'Confirming'}
								</Text02M>
							</View>
						}
					/>
				</View>

				<View style={styles.sectionContainer}>
					<Section
						title="DATE"
						value={
							<Text02M>
								{new Date(timestamp).toLocaleString(undefined, {
									year: 'numeric',
									month: 'long',
									day: 'numeric',
								})}
							</Text02M>
						}
					/>
					<Section
						title="TIME"
						value={
							<Text02M>
								{new Date(timestamp).toLocaleString(undefined, {
									hour: 'numeric',
									minute: 'numeric',
									hour12: false,
								})}
							</Text02M>
						}
					/>
				</View>

				{!extended ? (
					<>
						{tags.length !== 0 && (
							<View style={styles.sectionContainer}>
								<Section
									title="TAGS"
									value={
										<View style={styles.tagsContainer}>
											{tags.map((tag) => (
												<Tag
													key={tag}
													value={tag}
													style={styles.tag}
													onClose={(): void => handleTagClose(tag)}
												/>
											))}
										</View>
									}
								/>
							</View>
						)}

						{message ? (
							<View>
								<Caption13M color="brand" style={styles.sText}>
									NOTE
								</Caption13M>
								<ThemedView color="gray5">
									<Canvas style={styles.zRoot}>
										<ZigZag color={colors.background} />
									</Canvas>

									<View style={styles.note}>
										<Title>{message}</Title>
									</View>
								</ThemedView>
							</View>
						) : null}

						<View>
							<View style={styles.sectionContainer}>
								<Button
									style={styles.button}
									text="Assign"
									icon={<UserPlusIcon height={16} width={16} color="brand" />}
									onPress={(): void => Alert.alert('TODO')}
								/>
								<Button
									style={styles.button}
									text="Tag"
									icon={<TagIcon height={16} width={16} color="brand" />}
									onPress={handleTag}
								/>
							</View>
							<View style={styles.sectionContainer}>
								<Button
									style={styles.button}
									text="Boost"
									icon={<TimerIconAlt color="brand" />}
									disabled={!showBoost}
									onPress={handleBoost}
								/>
								<Button
									style={styles.button}
									text="Explore"
									icon={<GitBranchIcon />}
									disabled={!blockExplorerUrl}
									onPress={handleBlockExplorerOpen}
								/>
							</View>
						</View>

						<View style={styles.buttonDetailsContainer}>
							<Button
								text="Transaction Details"
								size="large"
								onPress={(): void =>
									props.navigation.push('ActivityDetail', {
										extended: true,
										activityItem: props.route.params.activityItem,
									})
								}
							/>
						</View>
					</>
				) : (
					<>
						<View style={styles.sectionContainer}>
							<Section title="TRANSACTION ID" value={<Text02M>{id}</Text02M>} />
						</View>
						<View style={styles.sectionContainer}>
							<Section title="ADDRESS" value={<Text02M>{address}</Text02M>} />
						</View>
						{txDetails ? (
							<>
								<View style={styles.sectionContainer}>
									<Section
										title={`INPUTS (${txDetails.vin.length})`}
										value={txDetails.vin.map(({ txid, vout }) => {
											const i = txid + ':' + vout;
											return <Text02M key={i}>{i}</Text02M>;
										})}
									/>
								</View>
								<View style={styles.sectionContainer}>
									<Section
										title={`OUTPUTS (${txDetails.vout.length})`}
										value={txDetails.vout.map(({ scriptPubKey }) => {
											const i = scriptPubKey.address;
											return <Text02M key={i}>{i}</Text02M>;
										})}
									/>
								</View>
							</>
						) : (
							<ActivityIndicator size="small" />
						)}
						<View style={styles.buttonDetailsContainer}>
							<Button
								text="Open Block Explorer"
								size="large"
								disabled={!blockExplorerUrl}
								onPress={handleBlockExplorerOpen}
							/>
						</View>
					</>
				)}

				<SafeAreaInsets type="bottom" />
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	scrollContent: {
		paddingHorizontal: 16,
		flexGrow: 1,
		position: 'relative',
	},
	canvas: {
		position: 'absolute',
	},
	title: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginVertical: 32,
	},
	titleBlock: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingTop: 10,
	},
	iconContainer: {
		borderRadius: 30,
		overflow: 'hidden',
		height: 48,
		width: 48,
		justifyContent: 'center',
		alignItems: 'center',
	},
	confStatus: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	checkmarkIcon: {
		marginRight: 10,
	},
	sectionContainer: {
		marginHorizontal: -8,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	sRoot: {
		paddingBottom: 10,
		marginHorizontal: 8,
		marginBottom: 16,
		borderBottomWidth: 1,
		flex: 1,
	},
	sText: {
		marginBottom: 8,
	},
	note: {
		padding: 24,
	},
	buttonDetailsContainer: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	button: {
		marginHorizontal: 8,
		marginBottom: 16,
		flex: 1,
	},
	zRoot: {
		height: 12,
	},
	tagsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginBottom: -8,
	},
	tag: {
		marginRight: 8,
		marginBottom: 8,
	},
});

export default memo(ActivityDetail);
