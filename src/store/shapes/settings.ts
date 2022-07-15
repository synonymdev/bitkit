import { ISettings } from '../types/settings';
import { arrayTypeItems } from './wallet';
import { EExchangeRateService } from '../../utils/exchange-rate/types';

export const defaultSettingsShape: ISettings = {
	loading: false,
	error: false,
	biometrics: false,
	pin: false,
	pinOnLaunch: false,
	pinForPayments: false,
	rbf: true,
	theme: 'dark',
	bitcoinUnit: 'satoshi', //BTC, mBTC, μBTC or satoshi
	balaceUnit: 'satoshi', //BTC, mBTC, μBTC or satoshi
	selectedCurrency: 'USD',
	exchangeRateService: EExchangeRateService.bitfinex,
	selectedLanguage: 'english',
	customElectrumPeers: { ...arrayTypeItems },
	coinSelectAuto: true,
	coinSelectPreference: 'small',
	unitPreference: 'asset',
	transactionSpeed: 'normal',
	hideBalance: false,
};
