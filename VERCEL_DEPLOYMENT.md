# Vercel Deployment Guide for EduRep

## Overview
Deploy your EduRep WebRTC screen sharing application to Vercel for production hosting.

## Prerequisites
- GitHub repository: https://github.com/smallboy-dev/edurep.git
- Vercel account (free)
- Firebase project with Firestore configured

## Step 1: Connect GitHub to Vercel

1. **Sign up/login to Vercel**
   - Go to https://vercel.com
   - Sign up with your GitHub account

2. **Import your repository**
   - Click "Add New..." > "Project"
   - Select the `edurep` repository from GitHub
   - Click "Import"

## Step 2: Configure Environment Variables

In the Vercel project settings, add these environment variables:

### Firebase Configuration
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Get Firebase Config Values
1. Go to Firebase Console
2. Select your project
3. Click "Project Settings" (gear icon)
4. Under "Your apps", copy the Firebase configuration

## Step 3: Build Settings

Vercel will automatically detect the React/Vite configuration. The build settings should be:

```
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

## Step 4: Deploy

1. **Click "Deploy"**
   - Vercel will build and deploy your application
   - Deployment typically takes 2-3 minutes

2. **Get your URL**
   - Vercel will provide a production URL
   - Example: `https://edurep.vercel.app`

## Step 5: Test Your Deployment

1. **Visit your Vercel URL**
2. **Test screen sharing functionality**
3. **Verify Firebase connectivity**

## Optional: Custom Domain

1. **In Vercel Dashboard**
   - Go to Project Settings > Domains
   - Click "Add Custom Domain"

2. **Configure DNS**
   - Add the CNAME record provided by Vercel
   - Wait for DNS propagation (5-10 minutes)

## Troubleshooting

### Common Issues

**Build Fails**
```bash
# Check package.json scripts
npm run build
```

**Firebase Connection Issues**
- Verify all environment variables are set
- Check Firebase project settings
- Ensure Firestore is enabled

**WebRTC Issues**
- TURN servers should work on Vercel
- Check browser console for errors
- Verify HTTPS is enabled (automatic on Vercel)

### Environment Variable Debugging

Add this to your code to debug:
```javascript
console.log('Firebase Config:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
});
```

## Production Considerations

### Firebase Security Rules
Update your Firestore rules for production:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null;
      match /viewers/{viewerId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

### Performance Optimization
- Vercel automatically optimizes builds
- CDN distribution included
- Automatic HTTPS enabled

### Monitoring
- Vercel Analytics for performance
- Firebase Console for database usage
- Browser console for WebRTC issues

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:
```bash
git push origin master
# Vercel will automatically redeploy
```

## Cost

**Vercel Free Tier Includes:**
- 100GB bandwidth/month
- 100 builds/month
- SSL certificates
- CDN distribution

**Firebase Free Tier Includes:**
- 1GB storage
- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day

## Support

- **Vercel Documentation**: https://vercel.com/docs
- **Firebase Documentation**: https://firebase.google.com/docs
- **GitHub Issues**: https://github.com/smallboy-dev/edurep/issues

## Quick Deploy Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from local
vercel --prod

# Link to existing project
vercel link
```

## Success Checklist

- [ ] GitHub repository connected to Vercel
- [ ] Environment variables configured
- [ ] Build succeeds
- [ ] Application loads in browser
- [ ] Screen sharing works
- [ ] Firebase connectivity verified
- [ ] Custom domain configured (optional)

Your EduRep application is now live on Vercel!
