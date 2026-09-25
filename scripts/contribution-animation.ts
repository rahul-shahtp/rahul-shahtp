import {
	CANVAS_HEIGHT,
	CANVAS_WIDTH,
	CELL_SIZE,
	CELL_STEP,
	countActiveDays,
	FLIGHT_DURATION_SECONDS,
	FLIGHT_END_X,
	FLIGHT_START_X,
	FLIGHT_Y,
	GRID_X,
	GRID_Y,
	type MonthLabel,
	type PositionedTarget,
	positionShotTargets,
	renderMonthLabels,
} from "./contribution-layout.ts";
import {
	type ContributionCalendar,
	type ContributionCell,
	type ContributionLevel,
	selectShotTargets,
} from "./contribution-model.ts";

const LEVEL_COLORS = {
	0: "#161b22",
	1: "#0e4429",
	2: "#006d32",
	3: "#26a641",
	4: "#39d353",
} as const satisfies Readonly<Record<ContributionLevel, string>>;

const SHOT_LIMIT = 30;
const clamp = (value: number): number => Math.min(1, Math.max(0, value));
const ratio = (seconds: number): number =>
	clamp(seconds / FLIGHT_DURATION_SECONDS);

const renderCell = (day: ContributionCell, x: number, y: number): string => {
	if (day === null) {
		return "";
	}
	const color = LEVEL_COLORS[day.level];
	const summary =
		day.contributionCount === undefined
			? `activity level ${day.level}`
			: `${day.contributionCount} contributions`;
	return `<rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="2" fill="${color}" data-date="${day.date}" data-level="${day.level}"><title>${day.date}: ${summary}</title></rect>`;
};

