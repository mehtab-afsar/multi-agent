# api/index.py - Vercel serverless function entry point

import sys
import os

# Add the parent directory to the path so we can import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app

# Export the Flask app for Vercel
handler = app
