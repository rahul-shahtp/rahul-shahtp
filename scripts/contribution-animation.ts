import {
	CANVAS_HEIGHT,
	CANVAS_WIDTH,
	CELL_SIZE,
	CELL_STEP,
	CLOCK_BIT_COUNT,
	CLOCK_DURATION_SECONDS,
	CLOCK_REGISTER_X,
	CLOCK_REGISTER_Y,
	CLOCK_TRACK_END_X,
	CLOCK_TRACK_START_X,
	clockImpactRatio,
	clockSignalBegin,
	clockTrackY,
	countActiveDays,
	GRID_X,
	GRID_Y,
	type MonthLabel,
	renderMonthLabels,
} from "./contribution-layout.ts";
import {
	type ContributionCalendar,
	type ContributionCell,
	type ContributionLevel,
	selectClockTargets,
} from "./contribution-model.ts";

const LEVEL_COLORS = {
	0: "#161b22",
	1: "#0e4429",
	2: "#006d32",
	3: "#26a641",
	4: "#39d353",
} as const satisfies Readonly<Record<ContributionLevel, string>>;

const CLOCK_TARGET_LIMIT = 30;
const CLOCK_ROWS = [0, 1, 2, 3, 4, 5, 6] as const;
const REGISTER_BIT_WIDTH = 25;
const REGISTER_BIT_GAP = 5;
const REGISTER_BIT_HEIGHT = 20;

const renderCell = (
	day: ContributionCell,
	x: number,
	y: number,
	row: number,
	animated: boolean,
): string => {
	if (day === null) {
		return "";
	}
	const color = LEVEL_COLORS[day.level];
	const summary =
		day.contributionCount === undefined
			? `activity level ${day.level}`
			: `${day.contributionCount} contributions`;
	const base = `<rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="2" fill="${color}" data-date="${day.date}" data-level="${day.level}"><title>${day.date}: ${summary}</title></rect>`;
	if (!animated || day.level === 0) {
		return base;
	}

	const impactRatio = Math.max(0.005, clockImpactRatio(x, row));
	const releaseRatio = Math.min(1, impactRatio + 0.055);
	const fadeRatio = Math.min(1, releaseRatio + 0.02);
	return `${base}<g class="clock-cell-motion" opacity="0" data-clock-date="${day.date}"><rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="2" fill="#39d353" stroke="#c9f7d5" stroke-width="1.2"/><text x="${x + CELL_SIZE / 2}" y="${y + 7.4}" text-anchor="middle" fill="#04110a" font-family="Consolas, monospace" font-size="6" font-weight="700">1</text><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${Math.max(0, impactRatio - 0.014)};${impactRatio};${releaseRatio};${fadeRatio};1" dur="${CLOCK_DURATION_SECONDS}s" repeatCount="indefinite"/></g>`;
};

const renderGrid = (
	calendar: ContributionCalendar,
	clockDates: ReadonlySet<string>,
): string => {
	const cells = calendar
		.map((week, column) =>
			week
				.map((day, row) =>
					renderCell(
						day,
						GRID_X + column * CELL_STEP,
						GRID_Y + row * CELL_STEP,
						row,
						day !== null && clockDates.has(day.date),
					),
				)
				.join(""),
		)
		.join("");
	return `<g id="contribution-grid">${cells}</g>`;
};

const renderMonths = (labels: readonly MonthLabel[]): string =>
	labels
		.map(
			({ x, y, label }) =>
				`<text class="month-label" x="${x}" y="${y}" fill="#5b6b7d" font-family="Consolas, monospace" font-size="9" letter-spacing="1">${label.toUpperCase()}</text>`,
		)
		.join("");

const renderBitRegister = (activeDays: number): string => {
	const bits = activeDays.toString(2).padStart(CLOCK_BIT_COUNT, "0");
	const cells = Array.from(bits, (bit, index) => {
		const x =
			CLOCK_REGISTER_X + index * (REGISTER_BIT_WIDTH + REGISTER_BIT_GAP);
		const fill = bit === "1" ? "#0e4429" : "#161b22";
		const color = bit === "1" ? "#39d353" : "#5b6b7d";
		return `<g><rect x="${x}" y="${CLOCK_REGISTER_Y}" width="${REGISTER_BIT_WIDTH}" height="${REGISTER_BIT_HEIGHT}" rx="3" fill="${fill}" stroke="#263444"/><text x="${x + REGISTER_BIT_WIDTH / 2}" y="${CLOCK_REGISTER_Y + 14}" text-anchor="middle" fill="${color}" font-family="Consolas, monospace" font-size="11" font-weight="700">${bit}</text></g>`;
	}).join("");
	return `<g class="bit-register">${cells}</g>`;
};

const renderClockSignal = (row: number): string => {
	const begin = clockSignalBegin(row);
	return `<g class="clock-signal" data-clock-row="${row}" filter="url(#clockGlow)">
    <rect x="-6" y="-6" width="12" height="12" rx="2" fill="#0a0e14" stroke="#00e5c7"/>
    <text class="clock-zero" x="0" y="3.5" text-anchor="middle" fill="#5b6b7d" font-family="Consolas, monospace" font-size="8" font-weight="700">0<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.49;0.5;1" dur="1s" begin="${begin}s" repeatCount="indefinite"/></text>
    <text class="clock-one" x="0" y="3.5" text-anchor="middle" fill="#39d353" font-family="Consolas, monospace" font-size="8" font-weight="700">1<animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.49;0.5;1" dur="1s" begin="${begin}s" repeatCount="indefinite"/></text>
    <animateMotion dur="${CLOCK_DURATION_SECONDS}s" begin="${begin}s" repeatCount="indefinite"><mpath href="#clock-track-${row}"/></animateMotion>
  </g>`;
};

