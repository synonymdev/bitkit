import actions from './actions';
import { getDispatch } from '../helpers';
import { err, ok, Result } from '../../utils/result';
import { LNURLChannelParams } from 'js-lnurl';
import { getLNURLParams, lnurlChannel } from '@synonymdev/react-native-lnurl';

const dispatch = getDispatch();

export const updateLightning = (payload): Result<string> => {
	dispatch({
		type: actions.UPDATE_LIGHTNING,
		payload,
	});
	return ok('');
};

/**
 * Claims a lightning channel from a lnurl-channel string
 * @param lnurl
 * @returns {Promise<Ok<boolean> | Err<boolean>>}
 */
export const claimChannelFromLnurlString = (
	lnurl: string,
): Promise<Result<string>> => {
	return new Promise(async (resolve) => {
		const res = await getLNURLParams(lnurl);
		if (res.isErr()) {
			return resolve(err(res.error));
		}

		const params = res.value as LNURLChannelParams;
		if (params.tag !== 'channelRequest') {
			return resolve(err('Not a channel request lnurl'));
		}

		resolve(claimChannel(params));
	});
};

/**
 * Claims a lightning channel from a decoded lnurl-channel request
 * @param params
 * @returns {Promise<Ok<boolean> | Err<boolean>>}
 */
export const claimChannel = (
	params: LNURLChannelParams,
): Promise<Result<string>> => {
	return new Promise(async (resolve) => {
		// TODO: Connect to peer from URI.
		const lnurlRes = await lnurlChannel({
			params,
			isPrivate: true,
			cancel: false,
			localNodeId: '',
		});

		if (lnurlRes.isErr()) {
			return resolve(err(lnurlRes.error));
		}

		resolve(ok(lnurlRes.value));
	});
};

/*
 * This resets the lightning store to defaultLightningShape
 */
export const resetLightningStore = (): Result<string> => {
	dispatch({
		type: actions.RESET_LIGHTNING_STORE,
	});
	return ok('');
};
