function escapeRegex(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const operatorMap: { [key: string]: string } = {
	eq: '$eq', // equal
	ne: '$ne', // not equal
	gt: '$gt', // greater than
	gte: '$gte', // greater than or equal
	lt: '$lt', // less than
	lte: '$lte', // less than or equal
	in: '$in', // in array
	nin: '$nin' // not in array
};

export function buildQuery(
	queryParams: any,
	globalSearchFields: string[] = []
): { [key: string]: any } {
	const query: { [key: string]: any } = {};
	const orQuery: { [key: string]: any }[] = [];

	for (const field in queryParams) {
		if (field === 'page' || field === 'limit' || field === 'sort') {
			continue;
		}

		const value = queryParams[field];

		// Global Search Logic
		if (field === 'globalSearch' && typeof value === 'string' && value) {
			// 2. Use the argument here
			if (globalSearchFields.length > 0) {
				const searchRegex = new RegExp(escapeRegex(value), 'i');
				for (const fieldName of globalSearchFields) {
					orQuery.push({ [fieldName]: { $regex: searchRegex } });
				}
			}
			continue;
		}

		// ... (rest of your function is unchanged) ...

		// Case 1: Simple equality (e.g., ?role=admin)
		if (typeof value === 'string') {
			query[field] = value;
			continue;
		}

		// Case 2: Operator object (e.g., ?name[ilike]=dav or ?worktime[gt]=10)
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			// Get the operator (e.g., 'ilike', 'gt')
			const operator = Object.keys(value)[0];
			const operatorValue = value[operator];

			if (!operatorValue) continue;

			// Handle our special 'ilike' operator
			if (operator === 'ilike') {
				query[field] = { $regex: new RegExp(escapeRegex(operatorValue), 'i') };
			}
			// Handle the 'in' operator, which expects an array
			else if (operator === 'in' || operator === 'nin') {
				const arr = operatorValue.split(',').map((item: string) => item.trim());
				query[field] = { [operatorMap[operator]]: arr };
			}
			// Handle all other Mongoose operators (gt, gte, lt, lte, eq, ne)
			else if (operatorMap[operator]) {
				// Convert to number if it's a numeric operator
				const numOps = ['$gt', '$gte', '$lt', '$lte'];
				const mongooseOp = operatorMap[operator];

				query[field] = {
					[mongooseOp]: numOps.includes(mongooseOp)
						? Number(operatorValue)
						: operatorValue
				};
			}
		}
	}

	// Add $or conditions if they exist
	if (orQuery.length > 0) {
		query.$or = orQuery;
	}

	return query;
}