const renderClockTracks = (): string =>
	CLOCK_ROWS.map(
		(row) =>
			`<path d="M${CLOCK_TRACK_START_X} ${clockTrackY(row)} H${CLOCK_TRACK_END_X}" fill="none" stroke="#1f6f68" stroke-width="1" opacity="0.75"/>`,
	).join("");

const renderClockTrackDefinitions = (): string =>
	CLOCK_ROWS.map(
		(row) =>
			`<path id="clock-track-${row}" d="M${CLOCK_TRACK_START_X} ${clockTrackY(row)} H${CLOCK_TRACK_END_X}"/>`,
	).join("");

const renderClockLayer = (): string => `
  <g id="binary-clock" class="clock-motion">
    <rect x="${CLOCK_REGISTER_X - 3}" y="${CLOCK_REGISTER_Y - 3}" width="${CLOCK_BIT_COUNT * (REGISTER_BIT_WIDTH + REGISTER_BIT_GAP) - REGISTER_BIT_GAP + 6}" height="${REGISTER_BIT_HEIGHT + 6}" rx="5" fill="none" stroke="#00e5c7" stroke-width="1" opacity="0.55"/>
    <rect x="${CLOCK_REGISTER_X - 2}" y="${CLOCK_REGISTER_Y - 2}" width="2" height="${REGISTER_BIT_HEIGHT + 4}" fill="#39d353" filter="url(#clockGlow)"><animate attributeName="x" values="${CLOCK_REGISTER_X - 2};${CLOCK_REGISTER_X + CLOCK_BIT_COUNT * (REGISTER_BIT_WIDTH + REGISTER_BIT_GAP) - REGISTER_BIT_GAP - 2};${CLOCK_REGISTER_X + CLOCK_BIT_COUNT * (REGISTER_BIT_WIDTH + REGISTER_BIT_GAP) - REGISTER_BIT_GAP - 2}" keyTimes="0;0.82;1" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.9;1" dur="2s" repeatCount="indefinite"/></rect>
    ${CLOCK_ROWS.map(renderClockSignal).join("")}
  </g>
  <g class="static-clock">
    <rect x="${CLOCK_REGISTER_X - 3}" y="${CLOCK_REGISTER_Y - 3}" width="${CLOCK_BIT_COUNT * (REGISTER_BIT_WIDTH + REGISTER_BIT_GAP) - REGISTER_BIT_GAP + 6}" height="${REGISTER_BIT_HEIGHT + 6}" rx="5" fill="none" stroke="#39d353" stroke-width="1" stroke-dasharray="4 5"/>
    ${CLOCK_ROWS.map((row) => `<circle cx="${CLOCK_TRACK_START_X}" cy="${clockTrackY(row)}" r="3" fill="#39d353"/>`).join("")}
  </g>`;

export const renderContributionAnimation = (
	calendar: ContributionCalendar,
): string => {
	const clockDates = new Set(
		selectClockTargets(calendar, CLOCK_TARGET_LIMIT).map(({ date }) => date),
	);
	const activeDays = countActiveDays(calendar);

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}" role="img" aria-labelledby="title description">
  <title id="title">Binary contribution clock</title>
  <desc id="description">Seven binary signals travel across a year of GitHub contributions, switching active squares from zero to one. The animation contains ${activeDays} active days.</desc>
  <style>
    .static-clock{display:none}
    @media (max-width:480px){.title{font-size:22px;letter-spacing:2px}.subtitle{font-size:12px}.month-label{font-size:11px}.active-count{font-size:15px}}
    @media (prefers-reduced-motion: reduce){.clock-motion,.clock-cell-motion{display:none}.static-clock{display:inline}}
  </style>
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#070b11"/><stop offset="1" stop-color="#141a24"/></linearGradient>
    <pattern id="circuit" width="42" height="42" patternUnits="userSpaceOnUse"><path d="M0 21H15V6H42M21 42V29H42" fill="none" stroke="#1c2531" stroke-width="1"/><circle cx="15" cy="21" r="1.5" fill="#263444"/></pattern>
    <filter id="clockGlow" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="2.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    ${renderClockTrackDefinitions()}
  </defs>
  <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" rx="18" fill="url(#background)"/>
  <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" rx="18" fill="url(#circuit)" opacity="0.75"/>
  <text class="title" x="42" y="39" fill="#c9d1d9" font-family="Consolas, monospace" font-size="14" font-weight="700" letter-spacing="3">CONTRIBUTION CLOCK</text>
  <text class="subtitle" x="42" y="57" fill="#5b6b7d" font-family="Consolas, monospace" font-size="9" letter-spacing="1.5">0 -&gt; 1 // COMMIT SIGNAL</text>
  <text class="active-count" x="958" y="43" text-anchor="end" fill="#39d353" font-family="Consolas, monospace" font-size="12" font-weight="700">${String(activeDays).padStart(3, "0")} ACTIVE DAYS</text>
  <text x="${CLOCK_REGISTER_X}" y="72" fill="#5b6b7d" font-family="Consolas, monospace" font-size="8" letter-spacing="1">ACTIVE REGISTER // ${activeDays.toString(2).padStart(CLOCK_BIT_COUNT, "0")}</text>
  ${renderBitRegister(activeDays)}
  ${renderMonths(renderMonthLabels(calendar))}
  ${renderClockTracks()}
  ${renderGrid(calendar, clockDates)}
  ${renderClockLayer()}
</svg>
`;
};
