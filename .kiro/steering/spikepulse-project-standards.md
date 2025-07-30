# Spikepulse Project Standards

## Project Overview
Spikepulse is a modular, web-based game inspired by Geometry Dash, featuring advanced mechanics like double jump, dash, and gravity inversion. The project emphasizes clean architecture, semantic HTML, modern CSS, and modular JavaScript. **All user-facing content, interface elements, and messages must be in Spanish to provide a complete Spanish gaming experience.**

## Code Architecture Standards

### ES6 Module Structure

- Use ES6 modules with explicit imports/exports
- Each module should have a single responsibility
- Follow the established directory structure:
  ```
  src/
  ├── core/           # Game engine, state management, event bus
  ├── modules/        # Game modules (player, world, renderer, etc.)
  ├── utils/          # Utility functions and helpers
  ├── config/         # Configuration files
  ├── styles/         # CSS organized by responsibility
  └── assets/         # Images, fonts, sounds
  ```

### JavaScript Standards

- Use modern ES6+ features (classes, arrow functions, destructuring, async/await)
- Implement proper error handling with try-catch blocks
- Use meaningful variable and function names
- Add JSDoc comments for public methods and complex logic
- Follow the Module Pattern for encapsulation
- Implement the Observer Pattern for module communication via EventBus

### Class Design Patterns

- Constructor should initialize core properties and call init() method
- Separate concerns: physics, rendering, and logic in different methods
- Use composition over inheritance
- Implement proper cleanup methods for memory management

## HTML Standards

### Semantic Structure

- Use semantic HTML5 elements (main, section, article, nav, aside, header, footer)
- Implement proper heading hierarchy (h1 > h2 > h3)
- Add ARIA attributes for accessibility in Spanish
- Use meaningful IDs and classes following BEM methodology
- Ensure keyboard navigation support
- Set lang="es" attribute on HTML element
- All text content, labels, and messages must be in Spanish

### Accessibility Requirements

- All interactive elements must be keyboard accessible
- Provide alt text for images and aria-labels for complex elements in Spanish
- Implement proper focus management
- Use semantic markup for screen readers with Spanish content
- Test with keyboard-only navigation
- All accessibility messages and screen reader content must be in Spanish
- Use proper Spanish grammar and terminology for gaming context

## CSS Standards

### BEM Methodology

- Block: `.player`, `.obstacle`, `.game-hud`
- Element: `.player__sprite`, `.game-hud__stat`
- Modifier: `.player--dashing`, `.obstacle--spike`

### CSS Custom Properties

- Use CSS custom properties for all reusable values
- Organize variables by category (colors, spacing, typography, animations)
- Prefix Spikepulse variables with `--sp-`

### Responsive Design

- Mobile-first approach
- Use CSS Grid and Flexbox for layouts
- Implement touch-friendly controls (minimum 44px touch targets)
- Test on various screen sizes and orientations

## Spikepulse Visual Identity

### Color Palette

