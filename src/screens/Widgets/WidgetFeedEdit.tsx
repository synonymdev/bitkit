import React, { useState, useMemo, useEffect, ReactElement } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import { SlashURL } from '@synonymdev/slashtags-sdk';

import {
	ScrollView,
	View as ThemedView,
	Caption13Up,
	CubeIcon,
	NewspaperIcon,
	ChartLineIcon,
	Headline,
	Text01S,
	Text02M,
	Checkmark,
} from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import Store from '../../store/types';
import { IWidget, SlashFeedJSON } from '../../store/types/widgets';
import { useSlashtagsSDK } from '../../components/SlashtagsProvider';
import { decodeJSON, readAsDataURL } from '../../utils/slashtags';
import { showErrorNotification } from '../../utils/notifications';
import ProfileImage from '../../components/ProfileImage';
import { deleteWidget, setFeedWidget } from '../../store/actions/widgets';
import {
	decodeWidgetFieldValue,
	SUPPORTED_FEED_TYPES,
} from '../../utils/widgets';
import Divider from '../../components/Divider';
import HourglassSpinner from '../../components/HourglassSpinner';
import { SlashtagURL } from '../../components/SlashtagURL';
import BitfinexWidget from '../../components/BitfinexWidget';
import HeadlinesWidget from '../../components/HeadlinesWidget';
import BlocksWidget from '../../components/BlocksWidget';
import FeedWidget from '../../components/FeedWidget';
import type { RootStackScreenProps } from '../../navigation/types';

