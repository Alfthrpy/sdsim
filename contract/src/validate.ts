import Ajv2020 from "ajv/dist/2020.js";
import type { ErrorObject, ValidateFunction } from "ajv";
import descriptorSchema from "../descriptor.schema.json";
import labSchema from "../lab-spec.schema.json";

export interface Problem {
  /** JSON pointer to the offending value ("" is the document root). */
  path: string;
  /** The JSON Schema keyword that failed (required, enum, pattern, ...). */
  keyword: string;
  /** The missing or unexpected property name for `required` and `additionalProperties` problems. */
  property?: string;
  message: string;
}

export interface Verdict {
  valid: boolean;
  problems: Problem[];
}

const ajv = new Ajv2020({ strict: true, allErrors: true, allowUnionTypes: true });
ajv.addSchema(labSchema);
ajv.addSchema(descriptorSchema);

function compiled(id: string): ValidateFunction {
  const validator = ajv.getSchema(id);
  if (validator === undefined) throw new Error(`contract schema failed to compile: ${id}`);
  return validator;
}

const labValidator = compiled(labSchema.$id);
const descriptorValidator = compiled(descriptorSchema.$id);

function toVerdict(valid: boolean, errors: ErrorObject[] | null | undefined): Verdict {
  const problems = (errors ?? []).map((e): Problem => {
    const params = e.params as { missingProperty?: string; additionalProperty?: string };
    const property = params.missingProperty ?? params.additionalProperty;
    return {
      path: e.instancePath,
      keyword: e.keyword,
      ...(property === undefined ? {} : { property }),
      message: e.message ?? "",
    };
  });
  return { valid, problems };
}

/** Structural check of a lab spec (the schema only; cross-field and catalog rules are separate, see contract/RULES.md). */
export function validateLabSpec(spec: unknown): Verdict {
  const valid = labValidator(spec) as boolean;
  return toVerdict(valid, labValidator.errors);
}

/** Structural check of a component, policy or scenario descriptor. */
export function validateDescriptor(descriptor: unknown): Verdict {
  const valid = descriptorValidator(descriptor) as boolean;
  return toVerdict(valid, descriptorValidator.errors);
}
