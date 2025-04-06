// Validation function
function validateTrilaterationData(data) {
	if (!Array.isArray(data)) { return false; } // not array
	if (data.length !== 3) { return false; } // 3 points needed
	// Foreach point
	data.forEach((point, index) => {
		if (!Array.isArray(point)) { return false; } // Not array
		if (point.length !== 3) { return false; } // 3 elements, lat, lon, radius
		const [lat, lon, radius] = point;
		if (typeof lat !== "number" || typeof lon !== "number" || typeof radius !== "number") { return false; } // Must be numbers
		if (lat < -90 || lat > 90 || lon < -180 || lon > 180 || radius <= 0) { return false; } // Invalid lat lon radius ranges
	});

	return true;
}

// Trilateration with 3x [lat, lon, radius] data
function trilaterate(points) {
	// Validate
	if (!validateTrilaterationData(points)) { return false; }

	// Convert lat/lon to Cartesian (meters) using equirectangular approximation
	const R = 6371000; // Earth radius in meters
	const toXY = ([lat, lon], origin) => {
		const dLat = (lat - origin[0]) * Math.PI / 180;
		const dLon = (lon - origin[1]) * Math.PI / 180;
		const x = R * dLon * Math.cos(origin[0] * Math.PI / 180);
		const y = R * dLat;
		return [x, y];
	};

	const origin = [points[0][0], points[0][1]];
	const p1 = toXY(points[0], origin);
	const p2 = toXY(points[1], origin);
	const p3 = toXY(points[2], origin);

	const r1 = points[0][2];
	const r2 = points[1][2];
	const r3 = points[2][2];

	// Trilateration math in 2D
	const ex = [(p2[0] - p1[0]), (p2[1] - p1[1])];
	const d = Math.hypot(...ex);
	ex[0] /= d;
	ex[1] /= d;

	const p3p1 = [p3[0] - p1[0], p3[1] - p1[1]];
	const i = ex[0] * p3p1[0] + ex[1] * p3p1[1];

	const ey = [
		(p3p1[0] - i * ex[0]),
		(p3p1[1] - i * ex[1])
	];
	const eyDist = Math.hypot(...ey);
	ey[0] /= eyDist;
	ey[1] /= eyDist;

	const j = ey[0] * p3p1[0] + ey[1] * p3p1[1];

	const x = (r1**2 - r2**2 + d**2) / (2 * d);
	const y = (r1**2 - r3**2 + i**2 + j**2) / (2 * j) - (i / j) * x;

	const finalX = p1[0] + x * ex[0] + y * ey[0];
	const finalY = p1[1] + x * ex[1] + y * ey[1];

	// Convert back to lat/lon
	const finalLat = origin[0] + (finalY / R) * (180 / Math.PI);
	const finalLon = origin[1] + (finalX / (R * Math.cos(origin[0] * Math.PI / 180))) * (180 / Math.PI);

	return [finalLat, finalLon];
}
