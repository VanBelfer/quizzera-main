#!/usr/bin/env python3
"""
Agent Repository Framework - Quick Deploy Script
Non-interactive deployment - just deploys the current folder to GitHub
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def run_command(cmd, capture_output=True, check=True, silent=False):
    """Run a shell command and optionally capture output."""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=capture_output,
            text=True,
            check=check
        )
        return result.returncode == 0, result.stdout if capture_output else ""
    except subprocess.CalledProcessError:
        return False, ""

def main():
        # Get current directory first thing
    current_dir = Path.cwd()
    print("=" * 57)
    print("Quick Deploy: Agent Repository Framework")
    print("=" * 57)
    print()

    # Check for GitHub CLI
    success, _ = run_command("command -v gh", check=False)
    if not success:
        print("❌ GitHub CLI (gh) not found!")
        print("Install from: https://cli.github.com/")
        sys.exit(1)

    # Check authentication
    success, _ = run_command("gh auth status", check=False)
    if not success:
        print("❌ Please authenticate with GitHub CLI first:")
        print("   gh auth login")
        sys.exit(1)


    # Get repository name from current directory name
    repo_name = current_dir.name

    print(f"📦 Deploying framework as: {repo_name}")
    print(f"   Location: {current_dir}")
    print(f"   Visibility: Private")
    print()

    # Remove existing .git if present
    git_dir = current_dir / ".git"
    if git_dir.exists():
        print("Removing existing git history...")
        shutil.rmtree(git_dir)

    # Initialize git
    print("Initializing git repository...")
    run_command("git init -b main", silent=True)

    # Add all files
    print("Adding all files...")
    run_command("git add .", silent=True)

    # Create commit
    print("Creating initial commit...")
    commit_message = """Initial commit: Claude Code Agent Repository Framework

Complete framework including:
- Knowledge base (concepts + full versions)
- User engagement workflow (questions, profiles, tools)
- Plan generation templates
- Ready-to-deploy templates (5 templates)
- Utilities and helper scripts

This framework helps users design and build specialized Claude Code repositories."""
    
    run_command(f'git commit -m "{commit_message}"', silent=True)

    # Create and push to GitHub
    print("Creating GitHub repository and pushing...")
    run_command(f'gh repo create "{repo_name}" --private --source=. --push', silent=True)

    print()
    print("=" * 57)
    print("✅ Deployed!")
    print("=" * 57)
    print()
    
    # Get repo URL
    success, url = run_command("gh repo view --json url -q .url", check=False)
    if success and url.strip():
        print(url.strip())
    else:
        print(f"Repository: {repo_name}")
    
    print()
    print("Next: Open in Claude Code and start using!")
    print()

if __name__ == "__main__":
    main()