# __DISPLAY_NAME__ brand guidance

Rules for composing A2UI surfaces that read as genuine __DISPLAY_NAME__ product UI, not merely
schema-valid trees. Per-component semantics live in the catalog's own component descriptions;
this doc carries only the **cross-component, brand-level** rules the catalog cannot state — and
only rules that change what the model emits.

Register: imperative. Read each line as an instruction.

Scope: this is a **custom catalog** over __DISPLAY_NAME__'s own design system. It holds one seed
component today (`Text`); each component added through the catalog-component skills brings its
own description, and the rules below grow with it.

<!-- TODO: the product's own composition rules, written as the catalog fills in. -->

---

## Layout and density

- Give every surface a single root component with `id: "root"`.
- One screen, one subject.

## Actions

- Every control you emit must carry an action that leads somewhere.
- Give every action a label that names the outcome — "Save draft", not "OK".
