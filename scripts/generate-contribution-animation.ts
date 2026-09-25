import { renderContributionAnimation } from "./contribution-animation.ts";
import {
	ContributionDataError,
	fetchContributionDays,
	parseContributionSnapshot,
} from "./contribution-data.ts";
import { countActiveDays } from "./contribution-layout.ts";
import {
	type ContributionDay,
	normalizeContributionCalendar,
} from "./contribution-model.ts";

const DEFAULT_OUTPUT_PATH = "assets/contribution-spaceship.svg";

type EnvironmentKey =
	| "GITHUB_USERNAME"
	| "CONTRIBUTIONS_TOKEN"
	| "GITHUB_TOKEN";

const readEnvironment = (key: EnvironmentKey): string | undefined => {
	const value: unknown = Bun.env[key];
	return typeof value === "string" ? value : undefined;
};

export type GenerateContributionOptions = {
	readonly inputPath?: string;
	readonly outputPath?: string;
	readonly username?: string;
	readonly token?: string;
	readonly now?: Date;
};

export type GenerateContributionResult = {
	readonly outputPath: string;
	readonly activeDays: number;
};

class CliError extends Error {
	public constructor(message: string) {
		super(message);
		this.name = "CliError";
	}
}

const requireEnvironmentValue = (
	value: string | undefined,
	name: string,
): string => {
	if (value === undefined || value.trim() === "") {
		throw new ContributionDataError(
			`${name} is required when --input is not used`,
		);
	}
	return value;
};

export const runContributionAnimation = async (
	options: GenerateContributionOptions,
): Promise<GenerateContributionResult> => {
	const outputPath = options.outputPath ?? DEFAULT_OUTPUT_PATH;
	let days: readonly ContributionDay[];

	if (options.inputPath === undefined) {
		days = await fetchContributionDays({
			username: requireEnvironmentValue(
				options.username ?? readEnvironment("GITHUB_USERNAME"),
				"GITHUB_USERNAME",
			),
			token: requireEnvironmentValue(
				options.token ??
					readEnvironment("CONTRIBUTIONS_TOKEN") ??
					readEnvironment("GITHUB_TOKEN"),
				"CONTRIBUTIONS_TOKEN or GITHUB_TOKEN",
			),
			...(options.now === undefined ? {} : { now: options.now }),
		});
	} else {
		const input: unknown = await Bun.file(options.inputPath).json();
		days = parseContributionSnapshot(input);
	}

	const calendar = normalizeContributionCalendar(days);
	const activeDays = countActiveDays(calendar);
	await Bun.write(outputPath, renderContributionAnimation(calendar));
	return { outputPath, activeDays };
};

const readOption = (
	arguments_: readonly string[],
	name: string,
): string | undefined => {
	const index = arguments_.indexOf(name);
	if (index === -1) {
		return undefined;
	}
	const value = arguments_.at(index + 1);
	if (value === undefined || value.startsWith("--")) {
		throw new CliError(`${name} requires a path`);
	}
	return value;
};

if (import.meta.main) {
	try {
		const arguments_ = Bun.argv.slice(2);
		const inputPath = readOption(arguments_, "--input");
		const outputPath = readOption(arguments_, "--output");
		const result = await runContributionAnimation({
			...(inputPath === undefined ? {} : { inputPath }),
			...(outputPath === undefined ? {} : { outputPath }),
		});
		console.log(
			`Generated ${result.activeDays} active days at ${result.outputPath}`,
		);
	} catch (error) {
		// no-excuse-ok: catch
		console.error(
			error instanceof Error ? error.message : "Contribution generation failed",
		);
		process.exitCode = 1;
	}
}
