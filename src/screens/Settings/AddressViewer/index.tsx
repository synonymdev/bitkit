import React, {
	memo,
	ReactElement,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { FlatList, LayoutAnimation, StyleSheet, View } from 'react-native';

import {
	TouchableOpacity,
	View as ThemedView,
} from '../../../styles/components';
import { Subtitle, Text02S } from '../../../styles/text';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import type { SettingsScreenProps } from '../../../navigation/types';
import NavigationHeader from '../../../components/NavigationHeader';
import {
	generateAddresses,
	getKeyDerivationPathObject,
	getPrivateKey,
	getReceiveAddress,
} from '../../../utils/wallet';
import { useSelector } from 'react-redux';
import {
	addressTypeSelector,
	currentWalletSelector,
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import {
	EAddressType,
	IAddress,
	IUtxo,
	TWalletName,
} from '../../../store/types/wallet';
import { err, ok, Result } from '@synonymdev/result';
import Button from '../../../components/Button';
import { addressContent, addressTypes } from '../../../store/shapes/wallet';
import {
	EAvailableNetworks,
	TAvailableNetworks,
} from '../../../utils/networks';
import QRCode from 'react-native-qrcode-svg';
import Clipboard from '@react-native-clipboard/clipboard';
import {
	showErrorNotification,
	showSuccessNotification,
} from '../../../utils/notifications';
import {
	getBlockExplorerLink,
	sendMax,
} from '../../../utils/wallet/transactions';
import { openURL } from '../../../utils/helpers';
import { setupNodejsMobile } from '../../../utils/nodejs-mobile';
import { getAddressUtxos } from '../../../utils/wallet/electrum';
import { enableDevOptionsSelector } from '../../../store/reselect/settings';
import {
	resetOnChainTransaction,
	setupOnChainTransaction,
	updateAddressIndexes,
	updateBitcoinTransaction,
	updateWallet,
} from '../../../store/actions/wallet';
import { showBottomSheet } from '../../../store/actions/ui';
import Store from '../../../store/types';
import SearchInput from '../../../components/SearchInput';
import fuzzysort from 'fuzzysort';
import AddressViewerListItem from './AddressViewerListItem';
import { IThemeColors } from '../../../styles/themes';
import {
	resetActivityStore,
	updateActivityList,
} from '../../../store/actions/activity';
import { resetLdk } from '../../../utils/lightning';
import { startWalletServices } from '../../../utils/startup';
import { updateOnchainFeeEstimates } from '../../../store/actions/fees';
import { viewControllerIsOpenSelector } from '../../../store/reselect/ui';

export type TAddressViewerData = {
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
	selectedNetwork: TAvailableNetworks;
};
const ADDRESS_AMOUNT = 20; //How many addresses to generate at a given time.

const defaultConfig: TAddressViewerConfig = {
	addressType: EAddressType.p2wpkh,
	addressIndex: 0,
	viewReceivingAddresses: true,
	selectedNetwork: EAvailableNetworks.bitcoin,
};
const defaultAllAddressesData: TAddressViewerData = {
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
	(): ReactElement => (
		<ThemedView color={'darkGray'} style={styles.separator} />
	),
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
		const { addressType, addressIndex, viewReceivingAddresses } = config;
		let txt = 'No Addresses To Display';
		if (loadingAddresses) {
			txt = 'Loading Addresses...';
		}
		if (hasUtxos) {
			const receiveAddressText = viewReceivingAddresses
				? 'receiving'
				: 'change';
			txt = `No funds found under the ${addressType} address type, ${receiveAddressText} addresses up to index ${
				addressIndex - 1
			}`;
		}
		if (hasUtxos && searchTxt) {
			txt = `No addresses with funds found when searching for "${searchTxt}"`;
		}
		if (!hasUtxos && searchTxt) {
			txt = `No addresses found when searching for "${searchTxt}"`;
		}
		return (
			<View style={styles.emptyComponent}>
				<Subtitle style={styles.emptyText} color={'white8'}>
					{txt}
				</Subtitle>
			</View>
		);
	},
);

const getAllAddresses = async ({
	config,
	selectedWallet,
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
				selectedWallet,
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
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const addressType = useSelector(addressTypeSelector);
	const enableDevOptions = useSelector(enableDevOptionsSelector);
	const currentWallet = useSelector((state: Store) =>
		currentWalletSelector(state, selectedWallet),
	);
	const [sendNavigationHasOpened, setSendNavigationHasOpened] = useState(false);
	const sendNavigationIsOpen = useSelector((state) =>
		viewControllerIsOpenSelector(state, 'sendNavigation'),
	);

	const flatListRef = useRef<FlatList<any>>();

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
	const [selectedAddress, setSelectedAddress] =
		useState<IAddress>(addressContent);
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
	const [loadingNetwork, setLoadingNetwork] = useState<
		TAvailableNetworks | undefined
	>(undefined);
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

			if (!selectedAddress.address) {
				const type = config.addressType;
				setSelectedAddress(getAllAddressesRes.value[type].addresses[0]);
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
			selectedAddress.address,
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
		[allAddresses],
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
	 * Updates the selected network locally for the address viewer.
	 */
	const updateNetwork = useCallback(
		async (n: EAvailableNetworks): Promise<void> => {
			if (n === config.selectedNetwork) {
				return;
			}
			setLoadingNetwork(n);
			resetUtxos();
			const newConfig = {
				...config,
				addressIndex: 0,
				selectedNetwork: n,
			};
			const getAllAddressesRes = await getAllAddresses({
				config: newConfig,
				selectedWallet,
				addressAmount: ADDRESS_AMOUNT,
			});
			if (getAllAddressesRes.isErr()) {
				setLoadingNetwork(undefined);
				return;
			}
			const type = config.addressType;
			const indexes = getAllAddressesRes.value[type].addresses.map(
				(a) => a.index,
			);
			const maxIndex = Math.max(...indexes);
			setConfig({
				...newConfig,
				addressIndex: maxIndex + 1,
			});
			updateSelectedAddress(newConfig, getAllAddressesRes.value);
			setAllAddresses(getAllAddressesRes.value);
			updateSearchableAddresses(getAllAddressesRes.value).then();
			setLoadingNetwork(undefined);
			handleScroll(maxIndex);
		},
		[config, handleScroll, resetUtxos, selectedWallet, updateSelectedAddress],
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
		if (!selectedAddress.address) {
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
		},
		[searchableAddresses],
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
			resetOnChainTransaction({
				selectedWallet,
				selectedNetwork,
			});
			const transactionRes = await setupOnChainTransaction({
				selectedWallet,
				selectedNetwork,
				utxos: selectedUtxosLength > 0 ? selectedUtxos : utxos,
				rbf: true,
			});
			if (transactionRes.isErr()) {
				return;
			}
			const receiveAddress = await getReceiveAddress({
				selectedWallet,
				selectedNetwork,
			});
			if (receiveAddress.isErr()) {
				return;
			}
			updateBitcoinTransaction({
				transaction: {
					...transactionRes.value,
					outputs: [{ address: receiveAddress.value, value: 0, index: 0 }],
				},
				selectedWallet,
				selectedNetwork,
			});
			await sendMax({ selectedWallet, selectedNetwork });
			showBottomSheet('sendNavigation');
		},
		[selectedNetwork, selectedUtxos, selectedWallet, utxos],
	);

	/**
	 * Copies the qr-code data to the clipboard.
	 */
	const onQrCodePress = useCallback(() => {
		if (privateKey) {
			Clipboard.setString(privateKey);
			showSuccessNotification({
				title: 'Copied to clipboard',
				message: privateKey,
			});
		} else if (selectedAddress.address) {
			Clipboard.setString(selectedAddress.address);
			showSuccessNotification({
				title: 'Copied to clipboard',
				message: selectedAddress.address,
			});
		}
	}, [privateKey, selectedAddress.address]);

	/**
	 * Will retrieve and display the private key of the selected address.
	 */
	const onPrivateKeyPress = useCallback(async () => {
		if (privateKey) {
			setPrivateKey(undefined);
			return;
		}
		const setupRes = await setupNodejsMobile({
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
			if (!utxo) {
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

		// Ensure we switch networks if the user opted to do-so.
		if (selectedNetwork !== config.selectedNetwork) {
			// Wipe existing activity
			resetActivityStore();
			// Switch to new network.
			updateWallet({ selectedNetwork: config.selectedNetwork });
			// Generate addresses if none exist for the newly selected wallet and network.
			await updateAddressIndexes({
				selectedWallet,
				selectedNetwork: config.selectedNetwork,
				addressType: config.addressType,
			});
			// Switching networks requires us to reset LDK.
			await resetLdk();
			// Start wallet services with the newly selected network.
			await startWalletServices({
				selectedNetwork: config.selectedNetwork,
			});
			await updateOnchainFeeEstimates({
				selectedNetwork: config.selectedNetwork,
				forceUpdate: true,
			});
			await updateActivityList();
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
						selectedNetwork,
						allAddresses: _allAddresses,
					});
					if (utxosRes.isErr()) {
						showErrorNotification({
							title: 'Rescan Error: Please Check Connection',
							message: utxosRes.error.message,
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
		config.addressType,
		config.selectedNetwork,
		selectedNetwork,
		selectedWallet,
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
		const addrTxt = uniqueAddresses.length === 1 ? 'Address' : 'Addresses';
		return selectedUtxosLength > 0 && utxosLength !== selectedUtxosLength
			? `Spend ${fundsToSpend} sats From ${uniqueAddresses.length} ${addrTxt}`
			: `Spend All Funds From ${uniqueAddresses.length} ${addrTxt}`;
	}, [selectedUtxos, selectedUtxosLength, utxos, utxosLength]);

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

	LayoutAnimation.easeInEaseOut();

	return (
		<ThemedView style={styles.content} color="black">
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Address Viewer"
				displayBackButton={true}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			{displayQrCode && (
				<View style={styles.qrCodeRow}>
					<View style={styles.qrCode}>
						<TouchableOpacity
							color="white"
							activeOpacity={1}
							onPress={onQrCodePress}
							style={styles.qrCode}>
							<QRCode
								value={privateKey ?? selectedAddress.address}
								size={100}
							/>
						</TouchableOpacity>
					</View>
					<View>
						<Text02S style={styles.headerText}>
							Index: {selectedAddress?.index}
						</Text02S>
						<Text02S style={styles.headerText} testID="Path">
							Path: {selectedAddress?.path}
						</Text02S>
						<TouchableOpacity
							style={styles.headerText}
							onPress={onPrivateKeyPress}>
							<Text02S>
								{privateKey ? 'Hide Private Key' : 'View Private Key'}
							</Text02S>
						</TouchableOpacity>
						{config.selectedNetwork !== 'bitcoinRegtest' && (
							<TouchableOpacity
								style={styles.headerText}
								onPress={openBlockExplorer}>
								<Text02S>View Block Explorer</Text02S>
							</TouchableOpacity>
						)}
					</View>
				</View>
			)}
			{privateKey && (
				<Text02S style={styles.privKeyText}>Private Key: {privateKey}</Text02S>
			)}
			<SearchInput
				//style={styles.searchInput}
				value={searchTxt}
				onChangeText={onSearch}
				autoCapitalize="none"
			/>
			{enableDevOptions && (
				<View style={styles.row}>
					<Button
						loading={loadingNetwork === EAvailableNetworks.bitcoinTestnet}
						color={getAddressTypeButtonColor(EAvailableNetworks.bitcoinTestnet)}
						text="Testnet"
						onPress={(): void => {
							updateNetwork(EAvailableNetworks.bitcoinTestnet).then();
						}}
					/>
					<Button
						loading={loadingNetwork === EAvailableNetworks.bitcoinRegtest}
						color={getAddressTypeButtonColor(EAvailableNetworks.bitcoinRegtest)}
						text="Regtest"
						onPress={(): void => {
							updateNetwork(EAvailableNetworks.bitcoinRegtest).then();
						}}
					/>
					<Button
						loading={loadingNetwork === EAvailableNetworks.bitcoin}
						color={getAddressTypeButtonColor(EAvailableNetworks.bitcoin)}
						text="Mainnet"
						onPress={(): void => {
							updateNetwork(EAvailableNetworks.bitcoin).then();
						}}
					/>
				</View>
			)}
			{!searchTxt && (
				<View style={styles.row}>
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
				</View>
			)}
			{!searchTxt && (
				<View style={styles.row}>
					<Button
						color={getAddressTypeButtonColor('change')}
						text="Change Addresses"
						onPress={(): void => {
							toggleReceivingAddresses(false);
						}}
					/>
					<Button
						color={getAddressTypeButtonColor('receiving')}
						text="Receiving Addresses"
						onPress={(): void => {
							toggleReceivingAddresses(true);
						}}
					/>
				</View>
			)}
			<FlatList
				// @ts-ignore
				ref={flatListRef}
				style={styles.content}
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
						selectedAddress.address === item.address,
					);
					return (
						<AddressViewerListItem
							item={item}
							balance={balance}
							isSelected={isSelected}
							backgroundColor={backgroundColor}
							onItemRowPress={(): void => {
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
							{totalBalance} sats found
						</Subtitle>
					</View>
				)}
				<View style={styles.footer}>
					<Button
						text="↑"
						onPress={async (): Promise<void> => {
							scrollToTop();
						}}
					/>
					<Button
						text="Generate 20 More"
						loading={isGeneratingMoreAddresses}
						onPress={onGenerateMorePress}
					/>
					{!utxos && (
						<Button
							text="Check Balances"
							loading={isCheckingBalances}
							onPress={onCheckBalance}
						/>
					)}
				</View>
			</>

			<SafeAreaInsets type="bottom" />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-evenly',
		marginVertical: 2,
	},
	qrCodeRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginTop: -20,
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
	footer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-around',
		paddingVertical: 2,
	},
	spendFundsText: {
		marginVertical: 5,
	},
});

export default memo(AddressViewer);