const renderGrid = (calendar: ContributionCalendar): string => {
	const cells = calendar
		.map((week, column) =>
			week
				.map((day, row) =>
					renderCell(
						day,
						GRID_X + column * CELL_STEP,
						GRID_Y + row * CELL_STEP,
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

const spaceshipGeometry = (animated: boolean): string => {
	const flameAnimation = animated
		? '<animate attributeName="opacity" values="0.45;1;0.55" dur="0.42s" repeatCount="indefinite"/>'
		: "";
	return `
  <path d="M-44 0 L-27 -5 L-25 -12 L-5 -9 L8 -15 L28 0 L8 15 L-5 9 L-25 12 L-27 5 Z" fill="url(#hull)" stroke="#8b949e" stroke-width="1"/>
  <path d="M-7 -9 L10 -25 L19 0 L10 25 L-7 9 Z" fill="url(#wings)" opacity="0.95"/>
  <path d="M-24 0 L-43 -8 L-35 0 L-43 8 Z" fill="#3ab7ff" opacity="0.9"/>
  <path d="M-25 -4 L-58 0 L-25 4 Z" fill="#39d353" opacity="0.8">${flameAnimation}</path>
  <path d="M7 -6 L21 0 L7 6 Z" fill="#c9d1d9" opacity="0.8"/>
  <circle cx="1" cy="0" r="4" fill="#0a0e14" stroke="#00e5c7" stroke-width="1.5"/>
  <circle cx="15" cy="-4" r="1.5" fill="#f0f6fc"/>
`;
};

const renderAnimatedShip = (): string => `
  <g id="spaceship" class="motion-flight" filter="url(#shipGlow)">
    <animateTransform attributeName="transform" type="translate" from="${FLIGHT_START_X} ${FLIGHT_Y}" to="${FLIGHT_END_X} ${FLIGHT_Y}" dur="${FLIGHT_DURATION_SECONDS}s" repeatCount="indefinite"/>
    <g>
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0;0 4;0 0" dur="1.2s" repeatCount="indefinite"/>
      ${spaceshipGeometry(true)}
    </g>
  </g>
`;

const renderStaticFlight = (targets: readonly PositionedTarget[]): string => {
	const centerX = 500;
	const lines = targets
		.slice(0, 3)
		.map(
			(target) =>
				`<line x1="${centerX + 18}" y1="${FLIGHT_Y + 2}" x2="${target.x + 5}" y2="${target.y + 5}" stroke="#39d353" stroke-width="1" stroke-dasharray="3 5" opacity="0.75"/>`,
		)
		.join("");
	return `<g class="static-flight">${lines}<g transform="translate(${centerX} ${FLIGHT_Y})" filter="url(#shipGlow)">${spaceshipGeometry(false)}</g></g>`;
};

const renderShot = (target: PositionedTarget): string => {
	const progress = clamp(
		(target.x + 5 - FLIGHT_START_X) / (FLIGHT_END_X - FLIGHT_START_X),
	);
	const launchSeconds = progress * FLIGHT_DURATION_SECONDS;
	const impactSeconds = launchSeconds + 0.55;
	const startRatio = ratio(launchSeconds - 0.02);
	const launchRatio = ratio(launchSeconds);
	const impactRatio = ratio(impactSeconds);
	const fadeRatio = Math.min(1, impactRatio + 0.045);
	const originX =
		FLIGHT_START_X + (FLIGHT_END_X - FLIGHT_START_X) * progress - 22;
	const originY = FLIGHT_Y + 5;
	const centerX = target.x + CELL_SIZE / 2;
	const centerY = target.y + CELL_SIZE / 2;

	return `<g class="shot-motion" data-target-date="${target.date}">
    <circle cx="${originX}" cy="${originY}" r="2.4" fill="#39d353" filter="url(#boltGlow)">
      <animate attributeName="cx" values="${originX};${originX};${centerX};${centerX}" keyTimes="0;${startRatio};${impactRatio};1" dur="${FLIGHT_DURATION_SECONDS}s" repeatCount="indefinite"/>
      <animate attributeName="cy" values="${originY};${originY};${centerY};${centerY}" keyTimes="0;${startRatio};${impactRatio};1" dur="${FLIGHT_DURATION_SECONDS}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${startRatio};${launchRatio};${impactRatio};${fadeRatio};1" dur="${FLIGHT_DURATION_SECONDS}s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${centerX}" cy="${centerY}" r="3" fill="none" stroke="#39d353" stroke-width="1.5">
      <animate attributeName="r" values="3;3;3;12;3" keyTimes="0;${startRatio};${impactRatio};${fadeRatio};1" dur="${FLIGHT_DURATION_SECONDS}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0;0;0.95;0;0" keyTimes="0;${startRatio};${impactRatio};${fadeRatio};1" dur="${FLIGHT_DURATION_SECONDS}s" repeatCount="indefinite"/>
    </circle>
  </g>`;
};

export const renderContributionAnimation = (
	calendar: ContributionCalendar,
): string => {
	const targets = positionShotTargets(
		calendar,
		selectShotTargets(calendar, SHOT_LIMIT),
	);
	const activeDays = countActiveDays(calendar);
	const shots = targets.map(renderShot).join("");

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}" role="img" aria-labelledby="title description">
  <title id="title">Spaceship contribution flight</title>
  <desc id="description">A spaceship crosses a year of GitHub contributions and fires green energy bolts into active squares. The animation contains ${activeDays} active days.</desc>
  <style>
    .static-flight{display:none}
    @media (max-width:480px){.title{font-size:22px;letter-spacing:2px}.subtitle{font-size:12px}.month-label{font-size:11px}.active-count{font-size:15px}}
    @media (prefers-reduced-motion: reduce){.motion-flight,.shot-motion{display:none}.static-flight{display:inline}}
  </style>
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#070b11"/><stop offset="1" stop-color="#141a24"/></linearGradient>
    <linearGradient id="hull" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3ab7ff"/><stop offset="0.55" stop-color="#c9d1d9"/><stop offset="1" stop-color="#00e5c7"/></linearGradient>
    <linearGradient id="wings" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#3ab7ff"/></linearGradient>
    <pattern id="circuit" width="42" height="42" patternUnits="userSpaceOnUse"><path d="M0 21H15V6H42M21 42V29H42" fill="none" stroke="#1c2531" stroke-width="1"/><circle cx="15" cy="21" r="1.5" fill="#263444"/></pattern>
    <filter id="shipGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="boltGlow" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="2.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" rx="18" fill="url(#background)"/>
  <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" rx="18" fill="url(#circuit)" opacity="0.75"/>
  <path d="M42 82H214L232 64H406M780 206H922L940 188H970" fill="none" stroke="#1f6f68" stroke-width="1" opacity="0.65"/>
  <text class="title" x="42" y="39" fill="#c9d1d9" font-family="Consolas, monospace" font-size="14" font-weight="700" letter-spacing="3">CONTRIBUTION FLIGHT</text>
  <text class="subtitle" x="42" y="57" fill="#5b6b7d" font-family="Consolas, monospace" font-size="9" letter-spacing="1.5">SHIP // TARGET // COMMIT SIGNAL</text>
  <text class="active-count" x="958" y="43" text-anchor="end" fill="#39d353" font-family="Consolas, monospace" font-size="12" font-weight="700">${String(activeDays).padStart(3, "0")} ACTIVE DAYS</text>
  ${renderMonths(renderMonthLabels(calendar))}
  ${renderGrid(calendar)}
  ${renderStaticFlight(targets)}
  ${renderAnimatedShip()}
  ${shots}
</svg>
`;
};
