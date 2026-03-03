#!/bin/bash
# Usage: ./fetch-issue.sh 55
# Fetches main issue + all sub-issues into .cursor/tasks/issue-55.md

ISSUE=$1
OUTPUT=".cursor/tasks/issue-$ISSUE.md"
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')

mkdir -p .cursor/tasks

echo "# Issue #$ISSUE" > $OUTPUT
echo "" >> $OUTPUT

# Fetch main issue
gh issue view $ISSUE >> $OUTPUT

echo "" >> $OUTPUT
echo "---" >> $OUTPUT
echo "# Sub-issues" >> $OUTPUT
echo "" >> $OUTPUT

# Use GitHub API to get sub-issues (not available via gh issue view --json)
SUB_ISSUES=$(gh api graphql -f query="
{
  repository(owner: \"$(echo $REPO | cut -d'/' -f1)\", name: \"$(echo $REPO | cut -d'/' -f2)\") {
    issue(number: $ISSUE) {
      subIssues(first: 50) {
        nodes {
          number
          title
        }
      }
    }
  }
}" --jq '.data.repository.issue.subIssues.nodes[].number' 2>/dev/null)

if [ -z "$SUB_ISSUES" ]; then
  echo "⚠️  No sub-issues found via API, trying body links..." >> $OUTPUT
  # Fallback: extract issue numbers referenced in the body (#56, #57 etc)
  SUB_ISSUES=$(gh issue view $ISSUE --json body --jq '.body' | grep -oE '#[0-9]+' | tr -d '#')
fi

for SUB in $SUB_ISSUES; do
  echo "## Sub-issue #$SUB" >> $OUTPUT
  gh issue view $SUB >> $OUTPUT
  echo "" >> $OUTPUT
  echo "---" >> $OUTPUT
done

echo "✅ Saved to $OUTPUT"