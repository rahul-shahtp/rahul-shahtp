import type {
	ContributionCalendar,
	ContributionCell,
	ShotTarget,
} from "./contribution-model.ts";

export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 270;
export const GRID_X = 129;
export const GRID_Y = 122;
export const CELL_SIZE = 10;
export const CELL_GAP = 4;
export const CELL_STEP = CELL_SIZE + CELL_GAP;
export const FLIGHT_START_X = 74;
export const FLIGHT_END_X = 926;
export const FLIGHT_Y = 72;
export const FLIGHT_DURATION_SECONDS = 18;

export type Point = {
	readonly x: number;
	readonly y: number;
};

export type PositionedTarget = ShotTarget & Point;

export type MonthLabel = Point & {
	readonly label: string;
};

const MONTH_NAMES = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;

export const cellCoordinates = (column: number, row: number): Point => ({
	x: GRID_X + column * CELL_STEP,
	y: GRID_Y + row * CELL_STEP,
});

export const cellCenter = (column: number, row: number): Point => {
	const coordinates = cellCoordinates(column, row);
	return {
		x: coordinates.x + CELL_SIZE / 2,
		y: coordinates.y + CELL_SIZE / 2,
	};
};

const createPositionMap = (
	calendar: ContributionCalendar,
): ReadonlyMap<string, Point> => {
	const positions = new Map<string, Point>();
	calendar.forEach((week, column) => {
		week.forEach((day: ContributionCell, row) => {
			if (day !== null) {
				positions.set(day.date, cellCoordinates(column, row));
			}
		});
	});
	return positions;
};

export const positionShotTargets = (
	calendar: ContributionCalendar,
	targets: readonly ShotTarget[],
): readonly PositionedTarget[] => {
	const positions = createPositionMap(calendar);
	const positionedTargets: PositionedTarget[] = [];

	for (const target of targets) {
		const coordinates = positions.get(target.date);
		if (coordinates !== undefined) {
			positionedTargets.push({ ...target, ...coordinates });
		}
	}

	return positionedTargets.sort((left, right) =>
		left.date.localeCompare(right.date),
	);
};

export const renderMonthLabels = (
	calendar: ContributionCalendar,
): readonly MonthLabel[] => {
	const labels: MonthLabel[] = [];
	let previousMonth = -1;

	calendar.forEach((week, column) => {
		for (const day of week) {
			if (day === null) {
				continue;
			}
			const date = new Date(`${day.date}T00:00:00Z`);
			const month = date.getUTCMonth();
			if (month !== previousMonth && date.getUTCDate() <= 7) {
				const name = MONTH_NAMES[month];
				if (name !== undefined) {
					labels.push({ x: cellCoordinates(column, 0).x, y: 111, label: name });
					previousMonth = month;
				}
			}
		}
	});

	return labels;
};

export const countActiveDays = (calendar: ContributionCalendar): number =>
	calendar.flat().filter((day) => day !== null && day.level > 0).length;
