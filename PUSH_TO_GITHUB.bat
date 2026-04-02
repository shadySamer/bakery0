@echo off
echo ========================================
echo Finalizing Bakery App Push...
echo ========================================
git config user.email "shadySamer@example.com"
git config user.name "shadySamer"
git add .
git commit -m "feat: complete activation, fresh start, and premium icon"
echo.
echo Pushing to GitHub... Please login in the browser if prompted.
echo.
git push -u origin master
echo.
echo ========================================
echo Push Complete! Now visit: 
echo https://github.com/shadySamer/bakery0/actions
echo ========================================
pause
