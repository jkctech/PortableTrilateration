function test_examples_good()
{
	// Example usage
	const testdata = [
		// GOOD
		// [
		// 	[52.9590, 4.7590, 600],
		// 	[52.9615, 4.7470, 500],
		// 	[52.9560, 4.7515, 450]
		// ],
		// [
		// 	[52.9555, 4.7640, 300],
		// 	[52.9570, 4.7580, 250],
		// 	[52.9530, 4.7600, 350]
		// ],
		// [
		// 	[52.9650, 4.7400, 700],
		// 	[52.9610, 4.7455, 600],
		// 	[52.9620, 4.7500, 650]
		// ],
		// [
		// 	[52.9510, 4.7670, 500],
		// 	[52.9540, 4.7700, 480],
		// 	[52.9555, 4.7655, 520]
		// ],
		// [
		// 	[52.9600, 4.7800, 400],
		// 	[52.9580, 4.7750, 450],
		// 	[52.9560, 4.7820, 500]
		// ],

		// BAD
		// Radius is negative
		[
			[52.9590, 4.7590, -100],
			[52.9615, 4.7470, 500],
			[52.9560, 4.7515, 450]
		],

		// Invalid coordinate (lat too high)
		[
			[92.0000, 4.7590, 500],
			[52.9615, 4.7470, 500],
			[52.9560, 4.7515, 450]
		],
	];

	for (var j = 0; j < testdata.length; j++) {
		let data = testdata[j]
		for (var i = 0; i < data.length; i++) {
			addTrilaterationPoint(data[i][0], data[i][1], data[i][2]);
		}

		const estimated = trilaterate(data);
		addTrilaterationPoint(estimated[0], estimated[1], 1);
	}
}
