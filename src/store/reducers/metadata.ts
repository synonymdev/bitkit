import actions from '../actions/actions';
import { IMetadata } from '../types/metadata';
import { defaultMetadataShape } from '../shapes/metadata';
import { removeKeysFromObject } from '../../utils/helpers';

const updateLastUsedTags = (
	oldTags: Array<string>,
	newTags: Array<string>,
): Array<string> => {
	let tags = [...newTags, ...oldTags];
	tags = [...new Set(tags)];
	tags = tags.slice(0, 10);
	return tags;
};

const metadata = (
	state: IMetadata = defaultMetadataShape,
	action,
): IMetadata => {
	switch (action.type) {
		case actions.UPDATE_META_TX_TAGS: {
			let tags = {};

			if (action.payload.tags.length === 0) {
				tags = removeKeysFromObject(state.tags, action.payload.txid);
			} else {
				tags = { ...state.tags, [action.payload.txid]: action.payload.tags };
			}

			return {
				...state,
				tags,
			};
		}

		case actions.ADD_META_TX_TAG: {
			let txTags = state.tags[action.payload.txid] ?? [];
			txTags = [...txTags, action.payload.tag];
			txTags = [...new Set(txTags)]; // remove duplicates

			return {
				...state,
				tags: {
					...state.tags,
					[action.payload.txid]: txTags,
				},
			};
		}

		case actions.DELETE_META_TX_TAG: {
			const tags = { ...state.tags };
			let txTags = tags[action.payload.txid] ?? [];
			txTags = txTags.filter((t) => t !== action.payload.tag);

			if (txTags.length === 0) {
				delete tags[action.payload.txid];
			} else {
				tags[action.payload.txid] = txTags;
			}

			return {
				...state,
				tags,
			};
		}

		case actions.UPDATE_META_INC_TX_TAGS: {
			return {
				...state,
				pendingTags: {
					...state.pendingTags,
					[action.payload.address]: action.payload.tags,
					// TODO: handle Lightning
					// [action.payload.payReq]: action.payload.tags,
				},
			};
		}

		case actions.MOVE_META_INC_TX_TAG: {
			return {
				...state,
				pendingTags: action.payload.pendingTags,
				tags: { ...state.tags, ...action.payload.tags },
			};
		}

		case actions.ADD_META_TX_SLASH_TAGS_URL: {
			return {
				...state,
				slashTagsUrls: {
					...state.slashTagsUrls,
					[action.payload.txid]: action.payload.slashTagsUrl,
				},
			};
		}

		case actions.DELETE_META_TX_SLASH_TAGS_URL: {
			const slashTagsUrls = removeKeysFromObject(
				state.slashTagsUrls,
				action.payload.txid,
			);
			return {
				...state,
				slashTagsUrls,
			};
		}

		case actions.ADD_TAG: {
			const lastUsedTags = updateLastUsedTags(state.lastUsedTags, [
				action.payload.tag,
			]);

			return {
				...state,
				lastUsedTags,
			};
		}

		case actions.DELETE_TAG: {
			return {
				...state,
				lastUsedTags: state.lastUsedTags.filter(
					(tag) => tag !== action.payload,
				),
			};
		}

		case actions.RESET_META_STORE:
			return defaultMetadataShape;

		default:
			return state;
	}
};

export default metadata;
