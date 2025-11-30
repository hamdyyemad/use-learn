# Design System Documentation

## Overview
This project uses a custom design system built on top of Tailwind CSS. It features a "Dark Blue Code Editor" theme by default, using CSS variables for easy customization.

## Color Palette
The color palette is defined in `src/app/globals.css` using HSL values. This allows for semantic usage throughout the application.

### Dark Mode (Default)
The dark mode uses a deep blue background with vibrant accents, inspired by modern developer tools.

| Variable | Description | HSL Value |
|----------|-------------|-----------|
| `--background` | Main background color | `222 47% 11%` |
| `--foreground` | Main text color | `210 40% 98%` |
| `--card` | Card background | `217 33% 17%` |
| `--primary` | Primary action color | `217 91% 60%` |
| `--secondary` | Secondary background | `217 19% 27%` |
| `--muted` | Muted background | `217 19% 27%` |
| `--border` | Border color | `217 19% 27%` |

## How to Modify

### Changing Colors
To modify the theme, edit the CSS variables in `src/app/globals.css`.
- For **Dark Mode**: Edit the variables inside the `.dark` selector.
- For **Light Mode**: Edit the variables inside the `:root` selector.

Example: Changing the primary color to Purple.
```css
/* src/app/globals.css */
.dark {
  /* ... other vars */
  --primary: 263 70% 50%; /* Purple */
}
```

### Adding New Colors
1. Define the variable in `globals.css`:
   ```css
   :root {
     --brand-new: 123 45% 67%;
   }
   ```
2. Add it to `tailwind.config.ts`:
   ```ts
   // tailwind.config.ts
   theme: {
     extend: {
       colors: {
         'brand-new': 'hsl(var(--brand-new))',
       }
     }
   }
   ```
3. Use it in your components:
   ```tsx
   <div className="bg-brand-new">...</div>
   ```

## Components
Reusable components are located in `src/components/ui`. They are built using `cva` (Class Variance Authority) for managing variants.

### Button
Located at `src/components/ui/button.tsx`.
- **Variants**: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`.
- **Sizes**: `default`, `sm`, `lg`, `icon`.

### Card
Located at `src/components/ui/card.tsx`.
- Composed of `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
