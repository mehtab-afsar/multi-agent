# api/index.py - Vercel serverless function entry point

import sys
import os

# Add the parent directory to the path so we can import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import the Flask app from app_vercel
from app_vercel import app

# This is what Vercel calls as the handler
# No need to reassign, the 'app' variable is already the Flask instance
