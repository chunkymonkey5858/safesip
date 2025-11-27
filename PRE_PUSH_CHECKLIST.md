# Pre-Push Checklist

Before pushing to GitHub, please review this checklist:

## ⚠️ Security

- [ ] **Firebase Config**: Your `src/config/firebase.ts` file contains real Firebase API keys
  - **Option 1** (Recommended): Add `src/config/firebase.ts` to `.gitignore` (line is already there, just uncomment it)
  - **Option 2**: Replace real keys with placeholders before committing
  - The template file `src/config/firebase.ts.template` is already set up for others

## 📝 Files to Review

- [ ] Check that no sensitive data is in any files (API keys, passwords, etc.)
- [ ] Review `.gitignore` to ensure sensitive files are excluded
- [ ] Make sure `node_modules/` is in `.gitignore` (already there)
- [ ] Ensure `.expo/` is in `.gitignore` (already there)

## ✅ Files Created for GitHub

- ✅ `README.md` - Main project documentation
- ✅ `SETUP.md` - Quick setup guide
- ✅ `CONTRIBUTING.md` - Contribution guidelines
- ✅ `LICENSE` - MIT License
- ✅ `.gitignore` - Updated with comprehensive ignore patterns
- ✅ `.gitattributes` - Line ending normalization
- ✅ `.github/ISSUE_TEMPLATE/` - Issue templates for bug reports and features
- ✅ `.github/workflows/ci.yml` - Basic CI workflow
- ✅ `src/config/firebase.ts.template` - Template for Firebase config

## 🚀 Ready to Push

Once you've reviewed the security items:

1. Initialize git (if not already done):
   ```bash
   git init
   ```

2. Add all files:
   ```bash
   git add .
   ```

3. Make initial commit:
   ```bash
   git commit -m "Initial commit: SafeSip app with BAC tracking"
   ```

4. Create repository on GitHub and add remote:
   ```bash
   git remote add origin <your-repo-url>
   ```

5. Push to GitHub:
   ```bash
   git branch -M main
   git push -u origin main
   ```

## 🔒 Important Note About Firebase Keys

Your current `firebase.ts` file has real API keys. Before pushing publicly:
- Either uncomment line 47 in `.gitignore` to exclude it, OR
- Replace the keys with placeholders

The template file will help other users set up their own Firebase config.

