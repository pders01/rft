---
id: koha-api-review
title: Review a Koha REST API patch
kind: skill
intent: Review Koha REST API specifications, routes, controllers, responses, and tests against the community API guidelines.
triggers:
  - "review this Koha API patch"
  - "check a Koha REST endpoint"
  - "review Swagger or OpenAPI changes in Koha"
  - "QA a Koha REST controller"
domains: [koha, api, rest, code-review, qa]
related: [koha-code-review, koha-data-review, koha-plugin-development, koha-skill-maintenance]
---

> **Guideline snapshot:** Refreshed `2026-07-18T10:07:31Z` from the supplied
> Koha REST API coding guidelines. At the start of every review, compare this
> timestamp with the current date. If it is more than 90 days old, warn that the
> skill may not reflect current community guidelines and ask for refreshed source
> material. Continue only if the user accepts that limitation; never silently treat
> an old snapshot as current.
>
> **Main-tree cross-check:** API integration points were checked against Koha main at
> commit `1265f905234946d67f7112932f9b274c47faf152` (2026-07-17). Main-tree
> conventions are additive evidence, not authority over the coding guidelines.

The API and general coding guidelines are authoritative. Use main to confirm current
paths, helpers, and tests, but do not let existing legacy endpoints weaken a rule.

Apply this skill to every changed REST route, resource definition, controller, and
API test. These API rules supplement rather than replace the general Koha coding
guidelines: apply `koha-code-review` to the same patch. For contributed plugin routes,
also apply `koha-plugin-development`. Distinguish adopted rules
from sections explicitly marked **draft**.

## Establish the API contract

Before reviewing implementation, list each operation as:

```text
METHOD /path — input — success status/body/headers — expected failures
```

Trace that contract through the OpenAPI/Swagger path, shared resource definition,
controller, object-to-API mapping, permissions, and tests. Report mismatches between
any two layers even when each file looks reasonable in isolation.

## Resource and route design (REST1–REST2)

- Use distinct paths for collection and item operations. Do not make an identifier
  optional on a single reused path.
- Routes should be guessable to a general API consumer. Prefer generic, widely
  understood resource names over Koha-internal vocabulary where possible.
- Resource route names are plural; action suffixes use singular names or verbs.
- Use HTTP methods for state: POST create, GET read, PUT update, DELETE delete, and
  PATCH partial update.
- Model an action that does not fit CRUD as a subordinate action resource—for
  example POST to add a block and DELETE to remove it.
- Do not add or enhance deprecated `/svc` APIs.
- Define each resource fully in its own definition file. Every field has a type and
  the resource lists required fields. Descriptions are strongly expected for API
  consumers.
- Verify database/object-to-API field mappings. Date, datetime, and timestamp names
  use `<action>_date` and return a full datetime. Action names are past tense, such
  as `created_date` and `modified_date`.
- Related keys use `<relation>_id`; embedding replaces the key with the relation name
  (for example `patron_id` becomes `patron`).

## Current main integration points

At the recorded main-tree cross-check, API controllers live under `Koha/REST/V1`,
resource and path fragments are YAML under `api/v1/swagger`, and the root
`swagger.yaml` registers both. The bundled JSON is generated output. Confirm these
locations in the reviewed checkout rather than applying them blindly.

After changing a definition or path, run the checkout's API bundle command. Main
currently exposes `yarn api:bundle`, backed by Redocly, and writes the generated
bundle. Review generated drift but do not hand-edit the bundle. Controller tests are
currently organized under `t/db_dependent/api/v1` and use `Test::Mojo`, transactions,
TestBuilder objects, and explicit authorization cases.

The guideline names `Koha::REST::V1::Cities` as its controller reference. Current
main still demonstrates `valid_input`, `try`/`catch`, object rendering, Location on
create, resource-not-found handling, and the deleted-response helper. Copy the
pattern critically: an existing typo, omission, or grandfathered construct is not a
new standard.

## Specification completeness (REST3)

Every request parameter and every achievable response status must appear in the
specification. Check ordinary success plus validation, authorization, missing
resource, duplicate/conflict, and unhandled failure paths.

Expected successful contracts:

| Operation | Status | Body | Header |
|---|---:|---|---|
| POST create | 201 | full created resource | `Location` points to resource |
| GET | 200 | full resource representation | — |
| PUT | 200 | full updated resource | — |
| DELETE | 204 | empty | — |
| POST async work | 202 | full background-job resource | `Location: /api/v1/jobs/{job_id}` |

A duplicate create returning 409 and a deletion blocked by conflict returning 409
are marked **draft** in the supplied guidelines; recommend them with that status,
not as unqualified adopted blockers.

For asynchronous POST operations, 202 is required because the target resource does
not yet exist. Its response schema references the shared job definition, the body is
the job representation, and Location identifies the job tracking endpoint—not the
future resource.

## Controller review (REST4, draft)

The supplied controller section is marked **draft**. Review against it and identify
its status in findings:

- Start each action with
  `my $c = shift->openapi->valid_input or return;` so specification validation runs.
- Wrap controller logic in `try`/`catch`, map known exceptions to documented errors,
  and always fall back to `$c->unhandled_exception($_)`.
- Use `$c->objects->to_api(...)` for `Koha::Object(s)` responses so mappings, hidden
  attributes, calculated fields, and embeds are honored.
- Resolve route/query parameters through the corresponding `Koha::Objects` APIs.
- Use `$c->render_resource_not_found('Resource')` for missing resources unless QA
  has agreed on different behavior.
- After deletion, use `$c->render_resource_deleted()` to guarantee 204 with an empty
  body.
- For async acceptance, use the established `render_job_accepted` helper where
  available.
- Compare new endpoint structure with `Koha::REST::V1::Cities`, identified by the
  guideline as the reference implementation, while accounting for the endpoint's
  actual domain needs.

## Security, permissions, and behavior

- Confirm operation-level permissions exist in the specification and match the
  controller's intended audience.
- Ensure IDs from the path cannot expose or mutate another patron's/library's data
  without authorization.
- Ensure writes cannot occur through GET and all input reaches the controller via
  validated OpenAPI input.
- Check query operators, pagination, ordering, embeds, and field selection against
  the capabilities declared by the route.
- Ensure exceptions and validation responses do not leak internals or sensitive
  patron data.
- Check create/update/delete atomicity and conflicts, especially around foreign keys
  and concurrent updates.

## Tests

Require focused tests for each operation and changed branch. Depending on scope,
cover:

- authorized success with exact status, body shape, mappings, and Location header;
- unauthenticated and unauthorized access;
- malformed body, missing required fields, invalid path/query values, and unknown
  query parameters as applicable;
- missing resources;
- duplicate or foreign-key conflict behavior where reachable;
- embed/mapping behavior and date serialization;
- DELETE's empty body;
- async job status, full job body, shared schema, and tracking Location;
- side effects in the database, not merely the HTTP response.

Tests must create their own data and not rely on optional sample records. New tests
should be grouped in subtests. Run the narrow API test file first, then relevant
specification and coding checks available in the checkout.

## Reporting

Use the finding format from `koha-code-review`, cite API rule IDs (`REST1.2`,
`REST3.2.1`, etc.), and explicitly label REST4 and individual draft conflict rules.
Lead with contract or security failures, then missing tests and maintainability
issues. Finish with checks run, manual verification gaps, and a verdict. Never claim
an endpoint is compliant if only the specification or only the controller was
reviewed.
