// JSON Schema for the structured-output format. Mirrors parsedWorkoutSchema's fields.
// Numeric min/max constraints are enforced by zod after parsing, not here
// (structured outputs do not support numeric range constraints).
export function parsedWorkoutJsonSchema() {
  return {
    type: "object",
    properties: {
      preparation: { type: "integer" },
      rounds: { type: "array", items: { type: "integer" } },
      rest: { type: "integer" },
    },
    required: ["preparation", "rounds", "rest"],
    additionalProperties: false,
  } as const;
}
