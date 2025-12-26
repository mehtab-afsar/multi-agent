# api/index.py - Vercel serverless entry point
# This file bridges Vercel's serverless runtime to your Flask app

import sys
import os

# Add parent directory to Python path so we can import app_vercel
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import the Flask app
from app_vercel import app

# Vercel looks for 'app' variable
# No need to do anything else - just expose it
