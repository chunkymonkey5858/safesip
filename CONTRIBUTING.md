# Contributing to SafeSip

Thank you for your interest in contributing to SafeSip! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Set up Firebase configuration (see FIREBASE_SETUP.md)
4. Copy `src/config/firebase.ts.template` to `src/config/firebase.ts` and add your Firebase credentials
5. Start the development server: `npm start`

## Code Style

- Use TypeScript for all new code
- Follow React Native best practices
- Use functional components with hooks
- Maintain consistent naming conventions (camelCase for variables, PascalCase for components)

## Commit Messages

Please write clear commit messages:

```
feat: Add new feature description
fix: Fix bug description
docs: Update documentation
style: Formatting changes
refactor: Code restructuring
test: Add or update tests
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Test thoroughly on both iOS and Android if possible
4. Update documentation if needed
5. Submit a pull request with a clear description

## Reporting Issues

When reporting bugs or requesting features:
- Use the issue templates
- Provide detailed steps to reproduce
- Include device/OS information
- Add screenshots if relevant

## Questions?

Feel free to open an issue for questions or discussions!

