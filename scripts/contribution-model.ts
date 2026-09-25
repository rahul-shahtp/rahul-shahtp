export const CONTRIBUTION_WEEKS = 53 as const;
export const DAYS_PER_WEEK = 7 as const;

export const CONTRIBUTION_LEVELS = [0, 1, 2, 3, 4] as const;

export type ContributionLevel = (typeof CONTRIBUTION_LEVELS)[number];

export type ContributionDay = {
	readonly date: string;
	readonly level: ContributionLevel;
	readonly contributionCount?: number;
};

export type ContributionCell = ContributionDay | null;
export type ContributionCalendar = readonly (readonly ContributionCell[])[];

export type ShotTarget = {
	readonly date: string;
	readonly level: Exclude<ContributionLevel, 0>;
	readonly contributionCount: number;
};

const DAY_IN_MILLISECONDS = 86_400_000;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class ContributionModelError extends Error {
	public constructor(message: string) {
		super(message);
		this.name = "ContributionModelError";
	}
}

const parseDate = (date: string): number => {
	const timestamp = Date.parse(`${date}T00:00:00Z`);
	const normalizedDate = Number.isNaN(timestamp)
		? ""
		: new Date(timestamp).toISOString().slice(0, 10);

	if (!ISO_DATE_PATTERN.test(date) || normalizedDate !== date) {
		throw new ContributionModelError(`Invalid contribution date: ${date}`);
	}

	return timestamp;
};

export const normalizeContributionCalendar = (
	days: readonly ContributionDay[],
): ContributionCalendar => {
	if (days.length === 0) {
		throw new ContributionModelError("Contribution calendar cannot be empty");
	}

	const sortedDays = [...days].sort((left, right) =>
		left.date.localeCompare(right.date),
	);
	const firstDay = sortedDays.at(0);
	const lastDay = sortedDays.at(-1);
	if (firstDay === undefined || lastDay === undefined) {
		throw new ContributionModelError("Contribution calendar cannot be empty");
	}

	const daysByDate = new Map<string, ContributionDay>();
	for (const day of sortedDays) {
		parseDate(day.date);
		if (daysByDate.has(day.date)) {
			throw new ContributionModelError(
				`Duplicate contribution date: ${day.date}`,
			);
		}
		daysByDate.set(day.date, day);
	}

	const firstTimestamp = parseDate(firstDay.date);
	const lastTimestamp = parseDate(lastDay.date);
	const leadingEmptyDays = new Date(firstTimestamp).getUTCDay();
	const contributionDayCount =
		Math.round((lastTimestamp - firstTimestamp) / DAY_IN_MILLISECONDS) + 1;
	const slotCount = Math.max(
		CONTRIBUTION_WEEKS * DAYS_PER_WEEK,
		Math.ceil((leadingEmptyDays + contributionDayCount) / DAYS_PER_WEEK) *
			DAYS_PER_WEEK,
	);
	const slots: ContributionCell[] = Array.from(
		{ length: slotCount },
		() => null,
	);

	for (const [index, day] of sortedDays.entries()) {
		slots[leadingEmptyDays + index] = day;
	}

	const visibleCells = slots.slice(-(CONTRIBUTION_WEEKS * DAYS_PER_WEEK));
	return Array.from({ length: CONTRIBUTION_WEEKS }, (_, weekIndex) =>
		visibleCells.slice(
			weekIndex * DAYS_PER_WEEK,
			(weekIndex + 1) * DAYS_PER_WEEK,
		),
	);
};

export const selectShotTargets = (
	calendar: ContributionCalendar,
	limit: number,
): readonly ShotTarget[] => {
	if (!Number.isInteger(limit) || limit < 0) {
		throw new ContributionModelError(
			"Shot target limit must be a non-negative integer",
		);
	}

	const targets: ShotTarget[] = [];
	for (const week of calendar) {
		for (const day of week) {
			if (day === null || day.level === 0) {
				continue;
			}
			targets.push({
				date: day.date,
				level: day.level,
				contributionCount: day.contributionCount ?? day.level,
			});
		}
	}

	return targets
		.sort(
			(left, right) =>
				right.level - left.level || right.date.localeCompare(left.date),
		)
		.slice(0, limit);
};
