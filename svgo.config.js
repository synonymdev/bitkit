module.exports = {
	plugins: [
		'preset-default',
		'removeDimensions', // remove width and height attributes
		'removeXMLNS', // remove xmlns attribute
		'removeXlink', // remove xlink:href attribute
	],
};