- Primary: Golden yellow (#FFD700) - represents energy and achievement
- Secondary: Electric red (#FF6B6B) - represents danger and spikes
- Accent: Electric purple (#9F7AEA) - represents gravity and special abilities
- Background: Deep blacks and dark blues for cyberpunk atmosphere
- Use pulse/glow effects to reinforce the "pulse" theme

### Typography

- Primary font: Orbitron (futuristic, gaming feel)
- Secondary font: Rajdhani (clean, readable)
- Use appropriate font weights and sizes for hierarchy

### Animation Principles

- Implement pulse animations that sync with game events
- Use CSS transforms for performance
- Smooth transitions (0.3s ease-out standard)
- Particle effects for visual feedback

## Performance Standards

### Canvas Optimization

- Use object pooling for frequently created/destroyed objects
- Implement dirty rectangle rendering when possible
- Separate static and dynamic rendering layers
- Optimize collision detection with spatial partitioning

### Memory Management

- Clean up event listeners in module destroy methods
- Use WeakMap/WeakSet for object references when appropriate
- Implement proper garbage collection patterns
- Monitor memory usage in development

### Loading Performance

- Lazy load non-critical assets
- Use web fonts with font-display: swap
- Minimize initial bundle size
- Implement loading states with visual feedback

## Testing Standards

### Unit Testing

- Test each module in isolation
- Mock dependencies using Jest
- Achieve minimum 80% code coverage for core modules
- Test edge cases and error conditions

### Integration Testing

- Test module communication through EventBus
- Verify state transitions work correctly
- Test complete game flow scenarios

## Error Handling

### Graceful Degradation

- Game should continue functioning if non-critical modules fail
- Provide fallback behaviors for missing features
- Log errors without breaking user experience
- Implement retry mechanisms for recoverable errors

### Development Tools

- Include debug mode with visual debugging aids
- Implement performance monitoring
- Create developer console for testing
- Add comprehensive logging system

## Game-Specific Standards

### Physics Implementation

- Use consistent units and coordinate systems
- Implement predictable physics behavior
- Ensure frame-rate independent movement
- Maintain 60fps target performance

### Input Handling

- Support keyboard, mouse, and touch inputs
- Implement input buffering for responsive controls
- Provide customizable key bindings
- Handle input conflicts gracefully

### State Management

- Use clear state machine patterns
- Validate state transitions
- Implement state persistence for user preferences
- Provide state debugging tools

## Documentation Requirements

### Code Documentation

- JSDoc comments for all public APIs
- README files for each major module
- Architecture decision records (ADRs) for significant choices
- API documentation for module interfaces

### User Documentation

- Clear control instructions
- Accessibility features documentation
- Performance requirements and browser support
- Troubleshooting guide

## Quality Assurance

### Code Review Checklist

- [ ] Follows established architecture patterns
- [ ] Implements proper error handling
- [ ] Includes appropriate tests
- [ ] Meets performance requirements
- [ ] Follows accessibility guidelines
- [ ] Uses consistent naming conventions
- [ ] Includes necessary documentation

### Browser Compatibility

- Support modern browsers (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- Graceful degradation for older browsers
- Test on both desktop and mobile devices
- Verify touch controls work properly

Remember: Every piece of code should contribute to making Spikepulse a polished, accessible, and performant gaming experience that reflects the project's identity and technical excellence.
##
 Spanish Language Standards

### User Interface Language

- All buttons, labels, and UI text must be in Spanish
- Use appropriate gaming terminology in Spanish:
  - "Saltar" for Jump
  - "Dash" or "Impulso" for Dash
  - "Gravedad" for Gravity
  - "Distancia" for Distance
  - "Puntuación" for Score
  - "Pausa" for Pause
  - "Reiniciar" for Restart
  - "Configuración" for Settings

### Game Messages and Feedback

- Victory/defeat messages in Spanish
- Loading messages in Spanish
- Error messages in Spanish with clear explanations
- Tutorial and help text in Spanish
- Achievement and milestone messages in Spanish

### HTML Language Attributes

- Set `lang="es"` on the HTML element
- Use `lang="es"` on any text content containers
- Ensure proper Spanish character encoding (UTF-8)

### Accessibility in Spanish

- All ARIA labels and descriptions in Spanish
- Screen reader announcements in Spanish
- Keyboard shortcut descriptions in Spanish
- Help text and instructions in Spanish

### Code Comments and Documentation

- Public-facing documentation should be in Spanish
- User-facing error messages in Spanish
- Console messages that users might see should be in Spanish
- Keep technical code comments in English for developer clarity

### Spanish Text Guidelines

- Use proper Spanish grammar and punctuation
- Use appropriate formal/informal tone (tuteo vs ustedeo) - prefer informal "tú" for gaming context
- Use gender-neutral language where possible
- Ensure proper Spanish typography (¿¡ punctuation, accents, etc.)
- Use Spanish number formatting (comma for decimals: 1,5m instead of 1.5m)

### Cultural Considerations

- Use Spanish gaming conventions and terminology
- Consider Spanish-speaking gaming culture references
- Use appropriate Spanish expressions for excitement, achievement, etc.
- Ensure color meanings and symbols are appropriate for Spanish-speaking cultures