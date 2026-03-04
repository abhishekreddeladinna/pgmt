#!/bin/bash
# Git and Deployment Setup Script

# 1. Initialize Git
git init
git add .
git commit -m "🚀 Production ready PGMT application"

# 2. Create GitHub repository (do this on github.com first)
# Then:
git remote add origin https://github.com/YOUR_USERNAME/pgmt.git
git branch -M main
git push -u origin main

echo "✅ Code pushed to GitHub!"
echo ""
echo "Next steps:"
echo "1. Go to https://render.com and deploy backend (see PRODUCTION_SETUP.md)"
echo "2. Go to https://vercel.com and deploy frontend"
echo "3. Update environment variables on both platforms"
echo "4. Test the deployed application"
