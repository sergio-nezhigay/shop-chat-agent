---
applyTo: "**"
---

# GitHub Copilot Instructions for Shopify Liquid Section Creation

## General Guidelines

- Write code like the best Shopify theme developer.
- All code must be in English.
- Provide the entire section code in **one file**.
- Code must be SEO-optimized, responsive, and cross-browser compatible.
- Avoid inline styles whenever possible.
- All styles and scripts must use proper indentation and wrap in `<style>` or `<script>` tags.
- Use variables for all styles where possible.
- Ensure the section works correctly with other sections on the same page in the same theme.
- Match the design as closely as possible to screenshots — pixel-perfect replication.
- Do not add comments in code.
- Sections must be available on **any template**.

---

## Section Schema Requirements

- Section must have a **name** (max 25 characters). You may generate a suitable name yourself.
- Include **presets** in schema: `[ { "name": <same_name_as_above> } ]`.
- Schema must be wrapped in `{% schema %}` and `{% endschema %}`.
- Include the following settings:
  - Padding top (mobile/desktop)
  - Padding bottom (mobile/desktop)
  - Background
  - Max width (manual input)
  - Vertical & horizontal padding (mobile/desktop)
  - Text field for custom wrapper class
  - Block types and their settings
- Analyze the section and define **extra useful settings** to make it highly flexible.
- For range settings:
  - Step must not exceed 100.
  - Default must fall between min and max considering step size.
- For headers/subheaders:
  - Add font size settings for desktop and mobile.
- Use `richtext` fields for large text blocks.
- Ensure every text element has a color setting.
- Ensure any block order changes in the admin reflect on the page.

---

## Markup Guidelines

- Add `section.id` to the main wrapper.
- Add a custom wrapper class based on functionality/structure.
- Wrap HTML blocks with dynamic checks to avoid empty customizer fields.
- For sections with image + content:
  - Include settings to reverse layout.
  - Include mobile display options (image first/content first).
- Small icons (SVG) near text can use HTML block fields.
- Do not limit the number of blocks in admin.
- Do not provide default values for HTML blocks.
- Assign variables before accessing array/object keys in Liquid (avoid filters inside square brackets).

---

## Style Guidelines

- Styles using dynamic schema values must begin with `section.id` for specificity.
- Some styles may be global for the section (do not always scope with ID).
- Include text sizes, colors, padding, and max-width values from schema.
- Use **modern responsive image practices**:
  - `image_url` filter with width/height attributes
  - `srcset` and `sizes` via `image_tag`
- Use maximum specificity in class names to avoid conflicts.
- Ensure styles are responsive and do not break on different devices.
- Always include default values for range fields.

---

## Script Guidelines

- Include `<script>` block if needed.
- Wrap all dynamic behavior inside the section wrapper.
- Scripts must respect section ID and class specificity.
- Ensure scripts work correctly when multiple sections exist on the same page.

---

## Quality Guidelines

- Code must be well-thought-out, clean, and maintainable.
- Analyze the section and anticipate any extra settings to improve flexibility.
- Review code to ensure **replication of design pixel-perfect**.
- Ensure all markup, styles, and scripts are cross-browser compatible.
