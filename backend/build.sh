#!/usr/bin/env bash
# exit on error
set -o errexit

# Set CARGO_HOME to a writable directory for Rust-based packages
export CARGO_HOME=$HOME/.cargo

python --version
pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
