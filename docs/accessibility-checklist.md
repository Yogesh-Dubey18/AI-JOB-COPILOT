# Accessibility Checklist

Use this checklist before merging UI changes.

## Navigation

- Desktop and mobile navigation landmarks have clear `aria-label` values.
- Icon-only controls include `aria-label` or visible text.
- Links describe their destination or action.
- Keyboard focus is visible on links, buttons, inputs, selects, and textareas.

## Forms

- Inputs, selects, file controls, and textareas have labels or accessible names.
- Required fields use the `required` attribute when browser validation is appropriate.
- Validation errors use clear language and are placed near the relevant control.
- Error summaries or inline errors use `role="alert"` when immediate attention is needed.

## Dynamic States

- Loading states use `role="status"` and concise wording.
- Error states use `role="alert"` and include a retry or next action when possible.
- Empty states explain what is missing and the next useful action.
- Result counts or status text that changes after filtering uses `aria-live` when useful.

## Visual Design

- Text must not overlap on mobile, tablet, or desktop.
- Buttons keep stable height and do not rely on color alone.
- Color contrast should be checked for primary, muted, destructive, and badge styles.
- Touch targets should be comfortable on mobile navigation and common action buttons.

## Manual Checks

- Navigate dashboard, resume upload, jobs, applications, and settings using keyboard only.
- Test at mobile width, tablet width, and desktop width.
- Confirm screen reader names for file upload, filters, icon buttons, and retry actions.
- Confirm error states appear when the backend is offline.
