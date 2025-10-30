#!/usr/bin/env bash

git clone repo repo-modified

cd repo-modified

npm install

npm run start

if ! git diff-index --quiet HEAD -- rugby_matches.ics; then
  echo "Detected changes in rugby_matches.ics — committing..."
  git config user.name "Concourse CI"
  git config user.email "ci@archers.world"
  git add rugby_matches.ics
  git commit -m "Update rugby_matches.ics [ci skip]"
else
  echo "No changes detected."
fi