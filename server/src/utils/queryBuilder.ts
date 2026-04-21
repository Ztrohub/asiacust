import mongoose from 'mongoose';

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

		if (field === '_id' || field.endsWith('Id') || field.endsWith('_id')) {
			if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
				query[field] = new mongoose.Types.ObjectId(value);
			}
			continue;
		} // ... (rest of your function is unchanged) ...

		// Case 1: Simple equality (e.g., ?role=admin)
		if (typeof value === 'string') {
			if (value === 'true') {
				query[field] = true;
			} else if (value === 'false') {
				query[field] = false;
			} else {
				query[field] = value;
			}
			continue;
		}

		// Case 2: Operator object (e.g., ?name[ilike]=dav or ?worktime[gt]=10)
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			query[field] = query[field] || {};

			for (const operator of Object.keys(value)) {
				const operatorValue = value[operator];
				if (!operatorValue) continue;

				// Handle our special 'ilike' operator
				if (operator === 'ilike') {
					query[field].$regex = new RegExp(escapeRegex(operatorValue), 'i');
				}
				// Handle the 'in' operator, which expects an array
				else if (operator === 'in' || operator === 'nin') {
					const arr = operatorValue
						.split(',')
						.map((item: string) => item.trim());
					query[field][operatorMap[operator]] = arr;
				}
				// Handle all other Mongoose operators (gt, gte, lt, lte, eq, ne)
				else if (operatorMap[operator]) {
					// Convert to number if it's a numeric operator
					const numOps = ['$gt', '$gte', '$lt', '$lte'];
					const mongooseOp = operatorMap[operator];
					let finalValue: any = operatorValue;

					if (numOps.includes(mongooseOp)) {
						if (
							!isNaN(Number(operatorValue)) &&
							String(operatorValue).trim() !== ''
						) {
							finalValue = Number(operatorValue);
						} else if (!isNaN(Date.parse(operatorValue))) {
							finalValue = new Date(operatorValue);
						}
					} else if (operatorValue === 'true') {
						finalValue = true;
					} else if (operatorValue === 'false') {
						finalValue = false;
					}

					query[field][mongooseOp] = finalValue;
				}
			}
		}
	}

	// Add $or conditions if they exist
	if (orQuery.length > 0) {
		query.$or = orQuery;
	}

	return query;
}
