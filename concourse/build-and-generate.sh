#!/usr/bin/env bash
set -e 

git clone saints-fixtures-repo repo-modified

cd repo-modified

npm install

npm run start

if ! git diff-index --quiet HEAD -- rugby_matches.ics; then
  echo "Detected changes in rugby_matches.ics — committing..."
  git config user.name "Concourse CI"
  git config user.email "ci@archers.world"
  git add rugby_matches.ics
  git add rugbymatches.json
  git commit -m "Update to rugby calendar"
else
  echo "No changes detected."
fi