export const WidgetFeedEdit = ({
	navigation,
	route,
}: RootStackScreenProps<'WidgetFeedEdit'>): ReactElement => {
	const { url } = route.params;
	const sdk = useSlashtagsSDK();

	const savedWidget: IWidget | undefined = useSelector((state: Store) => {
		return state.widgets.widgets[url];
	});

	const savedSelectedField = useMemo(() => {
		return savedWidget?.feed?.field?.name;
	}, [savedWidget]);

	const [fields, setFields] = useState<{ [label: string]: string }>({});
	const [isLoading, setIsLoading] = useState(false);
	const [config, setConfig] = useState<
		Partial<SlashFeedJSON> & { icon?: string }
	>(savedWidget?.feed);

	const [selectedField, setSelectedField] = useState(savedSelectedField);

	const resolving = useMemo(() => {
		return !config && !savedWidget;
	}, [config, savedWidget]);

	useEffect(() => {
		let unmounted = false;

		const parsed = SlashURL.parse(url);
		const key = parsed.key;
		const encryptionKey =
			typeof parsed.privateQuery.encryptionKey === 'string'
				? SlashURL.decode(parsed.privateQuery.encryptionKey)
				: undefined;

		const drive = sdk.drive(key, { encryptionKey });

		// TODO(slashtags): should not be needed after Hyperdrive actually support encryptionKey
		// Manually awaiting peers
		const done = drive.findingPeers();
		sdk.swarm.flush().then(done, done);

		drive
			.ready()
			.then(read)
			.catch((e: Error) => {
				showErrorNotification({
					title: 'Failed to open feed drive',
					message: e.message,
				});
			});

		function read(): void {
			setIsLoading(true);

			drive
				.get('/slashfeed.json')
				.then(decodeJSON)
				.then((_config: SlashFeedJSON) => {
					saveConfig(_config).catch(noop);

					// Save fields without values as soon as possible
					if (!unmounted) {
						setFields(
							Object.fromEntries(_config.fields.map((f) => [f.name, ''])),
						);
					}

					_config.fields.map((field) => {
						drive
							.get(field.main)
							.then((buf: Uint8Array) =>
								decodeWidgetFieldValue(_config.type, field, buf),
							)
							.then((val: any) =>
								setFields((f) => ({ ...f, [field.name]: val })),
							)
							.catch(noop);
					});

					if (!savedWidget) {
						// pre-select first option
						setSelectedField(_config.fields[0].name);
					}

					setIsLoading(false);
				})
				.catch((e: Error) => {
					setIsLoading(false);
					showErrorNotification({
						title: 'Could not resolve feed configuration file slashfeed.json',
						message: e.message,
					});
				});
		}

		async function saveConfig(_config: SlashFeedJSON): Promise<void> {
			let icon = _config.icons['32'] || Object.values(_config.icons)[0];

			if (icon.startsWith('/')) {
				icon = await readAsDataURL(drive, icon);
			}

			if (!unmounted) {
				setConfig({ ..._config, icon });
			}
		}

		function noop(): void {}

		return function cleanup() {
			unmounted = true;
		};
	}, [sdk, url, savedWidget]);

	const onSave = (): void => {
		if (config && selectedField !== savedSelectedField) {
			setFeedWidget(url, {
				name: config.name,
				type: config.type,
				description: config.description,
				icon: config.icon,
				field: config.fields?.find((f) => f.name === selectedField),
			} as IWidget['feed']);
		}

		navigation.navigate('Tabs');
	};

	const onDelete = (): void => {
		deleteWidget(url);
		navigation.navigate('Tabs');
	};

	const headerTitle = savedSelectedField ? 'Change Widget Feed' : 'Widget Feed';
	const buttonText = savedSelectedField ? 'Save' : 'Save Widget';
	const previewWidget = config?.fields && {
		feed: {
			name: config.name ?? '',
			description: config.description ?? '',
			icon: config.icon ?? '',
			type: config.type ?? '',
			field: config.fields.find((f) => f.name === selectedField)!,
		},
	};

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title={headerTitle}
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>

			{resolving ? (
				<HourglassSpinner />
			) : (
				<View style={styles.content}>
					<View style={styles.header}>
						<View style={styles.headerText}>
							<Headline>{config.name}</Headline>
							<SlashtagURL style={styles.url} url={url} />
						</View>
						<View style={styles.headerImage}>
							{((): ReactElement => {
								switch (config.type) {
									case SUPPORTED_FEED_TYPES.PRICE_FEED:
										return <ChartLineIcon width={64} height={64} />;
									case SUPPORTED_FEED_TYPES.HEADLINES_FEED:
										return <NewspaperIcon width={64} height={64} />;
									case SUPPORTED_FEED_TYPES.BLOCKS_FEED:
										return <CubeIcon width={64} height={64} />;
									default:
										return (
											<ProfileImage url={url} image={config.icon} size={32} />
										);
								}
							})()}
						</View>
					</View>

					{config.description && (
						<Text01S style={styles.description} color="gray1">
							{config.description}
						</Text01S>
					)}

					{Object.entries(fields).length > 1 && (
						<ScrollView>
							{isLoading && (
								<Text01S style={styles.loading} color="gray1">
									Loading widget options...
								</Text01S>
							)}

							{!isLoading && (
								<View style={styles.fields}>
									{Object.entries(fields).map(([label, value]) => (
										<Pressable
											key={label}
											onPress={(): void => setSelectedField(label)}>
											<Divider />
											<View style={styles.fieldContainer}>
												<View style={styles.fieldLeftContainer}>
													{typeof value === 'string' ? (
														<>
															<Caption13Up
																color="gray1"
																style={styles.fieldLabel}>
																{label}
															</Caption13Up>
															<Text02M style={styles.fieldValue}>
																{value}
															</Text02M>
														</>
													) : (
														<Text01S style={styles.fieldValue}>{label}</Text01S>
													)}
												</View>
												{selectedField === label && (
													<Checkmark color="brand" height={30} width={30} />
												)}
											</View>
										</Pressable>
									))}
								</View>
							)}
						</ScrollView>
					)}

					<View style={styles.footer}>
						{previewWidget && (
							<>
								<Caption13Up color="gray1" style={styles.fieldLabel}>
									Widget preview
								</Caption13Up>

								{((): ReactElement => {
									switch (config.type) {
										case SUPPORTED_FEED_TYPES.PRICE_FEED:
											return (
												<BitfinexWidget
													key={url}
													url={url}
													widget={previewWidget}
												/>
											);
										case SUPPORTED_FEED_TYPES.HEADLINES_FEED:
											return (
												<HeadlinesWidget
													key={url}
													url={url}
													widget={previewWidget}
												/>
											);
										case SUPPORTED_FEED_TYPES.BLOCKS_FEED:
											return (
												<BlocksWidget
													key={url}
													url={url}
													widget={previewWidget}
												/>
											);
										default:
											return (
												<FeedWidget
													key={url}
													url={url}
													widget={previewWidget}
												/>
											);
									}
								})()}
							</>
						)}

						<View style={styles.buttonsContainer}>
							{savedSelectedField && (
								<Button
									style={styles.deleteButton}
									text="Delete"
									size="large"
									variant="secondary"
									onPress={onDelete}
								/>
							)}
							<Button
								style={styles.saveButton}
								text={buttonText}
								size="large"
								onPress={onSave}
							/>
						</View>
					</View>
				</View>
			)}
			<SafeAreaInsets type="bottom" />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 16,
	},
	headerText: {},
	headerImage: {
		borderRadius: 8,
		overflow: 'hidden',
	},
	url: {
		marginTop: 8,
	},
	description: {
		fontFamily: 'NHaasGroteskDSW02-55Rg',
		fontSize: 22,
		letterSpacing: 0.4,
		lineHeight: 26,
	},
	loading: {
		marginTop: 16,
	},
	fields: {
		paddingBottom: 16,
	},
	fieldContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	fieldLeftContainer: {
		justifyContent: 'center',
		flex: 1,
	},
	fieldLabel: {
		marginBottom: 8,
	},
	fieldValue: {
		flex: 1,
		paddingRight: 16,
	},
	footer: {
		paddingTop: 16,
		marginTop: 'auto',
	},
	buttonsContainer: {
		paddingTop: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	deleteButton: {
		flex: 1,
		marginRight: 16,
	},
	saveButton: {
		flex: 1,
	},
});

export default WidgetFeedEdit;
