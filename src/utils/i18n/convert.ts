// https://help.transifex.com/en/articles/6220899-structured-json
type SJItem =
	| {
			string: string;
			context?: string;
			developer_comment?: string;
			character_limit?: number;
	  }
	| {
			[key: string]: SJItem;
	  };

type StructuredJson = {
	[lang: string]: {
		[ns: string]: SJItem;
	};
};

type KVItem = { [k: string]: string } | { [k: string]: KVItem };
type KeyValueJson = {
	[lang: string]: {
		[ns: string]: KVItem;
	};
};

const recursion = (resources: Object): {} => {
	const res = {};

	for (const [key, value] of Object.entries(resources)) {
		if (typeof value.string === 'string') {
			res[key] = value.string;
		} else {
			res[key] = recursion(value);
		}
	}

	return res;
};

/**
 * Converts structured JSON to key-value JSON.
 **/
const convert = (resources: StructuredJson): KeyValueJson => {
	return recursion(resources);
};

export default convert;
