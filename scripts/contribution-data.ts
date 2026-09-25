import ky from "ky";
import { z } from "zod";
import type {
	ContributionDay,
	ContributionLevel,
} from "./contribution-model.ts";

export type ContributionWindow = {
	readonly from: string;
	readonly to: string;
};

export type FetchContributionOptions = {
	readonly username: string;
	readonly token: string;
	readonly now?: Date;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const GITHUB_USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;

const localLevelSchema = z.union([
	z.literal(0),
	z.literal(1),
	z.literal(2),
	z.literal(3),
	z.literal(4),
]);

const isoDateSchema = z
	.string()
	.regex(ISO_DATE_PATTERN)
	.refine((value) => {
		const timestamp = Date.parse(`${value}T00:00:00Z`);
		return (
			!Number.isNaN(timestamp) &&
			new Date(timestamp).toISOString().slice(0, 10) === value
		);
	});

const localDaySchema = z
	.object({
		date: isoDateSchema,
		level: localLevelSchema,
		contributionCount: z.number().int().nonnegative().optional(),
	})
	.strict();

const localCalendarSchema = z.array(localDaySchema).min(1);

const graphQlLevelSchema = z.enum([
	"NONE",
	"FIRST_QUARTILE",
	"SECOND_QUARTILE",
	"THIRD_QUARTILE",
	"FOURTH_QUARTILE",
]);

type GraphQlContributionLevel = z.infer<typeof graphQlLevelSchema>;

const CONTRIBUTION_LEVEL_MAP: Readonly<
	Record<GraphQlContributionLevel, ContributionLevel>
> = {
	NONE: 0,
	FIRST_QUARTILE: 1,
	SECOND_QUARTILE: 2,
	THIRD_QUARTILE: 3,
	FOURTH_QUARTILE: 4,
};

const graphQlResponseSchema = z.object({
	data: z
		.object({
			user: z
				.object({
					contributionsCollection: z.object({
						contributionCalendar: z.object({
							totalContributions: z.number().int().nonnegative(),
							weeks: z.array(
								z.object({
									contributionDays: z.array(
										z.object({
											date: isoDateSchema,
											contributionCount: z.number().int().nonnegative(),
											contributionLevel: graphQlLevelSchema,
										}),
									),
								}),
							),
						}),
					}),
				})
				.nullable(),
		})
		.nullable()
		.optional(),
	errors: z.array(z.object({ message: z.string() })).optional(),
});

export class ContributionDataError extends Error {
	public constructor(message: string) {
		super(message);
		this.name = "ContributionDataError";
	}
}

const assertUniqueDates = (days: readonly ContributionDay[]): void => {
	const dates = new Set<string>();
	for (const day of days) {
		if (dates.has(day.date)) {
			throw new ContributionDataError(
				`Contribution data contains duplicate date: ${day.date}`,
			);
		}
		dates.add(day.date);
	}
};

export const parseContributionSnapshot = (
	input: unknown,
): readonly ContributionDay[] => {
	const result = localCalendarSchema.safeParse(input);
	if (!result.success) {
		const details = result.error.issues
			.map(({ message }) => message)
			.join("; ");
		throw new ContributionDataError(`Contribution data is invalid: ${details}`);
	}

	const days: ContributionDay[] = result.data.map((day) => ({
		date: day.date,
		level: day.level,
		...(day.contributionCount === undefined
			? {}
			: { contributionCount: day.contributionCount }),
	}));
	assertUniqueDates(days);
	return days;
};

export const parseContributionResponse = (
	input: unknown,
): readonly ContributionDay[] => {
	const result = graphQlResponseSchema.safeParse(input);
	if (!result.success) {
		throw new ContributionDataError(
			"GitHub GraphQL returned an unexpected response shape",
		);
	}
	if (result.data.errors !== undefined && result.data.errors.length > 0) {
		const message = result.data.errors
			.map(({ message: errorMessage }) => errorMessage)
			.join("; ");
		throw new ContributionDataError(`GitHub GraphQL error: ${message}`);
	}

	const calendar =
		result.data.data?.user?.contributionsCollection.contributionCalendar;
	if (calendar === undefined) {
		throw new ContributionDataError(
			"GitHub contribution calendar is unavailable for this user",
		);
	}

	const days: ContributionDay[] = calendar.weeks.flatMap(
		({ contributionDays }) =>
			contributionDays.map((day) => ({
				date: day.date,
				level: CONTRIBUTION_LEVEL_MAP[day.contributionLevel],
				contributionCount: day.contributionCount,
			})),
	);
	if (days.length === 0) {
		throw new ContributionDataError("GitHub contribution calendar is empty");
	}
	assertUniqueDates(days);
	return days;
};

export const buildContributionWindow = (now: Date): ContributionWindow => {
	if (Number.isNaN(now.getTime())) {
		throw new ContributionDataError(
			"Contribution window requires a valid date",
		);
	}
	const from = new Date(now.getTime());
	from.setUTCDate(from.getUTCDate() - 364);
	return { from: from.toISOString(), to: now.toISOString() };
};

const CONTRIBUTION_QUERY = `
  query ContributionFlight($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

export const fetchContributionDays = async (
	options: FetchContributionOptions,
): Promise<readonly ContributionDay[]> => {
	if (!GITHUB_USERNAME_PATTERN.test(options.username)) {
		throw new ContributionDataError("GitHub username is invalid");
	}
	if (options.token.trim() === "") {
		throw new ContributionDataError("A GitHub token is required");
	}

	const window = buildContributionWindow(options.now ?? new Date());
	const payload: unknown = await ky.post("https://api.github.com/graphql", {
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${options.token}`,
			"User-Agent": "rahul-shahtp-profile-animation",
		},
		json: {
			query: CONTRIBUTION_QUERY,
			variables: {
				login: options.username,
				from: window.from,
				to: window.to,
			},
		},
		timeout: 15_000,
		retry: 2,
	});

	return parseContributionResponse(payload);
};
