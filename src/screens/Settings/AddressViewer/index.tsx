import React, {
	memo,
	ReactElement,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { FlatList, StyleSheet, View, ScrollView } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';
import { err, ok, Result } from '@synonymdev/result';
import Clipboard from '@react-native-clipboard/clipboard';
import fuzzysort from 'fuzzysort';
import { ldk } from '@synonymdev/react-native-ldk';

import {
	TouchableOpacity,
	View as ThemedView,
} from '../../../styles/components';
import { Subtitle, BodyS } from '../../../styles/text';
import SafeAreaInset from '../../../components/SafeAreaInset';
import type { SettingsScreenProps } from '../../../navigation/types';
import NavigationHeader from '../../../components/NavigationHeader';
import {
	generateAddresses,
	getKeyDerivationPathObject,
	getPrivateKey,
	getReceiveAddress,
	setupAddressGenerator,
} from '../../../utils/wallet';
import {
	addressTypeSelector,
	currentWalletSelector,
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import { TWalletName } from '../../../store/types/wallet';
import Button from '../../../components/buttons/Button';
import {
	defaultAddressContent,
	addressTypes,
} from '../../../store/shapes/wallet';
import { EAvailableNetwork } from '../../../utils/networks';
import { showToast } from '../../../utils/notifications';
import {
	getBlockExplorerLink,
	sendMax,
} from '../../../utils/wallet/transactions';
import { openURL } from '../../../utils/helpers';
import { getAddressUtxos } from '../../../utils/wallet/electrum';
import { updateWallet } from '../../../store/slices/wallet';
import {
	resetSendTransaction,
	setupOnChainTransaction,
	updateSendTransaction,
} from '../../../store/actions/wallet';
import { updateUi } from '../../../store/slices/ui';
import { showBottomSheet } from '../../../store/utils/ui';
import SearchInput from '../../../components/SearchInput';
import AddressViewerListItem from './AddressViewerListItem';
import { IThemeColors } from '../../../styles/themes';
import { updateActivityList } from '../../../store/utils/activity';
import { resetActivityState } from '../../../store/slices/activity';
import { setupLdk } from '../../../utils/lightning';
import { startWalletServices } from '../../../utils/startup';
import { updateOnchainFeeEstimates } from '../../../store/utils/fees';
import { viewControllerIsOpenSelector } from '../../../store/reselect/ui';
import { EAddressType, IAddress, IUtxo } from 'beignet';
import { setupLedger, syncLedger } from '../../../utils/ledger';

export type TAddressViewerData = {
	[EAddressType.p2tr]: {
		addresses: IAddress[];
		changeAddresses: IAddress[];
	};
	[EAddressType.p2wpkh]: {
		addresses: IAddress[];
		changeAddresses: IAddress[];
	};
	[EAddressType.p2sh]: {
		addresses: IAddress[];
		changeAddresses: IAddress[];
	};
	[EAddressType.p2pkh]: {
		addresses: IAddress[];
		changeAddresses: IAddress[];
	};
};
export type TAddressViewerConfig = {
	addressType: EAddressType;
	addressIndex: number;
	viewReceivingAddresses: boolean;
	selectedNetwork: EAvailableNetwork;
};
const ADDRESS_AMOUNT = 20; //How many addresses to generate at a given time.

const defaultConfig: TAddressViewerConfig = {
	addressType: EAddressType.p2wpkh,
	addressIndex: 0,
	viewReceivingAddresses: true,
	selectedNetwork: EAvailableNetwork.bitcoin,
};
const defaultAllAddressesData: TAddressViewerData = {
	[EAddressType.p2tr]: {
		addresses: [],
		changeAddresses: [],
	},
	[EAddressType.p2wpkh]: {
		addresses: [],
		changeAddresses: [],
	},
	[EAddressType.p2sh]: {
		addresses: [],
		changeAddresses: [],
	},
	[EAddressType.p2pkh]: {
		addresses: [],
		changeAddresses: [],
	},
};

const Separator = memo(
	(): ReactElement => <ThemedView color="gray2" style={styles.separator} />,
);

const EmptyComponent = memo(
	({
		hasUtxos,
		config,
		searchTxt = '',
		loadingAddresses,
	}: {
		hasUtxos: boolean;
		config: TAddressViewerConfig;
		searchTxt?: string;
		loadingAddresses: boolean;
	}): ReactElement => {
		const { t } = useTranslation('settings');
		const { addressType, addressIndex, viewReceivingAddresses } = config;
		let txt = t('addr.no_addrs');
		if (loadingAddresses) {
			txt = t('addr.loading');
		}
		if (hasUtxos) {
			txt = t(
				viewReceivingAddresses
					? 'addr.no_funds_receiving'
					: 'addr.no_funds_change',
				{ addressType, index: addressIndex - 1 },
			);
		}
		if (hasUtxos && searchTxt) {
			txt = t('addr.no_addrs_with_funds', { searchTxt });
		}
		if (!hasUtxos && searchTxt) {
			txt = t('addr.no_addrs_str', { searchTxt });
		}
		return (
			<View style={styles.emptyComponent}>
				<Subtitle style={styles.emptyText} color="white80">
					{txt}
				</Subtitle>
			</View>
		);
	},
);

const getAllAddresses = async ({
	config,
	addressAmount = ADDRESS_AMOUNT,
}: {
	config: TAddressViewerConfig;
	selectedWallet: TWalletName;
	addressAmount?: number;
}): Promise<Result<TAddressViewerData>> => {
	const responseData = { ...defaultAllAddressesData };
	const start = performance.now();
	await Promise.all(
		Object.values(addressTypes).map(async ({ path, type }) => {
			const keyDerivationPathResponse = getKeyDerivationPathObject({
				selectedNetwork: config.selectedNetwork,
				path,
			});
			if (keyDerivationPathResponse.isErr()) {
				return err(keyDerivationPathResponse.error.message);
			}
			const keyDerivationPath = keyDerivationPathResponse.value;
			const generateAddressResponse = await generateAddresses({
				...config,
				keyDerivationPath,
				addressAmount,
				changeAddressAmount: addressAmount,
				changeAddressIndex: config.addressIndex,
				addressType: type,
			});
			if (generateAddressResponse.isOk()) {
				let addresses = Object.values(
					generateAddressResponse.value.addresses,
				).sort((a, b) => a.index - b.index);
				let changeAddresses = Object.values(
					generateAddressResponse.value.changeAddresses,
				).sort((a, b) => a.index - b.index);

				responseData[type] = {
					addresses,
					changeAddresses,
				};
			} else {
				console.log(
					'generateAddressResponse error',
					generateAddressResponse.error.message,
				);
			}
		}),
	);
	const end = performance.now();
	console.log(
		`Time To Generate ${
			addressAmount * Object.keys(addressTypes).length
		} Addresses: ${end - start} ms`,
	);
	return ok(responseData);
};

const AddressViewer = ({
	navigation,
}: SettingsScreenProps<'AddressViewer'>): ReactElement => {
	const { t } = useTranslation('settings');
	const dispatch = useAppDispatch();
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const addressType = useAppSelector(addressTypeSelector);
	const currentWallet = useAppSelector((state) =>
		currentWalletSelector(state, selectedWallet),
	);
	const [sendNavigationHasOpened, setSendNavigationHasOpened] = useState(false);
	const sendNavigationIsOpen = useAppSelector((state) =>
		viewControllerIsOpenSelector(state, 'sendNavigation'),
	);

	const flatListRef = useRef<FlatList>(null);
	const scrollViewRef = useRef<ScrollView>(null);
	const [config, setConfig] = useState({
		...defaultConfig,
		selectedNetwork,
		addressType,
	});
	const currentAddressIndex =
		currentWallet.addressIndex[selectedNetwork][config.addressType]?.index ?? 0;
	const [allAddresses, setAllAddresses] = useState({
		...defaultAllAddressesData,
	});
	// This is used as a reference when searching for specific text in onSearch.
	const [searchableAddresses, setSearchableAddresses] = useState<IAddress[]>(
		[],
	);
	// The currently selected address to display qrcode data for.
	const [selectedAddress, setSelectedAddress] = useState<IAddress>(
		defaultAddressContent,
	);
	// The private key of the currently selected address to display qrcode data for.
	const [privateKey, setPrivateKey] = useState<string | undefined>(undefined);
	// Available array of UTXO's after checking for a balance.
	const [utxos, setUtxos] = useState<IUtxo[] | undefined>();
	// Total balance of available UTXO's after checking for a balance.
	const [totalBalance, setTotalBalance] = useState(0);
	// An array of UTXO's that are currently selected for spending.
	const [selectedUtxos, setSelectedUtxos] = useState<IUtxo[]>([]);
	const [searchTxt, setSearchTxt] = useState('');
	// Addresses filtered from a search query in onSearch.
	const [filteredAddresses, setFilterAddresses] = useState<IAddress[]>([]);
	// An array of addresses that contain a balance after checking for a balance.
	const [addressesWithBalance, setAddressesWithBalance] = useState<string[]>(
		[],
	);
	const [loadingAddresses, setLoadingAddresses] = useState(true);
	const [isCheckingBalances, setIsCheckingBalances] = useState(false);
	const [isGeneratingMoreAddresses, setIsGeneratingMoreAddresses] =
		useState(false);

	/**
	 * Parses address data for use in the FlatList.
	 */
	const flatlistData = useMemo(() => {
		if (searchTxt !== '') {
			return filteredAddresses;
		}
		const type = config.addressType;
		const currentAddresses = config.viewReceivingAddresses
			? allAddresses[type].addresses
			: allAddresses[type].changeAddresses;
		if (totalBalance > 0) {
			return currentAddresses.filter((a) => {
				return addressesWithBalance.includes(a.address);
			});
		}
		return currentAddresses;
	}, [
		addressesWithBalance,
		allAddresses,
		config.addressType,
		config.viewReceivingAddresses,
		filteredAddresses,
		searchTxt,
		totalBalance,
	]);

	const scrollToEnd = (): void => {
		setTimeout(() => flatListRef?.current?.scrollToEnd(), 200);
	};

	const scrollToTop = useCallback((): void => {
		if (flatlistData.length > 0) {
			setTimeout(() => flatListRef?.current?.scrollToIndex({ index: 0 }), 200);
		}
	}, [flatlistData.length]);

	const handleScroll = useCallback(
		(index: number): void => {
			if (index < 20) {
				scrollToTop();
			} else {
				scrollToEnd();
			}
		},
		[scrollToTop],
	);

	/**
	 * Clears all UTXO and balance data.
	 */
	const resetUtxos = useCallback((): void => {
		if (utxos) {
			setUtxos(undefined);
			setSelectedUtxos([]);
			setAddressesWithBalance([]);
			setTotalBalance(0);
		}
	}, [utxos]);

	/**
	 * Combines all addresses & change addresses of each address type into
	 * a single object that we can use to search against.
	 * @param {TAddressViewerData} _allAddresses
	 * @returns {Promise<void>}
	 */
	const updateSearchableAddresses = async (
		_allAddresses: TAddressViewerData,
	): Promise<void> => {
		let searchAddrs: IAddress[] = [];
		await Promise.all(
			Object.keys(_allAddresses).map(async (key) => {
				searchAddrs = [
					...searchAddrs,
					..._allAddresses[key].addresses,
					..._allAddresses[key].changeAddresses,
				];
			}),
		);
		setSearchableAddresses(searchAddrs);
	};

	/**
	 * Generates a specified amount of addresses per address type. (addressAmount * addressTypes.length)
	 */
	const getMoreAddresses = useCallback(
		async (addressAmount): Promise<void> => {
			const getAllAddressesRes = await getAllAddresses({
				config,
				selectedWallet,
				addressAmount,
			});
			if (getAllAddressesRes.isErr()) {
				if (loadingAddresses) {
					setLoadingAddresses(false);
				}
				return;
			}

			if (!selectedAddress?.address) {
				const type = config.addressType;
				if (getAllAddressesRes.value[type].addresses.length) {
					setSelectedAddress(getAllAddressesRes.value[type].addresses[0]);
				}
			}

			resetUtxos();

			const newAllAddresses: TAddressViewerData = {
				...defaultAllAddressesData,
			};

			await Promise.all(
				Object.keys(getAllAddressesRes.value).map(async (key) => {
					newAllAddresses[key] = {
						addresses: [
							...allAddresses[key].addresses,
							...getAllAddressesRes.value[key].addresses,
						],
						changeAddresses: [
							...allAddresses[key].changeAddresses,
							...getAllAddressesRes.value[key].changeAddresses,
						],
					};
				}),
			);

			const indexes = newAllAddresses[config.addressType].addresses.map(
				(a) => a.index,
			);
			const maxIndex = Math.max(...indexes);
			setConfig({
				...config,
				addressIndex: maxIndex + 1,
			});
			setAllAddresses(newAllAddresses);
			updateSearchableAddresses(newAllAddresses).then();
			if (loadingAddresses) {
				setLoadingAddresses(false);
			}
			handleScroll(maxIndex);
		},
		[
			allAddresses,
			config,
			handleScroll,
			loadingAddresses,
			resetUtxos,
			selectedAddress?.address,
			selectedWallet,
		],
	);

	const getAddressTypeButtonColor = useCallback(
		(type): keyof IThemeColors => {
			if (type === true) {
				return 'brand';
			}
			if (config.addressType === type) {
				return 'brand';
			}
			if (
				(config.viewReceivingAddresses && type === 'receiving') ||
				(!config.viewReceivingAddresses && type === 'change')
			) {
				return 'brand';
			}
			if (config.selectedNetwork === type) {
				return 'brand';
			}
			return 'onSurface';
		},
		[config.addressType, config.selectedNetwork, config.viewReceivingAddresses],
	);

	/**
	 * Updates the selected address to display qr-code and additional information on the address view screen.
	 */
	const updateSelectedAddress = useCallback(
		(
			_config: TAddressViewerConfig,
			_allAddresses: TAddressViewerData,
		): void => {
			if (privateKey) {
				setPrivateKey(undefined);
			}
			if (!_allAddresses) {
				_allAddresses = allAddresses;
			}
			const type = _config.addressType;
			if (
				_config.viewReceivingAddresses &&
				_allAddresses[type].addresses.length
			) {
				setSelectedAddress(_allAddresses[type].addresses[0]);
			} else if (
				!_config.viewReceivingAddresses &&
				_allAddresses[type].changeAddresses.length
			) {
				setSelectedAddress(_allAddresses[type].changeAddresses[0]);
			}
		},
		[allAddresses, privateKey],
	);

	/**
	 * Updates the addresses address type to be displayed in the address viewer.
	 */
	const updateAddressType = useCallback(
		async (_addressType): Promise<void> => {
			if (_addressType === config.addressType) {
				return;
			}
			const newConfig = {
				...config,
				addressType: _addressType,
			};
			setConfig(newConfig);
			updateSelectedAddress(newConfig, allAddresses);
		},
		[allAddresses, config, updateSelectedAddress],
	);

	/**
	 * Toggles the receive and change addresses from view.
	 */
	const toggleReceivingAddresses = useCallback(
		(viewReceivingAddresses): void => {
			if (config.viewReceivingAddresses === viewReceivingAddresses) {
				return;
			}
			const newConfig = {
				...config,
				viewReceivingAddresses,
			};
			updateSelectedAddress(newConfig, allAddresses);
			setConfig(newConfig);
		},
		[allAddresses, config, updateSelectedAddress],
	);

	/**
	 * Handles opening the block explorer url link for the currently selected address.
	 */
	const openBlockExplorer = useCallback(async () => {
		if (!selectedAddress?.address) {
			return;
		}
		const blockExplorerUrl = getBlockExplorerLink(
			selectedAddress.address,
			'address',
			config.selectedNetwork,
		);
		await openURL(blockExplorerUrl);
	}, [config.selectedNetwork, selectedAddress]);

	/**
	 * Returns whether or not the qr-code should be displayed
	 * @returns {boolean}
	 */
	const displayQrCode = useMemo(
		() => selectedAddress?.index >= 0 || privateKey,
		[privateKey, selectedAddress?.index],
	);

	/**
	 * Returns local/known balance information for a given address string.
	 * @returns {number}
	 */
	const getBalanceForAddress = useCallback(
		(addr: string): number => {
			let balance: number = 0;
			if (utxos && addressesWithBalance.length > 0) {
				utxos.map((u) => {
					if (u.address === addr) {
						balance += u.value;
					}
				});
			}
			return balance;
		},
		[addressesWithBalance.length, utxos],
	);

	/**
	 * Returns local/known UTXO information for a given address string.
	 * @returns {IUtxo | undefined}
	 */
	const getUtxoForAddress = useCallback(
		(addr: string): IUtxo | undefined => {
			let utxo;
			if (utxos && addressesWithBalance.length > 0) {
				utxo = utxos.find((u) => {
					return u.address === addr;
				});
			}
			return utxo;
		},
		[addressesWithBalance.length, utxos],
	);

	/**
	 * Determines whether the checkmark for a given UTXO is selected.
	 * @returns {boolean}
	 */
	const utxoIsSelected = useCallback(
		(utxo: IUtxo): boolean => {
			return selectedUtxos.some(
				(u) => u.address === utxo.address && u.tx_pos === utxo.tx_pos,
			);
		},
		[selectedUtxos],
	);

	/**
	 * Used to handle user input when searching for addresses or transaction id's.
	 */
	const onSearch = useCallback(
		(txt): void => {
			const options = {
				limit: 100,
				threshold: -45000,
				keys: ['address', 'publicKey', 'scriptHash', 'path'],
				allowTypo: true,
			};
			setSearchTxt(txt);

			const fuzzyRes = fuzzysort.go(txt, searchableAddresses, options);
			const filtered = fuzzyRes.map((r) => r.obj);
			const sorted = Object.values(filtered).sort((a, b) => a.index - b.index);
			setFilterAddresses(sorted);
			if (privateKey) {
				setPrivateKey(undefined);
			}
		},
		[privateKey, searchableAddresses],
	);

	/**
	 * This method will gather all selected UTXO's and setup an on-chain transaction.
	 * The on-chain transaction will retrieve and include the app's receiving address by default.
	 * Finally, this method will prompt the sendNavigation modal to appear for the user to finalize and confirm the transaction.
	 */
	const onSpendFundsPress = useCallback(
		async (utxosLength, selectedUtxosLength): Promise<void> => {
			if (utxosLength <= 0) {
				return;
			}
			resetSendTransaction();
			const transactionRes = await setupOnChainTransaction({
				utxos: selectedUtxosLength > 0 ? selectedUtxos : utxos,
				rbf: true,
			});
			if (transactionRes.isErr()) {
				return;
			}
			const receiveAddress = await getReceiveAddress({
				selectedNetwork,
			});
			if (receiveAddress.isErr()) {
				return;
			}
			updateSendTransaction({
				transaction: {
					...transactionRes.value,
					outputs: [{ address: receiveAddress.value, value: 0, index: 0 }],
				},
			});
			dispatch(updateUi({ fromAddressViewer: true }));
			sendMax({
				selectedWallet,
				selectedNetwork,
			});
			showBottomSheet('sendNavigation', { screen: 'ReviewAndSend' });
		},
		[selectedUtxos, utxos, selectedNetwork, dispatch, selectedWallet],
	);

	/**
	 * Copies the qr-code data to the clipboard.
	 */
	const onQrCodePress = useCallback(() => {
		if (privateKey) {
			Clipboard.setString(privateKey);
			showToast({
				type: 'success',
				title: t('addr.copied'),
				description: privateKey,
			});
		} else if (selectedAddress?.address) {
			Clipboard.setString(selectedAddress.address);
			showToast({
				type: 'success',
				title: t('addr.copied'),
				description: selectedAddress.address,
			});
		}
	}, [privateKey, selectedAddress?.address, t]);

	/**
	 * Will retrieve and display the private key of the selected address.
	 */
	const onPrivateKeyPress = useCallback(async () => {
		if (privateKey) {
			setPrivateKey(undefined);
			return;
		}
		const setupRes = await setupAddressGenerator({
			selectedWallet,
			selectedNetwork: config.selectedNetwork,
		});
		if (setupRes.isErr()) {
			return;
		}
		const getPrivateKeyRes = await getPrivateKey({
			addressData: selectedAddress,
			selectedNetwork,
		});
		if (getPrivateKeyRes.isErr()) {
			return;
		}
		setPrivateKey(getPrivateKeyRes.value);
	}, [
		config.selectedNetwork,
		privateKey,
		selectedAddress,
		selectedNetwork,
		selectedWallet,
	]);

	const onCheckMarkPress = useCallback(
		(utxo, isSelected) => {
			if (!utxo?.address) {
				return;
			}
			if (isSelected) {
				// De-select the UTXO.
				const newSelectedUtxos: IUtxo[] = selectedUtxos.filter(
					(u) => u.address !== utxo.address,
				);
				setSelectedUtxos(newSelectedUtxos);
			} else if (utxos) {
				// Add the UTXO
				const newSelectedUtxos: IUtxo[] = utxos.filter(
					(u) => u.address === utxo.address,
				);
				setSelectedUtxos([...selectedUtxos, ...newSelectedUtxos]);
			}
		},
		[selectedUtxos, utxos],
	);

	const onGenerateMorePress = useCallback(async () => {
		setIsGeneratingMoreAddresses(true);
		await getMoreAddresses(ADDRESS_AMOUNT);
		setIsGeneratingMoreAddresses(false);
	}, [getMoreAddresses]);

	/**
	 * Retrieves the balance and UTXO's associated with all addresses of each type.
	 */
	const onCheckBalance = useCallback(async (): Promise<void> => {
		setIsCheckingBalances(true);
		setPrivateKey(undefined);

		// Ensure we switch networks if the user opted to do-so.
		if (selectedNetwork !== config.selectedNetwork) {
			// Wipe existing activity
			dispatch(resetActivityState());
			setupLedger({ selectedWallet, selectedNetwork });
			ldk.stop();
			// Switch to new network.
			dispatch(updateWallet({ selectedNetwork: config.selectedNetwork }));
			// Switching networks requires us to reset LDK.
			await setupLdk({ selectedWallet, selectedNetwork });
			// Start wallet services with the newly selected network.
			await startWalletServices({
				selectedNetwork: config.selectedNetwork,
			});
			await updateOnchainFeeEstimates({
				selectedNetwork: config.selectedNetwork,
				forceUpdate: true,
			});
			updateActivityList();
			await syncLedger();
		}

		let _utxos: IUtxo[] = [];
		let _selectedUtxos: IUtxo[] = [];
		let _totalBalance = 0;
		let _addressesWithBalance: string[] = [];

		await Promise.all(
			Object.values(addressTypes).map(async ({ type }) => {
				const _allAddresses = [
					...allAddresses[type].addresses,
					...allAddresses[type].changeAddresses,
				];
				if (_allAddresses.length > 0) {
					const utxosRes = await getAddressUtxos({
						allAddresses: _allAddresses,
					});
					if (utxosRes.isErr()) {
						console.log(utxosRes.error.message);
						showToast({
							type: 'warning',
							title: t('addr.rescan_error'),
							description: t('addr.rescan_error_description'),
						});
						setIsCheckingBalances(false);
						return;
					}
					_utxos = [..._utxos, ...utxosRes.value.utxos];
					_selectedUtxos = [..._selectedUtxos, ...utxosRes.value.utxos];
					_totalBalance += utxosRes.value.balance;
					const awb: string[] = utxosRes.value.utxos.map((u) => u.address);
					_addressesWithBalance = [..._addressesWithBalance, ...awb];
				}
			}),
		);
		setUtxos(_utxos);
		setSelectedUtxos(_selectedUtxos);
		setTotalBalance(_totalBalance);
		setAddressesWithBalance(_addressesWithBalance);
		setIsCheckingBalances(false);
	}, [
		allAddresses,
		config.selectedNetwork,
		selectedNetwork,
		selectedWallet,
		dispatch,
		t,
	]);

	const utxosLength = useMemo(() => utxos?.length ?? 0, [utxos?.length]);
	const selectedUtxosLength = useMemo(
		() => selectedUtxos?.length ?? 0,
		[selectedUtxos?.length],
	);

	const spendFundsButtonText = useMemo(() => {
		let fundsToSpend = 0;
		let uniqueAddresses: string[] = [];
		if (utxos) {
			fundsToSpend = selectedUtxos.reduce((acc, cur) => {
				return acc + cur.value;
			}, 0);
			selectedUtxos.map((u) => {
				if (!uniqueAddresses.includes(u.address)) {
					uniqueAddresses.push(u.address);
				}
			});
		}

		return selectedUtxosLength > 0 && utxosLength !== selectedUtxosLength
			? t('addr.spend_number', { fundsToSpend, count: uniqueAddresses.length })
			: t('addr.spend_all', { count: uniqueAddresses.length });
	}, [selectedUtxos, selectedUtxosLength, utxos, utxosLength, t]);

	useEffect(() => {
		const addressAmount =
			currentAddressIndex + 1 < 20 ? 20 : currentAddressIndex + 1;
		getMoreAddresses(addressAmount).then();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Refresh balances after closing the send modal.
	useEffect(() => {
		if (sendNavigationIsOpen) {
			setSendNavigationHasOpened(true);
		}
		if (sendNavigationHasOpened && !sendNavigationIsOpen) {
			onCheckBalance().then();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sendNavigationHasOpened, sendNavigationIsOpen]);

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('adv.address_viewer')}
				displayBackButton={true}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<View style={styles.content}>
				{displayQrCode && (
					<View style={styles.qrCodeRow}>
						<View style={styles.qrCode}>
							<TouchableOpacity
								color="white"
								activeOpacity={1}
								onPress={onQrCodePress}
								style={styles.qrCode}>
								<QRCode
									value={privateKey ?? selectedAddress?.address}
									size={100}
								/>
							</TouchableOpacity>
						</View>
						<View>
							<BodyS style={styles.headerText}>
								{t('addr.index', { index: selectedAddress?.index })}
							</BodyS>
							<BodyS style={styles.headerText} testID="Path">
								{t('addr.path', { path: selectedAddress?.path })}
							</BodyS>
							<TouchableOpacity
								style={styles.headerText}
								onPress={onPrivateKeyPress}>
								<BodyS>
									{t(privateKey ? 'addr.private_hide' : 'addr.private_view')}
								</BodyS>
							</TouchableOpacity>
							{config.selectedNetwork !== 'bitcoinRegtest' && (
								<TouchableOpacity
									style={styles.headerText}
									onPress={openBlockExplorer}>
									<BodyS>View Block Explorer</BodyS>
								</TouchableOpacity>
							)}
						</View>
					</View>
				)}
				{privateKey && (
					<BodyS style={styles.privKeyText}>
						{t('addr.private_key', { privateKey })}
					</BodyS>
				)}
				<SearchInput
					style={styles.searchInput}
					value={searchTxt}
					onChangeText={onSearch}
					autoCapitalize="none"
				/>
				{!searchTxt && (
					<View style={styles.row}>
						<ScrollView
							horizontal={true}
							showsHorizontalScrollIndicator={false}
							ref={scrollViewRef}
							onContentSizeChange={(): void =>
								scrollViewRef?.current?.scrollToEnd({ animated: false })
							}>
							<Button
								color={getAddressTypeButtonColor(EAddressType.p2pkh)}
								text={EAddressType.p2pkh}
								onPress={(): void => {
									updateAddressType(EAddressType.p2pkh).then();
								}}
							/>
							<Button
								color={getAddressTypeButtonColor(EAddressType.p2sh)}
								text={EAddressType.p2sh}
								onPress={(): void => {
									updateAddressType(EAddressType.p2sh).then();
								}}
							/>
							<Button
								color={getAddressTypeButtonColor(EAddressType.p2wpkh)}
								text={EAddressType.p2wpkh}
								onPress={(): void => {
									updateAddressType(EAddressType.p2wpkh).then();
								}}
							/>
							<Button
								color={getAddressTypeButtonColor(EAddressType.p2tr)}
								text={EAddressType.p2tr}
								onPress={(): void => {
									updateAddressType(EAddressType.p2tr).then();
								}}
							/>
						</ScrollView>
					</View>
				)}
				{!searchTxt && (
					<View style={styles.row}>
						<Button
							color={getAddressTypeButtonColor('change')}
							text={t('addr.addr_change')}
							onPress={(): void => {
								toggleReceivingAddresses(false);
							}}
						/>
						<Button
							color={getAddressTypeButtonColor('receiving')}
							text={t('addr.addr_receiving')}
							onPress={(): void => {
								toggleReceivingAddresses(true);
							}}
						/>
					</View>
				)}
				<FlatList
					ref={flatListRef}
					ListEmptyComponent={
						<EmptyComponent
							hasUtxos={utxos !== undefined}
							config={config}
							searchTxt={searchTxt}
							loadingAddresses={loadingAddresses}
						/>
					}
					ItemSeparatorComponent={Separator}
					contentContainerStyle={styles.flatListContent}
					data={flatlistData}
					renderItem={({ item }): ReactElement => {
						let balance;
						let utxo;
						let isSelected = false;
						if (utxos) {
							balance = getBalanceForAddress(item.address);
							utxo = getUtxoForAddress(item.address);
							if (utxo) {
								isSelected = utxoIsSelected(utxo);
							}
						}
						const backgroundColor = getAddressTypeButtonColor(
							selectedAddress?.address === item.address,
						);
						return (
							<AddressViewerListItem
								item={item}
								balance={balance}
								isSelected={isSelected}
								backgroundColor={backgroundColor}
								onItemRowPress={(): void => {
									setPrivateKey(undefined);
									setSelectedAddress(item);
								}}
								onCheckMarkPress={(): void => {
									onCheckMarkPress(utxo, isSelected);
								}}
							/>
						);
					}}
					keyExtractor={(item: IAddress): string => item.path}
				/>
				<>
					{totalBalance > 0 && (
						<View style={styles.spendFundsContainer}>
							{selectedUtxosLength > 0 && (
								<Button
									text={spendFundsButtonText}
									onPress={(): void => {
										onSpendFundsPress(utxosLength, selectedUtxosLength).then();
									}}
								/>
							)}
							<Subtitle style={styles.spendFundsText}>
								{t('addr.sats_found', { totalBalance })}
							</Subtitle>
						</View>
					)}
				</>

				<View style={styles.footer}>
					<Button style={styles.backToTop} text="↑" onPress={scrollToTop} />
					<Button
						style={styles.footerButton}
						text={t('addr.gen_20')}
						loading={isGeneratingMoreAddresses}
						onPress={onGenerateMorePress}
					/>
					{!utxos && (
						<Button
							style={styles.footerButton}
							text={t('addr.check_balances')}
							loading={isCheckingBalances}
							onPress={onCheckBalance}
						/>
					)}
				</View>
			</View>

			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-evenly',
		marginBottom: 2,
	},
	qrCodeRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginTop: -20,
	},
	searchInput: {
		marginVertical: 8,
	},
	flatListContent: {
		flexGrow: 1,
	},
	qrCode: {
		borderRadius: 10,
		padding: 6,
		alignItems: 'flex-start',
	},
	emptyComponent: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: -50,
		marginHorizontal: 50,
	},
	emptyText: {
		textAlign: 'center',
	},
	privKeyText: {
		alignSelf: 'center',
		textAlign: 'center',
		marginHorizontal: 40,
		marginBottom: 5,
	},
	headerText: {
		marginTop: 5,
	},
	separator: {
		height: 1,
		width: '100%',
	},
	spendFundsContainer: {
		marginTop: 10,
		alignItems: 'center',
	},
	spendFundsText: {
		marginVertical: 5,
	},
	footer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingTop: 2,
		gap: 2,
	},
	footerButton: {
		flex: 1,
	},
	backToTop: {
		minWidth: 50,
	},
});

export default memo(AddressViewer);
